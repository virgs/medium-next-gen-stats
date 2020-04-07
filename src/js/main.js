let currentRangeIndex = 0;
let currentTimeRangeIndex = 0;
const oneDayInMilliseconds = 24 * 3600 * 1000;
// const originalColor = {r: 82, g: 151, b: 186};
const originalColor = {r: 82, g: 186, b: 151};

function nextGenerationLog(...params) {
    const now = new Date();
    const paddedSeconds = now.getSeconds().toString().padStart(2, '0');
    const paddedMilliseconds = now.getMilliseconds().toString().padStart(3, '0');
    console.log(`[Medium Next Gen Stats - ${paddedSeconds}:${paddedMilliseconds}] ${params}`)
}

function getShadeOfColor(max, index) {
    return {
        r: (originalColor.r / (max)) * (index + 1),
        g: (originalColor.g / (max)) * (index + 1),
        b: (originalColor.b / (max)) * (index + 1)
    };
}

function prettifyNumbersWithUnits(number) {
    const unity = ['', 'K', 'M', 'G', 'T', 'P', 'E'];
    const tier = (Math.log10(number) / 3) | 0;
    if (tier === 0) {
        return number;
    }
    const suffix = unity[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = number / scale;
    return scaled.toFixed(1) + suffix;
}

function prettifyNumbersWithCommas(number) {
    return number
        .toString()
        .split('')
        .reverse()
        .reduce((acc, letter, index, vec) => {
            acc.push((index % 3 === 2 && index !== vec.length - 1 ? ',' : '') + letter);
            return acc;
        }, [])
        .reverse()
        .join('');
}

async function getPostsFromUser() {
    const posts = await request(`https://medium.com/me/stats?format=json&limit=100000`);
    return posts.value
        .map(post => {
                return {
                    ...post,
                    id: post.postId
                }
            }
        );
}

function getInitialPostsData() {
    nextGenerationLog(`Loading initial data of ${postsSummary.length} posts`);
    return Promise
        .all(postsSummary.map((post) => loadInitialPostStats(post)))
        .then(postsInformation => postsInformation
            .reduce((acc, item) => acc.concat(item), [])
        );
}

function getFullPostsData() {
    nextGenerationLog(`Loading full data of ${postsSummary.length} posts`);
    return Promise
        .all(postsSummary.map((post) => loadFullPostsStats(post)))
        .then(postsInformation => postsInformation
            .reduce((acc, item) => acc.concat(item), [])
        );
}

function loadInitialPostStats(post) {
    return getInitialPostStats(post.id)
        .then(postStats => postStats
            .map(postStat => {
                const fullStats = {...postStat, id: post.id, title: post.title};
                delete fullStats.postId;
                return fullStats
            }));
}

function loadFullPostsStats(post) {
    return getFullPostStats(post.id)
        .then(postStats => postStats
            .map(postStat => {
                const fullStats = {...postStat, id: post.id, title: post.title};
                delete fullStats.postId;
                return fullStats
            }));
}

function getInitialPostStats(postId) {
    return request(`https://medium.com/stats/${postId}/${statsOptions.firstDayOfRange.getTime()}/${statsOptions.lastDayOfRange.getTime()}`)
        .then(data => data && data.value || []);
}

function getFullPostStats(postId) {
    return request(`https://medium.com/stats/${postId}/0}/${Date.now()}`)
        .then(data => data && data.value || []);
}


function request(url) {
    return fetch(url, {credentials: "same-origin", headers: {accept: 'application/json'}})
        .then(res => {
            if (res.status !== 200) {
                const message = `Fail to fetch data: (${res.status}) - ${res.statusText}`;
                console.log(message);
                throw message;
            }
            return res.text();
        })
        .then(text => JSON.parse(text.slice(16)).payload)
}

const getViewOfData = (data) => data.views;
const getReadsOfData = (data) => data.reads;
const getClapsOfData = (data) => data.claps;

const now = new Date();
const tomorrow = new Date(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() + oneDayInMilliseconds);
const initiallySelectedRange = ranges[currentRangeIndex];
const statsOptions = {
    firstDayOfRange: new Date(tomorrow.getTime() - (timeRanges[currentTimeRangeIndex] * oneDayInMilliseconds)),
    lastDayOfRange: tomorrow,
    chartGenerator: generateVerticalStackedBarChart,
    relevantDatum: getViewOfData,
    relevantDatumLabel: 'views',
    rangeMethod: initiallySelectedRange.rangeMethod,
    label: initiallySelectedRange.label
};

nextGenerationLog('Started');
let postsData = undefined;
let postsSummary = undefined;
let downloadData = undefined;

async function aggregateDownloadData() {
    downloadData = postsSummary.reduce((acc, post) => {
        acc[post.id] = {...post, data: []};
        return acc;
    }, {});
    postsData.forEach(datum => {
        if (downloadData[datum.id] !== undefined) {
            const clone = {...datum};
            delete clone.id;
            delete clone.title;
            downloadData[datum.id].data.push(clone);
        }
    });
    downloadData = Object.values(downloadData);
    nextGenerationLog('Downloadable data aggregated');
    enableDownloadButton();
}

renewOldFashionPage()
    .then(() => getPostsFromUser())
    .then(data => postsSummary = data)
    .then(() => getInitialPostsData()
        .then(data => postsData = data)
        .then(() => generateChart())
        .then(() => getFullPostsData())
        .then(data => postsData = data)
        .then(() => aggregateDownloadData())
        .then(() => nextGenerationLog('Done')));
