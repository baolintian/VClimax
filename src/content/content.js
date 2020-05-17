var videoSeletor;
var videoContainerSelector;
//www.bilibili.com
var urlHost = window.location.host;
var filter_segment;

//format string output like"%02d", can't process format float number.
function printf(){
    var as=[].slice.call(arguments),fmt=as.shift(),i=0;
    return  fmt.replace(/%(\w)?(\d)?([dfsx])/ig,function(_,a,b,c){
         var s=b?new Array(b-0+1).join(a||''):'';
         if(c=='d') s+=parseInt(as[i++]);
         return b?s.slice(b*-1):s;
    })
}

function sec2format(x){
    var h = parseInt(x/3600);
    x -= h*3600;
    var m = parseInt(x/60);
    x -= m*60;
    var s = parseInt(x);
    x -= s;
    return printf("%02d:%02d:%02d", h, m, s)+x.toFixed(2).substring(1);
}

//if want to parse other video website, may change the selector
if (urlHost.indexOf("bilibili") > -1) {
    videoSeletor = "#bilibiliPlayer video";
    videoContainerSelector = "#bilibiliPlayer .bilibili-player-video";
} 

var $video = document.querySelector(videoSeletor);


function insert_before_child(container, pos){
    if($('div').is('.plp-r'))
        document.body.querySelector("#app .plp-r").insertBefore(container, pos);
    else if($('div').is('.r-con'))
        document.body.querySelector("#app .r-con").insertBefore(container, pos);
}

var TAOLUS={};

var max_wait_time = 0;
while(true){
    if($('div').is('.plp-r')||$('div').is('.r-con')){
        chrome.runtime.sendMessage({"message": "get_result"});
        break;
    }
    else if(max_wait_time>5){
        console.log("can't locate video, may not have a video");
        break;
    }
    else{
        var $video = document.querySelector(videoSeletor);
        setTimeout("", 500);
        max_wait_time+=1;
    }
}


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if( request.message === "loaded" ) {

            var exist = $('div').is('.VClimax-control');
            var video_part_dom;
            if($('div').is('.plp-r'))
                video_part_dom = ".plp-r";
            else if($('div').is('.r-con'))
                video_part_dom = ".r-con";
            var obj = document.body.querySelector("#app "+video_part_dom);
            //if the page dosen't refresh, remove the odd one.
            if(exist) {
                var $video = document.querySelector(videoSeletor);
                var has = false;
                while(true){
                    for(i=0; i<obj.childElementCount; i++){
                        if(obj.childNodes[i].className === "VClimax-control"){
                            obj.removeChild(obj.childNodes[i]);
                            has = true;
                            break;
                        }
                    }
                    if(has){
                        has = false;
                    }
                    else break;
                }
            }
            var pos = document.getElementById("danmukuBox");
            var pos1 = document.getElementById("app");

            //add recommend.
            var container = document.createElement("DIV");
            container.style.zIndex = "auto";
            container.innerHTML = "一共推荐"+request.result[0].length+"个片段";
            filter_segment = request.result[0];
            for(i=0, len=request.result[0].length; i<len; i++){
                var upBtn = document.createElement("LI");
                upBtn.value = filter_segment[i]["start"];
                upBtn.appendChild(document.createTextNode("第"+i+"个>>   "+sec2format(filter_segment[i]["start"])));
                upBtn.addEventListener("click", function () {
                    console.log($(this).attr("value"));
                    max_wait_time = 0;
                    while($video === undefined){
                        $video = document.querySelector(videoSeletor);
                        max_wait_time+=1;
                        setTimeout("", 500);
                        if(max_wait_time > 5)
                            break;
                    }
                    $video.currentTime = $(this).attr("value");
                });
                container.appendChild(upBtn);
            }
            container.className = "VClimax-control";
            insert_before_child(container, pos);

            //add other part
            var result_set = request.result[1];
            for(var name in result_set){
                var container = document.createElement("DIV");
                container.style.zIndex = "auto";
                container.innerHTML = name;
                var len=result_set[name].length;
                if(len===0)
                    continue;
                for(i=0 ; i<len; i++){
                    var upBtn = document.createElement("LI");
                    upBtn.value = result_set[name][i];
                    upBtn.appendChild(document.createTextNode("第"+i+"个>>   "+sec2format(result_set[name][i])));
                    upBtn.addEventListener("click", function () {
                        max_wait_time = 0;
                        while($video === undefined){
                            $video = document.querySelector(videoSeletor);
                            max_wait_time+=1;
                            setTimeout("", 500);
                            if(max_wait_time > 5)
                                break;
                        }
                        $video.currentTime = $(this).attr("value");
                    });
                    container.appendChild(upBtn);
                }
                container.className = "VClimax-control";
                insert_before_child(container, pos);
            }
        }
    }
);