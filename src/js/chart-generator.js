let chartRenderingAnimationCompleted = false;

let chart = undefined;

async function generateChart() {
    if (chart) {
        chart.destroy();
    }

    chartRenderingAnimationCompleted = false;
    const postsDataOfChart = mngsData.postsData
        .filter(post => {
            const collectedAt = new Date(+post.collectedAt);
            return collectedAt >= statsOptions.firstDayOfRange &&
                collectedAt < statsOptions.lastDayOfRange;
        });
    const postsSummaryOfChart = mngsData.postsSummary
        .filter(post => {
            const date = new Date(+post.firstPublishedAt);
            return date >= statsOptions.firstDayOfRange &&
                date < statsOptions.lastDayOfRange;
        });

    const chartOptions = await statsOptions.chartGenerator(postsDataOfChart, postsSummaryOfChart);

    const ctx = document.getElementById('chart').getContext('2d');
    chart = new Chart(ctx, chartOptions);

    updateSummaryTabs(postsDataOfChart, statsOptions);
    nextGenerationLog('Chart rendered');
}
