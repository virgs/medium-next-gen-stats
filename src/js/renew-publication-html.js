function createSummary() {
    const summary = document.createElement('ul');
    summary.classList.add('chartTabs');
    summary.innerHTML = `
        <li class="is-active" data-action="switch-graph" data-action-value="views">
            <div class="chartTab">
                <div class="stats-totalNumber js-totalViews">-</div>
                <div>Views <span class="u-fontWeightNormal u-xs-hide"></span></div>
            </div>
        </li>
        <li data-action="switch-graph" data-action-value="reads">
            <div class="chartTab">
                <div class="stats-totalNumber js-totalReads">-</div>
                <div>Reads</div>
            </div>
        </li>
        <li data-action="switch-graph" data-action-value="claps">
            <div class="chartTab">
                <div class="stats-totalNumber js-totalFans">-</div>
                <div>Claps</div>
            </div>
        </li>
        <li data-action="switch-graph" data-action-value="fans">
            <div class="chartTab">
                <div class="stats-totalNumber js-totalFans">-</div>
                <div>Fans</div>
            </div>
        </li>        
        <li data-action="switch-graph" data-action-value="followers">
            <div class="chartTab">
                <div class="stats-totalNumber js-totalFans">-</div>
                <div>Followers</div>
            </div>
        </li>        
        <li data-action="switch-graph" data-action-value="earnings" ${!isEarningsFeatureEnabled() || 'style="pointer-events: none"'}>
            <div class="chartTab" ${!isEarningsFeatureEnabled() || 'style="color: var(--mngs-disabled-color)"'}>
                <div class="stats-totalNumber js-totalFans">$</div>
                <div>Earnings</div>
            </div>
        </li>`;

    return summary;
}

function createRangeNavbar() {
    const rangeNavBar = document.createElement('div');
    rangeNavBar.setAttribute('id', 'rangeNavBar');
    rangeNavBar.classList.add('u-flex', 'heading', 'heading--borderedBottom', 'heading--paddedTop', 'mngs-range-selector');
    rangeNavBar.innerHTML = `
        <ul class="heading-tabs">
            ${ranges.map((range, index) => {
        return ` <li class="heading-tabsItem u-inlineBlock js-tabsItem range-item ${index === 0 ? 'is-active' : ''} u-fontSize16">
                            <span class="heading-title u-inlineBlock u-fontSize16">
                                <a class="button button--chromeless u-baseColor--buttonNormal" href="#">${range.label}</a>
                            </span>
                         </li>`
    }).join('')}
        </ul>
         <div class="current-month-button">
            <div class="heading-tabsItem u-inlineBlock js-tabsItem u-fontSize16">
                <span class="heading-title u-inlineBlock u-fontSize16">
                    <div id="current-month-button" class="button button--chromeless u-baseColor--buttonNormal">Current month</div>
                </span>
            </div>         
         </div> 
    `;
    navBar.querySelector('#current-month-button').addEventListener('click', currentMonthButtonClick)
    const listItems = Array.from(rangeNavBar.querySelectorAll('ul li'));
    listItems
        .forEach((item, index) => {
            item.querySelector('a').addEventListener('click', () => rangeButtonClicked(listItems, index));
        });
    return rangeNavBar;
}

function createChartPagination() {
    const chartPage = document.createElement('div');
    chartPage.classList.add('chartPage');
    chartPage.innerHTML = `
        <button class="button button--chromeless u-baseColor--buttonNormal button--withIcon button--withSvgIcon button--withIconAndLabel js-showPreviousButton is-touched" data-action="show-graph-previous">
            <span class="svgIcon svgIcon--arrowLeft svgIcon--21px">
                <svg class="svgIcon-use" width="21" height="21">
                    <path d="M13.402 16.957l-6.478-6.479L13.402 4l.799.71-5.768 5.768 5.768 5.77z" fill-rule="evenodd">
                    </path>
                </svg>
            </span>
            <span class="button-label  js-buttonLabel">Prev 30 days</span>
        </button>
        <span class="chartPage-verticalDivider"></span>
        <button class="button button--chromeless u-baseColor--buttonNormal button--withIcon button--withSvgIcon button--withIconRight button--withIconAndLabel js-showNextButton" data-action="show-graph-next">
            <span class="button-label  js-buttonLabel">Next 30 days</span>
            <span class="svgIcon svgIcon--arrowRight svgIcon--21px">
                <svg class="svgIcon-use" width="21" height="21">
                    <path d="M8.3 4.2l6.4 6.3-6.4 6.3-.8-.8 5.5-5.5L7.5 5" fill-rule="evenodd">
                    </path>
                </svg>
            </span>
        </button>`;
    return chartPage;
}

async function renewOldFashionPublicationPage() {
    document.querySelector('nav.heading--stats').remove();
    const statsTitleDetails = document.querySelectorAll('div.stats')[0];
    const chart = statsTitleDetails.cloneNode();
    chart.innerHTML = createChartInnerHtml();
    statsTitleDetails.insertAdjacentElement('beforebegin', chart);

    const navContainer = document.createElement('div');
    navContainer.classList.add('container', 'u-maxWidth1040');
    chart.insertAdjacentElement('beforebegin', navContainer);
    const timeNavBar = createTimeNavBar();
    navContainer.appendChild(timeNavBar);
    const summary = createSummary();
    navContainer.appendChild(summary);
    const summaryInfo = renewSummaryInfo();
    navContainer.appendChild(summaryInfo);
    const rangeNavBar = createRangeNavbar();
    navContainer.appendChild(rangeNavBar);
    const chartPagination = createChartPagination();
    chart.insertAdjacentElement('afterend', chartPagination);
    renewChartPaginator();
    addActionToChartTypeIcons();
}
