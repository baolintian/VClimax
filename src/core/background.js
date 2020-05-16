// (C) 2017 @xmcp. THIS PROJECT IS LICENSED UNDER GPL VERSION 3. SEE `LICENSE.txt`.

var GLOBAL_SWITCH=true;

var DANMU_URL_FILTER=['*://comment.bilibili.com/*','*://api.bilibili.com/x/v1/dm/*','*://api.bilibili.com/x/v2/dm/*']
var TRAD_DANMU_URL_RE=/(.+):\/\/comment\.bilibili\.com\/(?:rc\/)?(?:dmroll,[\d\-]+,)?(\d+)(?:\.xml)?(\?debug)?$/;
var NEW_DANMU_NORMAL_URL_RE=/(.+):\/\/api\.bilibili\.com\/x\/v1\/dm\/list.so\?oid=(\d+)(\&debug)?$/;
var NEW_DANMU_HISTORY_URL_RE=/(.+):\/\/api\.bilibili\.com\/x\/v2\/dm\/history\?type=\d+&oid=(\d+)&date=[\d\-]+(\&debug)?$/;
var filter_segment;

function parse_danmu_url(url) {
    // var protocol=ret[1], cid=ret[2], debug=ret[3], type=ret[4];
    function addtype(type,res) {
        return res ? res.concat(type) : res;
    }

    if(url.indexOf('//comment.bilibili.com/')!==-1)
        return addtype('trad',TRAD_DANMU_URL_RE.exec(url));
    else if(url.indexOf('/list.so?')!==-1)
        return addtype('list',NEW_DANMU_NORMAL_URL_RE.exec(url));
    else if(url.indexOf('/history?')!==-1) {
        return addtype('history',NEW_DANMU_HISTORY_URL_RE.exec(url));
    }
    else
        return null;
}
function fromholyjson(txt) {
    var item=JSON.parse(txt);
    for(var key in item)
        item[key]=RegExp(item[key]);
    return item;
}
function toholyjson(obj) {
    var item={};
    for(var key in obj)
        item[key]=obj[key].source;
    return JSON.stringify(item);
}

function loadconfig() {
    window.THRESHOLD=parseInt(localStorage['THRESHOLD'])||15;
    window.MAX_DIST=1+(localStorage['DANMU_FUZZ']==='on')*4;
    window.TRIM_ENDING=localStorage['TRIM_ENDING']==='on';
    window.TRIM_SPACE=localStorage['TRIM_SPACE']==='on';
    window.TAOLUS=fromholyjson(localStorage['TAOLUS'])||{};
    window.REMOVE_SEEK=localStorage['REMOVE_SEEK']==='on';
    window.FLASH_NOTIF=localStorage['FLASH_NOTIF']==='on';
    window.DANMU_MARK=localStorage['DANMU_MARK'];
    window.POPUP_BADGE=localStorage['POPUP_BADGE'];
    window.PROC_TYPE7=localStorage['PROC_TYPE7']==='on';
}
localStorage['THRESHOLD']=localStorage['THRESHOLD']||15;
localStorage['DANMU_FUZZ']=localStorage['DANMU_FUZZ']||'on';
localStorage['TRIM_ENDING']=localStorage['TRIM_ENDING']||'on';
localStorage['TRIM_SPACE']=localStorage['TRIM_SPACE']||'on';
localStorage['TAOLUS']=localStorage['TAOLUS']||'{"233...":"^23{2,}$","666...":"^6{3,}$","FFF...":"^[fF]+$","hhh...":"^[hH]+$"}';
localStorage['REMOVE_SEEK']=localStorage['REMOVE_SEEK']||'on';
localStorage['FLASH_NOTIF']=localStorage['FLASH_NOTIF']||'on';
localStorage['DANMU_MARK']=localStorage['DANMU_MARK']||'suffix';
localStorage['POPUP_BADGE']=localStorage['POPUP_BADGE']||'percent';
localStorage['PROC_TYPE7']=localStorage['PROC_TYPE7']||'on';
loadconfig();

chrome.notifications.onButtonClicked.addListener(function(notifid,btnindex) {
    if(btnindex==0) // goto settings
        chrome.tabs.create({url: 'http://www.bilibili.com/html/help.html#p'});
    else if(btnindex==1) // ignore
        ;
    else
        throw 'bad index';
    chrome.notifications.clear(notifid);
});

chrome.runtime.onInstalled.addListener(function(details) {
    if(details.reason=='install') {
        window.open(chrome.runtime.getURL('options/options.html'));
        chrome.notifications.create('//init', {
            type: 'basic',
            iconUrl: chrome.runtime.getURL('assets/logo.png'),
            title: '切换到哔哩哔哩 HTML5 播放器',
            message: '由于技术限制，VClimax 不支持过滤 Flash 播放器中的弹幕。如果您仍在使用 Flash 播放器，请切换到 HTML5 版本。',
            contextMessage: 'http://www.bilibili.com/html/help.html#p',
            isClickable: false,
            buttons: [
                {title: '→ 前去设置'},
                {title: '我已经在用 HTML5 播放器了'}
            ]
        });
    }
});

function load_danmaku(id,tabid) {
    function base64(str) { // from https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
    }
    chrome.browserAction.setTitle({
        title: '正在下载弹幕文件…',
        tabId: tabid
    });
    chrome.browserAction.setBadgeText({
        text: '...',
        tabId: tabid
    });
    
    var xhr=new XMLHttpRequest();
    console.log('load http://comment.bilibili.com/'+id+'.xml');
    xhr.open('get','http://comment.bilibili.com/'+id+'.xml',false);
    xhr.send();

    filter_segment = parse(xhr.responseXML, tabid);

    console.log(filter_segment);
    
    var serializer=new XMLSerializer();
    if(xhr.status===200 && xhr.responseXML) {
        return 'data:text/xml;charset=utf-8;base64,'+
                                base64(serializer.serializeToString(xhr.responseXML));
    } else {
        return null;
    }
}

chrome.browserAction.onClicked.addListener(function(tab){
    console.log("in1");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        console.log("in2");
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, {"message": "loaded", "result": filter_segment});
      });
});


//对每一个请求都做了一遍过滤
//这个函数的返回相当于是给了原来程序中的请求结果。。。
//相当于把别人截住了然后自己算了一个让自己满意的结果，最后放行。

chrome.webRequest.onBeforeRequest.addListener(function(details) {
    console.log(details.url);
    if(!GLOBAL_SWITCH)
        return {cancel: false};
    // ://comment.bilibili.com/?rc/?数字.debug.xml
    var ret=parse_danmu_url(details.url);
    if(ret) {
        if(ret[2] || details.type==='xmlhttprequest')
            return {redirectUrl: load_danmaku(ret[2],details.tabId)||details.url};
        else {
            console.log(details);
            chrome.browserAction.setBadgeText({
                text: 'FL!',
                tabId: details.tabId
            });
            if(FLASH_NOTIF)
                chrome.notifications.create(details.url, {
                    type: 'basic',
                    iconUrl: chrome.runtime.getURL('assets/logo.png'),
                    title: '暂不支持 Flash 播放器',
                    message: '请切换到哔哩哔哩 HTML5 播放器来让 VClimx 过滤视频中的弹幕。',
                    contextMessage: '（在 VClimax 的设置中可以关闭此提醒）',
                    isClickable: false,
                    buttons: [
                        {title: '→ 切换到 HTML5 播放器'},
                        {title: '忽略'}
                    ]
                });
            return {cancel: false};
        }
    }
    else
        return {cancel: false};
    
}, {urls: DANMU_URL_FILTER}, ['blocking']);
