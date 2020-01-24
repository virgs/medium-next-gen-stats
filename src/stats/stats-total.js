log('start');

const oneDayInMilliseconds = 24 * 3600 * 1000;
const now = new Date();
const numberOfDays = 30;
let firstDayOfRange = new Date(now.getTime() - (numberOfDays * oneDayInMilliseconds));
let lastDayOfRange = now;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

removeDefaultAndOldFashionChart();

function scrollToTheTop() {
    document.querySelector('body').scrollIntoView({block: 'start'});
}

function getPostsSummary() {
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

function getPostsData(postsSummary) {
    return Promise
        .all(postsSummary.map((post) => loadPostStats(post)))
        .then(postsData => postsData
            .reduce((acc, item) => acc.concat(item), [])
        );
}

waitForEveryTitleToLoad()
    .then(() => scrollToTheTop())
    .then(() => getPostsSummary())
    .then(postsSummary => getPostsData(postsSummary))
    .then(data => generateChart(data, firstDayOfRange, lastDayOfRange))


function getRangeDays(beginDate, endDate) {
    const differenceInDays = (endDate.getTime() - beginDate.getTime()) / oneDayInMilliseconds;
    let dayIterator = beginDate;
    return Array.from(Array(differenceInDays))
        .reduce(acc => {
            acc = acc.concat(dayIterator);
            dayIterator = new Date(dayIterator.getTime() + oneDayInMilliseconds);
            return acc;
        }, []);
}

function getStringifiedDate(date) {
    const day = (date.getDate() + '').padStart(2, '0');
    let monthShort = date.toLocaleString('default', {month: 'long'}).substr(0, 3);
    const month = monthShort.substr(0, 1).toUpperCase() + monthShort.substr(1);
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

function getViewsOfPost(infoFilteredByRange, firstDayOfRange, post) {
    const chartData = infoFilteredByRange
        .filter(data => data.id === post.id)
        .reduce((acc, data) => {
            const dataDate = new Date(data.collectedAt);
            const index = Math.trunc((dataDate - firstDayOfRange) / oneDayInMilliseconds);
            acc[index] += data.views;
            return acc;
        }, Array.from(Array(numberOfDays)).map(() => 0));
    return chartData;
}

function generateChartData(initialRange, infoFilteredByRange, firstDayOfRange) {
    return Object.values(infoFilteredByRange
        .reduce((acc, info) => {
            if (acc[info.id] === undefined) {
                acc[info.id] = {
                    id: info.id,
                    label: info.title,
                    stack: 'same',
                    data: Array.from(Array(numberOfDays)).map(() => 0)
                };
            }
            return acc;
        }, {}))
        .map((post, index, vec) => {
            const color = (256.0 / vec.length) * index;
            const dataOfPostId = getViewsOfPost(infoFilteredByRange, firstDayOfRange, post);
            post.data = post.data.map((datum, index) => datum + dataOfPostId[index]);
            post.backgroundColor = `rgb(${color}, ${color}, ${color})`;
            return post;
        })
        .filter((post => post.data
            .reduce((acc, current) => acc + current, 0) > 0));
}

async function generateChart(info, firstDayOfRange, lastDayOfRange) {
    const infoFilteredByRange = info
        .filter(post => post.collectedAt >= firstDayOfRange && post.collectedAt <= lastDayOfRange);
    const range = getRangeDays(firstDayOfRange, lastDayOfRange);
    const initialRange = range
        .reduce(acc => acc.concat(0), []);
    const chartData = generateChartData(initialRange, infoFilteredByRange, firstDayOfRange);

    const numOfDescribedLabels = 5;
    const labelInterval = Math.trunc(range.length / numOfDescribedLabels);
    const lastIndexRestDivision = labelInterval - 1;
    const labels = range
        .map((date, index) => {
            const restOfDivision = index % labelInterval;
            if (restOfDivision === numOfDescribedLabels) {
                return getStringifiedDate(date);
            }
            return '';
        });
    // .map(getStringifiedDate);
    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: chartData
        },
        options: {
            responsive: true,
            tooltips: {
                mode: 'index',
                callbacks: {
                    // Use the footer callback to display the sum of the items showing in the tooltip
                    footer: function (tooltipItems, data) {
                        let day;
                        tooltipItems.forEach(function (tooltipItem) {
                            day = getStringifiedDate(range[tooltipItem.index])
                        });
                        return day;
                    },
                },
                footerFontStyle: 'normal',
                intersect: false
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
    });

}

function removeDefaultAndOldFashionChart() {
    document.querySelectorAll('div .stats-title')[1].innerHTML =
        `<div>
            <canvas id="chart"></canvas>
        </div>`;
    document.querySelector('.bargraph').remove();
    document.querySelector('.chartTabs').remove();
    document.querySelector('.chartPage').remove();
}

function loadPostStats(post) {
    return handleGetPostStats(post.id)
        .then(postStats => postStats
            .map(postStat => {
                const result = {...postStat, ...post};
                delete result.postId;
                return result
            }));
}

function getDayIdFromDate(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function log(...args) {
    console.log('Medium Next Gen Stats -', ...args);
}


function handleGetPostStats(postId) {
    const API_URL = 'https://medium.com';
    return request(`${API_URL}/stats/${postId}/0/${Date.now()}`)
        .then(data => data && data.value || []);
}


function request(url) {
    return fetch(url, {credentials: "same-origin", headers: {accept: 'application/json'}})
        .then(res => res.text())
        .then(text => JSON.parse(text.slice(16)).payload)
}
