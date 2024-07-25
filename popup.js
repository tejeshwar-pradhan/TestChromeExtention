document.getElementById('extractButton').addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        let url = tabs[0].url;
        if (url.startsWith('http://') || url.startsWith('https://')) {
            let types = [];
            if (document.getElementById('typeDiv').checked) types.push('div');
            if (document.getElementById('typeText').checked) types.push('p', 'span', 'a');
            if (document.getElementById('typeButton').checked) types.push('button', 'input[type="button"]', 'input[type="submit"]');

            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: extractLocators,
                args: [types]
            });
        } else {
            alert('This extension cannot run on this URL.');
        }
    });
});

chrome.runtime.onMessage.addListener(function(message) {
    if (message.action === 'showLocators') {
        let resultDiv = document.getElementById('result');
        resultDiv.innerHTML = '<pre>' + JSON.stringify(message.data, null, 2) + '</pre>';
    }
});

// Optionally, load locators from storage if they were saved
chrome.storage.local.get(['locators'], function(result) {
    if (result.locators) {
        let resultDiv = document.getElementById('result');
        resultDiv.innerHTML = '<pre>' + JSON.stringify(result.locators, null, 2) + '</pre>';
    }
});

function extractLocators(types) {
    function getElementXPath(element) {
        if (element.id !== '') {
            return '//*[@id="' + element.id + '"]';
        }
        if (element === document.body) {
            return '/html/' + element.tagName.toLowerCase();
        }

        var ix = 0;
        var siblings = element.parentNode.childNodes;
        for (var i = 0; i < siblings.length; i++) {
            var sibling = siblings[i];
            if (sibling === element) {
                return getElementXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
            }
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                ix++;
            }
        }
    }

    function getElementCSSSelector(element) {
        let path = [];
        while (element.nodeType === Node.ELEMENT_NODE) {
            let selector = element.nodeName.toLowerCase();
            if (element.id) {
                selector += '#' + element.id;
                path.unshift(selector);
                break;
            } else {
                let sib = element, nth = 1;
                while ((sib = sib.previousElementSibling) && nth++) {
                    if (sib.nodeName.toLowerCase() === selector) {
                        selector += ":nth-of-type(" + nth + ")";
                    }
                }
            }
            path.unshift(selector);
            element = element.parentNode;
        }
        return path.join(" > ");
    }

    function extractLocators() {
        let locators = [];
        types.forEach(type => {
            let elements = document.querySelectorAll(type);
            elements.forEach(element => {
                let tagName = element.tagName.toLowerCase();
                let id = element.id ? `#${element.id}` : null;
                let classes = (typeof element.className === 'string' && element.className) ? `.${element.className.split(' ').join('.')}` : null;
                let xpath = getElementXPath(element);
                let cssSelector = getElementCSSSelector(element);

                let locator = {
                    tagName: tagName,
                    id: id,
                    classes: classes,
                    xpath: xpath,
                    cssSelector: cssSelector
                };
                locators.push(locator);
            });
        });
        return locators;
    }

    let locators = extractLocators();
    console.log(locators);
    chrome.runtime.sendMessage({ action: 'showLocators', data: locators });
}
