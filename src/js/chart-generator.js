let chartRenderingAnimationCompleted = false;

let chart = undefined;
let prevStatsOptions = undefined;

function statsOptionsHasChanged() {
    console.log(prevStatsOptions, statsOptions)
    if (prevStatsOptions) {
        if (prevStatsOptions.firstDayOfRange.getTime() !== statsOptions.firstDayOfRange.getTime()) {
            return true;
        }
        if (prevStatsOptions.lastDayOfRange.getTime() !== statsOptions.lastDayOfRange.getTime()) {
            return true;
        }
        if (prevStatsOptions.label !== statsOptions.label) {
            return true;
        }
        if (prevStatsOptions.relevantDatumLabel !== statsOptions.relevantDatumLabel) {
            return true;
        }
        if (prevStatsOptions.rangeMethod !== statsOptions.rangeMethod) {
            return true;
        }
        if (prevStatsOptions.chartGenerator !== statsOptions.chartGenerator) {
            return true;
        }
        if (prevStatsOptions.postsIdsToHighlight !== statsOptions.postsIdsToHighlight) {
            return true;
        }
        return false
    }
    return true;
}

async function generateChart() {

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
    updateSummaryTabs(postsDataOfChart, statsOptions);

    if (!statsOptionsHasChanged()) {
        return
    }
    if (chart) {
        chart.destroy();
    }
    chartRenderingAnimationCompleted = false;
    const chartOptions = await statsOptions.chartGenerator(postsDataOfChart, postsSummaryOfChart);

    const ctx = document.getElementById('chart').getContext('2d');
    chart = new Chart(ctx, chartOptions);


    nextGenerationLog('Chart rendered');
    prevStatsOptions = {...statsOptions, postsIdsToHighlight: [...statsOptions.postsIdsToHighlight]}
}
