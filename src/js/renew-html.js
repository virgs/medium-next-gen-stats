function renewRangeNavbar() {
    const rangeNavBar = document.querySelector("nav");
    rangeNavBar.classList.add('mngs-range-selector');
    const listItems = Array.from(rangeNavBar.querySelectorAll('ul li'));
    listItems
        .forEach((item, index) => {
            const anchor = item.querySelector('a');
            anchor.text = ranges[index].label;
            anchor.setAttribute('href', '#');
            anchor.onclick = () => rangeButtonClicked(listItems, index);
        });
    return rangeNavBar;
}

function renewSummaryInfo() {
    const summaryInfo = document.querySelector('.chartTabs');
    summaryInfo.classList.add('mngs-summary-info');
    const chartTabs = document.querySelectorAll('.chartTabs li');
    const viewsTab = chartTabs[0];
    viewsTab.querySelector('span').textContent = '';
    viewsTab.onclick = async event => {
        event.stopPropagation();
        if (chartOptions.loaded) {
            viewsTab.classList.add('is-active');
            clapsTab.classList.remove('is-active');
            statsOptions.relevantDatum = getViewOfData;
            statsOptions.relevantDatumLabel = 'views';
            chartOptions.loaded = false;
            await generateChart();
        }
    };
    viewsTab.querySelector('.js-totalViews').innerText = `-`;

    const clapsTab = chartTabs[1];
    clapsTab.querySelector('.js-totalReads').innerText = `-`;
    clapsTab.querySelectorAll('div.chartTab div')[1].textContent = 'Claps';
    clapsTab.onclick = async event => {
        event.stopPropagation();
        if (chartOptions.loaded) {
            clapsTab.classList.add('is-active');
            viewsTab.classList.remove('is-active');
            statsOptions.relevantDatumLabel = 'claps';
            statsOptions.relevantDatum = getClapsOfData;
            chartOptions.loaded = false;
            await generateChart();
        }
    };

    const publicationsTab = chartTabs[2].remove();
    // publicationsTab.querySelector('.js-totalFans').innerText = `-`;
    // publicationsTab.querySelectorAll('div.chartTab div')[1].textContent = 'New articles';
    // publicationsTab.onclick = (e) => e.stopPropagation();
    // publicationsTab.classList.add('is-active');
    // publicationsTab.querySelector('div').style.cursor = 'initial';
    return summaryInfo;
}

function updateChartPageLabels() {
    const chartPaginator = document.querySelector(".chartPage");
    const chartPageLabels = chartPaginator.querySelectorAll('.button-label');
    chartPageLabels[0].textContent = `Prev ${ranges[currentRangeIndex].daysOfRange} days`;
    chartPageLabels[1].textContent = `Next ${ranges[currentRangeIndex].daysOfRange} days`;
}

function renewChartPaginator() {
    updateChartPageLabels();
    const chartPaginator = document.querySelector(".chartPage");
    const chartPageButtons = chartPaginator.querySelectorAll('button');
    const chartPagePrevButton = chartPageButtons[0];
    const chartPageNextRangeButton = chartPageButtons[1];
    chartPagePrevButton.onclick = async () => {
        if (chartOptions.loaded) {
            chartOptions.loaded = false;

            statsOptions.lastDayOfRange = statsOptions.firstDayOfRange;
            statsOptions.firstDayOfRange = new Date(statsOptions.lastDayOfRange.getTime() -
                (ranges[currentRangeIndex].daysOfRange * oneDayInMilliseconds));
            chartPageNextRangeButton.disabled = false;
            await generateChart();
        }
    };
    chartPageNextRangeButton.onclick = async () => {
        if (chartOptions.loaded) {
            chartOptions.loaded = false;

            statsOptions.firstDayOfRange = statsOptions.lastDayOfRange;
            statsOptions.lastDayOfRange = new Date(statsOptions.lastDayOfRange.getTime() +
                (ranges[currentRangeIndex].daysOfRange * oneDayInMilliseconds));
            if (new Date(statsOptions.lastDayOfRange.getTime() + oneDayInMilliseconds).getTime() >= new Date().getTime()) {
                chartPageNextRangeButton.disabled = true;
                statsOptions.lastDayOfRange = tomorrow;
                statsOptions.firstDayOfRange = new Date(statsOptions.lastDayOfRange.getTime() -
                    (ranges[currentRangeIndex].daysOfRange * oneDayInMilliseconds));
            }
            await generateChart();
        }
    };
    chartPageNextRangeButton.disabled = true;
}

function updateSummaryTabs(data) {
    const summary = data
        .reduce((acc, post) => {
            acc.views += post.views;
            acc.claps += post.claps;
            acc.reads += post.reads;
            acc.upvotes += post.upvotes;
            return acc;
        }, {
            views: 0,
            claps: 0,
            reads: 0,
            upvotes: 0
        });


    const chartTabs = document.querySelectorAll('.chartTabs li');
    const viewsTab = chartTabs[0];
    viewsTab.querySelector('.js-totalViews').innerText = `${prettifyNumbers(summary.views)}`;
    const clapsTab = chartTabs[1];
    clapsTab.querySelector('.js-totalReads').innerText = `${prettifyNumbers(summary.claps)}`;
    // const publicationsTab = chartTabs[2];
    // publicationsTab.querySelector('.js-totalFans').innerText = `${prettifyNumbers(publicationsDates)}`;
}

async function renewOldFashionPage() {
    document.querySelector('h1.stats-title').classList.add('mngs-stats-page-title');
    document.querySelector('.bargraph').remove();

    const statsTitleDetails = document.querySelectorAll('div .stats-title')[1];
    statsTitleDetails.classList.add('mngs-stats-title-details');
    const detailsLink = statsTitleDetails.querySelector('.chartHelper a');
    detailsLink.textContent = 'Get back to the old fashion medium stats';
    detailsLink.target = '_self';
    detailsLink.href = '/me/stats/';
    statsTitleDetails.querySelector('.chartHelper').innerHTML = detailsLink.outerHTML;
    const chart = statsTitleDetails.cloneNode();
    chart.innerHTML =
        `<div>
            <canvas id="chart"></canvas>
         </div>`;
    statsTitleDetails.insertAdjacentElement('afterend', chart);

    renewChartPaginator();
    const summaryInfo = renewSummaryInfo();
    const startTitle = document.querySelector(".stats-title--chart");
    const rangeNavBar = renewRangeNavbar();
    const parent = startTitle.parentNode;
    parent.insertBefore(rangeNavBar, startTitle);
    parent.insertBefore(summaryInfo, rangeNavBar);
    parent.insertBefore(statsTitleDetails, summaryInfo);
}
