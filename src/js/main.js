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
    console.log(`[Medium Next Gen Stats - ${paddedSeconds}:${paddedMilliseconds}] ${params}`);
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

function convertToCsv(items) {
    const replacer = (key, value) => value === null ? '' : value;
    const header = Object.keys(items.reduce((acc, item) => ({...acc, ...item}), {}));
    let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
    csv.unshift(header.join(','));
    return csv.join('\r\n');
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
    const message = await getTotals('me/stats');
    mngsData.user = message.references.User;
    return message.value.map(item => ({...item, id: item.postId}));
}

async function getPostsFromPublication(publication) {
    return getPosts(`https://medium.com/${publication}/stats?format=json&limit=1000000`);
}

async function getPostsData(begin, end) {
    nextGenerationLog(`Loading data of ${mngsData.postsSummary.length} posts`);
    const postsData = await Promise
        .all(mngsData.postsSummary
            .map(async post => {
                const postBegin = begin ? begin : +post.firstPublishedAt;
                console.log(postBegin, end)
                return await getPostStats(post, postBegin, end);
            }));
    mngsData.postsData = mngsData.postsData.concat(postsData
        .reduce((acc, item) => acc.concat(item), []))
}

async function getTotals(url, payload) {
    let finalUrl = `https://medium.com/${url}?limit=500`;
    if (!payload) {
        const response = await request(finalUrl);
        return getTotals(url, response);
    }
    const {value, paging} = payload;
    if (payload && paging && paging.next && paging.next.to && value && value.length) {
        finalUrl += `&to=${paging.next.to}`;
        try {
            const response = await request(finalUrl);
            payload.value = [...payload.value, ...response.value];
            payload.paging = response.paging;
            return getTotals(url, payload);
        } catch (err) {
            console.log(err);
            return payload;
        }
    } else {
        return payload;
    }
}

async function getPostStats(post, begin, end) {
    const interval = oneDayInMilliseconds * 180;
    let promises = [];
    for (let iterator = begin - 1; iterator < end; iterator += interval) {
        if (iterator + interval > end) {
            iterator = end - interval;
        }
        promises.push(request(`https://medium.com/stats/${post.id}/${iterator + 1}/${iterator + interval}?format=json`));
    }
    const data = await Promise.all(promises);
    return data
        .reduce((acc, item) => {
            const stats = item.value ? item.value : [];
            return acc.concat(stats);
        }, [])
        .map(item => {
            return ({...item, id: post.id, title: post.title});
        });
}

async function request(url) {
    const response = await fetch(url,
        {
            credentials: 'same-origin',
            headers: {
                accept: 'application/json'
            }
        });
    if (response.status === 200) {
        const text = await response.text();
        return JSON.parse(text.split('</x>')[1]).payload;
    } else {
        const message = `Fail to fetch data: (${response.status}) - ${response.statusText}`;
        console.log(message);
        return {};
    }
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
const timezoneOffsetInMs = now.getTimezoneOffset() * 60 * 1000;
const tomorrow = new Date(new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()).getTime() + oneDayInMilliseconds);
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
const mngsData = {
    postsData: [],
    postsSummary: [],
    user: null
};

async function getActivities() {
    const response = await request(`https://medium.com/_/api/activity?limit=1000000`);
    const data = response && response.value || [];
    const rollUp = data
        .filter(item => item.activityType === 'users_following_you_rollup')
        .map(item => item.rollupItems);
    const activities = await data
        .concat(...rollUp)
        .filter(item => item.activityType === 'users_following_you')
        .map(item => ({
            ...item,
            followers: 1,
            collectedAt: item.occurredAt
        }));
    mngsData.postsData = mngsData.postsData.concat(activities);
    nextGenerationLog('Activities data aggregated');
}

async function getEarningsData() {
    const earnings = await Promise
        .all(mngsData.postsSummary
            .map(async post => {
                const dailyEarnings = await getEarningsOfPost(post);
                return convertGraphQlToPostData(dailyEarnings, post);
            }))
        .then(postsInformation => postsInformation
            .reduce((acc, item) => acc.concat(item), [])
        );

    mngsData.postsData = mngsData.postsData.concat(earnings);
    nextGenerationLog('Earnings data aggregated');
}

const publicationRegex = /https:\/\/medium.com\/(.+)\/stats\/stories/;

async function remodelHtmlAndGetPosts() {
    if (publicationRegex.test(document.location.href)) {
        await renewOldFashionPublicationPage()
        mngsData.postsSummary = await getPostsFromPublication(getPublicationName());
    } else {
        await renewOldFashionPage();
        mngsData.postsSummary = await getPostsFromUser();
    }
}

function getPublicationName() {
    const match = document.location.href.match(publicationRegex);
    return match ? match[1] : '';
}

const initialLoadingDate = new Date(tomorrow - 60 * oneDayInMilliseconds);
remodelHtmlAndGetPosts()
    .then(() => createTotalsTable())
    .then(() => getPostsData(initialLoadingDate.getTime(), tomorrow.getTime()))
    .then(() => getActivities())
    .then(() => generateChart())
    .then(() => getEarningsData())
    .then(() => getPostsData(null, new Date(initialLoadingDate - 1).getTime()))
    .then(() => enableDownloadButton())
    .then(() => generateChart())
    .then(() => nextGenerationLog('Done'));
