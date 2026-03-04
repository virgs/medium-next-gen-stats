export const addToCache = (key: string, value: unknown): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        console.error(error);
      }
      resolve();
    });
  });
};

export const loadCache = (key: string): Promise<unknown | undefined> => {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (cached) => {
      resolve(cached[key]);
    });
  });
};

