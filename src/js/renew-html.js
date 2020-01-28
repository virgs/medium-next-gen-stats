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
    viewsTab.onclick = (e) => e.stopPropagation();
    viewsTab.querySelector('div').style.cursor = 'initial';
    viewsTab.querySelector('.js-totalViews').innerText = `-`;

    const publicationsTab = chartTabs[1];
    publicationsTab.querySelector('.js-totalReads').innerText = `-`;
    publicationsTab.querySelectorAll('div.chartTab div')[1].textContent = 'Publications';
    publicationsTab.onclick = (e) => e.stopPropagation();
    publicationsTab.classList.add('is-active');
    publicationsTab.querySelector('div').style.cursor = 'initial';
    chartTabs[2].remove();
    return summaryInfo;
}

function renewChartPaginator() {
    const chartPaginator = document.querySelector(".chartPage");
    const chartPageLabels = chartPaginator.querySelectorAll('.button-label');
    chartPageLabels[0].textContent = `Prev ${daysOfRange} days`;
    chartPageLabels[1].textContent = `Next ${daysOfRange} days`;
    const chartPageButtons = chartPaginator.querySelectorAll('button');
    const chartPagePrevButton = chartPageButtons[0];
    const chartPageNextRangeButton = chartPageButtons[1];
    chartPagePrevButton.onclick = async () => {
        if (chartOptions.loaded) {
            chartOptions.loaded = false;

            lastDayOfRange = firstDayOfRange;
            firstDayOfRange = new Date(lastDayOfRange.getTime() - (daysOfRange * oneDayInMilliseconds));
            chartPageNextRangeButton.disabled = false;
            await generateChart(postsData, {
                firstDayOfRange,
                lastDayOfRange,
                rangeMethod: ranges[currentRangeIndex].rangeMethod,
                label: ranges[currentRangeIndex].label
            });
        }
    };
    chartPageNextRangeButton.onclick = async () => {
        if (chartOptions.loaded) {
            chartOptions.loaded = false;
            firstDayOfRange = lastDayOfRange;
            lastDayOfRange = new Date(lastDayOfRange.getTime() + (daysOfRange * oneDayInMilliseconds));
            if (new Date(lastDayOfRange.getTime() + oneDayInMilliseconds).getTime() >= new Date().getTime()) {
                chartPageNextRangeButton.disabled = true;
            }
            await generateChart(postsData, {
                firstDayOfRange,
                lastDayOfRange,
                rangeMethod: ranges[currentRangeIndex].rangeMethod,
                label: ranges[currentRangeIndex].label
            })
        }
    };
    chartPageNextRangeButton.disabled = true;
}

async function renewOldFashionPage() {
    document.querySelectorAll('div .stats-title')[1].innerHTML =
        `<div>
            <canvas id="chart"></canvas>
         </div>`;
    document.querySelector('.bargraph').remove();
    renewChartPaginator();
    const summaryInfo = renewSummaryInfo();
    const chart = document.querySelector(".stats-title--chart");
    const rangeNavBar = renewRangeNavbar();
    const parent = rangeNavBar.parentNode;
    parent.insertBefore(rangeNavBar, chart);
    parent.insertBefore(summaryInfo, rangeNavBar);
}
