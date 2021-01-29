function addToCache(key, value) {
    return new Promise(resolve => {
        console.log(`${key} save`);
        chrome.storage.local.set({
            [key]: value
        }, () => {
            const error = chrome.runtime.lastError;
            if (error) {
                console.log(error);
            }
            resolve()
        });
    });
}

function loadCache(key) {
    // chrome.storage.local.remove(mountCacheKey(key))
    return new Promise(resolve => {
        chrome.storage.local.get([key], cached => {
            resolve(cached[key]);
        });
    });
}
