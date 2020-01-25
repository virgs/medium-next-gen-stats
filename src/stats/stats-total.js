const oneDayInMilliseconds = 24 * 3600 * 1000;
const now = new Date();
const daysOfRange = 90;
let firstDayOfRange = new Date(now.getTime() - (daysOfRange * oneDayInMilliseconds));
let lastDayOfRange = now;
const numOfDescribedLabels = 5;
const originalColor = {r: 82, g: 151, b: 186};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


const chartOptions = {
    type: 'bar',
    data: {},
    options: {
        title: {
            fontColor: '#000',
            display: true,
            fontSize: 24,
            padding: 12,
            text: `Views from '${getStringifiedDate(firstDayOfRange)}' to '${getStringifiedDate(lastDayOfRange)}'`
        },
        legend: {
            position: 'bottom',
            align: 'start'
        },
        responsive: true,
        tooltips: {
            mode: 'index',
            titleAlign: 'center',
            titleFontSize: 18,
            titleMarginBottom: 12,
            bodySpacing: 10,
            bodyFontSize: 14,
            bodyAlign: 'left',
            footerAlign: 'center',
            footerFontSize: 16,
            footerMarginTop: 12,
            yPadding: 10,
            xPadding: 10,
            filter: (item) => item.value > 0,
            callbacks: {
                label: (tooltipItem, data) => {
                    const dataset = data.datasets[tooltipItem.datasetIndex];
                    return `  "${dataset.label}":    ${tooltipItem.value}`
                },
                footer: (tooltipItems) => {
                    const total = tooltipItems.reduce((acc, tooltipItem) => parseInt(tooltipItem.value) + acc, 0);
                    return `Total:\t ${total}`;
                },
            },
            footerFontStyle: 'normal',
            intersect: true
        },
        hover: {
            mode: 'index',
            intersect: true
        },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true
                }
            }],
            xAxes: [
                {
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
        await sleep(500);

        postsTitleDom = document.querySelectorAll('.sortableTable-rowTitle');
        newLength = postsTitleDom.length;
    }
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


function getRangeInDays(beginDate, endDate) {
    const differenceInDays = (endDate.getTime() - beginDate.getTime()) / oneDayInMilliseconds;
    let dayIterator = beginDate;
    return Array.from(Array(differenceInDays))
        .reduce(acc => {
            acc = acc.concat(dayIterator);
            dayIterator = new Date(dayIterator.getTime() + oneDayInMilliseconds);
            return acc;
        }, []);
}

function getStringifiedMonth(monthIterator) {
    const monthName = monthIterator.toLocaleString('default', {month: 'long'});
    const monthNameCapitalized = monthName.substr(0, 1).toUpperCase() + monthName.substr(1) + '/' + monthIterator.getFullYear();
    return monthNameCapitalized;
}

function getRangeInMonths(beginDate, endDate) {
    const differenceInMonths = endDate.getMonth() - beginDate.getMonth() + (12 * (endDate.getFullYear() - beginDate.getFullYear())) + 1;
    let monthIterator = beginDate;
    return Array.from(Array(differenceInMonths))
        .reduce(acc => {
            const monthNameCapitalized = getStringifiedMonth(monthIterator);
            acc = acc.concat(monthNameCapitalized);
            monthIterator = new Date(monthIterator.getFullYear(), monthIterator.getMonth() + 1);
            return acc;
        }, []);
}

function getRangeInWeeks(beginDate, endDate) {
    const oneWeekInMilliseconds = oneDayInMilliseconds * 7;
    const differenceInWeeks = Math.abs(Math.round((endDate.getTime() - beginDate.getTime()) / oneWeekInMilliseconds));
    let weekIterator = beginDate;
    return Array.from(Array(differenceInWeeks))
        .reduce(acc => {
            const nextWeek = new Date(weekIterator.getTime() + oneWeekInMilliseconds);
            acc = acc.concat(`${getStringifiedDate(weekIterator)} to ${getStringifiedDate(new Date(nextWeek.getTime() - oneDayInMilliseconds))}`);
            weekIterator = nextWeek;
            return acc;
        }, []);
}

Date.prototype.getWeek = function () {
    const januaryFirst = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((((this - januaryFirst) / oneDayInMilliseconds) + januaryFirst.getDay() + 1) / 7);
};

function getStringifiedDate(date) {
    const day = (date.getDate() + '').padStart(2, '0');
    const monthShort = date.toLocaleString('default', {month: 'long'}).substr(0, 3);
    const month = monthShort.substr(0, 1).toUpperCase() + monthShort.substr(1);
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

function getIndexOfDate(dataDate, firstDayOfRange) {
    return Math.trunc((dataDate - firstDayOfRange) / oneDayInMilliseconds);
}

function getViewsOfPost(initialRange, infoFilteredByRange, firstDayOfRange, post) {
    return infoFilteredByRange
        .filter(data => data.id === post.id)
        .reduce((acc, data) => {
            const dataDate = new Date(data.collectedAt);
            const index = getIndexOfDate(dataDate, firstDayOfRange);
            acc[index] += data.views;
            return acc;
        }, initialRange.map(() => 0));
}

function getShadeOfColor(max, index) {
    return {
        r: (originalColor.r / (max)) * (index + 1),
        g: (originalColor.g / (max)) * (index + 1),
        b: (originalColor.b / (max)) * (index + 1)
    };
}

function generateChartData(initialRange, infoFilteredByRange, firstDayOfRange) {
    console.log("Generating chart");
    const publicationDateDotRadius = Math.min(Math.max(4, Math.trunc(250 / initialRange.length)), 10);
    const publicationDateDataset = {
        label: 'Date of publication',
        data: initialRange.map((_, index) => undefined),
        backgroundColor: `rgb(0, 0, 0)`,
        type: 'bubble',
        order: -1,
        borderWidth: 15
    };
    return Object.values(infoFilteredByRange
        .reduce((acc, info) => {
            if (acc[info.id] === undefined) {
                acc[info.id] = {
                    publicationDate: info.publicationDate,
                    id: info.id,
                    label: info.title,
                    stack: 'unique',
                    barPercentage: 0.95,
                    categoryPercentage: 1,
                    data: initialRange.map((_, index) => 0)
                };
            }
            return acc;
        }, {}))
        .map((post, index, vec) => {
            const indexOfDate = getIndexOfDate(post.publicationDate, firstDayOfRange);
            publicationDateDataset.data[indexOfDate] = {x: 0, y: 0, r: publicationDateDotRadius};
            const backgroundColor = getShadeOfColor(vec.length, index);
            const dataOfPostId = getViewsOfPost(initialRange, infoFilteredByRange, firstDayOfRange, post);
            post.data = post.data.map((datum, index) => datum + dataOfPostId[index]);
            post.backgroundColor = `rgb(${backgroundColor.r}, ${backgroundColor.g}, ${backgroundColor.b}, 0.75)`;
            return post;
        })
        .filter((post => post.data
            .reduce((acc, current) => acc + current, 0) > 0))
        .concat(publicationDateDataset);
}

async function generateChart(info, firstDayOfRange, lastDayOfRange) {
    const infoFilteredByRange = info
        .filter(post => post.collectedAt >= firstDayOfRange && post.collectedAt <= lastDayOfRange);
    const range = getRangeInDays(firstDayOfRange, lastDayOfRange);
    console.log(getRangeInMonths(firstDayOfRange, lastDayOfRange));
    console.log(getRangeInWeeks(firstDayOfRange, lastDayOfRange));
    const initialRange = range
        .reduce(acc => acc.concat(0), []);
    const labelInterval = Math.trunc(range.length / numOfDescribedLabels);
    const labels = range
        .map((date, index) => {
            const restOfDivision = index % labelInterval;
            if (restOfDivision === labelInterval - 2) {
                return getStringifiedDate(date);
            }
            return '';
        });
    const chartData = generateChartData(initialRange, infoFilteredByRange, firstDayOfRange);
    console.log(chartData);
    chartOptions.data = {
        datasets: chartData,
        labels
    };
    chartOptions.options.tooltips.callbacks.title = tooltipItems => getStringifiedDate(range[tooltipItems[0].index]);

    const ctx = document.getElementById('chart').getContext('2d');
    console.log(chartOptions);
    new Chart(ctx, chartOptions);
}

function removeDefaultAndOldFashionChart() {
    document.querySelectorAll('div .stats-title')[1].innerHTML =
        `<div>
            <canvas id="chart"></canvas>
        </div>`;
    document.querySelector('.bargraph').remove();
    document.querySelector('.chartTabs').remove();
    document.querySelector('.chartPage').remove();
    document.querySelector("nav").remove()
}

function getPostsData(postsSummary) {
    return Promise
        .all(postsSummary.map((post) => loadPostStats(post)))
        .then(postsData => postsData
            .reduce((acc, item) => acc.concat(item), [])
        );
}

function loadPostStats(post) {
    return handleGetPostStats(post.id)
        .then(postStats => {
            const publicationDate = postStats.reduce((acc, postStat) => acc < postStat.collectedAt ? acc : postStat.collectedAt, new Date());
            return postStats
                .map(postStat => {
                    const fullStats = {...postStat, ...post, publicationDate};
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

removeDefaultAndOldFashionChart();
waitForEveryTitleToLoad()
    .then(() => scrollToTheTop())
    .then(() => getPostsFromTableSummary())
    .then(postsSummary => getPostsData(postsSummary))
    .then(data => generateChart(data, firstDayOfRange, lastDayOfRange))
