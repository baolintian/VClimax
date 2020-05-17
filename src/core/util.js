var ERROR_COLOR='#ff4444';

function setbadge(text,color,tabid) {
    if(tabid<=0 && text=='FL!') return;
    chrome.browserAction.setBadgeText({
        text: text,
        tabId: tabid
    });
    if(color)
        chrome.browserAction.setBadgeBackgroundColor({
            color: color,
            tabId: tabid
        });
}
