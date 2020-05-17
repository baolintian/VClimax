// (C) 2017 @xmcp. THIS PROJECT IS LICENSED UNDER GPL VERSION 3. SEE `LICENSE.txt`.
// (C) 2020 @babydragon. THIS PROJECT IS LICENSED UNDER GPL VERSION 3. SEE `LICENSE.txt`.

function id(x) {
    return document.getElementById(x);
}

id('version').textContent=chrome.runtime.getManifest().version;

chrome.runtime.getBackgroundPage(function(bgpage) {
    function reload() {
        bgpage.loadconfig();
        id('saved-alert').classList.remove('hidden');
        setTimeout(function(){location.reload();},100);
    }
    
    var cfg_taolus=bgpage.fromholyjson(localStorage['TAOLUS']);
    var taolus=id('taolus');
    for(var key in cfg_taolus) {
        var container=document.createElement('li'),
            code1=document.createElement('code'),
            spliter1=document.createElement('span'),
            code2=document.createElement('code'),
            deletebtn=document.createElement('button'),
            spliter2=document.createElement('span'),
            code3=document.createElement('code');
            
        code1.textContent=cfg_taolus[key][0];
        spliter1.textContent=' → ';
        code2.textContent=key;
        deletebtn.textContent='删除';
        spliter2.textContent='     触发阈值： ';
        code3.textContent=cfg_taolus[key][1];
        (function(key) {deletebtn.addEventListener('click',function() {
            delete cfg_taolus[key];
            localStorage['TAOLUS']=bgpage.toholyjson(cfg_taolus);
            reload();
        })})(key);
        
        container.appendChild(deletebtn);
        container.appendChild(code1);
        container.appendChild(spliter1);
        container.appendChild(code2);
        container.appendChild(spliter2);
        container.appendChild(code3);
        taolus.appendChild(container);
    }
    

    id('sample-interval').value = localStorage['SAMPLE_INTERVAL'];
    id('radis').value = localStorage['RADIS'];
    id('filter-threshold').value = localStorage['FILTER_THRESHOLD'];
    id('min-interval').value = localStorage['MIN_INTERVAL'];
    id('flash-notif').checked=localStorage['FLASH_NOTIF']==='on';


    id('newtaolu-form').addEventListener('submit',function(e) {
        e.preventDefault();
        var key=id('newtaolu-name').value;
        cfg_taolus[key] = new Array(2);
        cfg_taolus[key][0]=new RegExp(id('newtaolu-pattern').value);
        cfg_taolus[key][1]=id('newtaolu-threshold').value;
        localStorage['TAOLUS']=bgpage.toholyjson(cfg_taolus);
        reload();
    });
    
    function update() {
        
        localStorage['FLASH_NOTIF']=id('flash-notif').checked?'on':'off';
        localStorage['SAMPLE_INTERVAL'] = parseInt(id('sample-interval').value)>0?parseInt(id('sample-interval').value):30;
        localStorage['FILTER_THRESHOLD'] = parseInt(id('filter-threshold').value)>0?parseInt(id('filter-threshold').value):100;
        localStorage['RADIS'] = parseInt(id('radis').value)>0?parseInt(id('radis').value):10;
        localStorage['MIN_INTERVAL'] = parseInt(id('min-interval').value)>0?parseInt(id('min-interval').value):5;
        reload();
    }
    
    ['filter-threshold', 'flash-notif', 'sample-interval', 'radis', 'min-interval']
            .forEach(function(elem) {
        id(elem).addEventListener('change',update);
    });
});
