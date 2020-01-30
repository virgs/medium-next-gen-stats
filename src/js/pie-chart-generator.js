const pieChartOptions = {
    type: 'pie',
    options: {
        cutoutPercentage: 20,
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
            display: false,
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


async function generatePieBarChart(postsDataOfChart) {
    let pieChartData = Object.values(postsDataOfChart
        .reduce((acc, data, index, vec) => {
            const id = data.id;
            if (!acc[id]) {
                acc[id] = {
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
    pieChartData
        .forEach((item, index, vec) => {
            const backgroundColor = getShadeOfColor(vec.length, index);
            item.backgroundColor = `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, 0.95)`;
        });

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
