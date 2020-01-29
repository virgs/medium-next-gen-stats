const chartOptions = {
    type: 'bar',
    data: {},
    options: {
        animation: {
            duration: 750,
            onComplete: () => chartOptions.loaded = true
        },
        title: {
            fontColor: '#000',
            display: true,
            fontSize: 24,
            padding: 12,
        },
        legend: {
            display: false,
            position: 'bottom',
            align: 'start'
        },
        responsive: true,
        tooltips: {
            position: 'nearest',
            mode: 'index',
            titleAlign: 'center',
            titleFontSize: 15,
            titleMarginBottom: 10,
            bodySpacing: 8,
            bodyFontSize: 12,
            bodyAlign: 'left',
            footerAlign: 'center',
            footerFontSize: 14,
            footerMarginTop: 10,
            yPadding: 10,
            xPadding: 10,
            currentExcludedItems: 0,
            topPostsOfTooltip: undefined,
            itemSort: (first, second) => second.value - first.value,
            filter: (item, chartData) => {
                const parsedValue = parseInt(item.value);
                if (parsedValue <= 0) {
                    return false;
                }
                if (!chartOptions.options.tooltips.topPostsOfTooltip) {
                    chartOptions.options.tooltips.topPostsOfTooltip = chartData.datasets
                        .filter(dataset => dataset.type !== 'bubble')
                        .map(dataset => dataset.data[item.index])
                        .filter(item => item > 0)
                        .sort((a, b) => a - b)
                        .reverse()
                        .filter((_, index) => index < 10);
                }
                if (chartOptions.options.tooltips.topPostsOfTooltip.includes(parsedValue)) {
                    return true;
                }
                ++chartOptions.options.tooltips.currentExcludedItems;

                return false;
            },
            callbacks: {
                label: (tooltipItem, chart) => {
                    // const publicationDay = chart.datasets.filter(dataset => dataset.type === 'bubble')[0].data[tooltipItem.index];
                    const dataset = chart.datasets[tooltipItem.datasetIndex];
                    return ` "${dataset.label}":    ${prettifyNumbers(tooltipItem.value)}`
                },
                afterBody: () => {
                    if (chartOptions.options.tooltips.currentExcludedItems > 0) {
                        if (chartOptions.options.tooltips.currentExcludedItems === 1) {
                            return `      and another one...`;
                        }
                        return `      and ${chartOptions.options.tooltips.currentExcludedItems} others...`;
                    }
                },
                footer: (tooltipItems) => {
                    const total = tooltipItems.reduce((acc, tooltipItem) => parseInt(tooltipItem.value) + acc, 0);
                    const excludedItems = chartOptions.options.tooltips.currentExcludedItems;
                    chartOptions.options.tooltips.currentExcludedItems = 0;
                    delete chartOptions.options.tooltips.topPostsOfTooltip;
                    return `Total:\t ${prettifyNumbers(total)} ${statsOptions.relevantDatumLabel} of ${tooltipItems.length + excludedItems} articles`;
                },
            },
            footerFontStyle: 'bold',
            intersect: true
        },
        hover: {
            mode: 'index',
            intersect: true
        },
        scales: {
            yAxes: [{
                gridLines: {
                    drawBorder: false,
                    borderDash: [2, 3],
                },
                ticks: {
                    callback: value => prettifyNumbers(value),
                    beginAtZero: true
                }
            }],
            xAxes: [
                {
                    ticks: {
                        padding: 10,
                        autoSkipPadding: 50,
                        autoSkip: true,
                        maxRotation: 0,
                        minRotation: 0,
                    },
                    stacked: true,
                    gridLines: {
                        display: false,
                        offsetGridLines: false
                    }
                }]
        }
    }
};

async function generateChart() {
    const filteredByRangePostsData = postsData
        .filter(post => post.collectedAt >= statsOptions.firstDayOfRange.getTime() && post.collectedAt < statsOptions.lastDayOfRange.getTime());
    const filteredByRangePostsSummary = postsSummary
        .filter(post => post.firstPublishedAt >= statsOptions.firstDayOfRange.getTime() && post.firstPublishedAt < statsOptions.lastDayOfRange.getTime());
    const range = statsOptions.rangeMethod(statsOptions.firstDayOfRange, statsOptions.lastDayOfRange);
    const labels = range.map(interval => interval.label);
    const chartData = generateBarChartData(range, filteredByRangePostsData, statsOptions.relevantDatum)
        .concat(generateBubbleChartData(range, filteredByRangePostsSummary));
    chartOptions.data = {
        datasets: chartData,
        labels
    };
    chartOptions.options.title.text = `${statsOptions.label} ${statsOptions.relevantDatumLabel} from '${getStringifiedDate(statsOptions.firstDayOfRange)}' to '${
        getStringifiedDate(new Date(statsOptions.lastDayOfRange.getTime() - oneDayInMilliseconds))}'`;
    // chartOptions.options.tooltips.callbacks.title = tooltipItems => range[tooltipItems[0].index].label;
    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, chartOptions);
    updateSummaryTabs(filteredByRangePostsData, statsOptions);
    nextGenerationLog("Chart rendered");
}

function generateBarChartData(range, data, relevantDatum) {
    return Object.values(data
        .reduce((acc, info) => {
            if (acc[info.id] === undefined) {
                acc[info.id] = initialValueOfEveryBar(info, range);
            }
            return acc;
        }, {}))
        .map((post, index, vec) => {
            const backgroundColor = getShadeOfColor(vec.length, index);
            const dataOfPostId = getDataOfPostInRange(range, data, post);
            post.data = post.data.map((datum, index) => datum + relevantDatum(dataOfPostId[index]));
            post.backgroundColor = `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, 0.75)`;
            return post;
        })
        .filter((post => post.data.reduce((acc, current) => acc + current, 0) > 0));
}

function generateBubbleChartData(range, filteredByRangePostsSummary) {
    return filteredByRangePostsSummary
        .reduce((acc, summary) => {
            const indexOfDate = range
                .findIndex(item => summary.firstPublishedAt >= item.begin.getTime() && summary.firstPublishedAt < item.end.getTime());
            const dataset = checkPublicationDataset(indexOfDate, summary, range, acc);
            if (dataset) {
                acc.push(dataset);
            }
            return acc;
        }, []);
}


function initialValueOfEveryBar(info, range) {
    return {
        id: info.id,
        claps: info.claps,
        reads: info.reads,
        label: info.title,
        views: info.views,
        readingTime: info.readingTime,

        stack: 'unique',
        barPercentage: 0.95,
        categoryPercentage: 1,
        data: range.map((_, index) => 0)
    };
}

function checkPublicationDataset(indexOfDate, post, range, previousDatasets) {
    let hasData = false;
    const publicationDateDataset = {
        label: 'Publication original date',
        data: range.map((_, index) => {
            if (index === indexOfDate) {
                hasData = true;
                const radius = Math.max(Math.min(1.3 * post.readingTime, 12), 3);
                const y = previousDatasets
                    .map(dataset => dataset.data[indexOfDate])
                    .filter(dataset => dataset)
                    .reduce((acc, bubble) => {
                        return acc + 5 + 2 * bubble.r;
                    }, 0);
                return {
                    x: 0,
                    y: y,
                    r: radius,
                    post
                };
            }
        }),
        backgroundColor: `rgb(0, 0, 0, 0.95)`,
        type: 'bubble',
        order: -1,
        borderWidth: 10
    };

    if (hasData) {
        return publicationDateDataset;
    }
    return undefined;
}

function getDataOfPostInRange(range, data, post) {
    return data
        .filter(data => data.id === post.id)
        .reduce((acc, data) => {
            const index = range.findIndex(item => item.begin.getTime() <= data.collectedAt && data.collectedAt < item.end.getTime());
            acc[index].views += data.views;
            acc[index].claps += data.claps;
            acc[index].reads += data.reads;
            acc[index].upvotes += data.upvotes;
            return acc;
        }, range.map(() => ({
            views: 0,
            claps: 0,
            reads: 0,
            upvotes: 0
        })));
}

function getShadeOfColor(max, index) {
    return {
        r: (originalColor.r / (max)) * (index + 1),
        g: (originalColor.g / (max)) * (index + 1),
        b: (originalColor.b / (max)) * (index + 1)
    };
}
