function renewRangeNavbar() {
    const rangeNavBar = document.querySelector("nav");
    rangeNavBar.setAttribute('id', 'rangeNavBar');
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
    const readsTab = chartTabs[1];
    const clapsTab = chartTabs[2];

    viewsTab.querySelector('.js-totalViews').innerText = `-`;
    viewsTab.querySelector('span').textContent = '';
    viewsTab.onclick = async event => {
        event.stopPropagation();
        if (chartRenderingAnimationCompleted) {
            viewsTab.classList.add('is-active');
            readsTab.classList.remove('is-active');
            clapsTab.classList.remove('is-active');
            statsOptions.relevantDatum = getViewOfData;
            statsOptions.relevantDatumLabel = 'views';
            await generateChart();
        }
    };

    readsTab.querySelector('.js-totalReads').innerText = `-`;
    readsTab.querySelectorAll('div.chartTab div')[1].textContent = 'Reads';
    readsTab.onclick = async event => {
        event.stopPropagation();
        if (chartRenderingAnimationCompleted) {
            viewsTab.classList.remove('is-active');
            readsTab.classList.add('is-active');
            clapsTab.classList.remove('is-active');
            statsOptions.relevantDatumLabel = 'reads';
            statsOptions.relevantDatum = getReadsOfData;
            await generateChart();
        }
    };

    clapsTab.querySelector('.js-totalFans').innerText = `-`;
    clapsTab.querySelectorAll('div.chartTab div')[1].textContent = 'Claps';
    clapsTab.onclick = async event => {
        event.stopPropagation();
        if (chartRenderingAnimationCompleted) {
            viewsTab.classList.remove('is-active');
            readsTab.classList.remove('is-active');
            clapsTab.classList.add('is-active');
            statsOptions.relevantDatumLabel = 'claps';
            statsOptions.relevantDatum = getClapsOfData;
            await generateChart();
        }
    };
    return summaryInfo;
}

function updateChartPageLabels() {
    const chartPaginator = document.querySelector(".chartPage");
    const chartPageLabels = chartPaginator.querySelectorAll('.button-label');
    chartPageLabels[0].textContent = `Prev ${timeRanges[currentTimeRangeIndex]} days`;
    chartPageLabels[1].textContent = `Next ${timeRanges[currentTimeRangeIndex]} days`;
}

function renewChartPaginator() {
    updateChartPageLabels();
    const chartPaginator = document.querySelector(".chartPage");
    const chartPageButtons = chartPaginator.querySelectorAll('button');
    const chartPagePrevButton = chartPageButtons[0];
    const chartPageNextRangeButton = chartPageButtons[1];
    chartPagePrevButton.onclick = async () => {
        if (chartRenderingAnimationCompleted) {
            statsOptions.lastDayOfRange = statsOptions.firstDayOfRange;
            statsOptions.firstDayOfRange = new Date(statsOptions.lastDayOfRange.getTime() -
                (timeRanges[currentTimeRangeIndex] * oneDayInMilliseconds));
            chartPageNextRangeButton.disabled = false;
            await generateChart();
        }
    };
    chartPageNextRangeButton.onclick = async () => {
        if (chartRenderingAnimationCompleted) {
            statsOptions.firstDayOfRange = statsOptions.lastDayOfRange;
            statsOptions.lastDayOfRange = new Date(statsOptions.lastDayOfRange.getTime() +
                (timeRanges[currentTimeRangeIndex] * oneDayInMilliseconds));
            if (new Date(statsOptions.lastDayOfRange.getTime() + oneDayInMilliseconds).getTime() >= new Date().getTime()) {
                chartPageNextRangeButton.disabled = true;
                statsOptions.lastDayOfRange = tomorrow;
                statsOptions.firstDayOfRange = new Date(statsOptions.lastDayOfRange.getTime() -
                    (timeRanges[currentTimeRangeIndex] * oneDayInMilliseconds));
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
    viewsTab.querySelector('.js-totalViews').innerText = `${prettifyNumbersWithCommas(summary.views)}`;
    const reads = chartTabs[1];
    reads.querySelector('.js-totalReads').innerText = `${prettifyNumbersWithCommas(summary.reads)}`;
    const clapsTab = chartTabs[2];
    clapsTab.querySelector('.js-totalFans').innerText = `${prettifyNumbersWithCommas(summary.claps)}`;
}

function addActionToChartTypeIcons() {
    const downloadIcon = document.querySelector('.fa-file-download');
    const chartBarIcon = document.querySelector('.fa-chart-bar');
    const pieChartIcon = document.querySelector('.fa-chart-pie');

    downloadIcon.parentNode.onclick = async () => {
        if (document.querySelector('.fa-file-download').style.pointerEvents !== 'none') {
            const element = document.createElement('a');
            const stringifiedContent = JSON.stringify(downloadData, null, 2);
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(stringifiedContent));
            element.setAttribute('download', 'medium-next-generation-stats.json');
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }
    };

    chartBarIcon.parentNode.onclick = async () => {
        if (statsOptions.chartGenerator !== generateVerticalStackedBarChart) {
            document.querySelector('#rangeNavBar').style.opacity = '1';
            statsOptions.chartGenerator = generateVerticalStackedBarChart;
            document.querySelector('.fa-chart-bar').classList.add('mngs-chart-type-icon-active');
            document.querySelector('.fa-chart-pie').classList.remove('mngs-chart-type-icon-active');
            await generateChart();
        }
    };

    pieChartIcon.parentNode.onclick = async () => {
        if (statsOptions.chartGenerator !== generatePieBarChart) {
            document.querySelector('#rangeNavBar').style.opacity = '0';
            statsOptions.chartGenerator = generatePieBarChart;
            document.querySelector('.fa-chart-bar').classList.remove('mngs-chart-type-icon-active');
            document.querySelector('.fa-chart-pie').classList.add('mngs-chart-type-icon-active');
            await generateChart();
        }
    }
}

function enableDownloadButton() {
    document.querySelector('.fa-file-download').style.pointerEvents = 'initial';
    document.querySelector('.fa-file-download').style.visibility = 'initial';

}

async function rangeButtonClicked(listItems, clickedItemIndex) {
    if (chartRenderingAnimationCompleted) {
        currentRangeIndex = clickedItemIndex;
        const selectedRange = ranges[clickedItemIndex];
        nextGenerationLog(`Generating ${selectedRange.label} chart`);
        listItems
            .forEach((item, index) => index === clickedItemIndex ? item.classList.add('is-active') : item.classList.remove('is-active'));
        statsOptions.rangeMethod = selectedRange.rangeMethod;
        statsOptions.label = selectedRange.label;

        await generateChart();
    }
}

async function timeRangeButtonClicked(listItems, clickedItemIndex) {
    if (chartRenderingAnimationCompleted) {
        currentTimeRangeIndex = clickedItemIndex;
        const days = timeRanges[currentTimeRangeIndex];
        nextGenerationLog(`Generating ${days} days chart`);
        listItems
            .forEach((item, index) => index === clickedItemIndex ? item.classList.add('is-active') : item.classList.remove('is-active'));
        statsOptions.firstDayOfRange = new Date(statsOptions.lastDayOfRange.getTime() -
            (days * oneDayInMilliseconds));

        updateChartPageLabels();
        await generateChart();
    }
}


function createTimeNavBar() {
    const navBar = document.createElement('nav');
    navBar.setAttribute('id', 'timeNavBar');
    navBar.classList.add('u-flex', 'heading', 'heading--borderedBottom', 'heading--paddedTop', 'mngs-range-selector');
    navBar.innerHTML = `
         <span class="u-minWidth0">
             <ul class="heading-tabs">
                ${timeRanges.map((range, index) => {
        return ` <li class="heading-tabsItem u-inlineBlock js-tabsItem ${index === 0 ? 'is-active' : ''} u-fontSize16">
                                 <span class="heading-title u-inlineBlock u-fontSize16">
                                     <a class="button button--chromeless u-baseColor--buttonNormal"
                                        href="#">${range} days</a>
                                 </span>
                             </li>`
    }).join('')}
             </ul>
         </span>    
    `;
    const listItems = Array.from(navBar.querySelectorAll('ul li'));
    listItems
        .forEach((item, index) => {
            item.querySelector('a').addEventListener('click', () => timeRangeButtonClicked(listItems, index));
        });
    return navBar;
}

async function renewOldFashionPage() {
    document.querySelector('h1.stats-title').classList.add('mngs-stats-page-title');
    document.querySelector('.bargraph').remove();

    const statsTitleDetails = document.querySelectorAll('div .stats-title')[1];
    const chart = statsTitleDetails.cloneNode();
    chart.innerHTML =
        `<div>
            <canvas id="chart"></canvas>
         </div>
         <div style="position: relative">
             <span class="tooltip">
                <div class="tooltiptext">Export to JSON file</div>
                <i style="pointer-events: none; visibility: hidden" class="fas fa-file-download mngs-chart-action-icon"></i>
            </span>
            <div style="top: 0; right: 0; position: absolute;">
                <span class="tooltip">
                    <div class="tooltiptext">Compare articles ${statsOptions.label.toLowerCase()} by time</div>
                    <i class="far fa-chart-bar mngs-chart-type-icon mngs-chart-type-icon-active"></i>
                </span>
                <span class="tooltip">
                    <div class="tooltiptext">Compare articles ${statsOptions.label.toLowerCase()} with each other</div>
                    <i class="fas fa-chart-pie mngs-chart-type-icon"></i> 
                </span>            
            </div>
        </div>`;
    statsTitleDetails.insertAdjacentElement('afterend', chart);

    renewChartPaginator();
    const summaryInfo = renewSummaryInfo();
    const startTitle = document.querySelector(".stats-title--chart");
    const parent = startTitle.parentNode;
    const rangeNavBar = renewRangeNavbar();
    const timeNavBar = createTimeNavBar();
    parent.appendChild(timeNavBar);
    parent.insertBefore(rangeNavBar, startTitle);
    parent.insertBefore(timeNavBar, rangeNavBar);
    parent.insertBefore(summaryInfo, rangeNavBar);
    addActionToChartTypeIcons();
    statsTitleDetails.remove();
    // parent.insertBefore(statsTitleDetails, summaryInfo);
}
