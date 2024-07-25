chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'showLocators') {
        chrome.storage.local.set({ locators: message.data });
    }
});
