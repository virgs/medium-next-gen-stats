let chartRenderingAnimationCompleted = false;

let chart = undefined;

async function generateChart() {
    if (chart) {
        chart.destroy();
    }

    chartRenderingAnimationCompleted = false;
    const postsDataOfChart = mngsData.postsData
        .filter(post => post.collectedAt >= statsOptions.firstDayOfRange.getTime() && post.collectedAt < statsOptions.lastDayOfRange.getTime());
    const postsSummaryOfChart = mngsData.postsSummary
        .filter(post => post.firstPublishedAt >= statsOptions.firstDayOfRange.getTime() && post.firstPublishedAt < statsOptions.lastDayOfRange.getTime());

    const chartOptions = await statsOptions.chartGenerator(postsDataOfChart, postsSummaryOfChart);

    const ctx = document.getElementById('chart').getContext('2d');
    chart = new Chart(ctx, chartOptions);

    updateSummaryTabs(postsDataOfChart, statsOptions);
    nextGenerationLog("Chart rendered");
}
