const publicationDateDotRadius = 5;

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
            itemSort: (first, second) => second.value - first.value,
            filter: item => item.value > 0,
            callbacks: {
                label: (tooltipItem, chart) => {
                    // const publicationDay = chart.datasets.filter(dataset => dataset.type === 'bubble')[0].data[tooltipItem.index];
                    const dataset = chart.datasets[tooltipItem.datasetIndex];
                    return ` "${dataset.label}":    ${prettifyNumbers(tooltipItem.value)}`
                },
                footer: (tooltipItems) => {
                    const total = tooltipItems.reduce((acc, tooltipItem) => parseInt(tooltipItem.value) + acc, 0);
                    return `Total:\t ${prettifyNumbers(total)} views of ${tooltipItems.length} articles`;
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

async function generateChart(info, statsOptions) {
    const infoFilteredByRange = info
        .filter(post => post.collectedAt >= statsOptions.firstDayOfRange.getTime() && post.collectedAt < statsOptions.lastDayOfRange.getTime());
    const range = statsOptions.rangeMethod(statsOptions.firstDayOfRange, statsOptions.lastDayOfRange);
    const labels = range.map(interval => interval.label);
    const chartData = generateChartData(range, infoFilteredByRange, statsOptions.relevantDatum);
    chartOptions.data = {
        datasets: chartData,
        labels
    };
    chartOptions.options.title.text = `${statsOptions.label} views from '${getStringifiedDate(statsOptions.firstDayOfRange)}' to '${getStringifiedDate(statsOptions.lastDayOfRange)}'`;
    chartOptions.options.tooltips.callbacks.title = tooltipItems => range[tooltipItems[0].index].label;
    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, chartOptions);
    updateSummaryTabs(infoFilteredByRange, statsOptions);
    nextGenerationLog("Chart rendered");
}


function generateChartData(range, data, relevantDatum) {
    const publicationDateDataset = {
        label: 'Publication original date\n',
        data: range.map((_, index) => undefined),
        backgroundColor: `rgb(0, 0, 0)`,
        type: 'bubble',
        order: -1,
        borderWidth: 10
    };
    return Object.values(data
        .reduce((acc, info) => {
            if (acc[info.id] === undefined) {
                acc[info.id] = initialValueOfEveryBar(info, range);
            }
            return acc;
        }, {}))
        .map((post, index, vec) => {
            const indexOfDate = range
                .findIndex(item => post.publicationDate.getTime() >= item.begin.getTime() && post.publicationDate.getTime() < item.end.getTime());
            checkPublicationDot(indexOfDate, publicationDateDataset, post);
            const backgroundColor = getShadeOfColor(vec.length, index);
            const dataOfPostId = getDataOfPostInRange(range, data, post);
            post.data = post.data.map((datum, index) => datum + relevantDatum(dataOfPostId[index]));
            post.backgroundColor = `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, 0.75)`;
            return post;
        })
        .filter((post => post.data.reduce((acc, current) => acc + current, 0) > 0))
        .concat(publicationDateDataset);
}


function initialValueOfEveryBar(info, range) {
    return {
        publicationDate: info.publicationDate,
        id: info.id,
        label: info.title,
        stack: 'unique',
        barPercentage: 0.95,
        categoryPercentage: 1,
        data: range.map((_, index) => 0)
    };
}

function checkPublicationDot(indexOfDate, publicationDateDataset, post) {
    const publicationDay = indexOfDate >= 0;
    if (publicationDay) {
        if (publicationDateDataset.data[indexOfDate]) {
            publicationDateDataset.data[indexOfDate].r += publicationDateDotRadius;
        } else {
            publicationDateDataset.data[indexOfDate] = {x: 0, y: 0, r: publicationDateDotRadius, post};
        }
    }
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
