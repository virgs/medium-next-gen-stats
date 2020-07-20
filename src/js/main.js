let currentRangeIndex = 0;
let currentTimeRangeIndex = 0;
const oneDayInMilliseconds = 24 * 3600 * 1000;

const originalColor = {r: 82, g: 186, b: 151};
const highlightColor = {r: 173, g: 49, b: 104};

let postsIdsToHighlight = [];
const HIGHLIGHTED_ALPHA = 0.35;
const NOT_HIGHLIGHTED_ALPHA = 0.75;

function nextGenerationLog(...params) {
    const now = new Date();
    const paddedSeconds = now.getSeconds().toString().padStart(2, '0');
    const paddedMilliseconds = now.getMilliseconds().toString().padStart(3, '0');
    console.log(`[Medium Next Gen Stats - ${paddedSeconds}:${paddedMilliseconds}] ${params}`)
}

window.requestAnimationFrame = window.requestAnimationFrame.bind(window)

function getShadeOfColor(max, index, color = originalColor) {
    return {
        r: (color.r / (max)) * (index + 1),
        g: (color.g / (max)) * (index + 1),
        b: (color.b / (max)) * (index + 1)
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

async function getPosts(url) {
    const posts = await request(url);
    return posts.value
        .map(post => {
                return {
                    ...post,
                    id: post.postId
                }
            }
        );
}

async function getPostsFromUser() {
    return getPosts(`https://medium.com/me/stats?format=json&limit=1000000`);
}

async function getPostsFromPublication(publication) {
    return getPosts(`https://medium.com/${publication}/stats?format=json&limit=1000000`);
}

function getInitialPostsData() {
    nextGenerationLog(`Loading initial data of ${mngsData.postsSummary.length} posts`);
    return Promise
        .all(mngsData.postsSummary.map((post) => loadInitialPostStats(post)))
        .then(postsInformation => postsInformation
            .reduce((acc, item) => acc.concat(item), [])
        );
}

function getFullPostsData() {
    nextGenerationLog(`Loading full data of ${mngsData.postsSummary.length} posts`);
    return Promise
        .all(mngsData.postsSummary.map((post) => loadFullPostsStats(post)))
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
    return getFullPostStats(post.id, post.createdAt)
        .then(postStats => postStats
            .map(postStat => {
                const fullStats = {...postStat, id: post.id, title: post.title};
                delete fullStats.postId;
                return fullStats
            }));
}

function getInitialPostStats(postId) {
    return request(`https://medium.com/stats/${postId}/${statsOptions.firstDayOfRange.getTime()}/${Date.now()}`)
        .then(data => data && data.value || []);
}

async function getFullPostStats(postId, createdAt) {
    // const fullPeriod = Date.now() - createdAt
    const interval = oneDayInMilliseconds * 360;
    // let result = await Promise.all(Array.from(Array(Math.ceil(fullPeriod / interval)))
    //     .map(async _ => {
    //         const stats = await request(`https://medium.com/stats/${postId}/${initial}/${initial + interval}?format=json&limit=1000000`);
    //         return stats.value ? stats.value : []
    //     }))
    // result = result.reduce(async (acc, item) => acc.concat(await item))

    let result = []
    for (let initial = createdAt; initial < Date.now(); initial += interval) {
        const stats = await request(`https://medium.com/stats/${postId}/${initial}/${initial + interval}?format=json&limit=1000000`);
        result = result.concat(stats.value ? stats.value : [])
    }

    const dailyEarnings = await getEarningsOfPost(postId);
    const earningToPostData = convertGraphQlToPostData(dailyEarnings, postId);
    result = result.concat(earningToPostData)

    return result
}


function request(url) {
    return fetch(url,
        {
            credentials: 'same-origin',
            headers: {
                accept: 'application/json'
            }
        })
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

const getNumber = (value) => {
    if (isNaN(value) ||
        value === undefined ||
        typeof value !== 'number') {
        return 0;
    }
    return value;
}

const getViewOfData = data => getNumber(data.views);
const getReadsOfData = data => getNumber(data.reads);
const getClapsOfData = data => getNumber(data.claps);
const getFollowersOfData = data => getNumber(data.followers);
const getUpvotesOfData = data => getNumber(data.upvotes);
const getEarningsOfData = data => getNumber(data.earnings);

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
const mngsData = {};

async function getActivities() {
    const response = await request(`https://medium.com/_/api/activity?limit=10000000`);
    const data = response && response.value || [];
    const rollUp = data
        .filter(item => item.activityType === 'users_following_you_rollup')
        .map(item => item.rollupItems);
    return data
        .concat(...rollUp)
        .filter(item => item.activityType === 'users_following_you')
        .map(item => ({
            ...item,
            followers: 1,
            collectedAt: item.occurredAt
        }));
}

async function aggregateDownloadData() {
    const activities = await getActivities();
    mngsData.postsData = mngsData.postsData.concat(activities);
    mngsData.downloadData = mngsData.postsData
    nextGenerationLog('Downloadable data aggregated');
    enableDownloadButton();
}

const publicationRegex = /https:\/\/medium.com\/(.+)\/stats\/stories/;

function printGoogleDetails() {
    google.payments.inapp.getSkuDetails({
        'parameters': {'env': 'prod'},
        'success': (v) => console.log('getSkuDetails.suc: ', v),
        'failure': (f) => console.log('getSkuDetails.fail', f)
    });
    google.payments.inapp.getPurchases({
        'parameters': {'env': 'prod'},
        'success': (v) => console.log('getPurchases.suc: ', v),
        'failure': (f) => console.log('getPurchases.fail', f)
    });
}

async function remodelHtmlAndGetPosts() {
    if (publicationRegex.test(document.location.href)) {
        await renewOldFashionPublicationPage()
        return getPostsFromPublication(getPublicationName())
    } else {
        await renewOldFashionPage()
        return getPostsFromUser();
    }
}

function getPublicationName() {
    const match = document.location.href.match(publicationRegex);
    return match ? match[1] : '';
}

remodelHtmlAndGetPosts()
    .then(data => mngsData.postsSummary = data)
    .then(() => getFullPostsData())
    .then(data => mngsData.postsData = data)
    .then(() => aggregateDownloadData())
    .then(() => generateChart())
    .then(() => nextGenerationLog('Done'));
