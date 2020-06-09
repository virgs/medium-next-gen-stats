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
    return getPosts(`https://medium.com/me/stats?format=json&limit=100000`);
}

async function getPostsFromPublication(publication) {
    return getPosts(`https://medium.com/${publication}/stats?format=json&limit=100000`);
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

async function getFullPostStats(postId) {
    const stats = await request(`https://medium.com/stats/${postId}/0}/${Date.now()}`);
    return stats.value ? stats.value : [];
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
        typeof value !== 'number') {
        return 0;
    }
    return value;
}

const getViewOfData = data => getNumber(data.views);
const getReadsOfData = data => getNumber(data.reads);
const getClapsOfData = data => getNumber(data.claps);
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

async function aggregateDownloadData() {
    const aggregatedData = mngsData.postsSummary
        .reduce((acc, post) => {
            acc[post.id] = {
                ...post,
                data: []
            };
            return acc;
        }, {});

    mngsData.postsData
        .forEach(datum => {
            if (aggregatedData[datum.id] !== undefined) {
                const clone = {...datum};
                delete clone.id;
                delete clone.title;
                aggregatedData[datum.id].data.push(clone);
            }
        });
    mngsData.downloadData = await Promise.all(Object
        .values(aggregatedData)
        .map(async data => {
            const payload = JSON.parse(await getEarningsOfPost(data.postId));
            const dailyEarningsOfPost = payload.data.post.earnings.dailyEarnings;
            const earningToPostData = convertDailyEarningToPostData(dailyEarningsOfPost, data.postId);
            earningToPostData.forEach(earning => mngsData.postsData.push(earning));
            data.earnings = dailyEarningsOfPost;
            return data;
        }));
    nextGenerationLog('Downloadable data aggregated');
    enableDownloadButton();
}

const publicationRegex = /https:\/\/medium.com\/(.+)\/stats\/stories/;

async function remodelHtml() {
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

    if (publicationRegex.test(document.location.href)) {
        return renewOldFashionPublicationPage()
            .then(() => getPostsFromPublication(getPublicationName()))
    } else {
        return renewOldFashionPage()
            .then(() => getPostsFromUser());
    }
}

function getPublicationName() {
    const match = document.location.href.match(publicationRegex);
    return match ? match[1] : '';
}

remodelHtml()
    .then(data => mngsData.postsSummary = data)
    .then(() => getInitialPostsData()
        .then(data => mngsData.postsData = data)
        .then(() => generateChart())
        .then(() => getFullPostsData())
        .then(data => mngsData.postsData = data)
        .then(() => aggregateDownloadData())
        .then(() => generateChart())
        .then(() => nextGenerationLog('Done'))
    );
