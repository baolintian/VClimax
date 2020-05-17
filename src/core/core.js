
function parse(dom,tabid) {
    chrome.browserAction.setTitle({
        title: '正在处理弹幕…', // if u can see this, VClimax might not be working correctly :)
        tabId: tabid
    });
    console.time('parse_danmu');

    var extra_number = Object.keys(TAOLUS).length;
    var time_stamp = new Array(extra_number);
    for(i=0; i<extra_number; i++){
        time_stamp[i] = new Array();
    }

    function detaolu(text) {
        var index = 0;
        for(var name in TAOLUS){
            if(TAOLUS[name].test(text))
                return index;
            index += 1;
        }
        return -1;
    }

    //get max duration time
    var max_duration_time = -1;
    [].slice.call(dom.childNodes[0].children).forEach(function(elem) {
        if(elem.tagName=='d') {
            var attr=elem.attributes['p'].value.split(',');
            max_duration_time = Math.max(attr[0], max_duration_time);
            var str=elem.childNodes[0] ? elem.childNodes[0].data : '';
            var index = detaolu(str);
            if(index >= 0){
                time_stamp[index].push(parseFloat(attr[0]));
            }
        }
    });
    for(i=0; i<extra_number; i++){
        time_stamp[i].sort(function(x, y){return x-y;});
    }
    var extra_keypoint = new Array(extra_number);
    for(i=0; i<extra_number; i++){
        extra_keypoint[i] = new Array();
    }
    
    for(i=0; i<extra_number; i++){
        var pre = -1;
        var count = 0;
        for(j=0; j<time_stamp[i].length; j++){
            count += 1;
            if(j == 0) {
                pre = time_stamp[i][j];
                continue;
            }
            if(time_stamp[i][j]-time_stamp[i][j-1]>5){
                if(count-1>=3){
                    extra_keypoint[i].push(pre);
                }
                pre = time_stamp[i][j];
                count = 1;
            }
        }
        if(pre !=-1&&count>=3)
            extra_keypoint[i].push(pre);
    }
    var result_set = {};
    var index = 0;
    for(var name in TAOLUS){
        result_set[name] = extra_keypoint[index++];
    }

    var danmu_number_per_second = new Array(parseInt(Math.ceil(max_duration_time))).fill(0);
    var tot_danmu = 0;
    if(dom.childNodes === null){
        console.log("failure");
        return null;
    }
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
    var interval = localStorage['SAMPLE_INTERVAL'];//default 30;
    var radis = localStorage['RADIS'];//10
    var min_interval = localStorage['MIN_INTERVAL'];//5

    var max_number = 0;
    var max_number_index = 0;

    
    var tot_segment = 0;
    var threshold = localStorage['FILTER_THRESHOLD'];//50
    

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
        var len = segment_sample[i].length;

        var start = Math.max(0, segment_sample[i][0]-radis);
        var end = Math.min(max_duration_time, mid+radis);
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
    console.timeEnd('parse_danmu');
    var result_list = [];
    result_list.push(result);
    result_list.push(result_set);
    //result_list[0]: 推荐的片段
    //result_list[1]: 根据正则表达式来进行筛选的片段
    return result_list;
}
