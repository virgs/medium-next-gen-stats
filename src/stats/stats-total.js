const oneDayInMilliseconds = 24 * 3600 * 1000;
const now = new Date();
const numberOfDays = 60;
let firstDayOfRange = new Date(now.getTime() - (numberOfDays * oneDayInMilliseconds));
let lastDayOfRange = now;
const numOfDescribedLabels = 5;
const publicationDateDotRadius = Math.max(4, Math.trunc(250 / numberOfDays));

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

function getIndexOfDate(dataDate, firstDayOfRange) {
    return Math.trunc((dataDate - firstDayOfRange) / oneDayInMilliseconds);
}

function getViewsOfPost(infoFilteredByRange, firstDayOfRange, post) {
    return infoFilteredByRange
        .filter(data => data.id === post.id)
        .reduce((acc, data) => {
            const dataDate = new Date(data.collectedAt);
            const index = getIndexOfDate(dataDate, firstDayOfRange);
            acc[index] += data.views;
            return acc;
        }, Array.from(Array(numberOfDays)).map(() => 0));
}

function generateChartData(initialRange, infoFilteredByRange, firstDayOfRange) {
    const publicationDateDataset = {
        label: 'Line Dataset',
        data: Array.from(Array(numberOfDays)).map((_, index) => undefined),
        backgroundColor: `rgb(0, 0, 0)`,
        type: 'bubble'
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
                    data: Array.from(Array(numberOfDays)).map(() => 0)
                };
            }
            return acc;
        }, {}))
        .map((post, index, vec) => {
            const indexOfDate = getIndexOfDate(post.publicationDate, firstDayOfRange);
            publicationDateDataset.data[indexOfDate] = {x: 0, y: 0, r: publicationDateDotRadius};
            const backgroundColor = (256.0 / (vec.length + 1)) * (index + 1);
            const dataOfPostId = getViewsOfPost(infoFilteredByRange, firstDayOfRange, post);
            post.data = post.data.map((datum, index) => datum + dataOfPostId[index]);
            post.backgroundColor = `rgb(${backgroundColor}, ${backgroundColor}, ${backgroundColor}, 0.75)`;
            return post;
        })
        .filter((post => post.data
            .reduce((acc, current) => acc + current, 0) > 0))
        .concat(publicationDateDataset);
}

async function generateChart(info, firstDayOfRange, lastDayOfRange) {
    const infoFilteredByRange = info
        .filter(post => post.collectedAt >= firstDayOfRange && post.collectedAt <= lastDayOfRange);
    const range = getRangeDays(firstDayOfRange, lastDayOfRange);
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
    console.log(chartData)
    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: chartData
        },
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
                        return `  "${dataset.label}":  ${tooltipItem.value}`
                    },
                    title: tooltipItems => getStringifiedDate(range[tooltipItems[0].index]),
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

