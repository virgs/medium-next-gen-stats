const lineChartGenerator = {
    type: 'line',
    options: {
        animation: {
            duration: 750,
            onComplete: () => chartRenderingAnimationCompleted = true
        },
        title: {
            fontColor: '#000',
            display: true,
            fontSize: 24,
            padding: 12,
        },
        legend: {
            // display: false,
            position: 'bottom',
            align: 'start',
            labels: {
                boxWidth: 10,
                padding: 30
            }
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
            xPadding: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            displayColors: false,
            currentExcludedItems: 0,
            topPostsOfTooltip: undefined,
            itemSort: (first, second) => second.value - first.value,
            filter: (item, chartData) => {
                const parsedValue = parseInt(item.value);
                if (parsedValue <= 0) {
                    return false;
                }
                if (!lineChartGenerator.options.tooltips.topPostsOfTooltip) {
                    lineChartGenerator.options.tooltips.topPostsOfTooltip = chartData.datasets
                        .filter(dataset => dataset.type !== 'bubble')
                        .map(dataset => dataset.data[item.index])
                        .filter(item => item > 0)
                        .sort((a, b) => a - b)
                        .reverse()
                        .filter((_, index) => index < 10);
                }
                if (lineChartGenerator.options.tooltips.topPostsOfTooltip.includes(parsedValue)) {
                    return true;
                }
                ++lineChartGenerator.options.tooltips.currentExcludedItems;

                return false;
            },
            callbacks: {
                label: (tooltipItem, chartData) => {
                    // const publicationDay = chartData.datasets.filter(dataset => dataset.type === 'bubble')[0].data[tooltipItem.index];
                    const total = chartData
                        .datasets
                        .reduce((acc, dataset) => {
                            const value = dataset.data[tooltipItem.index];
                            if (typeof value === 'number') {
                                return acc + value;
                            }
                            return acc;
                        }, 0);
                    const dataset = chartData.datasets[tooltipItem.datasetIndex];
                    return ` "${dataset.label}":    ${prettifyNumbersWithCommas(tooltipItem.value)}   (${(100 * tooltipItem.value / total).toFixed(1)}%)`
                },
                afterBody: () => {
                    if (lineChartGenerator.options.tooltips.currentExcludedItems > 0) {
                        if (lineChartGenerator.options.tooltips.currentExcludedItems === 1) {
                            return `   and another one...`;
                        }
                        return `   and ${lineChartGenerator.options.tooltips.currentExcludedItems} others...`;
                    }
                },
                footer: (tooltipItems) => {
                    const value = tooltipItems.reduce((acc, tooltipItem) => parseInt(tooltipItem.value) + acc, 0);
                    const excludedItems = lineChartGenerator.options.tooltips.currentExcludedItems;
                    lineChartGenerator.options.tooltips.currentExcludedItems = 0;
                    delete lineChartGenerator.options.tooltips.topPostsOfTooltip;
                    const total = tooltipItems.length + excludedItems;
                    return `Total: ${prettifyNumbersWithCommas(value)} ${statsOptions.relevantDatumLabel} of ${total} article${total > 1 ? 's' : ''}`;
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
                // stacked: true,
                gridLines: {
                    drawBorder: false,
                    borderDash: [2, 3],
                },
                ticks: {
                    callback: value => prettifyNumbersWithUnits(value),
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

async function generateLineChart(postsDataOfChart) {

    const range = statsOptions.rangeMethod(statsOptions.firstDayOfRange, statsOptions.lastDayOfRange);
    const labels = range.map(interval => interval.label);
    const chartData = generateLineData(range, postsDataOfChart, statsOptions.relevantDatum);
    lineChartGenerator.data = {
        datasets: chartData,
        labels
    };
    lineChartGenerator.options.title.text = `${statsOptions.label} ${statsOptions.relevantDatumLabel} from '${getStringifiedDate(statsOptions.firstDayOfRange)}' to '${
        getStringifiedDate(new Date(statsOptions.lastDayOfRange.getTime() - oneDayInMilliseconds))}'`;

    return lineChartGenerator;
}

function generateLineData(range, data, relevantDatum) {
    return Object.values(data
        .reduce((acc, info) => {
            if (acc[info.id] === undefined) {
                acc[info.id] = initialValueOfEveryBar(info, range);
            }
            return acc;
        }, {}))
        .map(post => {
            const dataOfPostId = getDataOfPostInRange(range, data, post);
            post.data = dataOfPostId.map(value => relevantDatum(value));
            post.relevantDataSum = post.data.reduce((acc, current) => acc + current, 0);
            post.fill = false;
            return post;
        })
        .sort((first, second) => second.relevantDataSum - first.relevantDataSum)
        .filter((post, index) => post.relevantDataSum > 0)
        .filter((post, index) => index < 5)
        .map((post, index, vec) => {
            const backgroundColor = getShadeOfColor(vec.length, index);
            post.backgroundColor = `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, 0.75)`;
            post.borderColor = `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, 0.75)`;
            return post;
        });
}

function initialValueOfEveryBar(info, range) {
    return {
        id: info.id,
        claps: info.claps,
        reads: info.reads,
        label: info.title,
        views: info.views,
        readingTime: info.readingTime,
        relevantDataSum: 0,

        stack: 'unique',
        barPercentage: 0.95,
        categoryPercentage: 1,
        data: range.map((_, index) => 0)
    };
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
