const MAX_LEGEND_ITEMS = 10;

const pieChartOptions = {
    type: 'pie',
    options: {
        cutoutPercentage: 40,
        rotation: Math.PI,
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
            position: 'right',
            align: 'start',
            labels: {
                boxWidth: 25,
                padding: 30,
                filter: legendItem => legendItem.index < MAX_LEGEND_ITEMS,
                generateLabels: chart => {
                    const data = chart.data;
                    if (data.labels.length && data.datasets.length) {
                        return data.labels.map((label, index) => {
                            const meta = chart.getDatasetMeta(0);
                            const style = meta.controller.getStyle(index);
                            return {
                                text: `${ordinalNumber(index + 1).padStart(4, ' ')} (${data.datasets[0].data[index]}) - "${label}"`,
                                fillStyle: style.backgroundColor,
                                strokeStyle: style.borderColor,
                                lineWidth: style.borderWidth,
                                hidden: isNaN(data.datasets[0].data[index]) || meta.data[index].hidden,

                                // Extra data used for toggling the correct item
                                index: index
                            };
                        });
                    }
                    return [];
                }
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
            callbacks: {
                label: (tooltipItem, data) => {
                    const total = data.datasets[0].data.reduce((acc, item) => acc + item, 0);
                    const value = data.datasets[0].data[tooltipItem.index];
                    const title = data.labels[tooltipItem.index];
                    return ` "${title}":    ${prettifyNumbersWithCommas(value)}   (${(100 * value / total).toFixed(1)}%)`
                },
            },
            footerFontStyle: 'bold',
            intersect: true
        },
        hover: {
            mode: 'index',
            intersect: true
        },
    }
};

const ordinalNumber = (value) => {
    if (value === 1) {
        return '1st';
    } else if (value === 2) {
        return '2nd';
    } else if (value === 3) {
        return '3rd';
    }
    return `${value}th`;
};


function getPieChartData(postsDataOfChart) {
    return Object.values(postsDataOfChart
        .reduce((acc, data) => {
            const id = data.id;
            if (!acc[id]) {
                acc[id] = {
                    id: id,
                    title: data.title,
                    value: statsOptions.relevantDatum(data),
                }
            } else {
                acc[id].value += statsOptions.relevantDatum(data);
            }
            return acc;
        }, {}))
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value);
}

function setBackgroundColor(pieChartData) {
    const alpha = postsIdsToHighlight.length > 0 ? HIGHLIGHTED_ALPHA : NOT_HIGHLIGHTED_ALPHA;
    pieChartData
        .forEach((item, index, vec) => {
            const findIndex = postsIdsToHighlight.findIndex(highlightedItem => highlightedItem === item.id);
            if (findIndex !== -1) {
                const backgroundColor = getShadeOfColor(postsIdsToHighlight.length, findIndex, highlightColor);
                item.backgroundColor = `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, 0.95)`;
            } else {
                const backgroundColor = getShadeOfColor(vec.length, index);
                item.backgroundColor = `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, ${alpha})`;
            }
        });
}

async function generatePieBarChart(postsDataOfChart) {
    const pieChartData = getPieChartData(postsDataOfChart);
    setBackgroundColor(pieChartData);

    const labels = pieChartData.map(item => item.title);
    const chartData = pieChartData.map(item => item.value);
    const colors = pieChartData.map(item => item.backgroundColor);
    pieChartOptions.data = {
        labels: labels,
        datasets: [{
            backgroundColor: colors,
            data: chartData
        }]
    };
    const capitalizedRelevantDatumLabel = statsOptions.relevantDatumLabel.substr(0, 1).toUpperCase() + statsOptions.relevantDatumLabel.substr(1);
    pieChartOptions.options.title.text = `${capitalizedRelevantDatumLabel} from '${getStringifiedDate(statsOptions.firstDayOfRange)}' to '${
        getStringifiedDate(new Date(statsOptions.lastDayOfRange.getTime() - oneDayInMilliseconds))}'`;

    return pieChartOptions;
}
