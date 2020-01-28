const daysOfRange = 120;
let currentRangeIndex = 0;
const oneDayInMilliseconds = 24 * 3600 * 1000;
// const originalColor = {r: 82, g: 151, b: 186};
const originalColor = {r: 82, g: 186, b: 151};

function nextGenerationLog(...params) {
    const now = new Date();
    const paddedSeconds = now.getSeconds().toString().padStart(2, '0');
    const paddedMilliseconds = now.getMilliseconds().toString().padStart(3, '0');
    console.log(`[Medium Next Gen Stats - ${paddedSeconds}:${paddedMilliseconds}] ${params}`)
}

function prettifyNumbers(number) {
    const unity = ['', 'K', 'M', 'G', 'T', 'P', 'E'];
    const tier = (Math.log10(number) / 3) | 0;
    if (tier === 0) {
        return number;
    }
    const suffix = unity[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = number / scale;
    return scaled.toFixed(2) + suffix;
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

function getStringifiedDate(date) {
    const day = (date.getDate() + '').padStart(2, '0');
    const monthShort = date.toLocaleString('default', {month: 'long'}).substr(0, 3);
    const month = monthShort.substr(0, 1).toUpperCase() + monthShort.substr(1);
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

async function rangeButtonClicked(listItems, clickedItemIndex) {
    if (chartOptions.loaded) {
        chartOptions.loaded = false;
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

function getPostsData(postsSummary) {
    nextGenerationLog(`Loading data of ${postsSummary.length} posts`);
    return Promise
        .all(postsSummary.map((post) => loadPostStats(post)))
        .then(postsInformation => postsInformation
            .reduce((acc, item) => acc.concat(item), [])
        );
}

function loadPostStats(post) {
    delete post.views;
    delete post.claps;
    delete post.internalReferrerViews;
    delete post.createdAt;
    delete post.reads;
    delete post.upvotes;
    const publicationDate = new Date(post.firstPublishedAt);
    return getPostStats(post.id)
        .then(postStats => postStats
            .map(postStat => {
                const fullStats = {...postStat, ...post, publicationDate: publicationDate};
                delete fullStats.postId;
                return fullStats
            }));
}

function getPostStats(postId) {
    return request(`https://medium.com/stats/${postId}/0/${Date.now()}`)
        .then(data => data && data.value || []);
}


function request(url) {
    return fetch(url, {credentials: "same-origin", headers: {accept: 'application/json'}})
        .then(res => res.text())
        .then(text => JSON.parse(text.slice(16)).payload)
}

const getViewOfData = (data) => data.views;
const getClapsOfData = (data) => data.claps;


const now = new Date();
const tomorrow = new Date(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() + oneDayInMilliseconds);
const statsOptions = {
    firstDayOfRange: new Date(tomorrow.getTime() - (daysOfRange * oneDayInMilliseconds)),
    lastDayOfRange: tomorrow,
    relevantDatum: getViewOfData,
    rangeMethod: ranges[currentRangeIndex].rangeMethod,
    label: ranges[currentRangeIndex].label
};
nextGenerationLog('Started');
let postsData = undefined;
renewOldFashionPage()
    .then(() => getPostsFromUser())
    .then(postsSummary => getPostsData(postsSummary))
    .then(data => {
        postsData = data;
        return generateChart();
    })
    .then(() => nextGenerationLog('Done'));
