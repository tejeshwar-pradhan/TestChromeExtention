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

function extractLocators() {
    let elements = document.querySelectorAll('*');
    let locators = [];
    elements.forEach(element => {
        let tagName = element.tagName.toLowerCase();
        let id = element.id ? `#${element.id}` : null;
        let classes = (typeof element.className === 'string' && element.className) ? `.${element.className.split(' ').join('.')}` : null;
        let xpath = getElementXPath(element);

        let locator = {
            tagName: tagName,
            id: id,
            classes: classes,
            xpath: xpath
        };
        locators.push(locator);
    });

    return locators;
}

let locators = extractLocators();
console.log(locators);
chrome.runtime.sendMessage({ action: 'showLocators', data: locators });
