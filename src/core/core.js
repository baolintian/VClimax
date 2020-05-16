
function parse(dom,tabid) {
    chrome.browserAction.setTitle({
        title: '正在处理弹幕…', // if u can see this, VClimax might not be working correctly :)
        tabId: tabid
    });
    console.time('parse');
    //get max duration time
    var max_duration_time = -1;
    [].slice.call(dom.childNodes[0].children).forEach(function(elem) {
        if(elem.tagName=='d') {
            var attr=elem.attributes['p'].value.split(',');
            max_duration_time = Math.max(attr[0], max_duration_time);
        }
    });

    var danmu_number_per_second = new Array(parseInt(Math.ceil(max_duration_time))).fill(0);
    var tot_danmu = 0;
    [].slice.call(dom.childNodes[0].children).forEach(function(elem) {
        if(elem.tagName=='d') {
            var attr=elem.attributes['p'].value.split(',');
            danmu_number_per_second [parseInt(attr[0])] += 1;
            tot_danmu += 1;
        }
    });
    
    var danmu_presum = new Array(danmu_number_per_second.length).fill(0);
    danmu_number_per_second.forEach(function(item, index, arr){
        if(index === 0){
            danmu_presum[index] = danmu_number_per_second[index];
        }
        else{
            danmu_presum[index] = danmu_presum[index-1]+danmu_number_per_second[index];
        }
    });

    //TODO: 将这些参数供使用者选择
    var interval = 30;
    var max_number = 0;
    var max_number_index = 0;
    var min_interval = 5;
    var tot_segment = 0;
    var threshold = 70;
    var segment_sample = new Array(20);
    for(i=0; i<20; i++){
        segment_sample[i] = new Array();
    }
    for(j=2*interval-1, len=danmu_number_per_second.length; j<len; j++){
        var now = danmu_presum[j]-danmu_presum[j-interval];
        pre_index = Math.max(0, j-min_interval);
        pre_sample = 0;
        if(pre_index != 0){
            pre_sample = danmu_presum[pre_index] - danmu_presum[Math.max(0, pre_index-interval)];
        }
        if(now-pre_sample>max_number){
            max_number = now-pre_sample;
            max_number_index = j;
        }
        if(now-pre_sample>Math.max(10, threshold*(tot_danmu/8000))){
            if(segment_sample[tot_segment] != undefined){
                length = segment_sample[tot_segment].length;
                if(segment_sample[tot_segment][length-1]+60<j){
                    tot_segment+=1;
                }
            }
            segment_sample[tot_segment].push(j);
        }
    }
    if(tot_segment == 0 && segment_sample[tot_segment].length == 0){
        segment_sample[tot_segment].push(max_number_index);
    }
    if(segment_sample[tot_segment] != undefined){
        tot_segment += 1;
    }
    var result = [];
    for(i=0; i<tot_segment; i++){
        if(segment_sample[i] == undefined)
            continue;
        var mid = segment_sample[i][Math.floor(segment_sample[i].length/2)];
        var start = Math.max(0, mid-30);
        var end = Math.min(max_duration_time, mid+30);
        result.push({start: start, end: end});
    }

    
    chrome.browserAction.setBadgeText({
        text: ''+tot_segment,
        tabId: tabid
    });
    chrome.browserAction.setTitle({
        title: '已筛选出'+tot_segment+'个片段',
        tabId: tabid
    });
    console.timeEnd('parse');
    return result;
}
