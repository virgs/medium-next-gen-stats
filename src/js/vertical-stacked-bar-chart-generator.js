const LINE_TYPE = 'line';
const BUBBLE_TYPE = 'bubble';
const BAR_TYPE = 'bar';

const MAX_TOOLTIP_ITEMS = 10;

let barChartData = [];
let bubbleChartData = [];
let lineChartData = [];

const verticalStackedBarChartGenerator = {
    type: BAR_TYPE,
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
            position: 'bottom',
            align: 'start',
            labels: {
                boxWidth: 25,
                padding: 30,
                generateLabels: chart => {
                    return chart.data.datasets
                        .filter(dataset => dataset.type === LINE_TYPE)
                        .map(dataset => ({
                            id: dataset.id,
                            text: dataset.label,
                            fillStyle: dataset.borderColor,
                            strokeStyle: dataset.borderColor,
                            lineWidth: dataset.borderColor,
                        }));
                }
            },
            onClick: (event, item) => hidePost(item)
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
            currentExcludedItems: [],
            topPostsOfTooltip: undefined,
            itemSort: (first, second) => second.value - first.value,
            filter: (item, chartData) => {
                const parsedValue = parseInt(item.value);
                if (parsedValue <= 0) {
                    return false;
                }
                if (!verticalStackedBarChartGenerator.options.tooltips.topPostsOfTooltip) {
                    verticalStackedBarChartGenerator.options.tooltips.topPostsOfTooltip = chartData.datasets
                        .filter(dataset => statsOptions.postsIdsToHighlight.length <= 0 ? dataset.type === BAR_TYPE : dataset.type === LINE_TYPE)
                        .map(dataset => dataset.data[item.index])
                        .filter(item => item > 0)
                        .sort((a, b) => a - b)
                        .reverse()
                        .filter((item, index) => {
                            if (index < MAX_TOOLTIP_ITEMS) {
                                return true;
                            }
                            verticalStackedBarChartGenerator.options.tooltips.currentExcludedItems.push(item);
                            return false;
                        });
                }
                const foundItemIndex = verticalStackedBarChartGenerator.options.tooltips.topPostsOfTooltip
                    .findIndex(item => item === parsedValue);

                if (foundItemIndex !== -1) {
                    verticalStackedBarChartGenerator.options.tooltips.topPostsOfTooltip =
                        verticalStackedBarChartGenerator.options.tooltips.topPostsOfTooltip
                            .filter((_, index) => index !== foundItemIndex);
                    return true;
                }
                return false;
            },
            callbacks: {
                label: (tooltipItem, chartData) => {
                    const dataset = chartData.datasets[tooltipItem.datasetIndex];
                    if (dataset.label === undefined) {
                        return ''
                    }
                    const total = chartData
                        .datasets
                        .reduce((acc, dataset) => {
                            const value = dataset.data[tooltipItem.index];
                            if (typeof value === 'number') {
                                return acc + value;
                            }
                            return acc;
                        }, 0);
                    return ` "${dataset.label}":    ${prettifyNumbersWithCommas(tooltipItem.value)}   (${(100 * tooltipItem.value / total).toFixed(1)}%)`
                },
                afterBody: () => {
                    if (verticalStackedBarChartGenerator.options.tooltips.currentExcludedItems.length > 0) {
                        if (verticalStackedBarChartGenerator.options.tooltips.currentExcludedItems.length === 1) {
                            return `   and another one...`;
                        }
                        return `   and ${verticalStackedBarChartGenerator.options.tooltips.currentExcludedItems.length} others...`;
                    }
                },
                footer: (tooltipItems) => {
                    const excludedItems = verticalStackedBarChartGenerator.options.tooltips.currentExcludedItems;
                    const value = tooltipItems
                            .reduce((acc, tooltipItem) => parseInt(tooltipItem.value) + acc, 0)
                        + excludedItems.reduce((acc, item) => acc + item, 0);
                    verticalStackedBarChartGenerator.options.tooltips.currentExcludedItems = [];
                    delete verticalStackedBarChartGenerator.options.tooltips.topPostsOfTooltip;
                    const total = tooltipItems.length + excludedItems.length;

                    const numOfHighlightedPosts = statsOptions.postsIdsToHighlight.length;
                    let label = statsOptions.relevantDatumLabel;
                    if (value <= 1) {
                        label = label.substring(0, label.length - 1);
                    }
                    let footer = `Total: ${prettifyNumbersWithCommas(value)} ${label}`;
                    if (!label.startsWith('follower')) {
                        if (numOfHighlightedPosts > 0) {
                            footer += `of ${numOfHighlightedPosts} highlighted article${numOfHighlightedPosts > 1 ? 's' : ''}`;
                        } else {
                            footer += ` of ${total} article${total > 1 ? 's' : ''}`;
                        }
                    }
                    return footer;
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
                type: 'linear',
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

async function generateVerticalStackedBarChart(postsDataOfChart, postsSummaryOfChart) {
    const range = statsOptions.rangeMethod(statsOptions.firstDayOfRange, statsOptions.lastDayOfRange);
    const labels = range.map(interval => interval.label);
    barChartData = generateBarChartData(range, postsDataOfChart, statsOptions.relevantDatum);
    bubbleChartData = generateBubbleChartData(range, postsSummaryOfChart);
    lineChartData = generateLineChartData(range, postsDataOfChart, statsOptions.relevantDatum);
    verticalStackedBarChartGenerator.data = {
        datasets: barChartData
            .concat(bubbleChartData)
            .concat(lineChartData),
        labels
    };

    verticalStackedBarChartGenerator.options.title.text = `${statsOptions.label} ${statsOptions.relevantDatumLabel} from '${getStringifiedDate(statsOptions.firstDayOfRange)}' to '${
        getStringifiedDate(statsOptions.lastDayOfRange)}'`;
    verticalStackedBarChartGenerator.options.tooltips.callbacks.title = tooltipItems => tooltipItems.length > 0 ? range[tooltipItems[0].index].label : '';
    return verticalStackedBarChartGenerator;
}

function generateBarChartData(range, postsDataOfChart, relevantDatum) {
    const alpha = statsOptions.postsIdsToHighlight.length > 0 ? HIGHLIGHTED_ALPHA : NOT_HIGHLIGHTED_ALPHA;
    const data = range.map(_ => 0);
    return Object.values(postsDataOfChart
        .reduce((acc, info) => {
            acc[info.id] = acc[info.id] || {
                claps: 0,
                reads: 0,
                followers: 0,
                upvotes: 0,
                views: 0,

                readingTime: info.readingTime,
                label: info.title,
                id: info.id,
                type: BAR_TYPE,
                stack: 'unique',
                barPercentage: 0.95,
                categoryPercentage: 1,
                data: data
            };

            acc[info.id].claps += getNumber(info.claps);
            acc[info.id].reads += getNumber(info.reads);
            acc[info.id].followers += getNumber(info.followers);
            acc[info.id].upvotes += getNumber(info.upvotes);
            acc[info.id].views += getNumber(info.views);
            return acc;
        }, {}))
        .map((post, index, vec) => {
            const backgroundColor = getShadeOfColor(vec.length, index);
            const dataOfPostId = getDataOfPostInRange(range, postsDataOfChart, post);
            post.data = dataOfPostId.map(value => relevantDatum(value));
            post.backgroundColor = `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, ${alpha})`;
            return post;
        })
        .filter((post => post.data.reduce((acc, current) => acc + current, 0) > 0));
}

function generateLineChartData(range, postsDataOfChart, relevantDatum) {
    return Object.values(postsDataOfChart
        .reduce((acc, info) => {
            if (acc[info.id] === undefined && statsOptions.postsIdsToHighlight.includes(info.id)) {
                acc[info.id] = {
                    id: info.id,
                    claps: info.claps,
                    reads: info.reads,
                    label: info.title,
                    followers: info.followers,
                    upvotes: info.upvotes,
                    views: info.views,
                    readingTime: info.readingTime,

                    type: LINE_TYPE,
                    order: -2,
                    spanGaps: false,
                    pointRadius: 2,
                    borderWidth: 4,
                    fill: false,
                    data: range.map((_, index) => 0)
                }
            }
            return acc;
        }, {}))
        .map((post, index, vec) => {
            const backgroundColor = getShadeOfColor(vec.length, index, highlightColor);
            const color = `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, 0.75)`;
            const dataOfPostId = getDataOfPostInRange(range, postsDataOfChart, post);
            post.data = dataOfPostId.map(value => relevantDatum(value));
            post.borderColor = color;
            post.pointBackgroundColor = color;
            post.pointBorderColor = color;
            return post;
        })
        .filter((post => post.data.reduce((acc, current) => acc + current, 0) > 0));
}

function generateBubbleChartData(range, filteredByRangePostsSummary) {
    return filteredByRangePostsSummary
        .reduce((acc, summary) => {
            const indexOfDate = range
                .findIndex(item => +summary.firstPublishedAt >= item.begin.getTime() && +summary.firstPublishedAt < item.end.getTime());
            const dataset = checkPublicationDataset(indexOfDate, summary, range, acc);
            if (dataset) {
                acc.push(dataset);
            }
            return acc;
        }, []);
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
                    r: radius
                };
            }
        }),
        backgroundColor: `rgb(0, 0, 0, 0.95)`,
        type: BUBBLE_TYPE,
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
            const index = range.findIndex(item => {
                const collectedAt = new Date(+data.collectedAt);
                return item.begin <= collectedAt &&
                    collectedAt < item.end;
            });
            if (index >= 0) {
                acc[index].views += getNumber(data.views);
                acc[index].claps += getNumber(data.claps);
                acc[index].reads += getNumber(data.reads);
                acc[index].upvotes += getNumber(data.upvotes);
                acc[index].earnings += getNumber(data.earnings);
                acc[index].followers += getNumber(data.followers);
            } else {
                console.log(index)
            }
            return acc;
        }, range.map(() => ({
            views: 0,
            claps: 0,
            reads: 0,
            followers: 0,
            earnings: 0,
            upvotes: 0
        })));
}
