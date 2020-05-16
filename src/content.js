var videoSeletor;
var videoContainerSelector;

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

if (urlHost.indexOf("bilibili") > -1) {
    videoSeletor = "#bilibiliPlayer video";
    videoContainerSelector = "#bilibiliPlayer .bilibili-player-video";
} 
var $video = document.querySelector(videoSeletor);

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if( request.message === "loaded" ) {
            var exist = document.getElementById("ynk-playback-control");
            if(exist != null) 
                return ;
            console.log("in3");
            var pos = document.getElementById("danmukuBox");
            var container = document.createElement("DIV");
            
            container.style.zIndex = "auto";
            container.innerHTML = "一共捕获到"+request.result.length+"个片段";
            filter_segment = request.result;
            for(i=0, len=request.result.length; i<len; i++){
                var upBtn = document.createElement("LI");
                upBtn.value = filter_segment[i]["start"];
                upBtn.index = i;
                upBtn.appendChild(document.createTextNode("第"+i+"个>>   "+sec2format(filter_segment[i]["start"])));
                upBtn.addEventListener("click", function () {
                    $video.currentTime = $(this).attr("value");
                });
                container.appendChild(upBtn);
            }
            
            container.className = "ynk-playback-control";

            document.body.querySelector("#app .r-con").insertBefore(container, pos);
        }
    }
);