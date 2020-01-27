const daysOfRange = 27;

const waitIntervalToLoadPage = 500;
// const waitIntervalToLoadPage = 0;

// const originalColor = {r: 82, g: 151, b: 186};
const originalColor = {r: 82, g: 186, b: 151};
const oneDayInMilliseconds = 24 * 3600 * 1000;
const now = new Date();
const lastDayOfRange = new Date(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() + oneDayInMilliseconds);
const firstDayOfRange = new Date(lastDayOfRange.getTime() - (daysOfRange * oneDayInMilliseconds));
const publicationDateDotRadius = 5;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));


}

function nextGenerationLog(...params) {
    const now = new Date();
    console.log(`[Medium Next Gen Stats - ${now.getSeconds()}:${now.getMilliseconds()}] ${params}`)
}

function prettifyNumbers(value) {
    const oneMillion = 1000000;
    const oneThousand = 1000;
    if (value >= oneMillion) {
        return (Math.trunc(value * 10 / oneMillion) / 10) + 'M';
    }
    if (value >= oneThousand) {
        return (Math.trunc(value * 10 / oneThousand) / 10) + 'K';
    }
    return value;
}

const chartOptions = {
    type: 'bar',
    data: {},
    options: {
        animation: {
            duration: 750,
            onComplete: () => chartOptions.loaded = true
        },
        title: {
            fontColor: '#000',
            display: true,
            fontSize: 24,
            padding: 12,
        },
        legend: {
            display: false,
            position: 'bottom',
            align: 'start'
        },
        responsive: true,
        tooltips: {
            position: 'nearest',
            mode: 'index',
            titleAlign: 'center',
            titleFontSize: 16,
            titleMarginBottom: 12,
            bodySpacing: 10,
            bodyFontSize: 14,
            bodyAlign: 'left',
            footerAlign: 'center',
            footerFontSize: 15,
            footerMarginTop: 12,
            yPadding: 10,
            xPadding: 10,
            itemSort: (first, second) => second.value - first.value,
            filter: item => item.value > 0,
            callbacks: {
                label: (tooltipItem, chart) => {
                    // const publicationDay = chart.datasets.filter(dataset => dataset.type === 'bubble')[0].data[tooltipItem.index];
                    const dataset = chart.datasets[tooltipItem.datasetIndex];
                    return ` "${dataset.label}":    ${prettifyNumbers(tooltipItem.value)}`
                },
                footer: (tooltipItems) => {
                    const total = tooltipItems.reduce((acc, tooltipItem) => parseInt(tooltipItem.value) + acc, 0);
                    return `Total:\t ${prettifyNumbers(total)} views of ${tooltipItems.length} articles`;
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
                gridLines: {
                    drawBorder: false,
                    borderDash: [2, 3],
                },
                ticks: {
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

async function waitForEveryTitleToLoad() {
    let length = -1;
    let newLength = 0;
    while (length !== newLength) {
        length = newLength;
        let postsTitleDom = document.querySelectorAll('.sortableTable-rowTitle');
        newLength = postsTitleDom.length;
        postsTitleDom[newLength - 1].scrollIntoView({block: 'start'});

        await sleep(waitIntervalToLoadPage);
        postsTitleDom = document.querySelectorAll('.sortableTable-rowTitle');
        newLength = postsTitleDom.length;
    }
    nextGenerationLog("Every title is described in this page")
}

function scrollToTheTop() {
    document.querySelector('body').scrollIntoView({block: 'start'});
}

function getPostsFromTableSummary() {
    return Array.from(document.querySelectorAll('.sortableTable-row.js-statsTableRow'))
        .map(row => {
                return {
                    title: row.querySelector('.sortableTable-title').textContent,
                    readTimeInMinutes: parseInt(row.querySelector('.readingTime').getAttribute("title").split(" ")[0]),
                    id: row.getAttribute('data-action-value')
                }
            }
        );
}

function getStringifiedDate(date) {
    const day = (date.getDate() + '').padStart(2, '0');
    const monthShort = date.toLocaleString('default', {month: 'long'}).substr(0, 3);
    const month = monthShort.substr(0, 1).toUpperCase() + monthShort.substr(1);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function getRangeInDays(beginDate, endDate) {
    const differenceInDays = (endDate.getTime() - beginDate.getTime()) / oneDayInMilliseconds;
    let dayIterator = beginDate;
    return Array.from(Array(differenceInDays))
        .reduce(acc => {
            const nextInterval = new Date(dayIterator.getTime() + oneDayInMilliseconds);
            const interval = {
                begin: dayIterator,
                end: nextInterval,
                label: getStringifiedDate(dayIterator)
            };
            acc = acc.concat(interval);
            dayIterator = nextInterval;
            return acc;
        }, []);
}

function getStringifiedMonth(monthIterator) {
    const monthName = monthIterator.toLocaleString('default', {month: 'long'});
    return monthName.substr(0, 1).toUpperCase() + monthName.substr(1) + '/' + monthIterator.getFullYear();
}

function getRangeInMonths(beginDate, endDate) {
    const differenceInMonths = endDate.getMonth() - beginDate.getMonth() + (12 * (endDate.getFullYear() - beginDate.getFullYear())) + 1;
    let monthIterator = beginDate;
    return Array.from(Array(differenceInMonths))
        .reduce(acc => {
            const nextInterval = new Date(monthIterator.getFullYear(), monthIterator.getMonth() + 1);
            const interval = {
                begin: monthIterator,
                end: nextInterval,
                label: getStringifiedMonth(monthIterator)
            };
            acc = acc.concat(interval);
            monthIterator = nextInterval;
            return acc;
        }, []);
}

function getStringifiedWeek(date) {
    const day = (date.getDate() + '').padStart(2, '0');
    const monthShort = date.toLocaleString('default', {month: 'long'}).substr(0, 3);
    const month = monthShort.substr(0, 1).toUpperCase() + monthShort.substr(1);
    return `${day}/${month}`;

}

function getRangeInWeeks(beginDate, endDate) {
    const oneWeekInMilliseconds = oneDayInMilliseconds * 7;
    const differenceInWeeks = Math.abs(Math.round((endDate.getTime() - beginDate.getTime()) / oneWeekInMilliseconds)) + 1;
    let weekIterator = beginDate;
    return Array.from(Array(differenceInWeeks))
        .reduce(acc => {
            const nextWeek = new Date(weekIterator.getTime() + oneWeekInMilliseconds);
            const interval = {
                begin: weekIterator,
                end: nextWeek,
                label: `${getStringifiedWeek(weekIterator)} to ${getStringifiedWeek(new Date(nextWeek.getTime() - oneDayInMilliseconds))}`
            };
            acc = acc.concat(interval);
            weekIterator = nextWeek;
            return acc;
        }, []);
}

function getViewsOfPost(range, data, post) {
    return data
        .filter(data => data.id === post.id)
        .reduce((acc, data) => {
            const index = range.findIndex(item =>  item.begin.getTime() <= data.collectedAt && data.collectedAt < item.end.getTime());
            acc[index] += data.views;
            return acc;
        }, range.map(() => 0));
}

function getShadeOfColor(max, index) {
    return {
        r: (originalColor.r / (max)) * (index + 1),
        g: (originalColor.g / (max)) * (index + 1),
        b: (originalColor.b / (max)) * (index + 1)
    };
}

function initialValueOfEveryBar(info, range) {
    return {
        publicationDate: info.publicationDate,
        id: info.id,
        label: info.title,
        stack: 'unique',
        barPercentage: 0.95,
        categoryPercentage: 1,
        data: range.map((_, index) => 0)
    };
}

function checkPublicationDot(indexOfDate, publicationDateDataset, post) {
    const publicationDay = indexOfDate >= 0;
    if (publicationDay) {
        if (publicationDateDataset.data[indexOfDate]) {
            publicationDateDataset.data[indexOfDate].r += publicationDateDotRadius;
        } else {
            publicationDateDataset.data[indexOfDate] = {x: 0, y: 0, r: publicationDateDotRadius, post};
        }
    }
}

function generateChartData(range, data) {
    nextGenerationLog("Generating chart");
    const publicationDateDataset = {
        label: 'Publication original date\n',
        data: range.map((_, index) => undefined),
        backgroundColor: `rgb(0, 0, 0)`,
        type: 'bubble',
        order: -1,
        borderWidth: 10
    };
    return Object.values(data
        .reduce((acc, info) => {
            if (acc[info.id] === undefined) {
                acc[info.id] = initialValueOfEveryBar(info, range);
            }
            return acc;
        }, {}))
        .map((post, index, vec) => {
            const indexOfDate = range
                .findIndex(item => post.publicationDate.getTime() >= item.begin.getTime() && post.publicationDate.getTime() < item.end.getTime());
            checkPublicationDot(indexOfDate, publicationDateDataset, post);
            const backgroundColor = getShadeOfColor(vec.length, index);
            const dataOfPostId = getViewsOfPost(range, data, post);
            post.data = post.data.map((datum, index) => datum + dataOfPostId[index]);
            post.backgroundColor = `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, 0.75)`;
            return post;
        })
        .filter((post => post.data.reduce((acc, current) => acc + current, 0) > 0))
        .concat(publicationDateDataset);
}

function updateChartSummaryTabs(chartData) {
    const summary = chartData.reduce((acc, dataSet) => {
        if (dataSet.type === 'bubble') {
            acc.publicationDates += dataSet.data.reduce((sum, item) => sum + (item !== undefined ? item.r / publicationDateDotRadius : 0), 0);
        } else {
            acc.views += dataSet.data.reduce((sum, item) => sum + item, 0);
        }
        return acc;
    }, {
        views: 0,
        publicationDates: 0
    });
    const chartTabs = document.querySelectorAll('.chartTabs li');
    const viewsTab = chartTabs[0];
    viewsTab.querySelector('.js-totalViews').innerText = `${prettifyNumbers(summary.views)}`;
    const publicationsTab = chartTabs[1];
    publicationsTab.querySelector('.js-totalReads').innerText = `${prettifyNumbers(summary.publicationDates)}`;
}

async function generateChart(info, options) {
    const infoFilteredByRange = info
        .filter(post => post.collectedAt >= options.firstDayOfRange.getTime() && post.collectedAt < options.lastDayOfRange.getTime());
    const range = options.rangeMethod(options.firstDayOfRange, options.lastDayOfRange);
    const labels = range.map(interval => interval.label);
    const chartData = generateChartData(range, infoFilteredByRange);
    updateChartSummaryTabs(chartData);
    chartOptions.data = {
        datasets: chartData,
        labels
    };
    chartOptions.options.title.text = `${options.label} views from '${getStringifiedDate(options.firstDayOfRange)}' to '${getStringifiedDate(options.lastDayOfRange)}'`;
    chartOptions.options.tooltips.callbacks.title = tooltipItems => range[tooltipItems[0].index].label;
    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, chartOptions);
}

const ranges = [
    {
        rangeMethod: getRangeInDays,
        label: 'Daily'
    },
    {
        rangeMethod: getRangeInWeeks,
        label: 'Weekly'
    },
    {
        rangeMethod: getRangeInMonths,
        label: 'Monthly'
    },
];

async function rangeButtonClicked(listItems, clickedItemIndex) {
    if (chartOptions.loaded) {
        chartOptions.loaded = false;
        const selectedRange = ranges[clickedItemIndex];
        nextGenerationLog(`Generating ${selectedRange.label} chart`);
        await postsData;
        listItems
            .forEach((item, index) => index === clickedItemIndex ? item.classList.add('is-active') : item.classList.remove('is-active'));
        await generateChart(postsData, {
            firstDayOfRange,
            lastDayOfRange,
            rangeMethod: selectedRange.rangeMethod,
            label: selectedRange.label
        });
    }
}

async function renewOldFashionPage() {
    document.querySelectorAll('div .stats-title')[1].innerHTML =
        `<div>
            <canvas id="chart"></canvas>
         </div>`;
    document.querySelector('.bargraph').remove();
    document.querySelector(".chartPage").remove();
    const summaryInfo = document.querySelector('.chartTabs');
    summaryInfo.classList.add('mngs-summary-info');
    const chartTabs = document.querySelectorAll('.chartTabs li');
    const viewsTab = chartTabs[0];
    viewsTab.querySelector('span').textContent = '';
    viewsTab.onclick = (e) => e.stopPropagation();
    viewsTab.querySelector('div').style.cursor = 'initial';
    const publicationsTab = chartTabs[1];
    publicationsTab.querySelectorAll('div.chartTab div')[1].textContent = 'Publications';
    publicationsTab.onclick = (e) => e.stopPropagation();
    publicationsTab.classList.add('is-active');
    publicationsTab.querySelector('div').style.cursor = 'initial';
    chartTabs[2].remove();

    const chart = document.querySelector(".stats-title--chart");
    const rangeNavBar = document.querySelector("nav");
    rangeNavBar.classList.add('mngs-range-selector');
    const parent = rangeNavBar.parentNode;
    parent.insertBefore(rangeNavBar, chart);
    parent.insertBefore(summaryInfo, rangeNavBar);
    const listItems = Array.from(rangeNavBar.querySelectorAll('ul li'));
    listItems
        .forEach((item, index) => {
            const anchor = item.querySelector('a');
            anchor.text = ranges[index].label;
            anchor.setAttribute('href', '#');
            anchor.onclick = () => rangeButtonClicked(listItems, index);
        })
}

function getPostsData(postsSummary) {
    nextGenerationLog(`Loading posts data`);
    return Promise
        .all(postsSummary.map((post) => loadPostStats(post)))
        .then(postsData => postsData
            .reduce((acc, item) => acc.concat(item), [])
        );
}

function loadPostStats(post) {
    return handleGetPostStats(post.id)
        .then(postStats => {
            const publicationDate = postStats.reduce((acc, postStat) => acc < postStat.collectedAt ? acc : postStat.collectedAt, new Date().getTime());
            return postStats
                .map(postStat => {
                    const fullStats = {...postStat, ...post, publicationDate: new Date(publicationDate)};
                    delete fullStats.postId;
                    return fullStats
                });
        });
}

function handleGetPostStats(postId) {
    return request(`https://medium.com/stats/${postId}/0/${Date.now()}`)
        .then(data => data && data.value || []);
}


function request(url) {
    return fetch(url, {credentials: "same-origin", headers: {accept: 'application/json'}})
        .then(res => res.text())
        .then(text => JSON.parse(text.slice(16)).payload)
}

nextGenerationLog('Started');
let postsData = undefined;
renewOldFashionPage()
    .then(() => waitForEveryTitleToLoad())
    .then(() => scrollToTheTop())
    .then(() => getPostsFromTableSummary())
    .then(postsSummary => getPostsData(postsSummary))
    .then(data => {
        postsData = data;
        generateChart(data, {firstDayOfRange, lastDayOfRange, rangeMethod: getRangeInDays, label: 'Daily'})
            .then(() => nextGenerationLog('Chart generated'));
    });
