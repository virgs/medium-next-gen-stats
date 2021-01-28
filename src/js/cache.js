//claps: 0
// collectedAt: 1540386000000
// flaggedSpam: 0
// friendsLinkViews: 0
// id: "56ce4d29371f"
// internalReferrerViews: 0
// postId: "56ce4d29371f"
// reads: 1
// title: "Testes de Fluxos Poliglotas"
// updateNotificationSubscribers: 0
// upvotes: 0
// views: 1

function mountCacheKey(key) {
    return 'mngs-' + key;
}

let cachedData = null

let persistedStats = []

function addToCache(key, stats) {
    persistedStats = persistedStats.concat(stats)
    return new Promise(resolve => {
        chrome.storage.local.set({
            [mountCacheKey(key)]: {
                cachedStats: persistedStats,
                updatedAt: Date.now()
            }
        }, () => resolve());
    });
}

async function getFromCache(key, postId, begin, end) {
    const cacheIsObsolete = Date.now() - (cachedData.updatedAt || 0) > oneDayInMilliseconds / 12
    if (begin > cachedData.maxCollectedAt) {
        // console.log("totally after", new Date(begin).toDateString(), new Date(end).toDateString())
        return {
            beginAfterCache: begin,
            endAfterCache: end,
            cacheStats: [],
            hasToFetchInformation: cacheIsObsolete
        }
    }
    if (end < cachedData.minCollectedAt) {
        // console.log("totally before", new Date(begin).toDateString(), new Date(end).toDateString())
        return {
            beginAfterCache: begin,
            endAfterCache: end,
            cacheStats: [],
            hasToFetchInformation: cacheIsObsolete
        }
    }
    if (begin > cachedData.minCollectedAt && end < cachedData.maxCollectedAt) {
        // console.log("totally in")
        return {
            cacheStats: cachedData.cachedStats
                .filter(stat => stat.postId === postId && stat.collectedAt >= begin && stat.collectedAt < end),
            hasToFetchInformation: false
        }
    }
    if (begin > cachedData.minCollectedAt && end > cachedData.maxCollectedAt) { //partially after
        // console.log("partially after", new Date(cachedData.maxCollectedAt).toDateString(), new Date(end).toDateString(), cacheIsObsolete)
        return {
            beginAfterCache: cachedData.maxCollectedAt,
            endAfterCache: end,
            cacheStats: cachedData.cachedStats
                .filter(stat => stat.postId === postId && stat.collectedAt >= begin && stat.collectedAt < end),
            hasToFetchInformation: cacheIsObsolete
        }
    }
    if (begin < cachedData.minCollectedAt && end < cachedData.maxCollectedAt) {
        // console.log("partially before", new Date(begin).toDateString(), new Date(end).toDateString())
        return {
            beginAfterCache: begin,
            endAfterCache: cachedData.minCollectedAt,
            cacheStats: cachedData.cachedStats
                .filter(stat => stat.postId === postId && stat.collectedAt >= begin && stat.collectedAt < end),
            hasToFetchInformation: cacheIsObsolete
        }
    }
    if (begin < cachedData.minCollectedAt && end > cachedData.maxCollectedAt) {
        // console.log("no cache")
        return {
            beginAfterCache: begin,
            endAfterCache: end,
            cacheStats: [],
            hasToFetchInformation: cacheIsObsolete
        }
    }
    console.log("wtf", begin, cachedData.minCollectedAt, end, cachedData.maxCollectedAt)
}

function loadCache(key) {
    // chrome.storage.local.remove(mountCacheKey(cacheKey))
    return new Promise(resolve => {
        const cacheKey = mountCacheKey(key);
        chrome.storage.local.get([cacheKey], value => {
            const cache = value[cacheKey] || [];
            const cachedStats = (cache || {}).cachedStats || [];
            const minCollectedAt = (cachedStats || []).reduce((acc, stat) => {
                const collectedAt = stat.collectedAt;
                if (!acc || acc > collectedAt) {
                    return collectedAt;
                }
                return acc;
            }, null);
            const maxCollectedAt = (cachedStats || []).reduce((acc, stat) => {
                const collectedAt = stat.collectedAt;
                if (!acc || acc < collectedAt) {
                    return collectedAt;
                }
                return acc;
            }, null);
            console.log(new Date(minCollectedAt).toDateString(), new Date(maxCollectedAt).toDateString())
            cachedData = {
                cachedStats: cachedStats.concat(cache),
                minCollectedAt,
                maxCollectedAt,
                updatedAt: (cache || {}).updatedAt
            };
            nextGenerationLog('Cache loaded');
            resolve();
        });
    });
}
