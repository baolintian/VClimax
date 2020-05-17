import requests, re, time, csv
from bs4 import BeautifulSoup as BS
from selenium import webdriver
import os
import process_ass
#打开网页函数

def open_url(url):
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.103 Safari/537.36'}
    response = requests.get(url=url, headers=headers)
    
    response.encoding = 'utf-8'
    html = response.text
    return html

def open_cid_url(url):
    bvid = url.split('/')[-1]
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.103 Safari/537.36'}
    if bvid[0] == 'b' or bvid[0] == 'B':
        cid_url = "https://api.bilibili.com/x/player/pagelist?bvid="+bvid
        res = requests.get(url=cid_url, headers=headers)
        duration = res.json()["data"][0]["duration"]
    else:
        cid_url = "https://api.bilibili.com/x/web-interface/view?aid="+bvid[2:len(bvid)]
        res = requests.get(url=cid_url, headers=headers)
        duration = res.json()["data"]["duration"]
    
    return duration

#获取弹幕url中的数字id号

#当requests行不通时，采用selenium的方法。
def sele_get(url):
    SERVICE_ARGS = ['--load-images=false', '--disk-cache=true']
    driver = webdriver.PhantomJS(service_args = SERVICE_ARGS)
    driver.get(url)
    time.sleep(2)
    danmu_id = re.findall(r'cid=(\d+)&', driver.page_source)[0]

    return danmu_id


def get_danmu_id(html, url):
    try:
        soup = BS(html, 'lxml')
        #视频名
        title = soup.select('title[data-vue-meta="true"]')[0].get_text()
        #投稿人
        author = soup.select('meta[name="author"]')[0]['content']
        #弹幕的网站代码
        try:
            danmu_id = re.findall(r'cid=(\d+)&', html)[0]
            #danmu_id = re.findall(r'/(\d+)-1-64', html)[0]
            #print(danmu_id)
        except:
            danmu_id = sele_get(url)
        print(title, author)
        return danmu_id
    except:
        print('视频不见了哟')
        return False
#秒转换成时间
def sec2str(seconds):
    seconds = eval(seconds)
    m, s = divmod(seconds, 60)
    h, m = divmod(m, 60)
    time = "%02d:%02d:%02d" % (h, m, s)
    return time

#csv保存函数
def csv_write(tablelist):
    tableheader = ['出现时间', '弹幕模式', '字号', '颜色', '发送时间' ,'弹幕池', '发送者id', 'rowID', '弹幕内容']
    with open('danmu.csv', 'w', newline='', errors='ignore') as f:
        writer = csv.writer(f)
        writer.writerow(tableheader)
        for row in tablelist:
            writer.writerow(row)
            

def sec2hms(x):
    h = x//3600
    x -= (3600*h)
    m = (x//60)
    x -= (60*m)
    s = x%60
    return "{:d}:{:0>2d}:{:0>2d}".format(h, m, s)



video_url = "https://www.bilibili.com/video/BV1Ht411M75h"
video_html = open_url(video_url)
duration = open_cid_url(video_url)
danmu_id = get_danmu_id(video_html, video_url)

all_list = []
if danmu_id:
    danmu_url = 'http://comment.bilibili.com/{}.xml'.format(danmu_id)
    print(danmu_url)
    danmu_html = open_url(url=danmu_url)
    soup = BS(danmu_html, 'lxml')
    all_d = soup.select('d')
    for d in all_d:
        #把d标签中P的各个属性分离开
        danmu_list = d['p'].split(',')
        #d.get_text()是弹幕内容
        danmu_list.append(d.get_text())
        danmu_list[0] = eval(danmu_list[0])
        danmu_list[4] = time.ctime(eval(danmu_list[4]))
        all_list.append(danmu_list)
#        print(danmu_list)
    all_list.sort()
    csv_write(all_list)

tot_danmu = len(all_list)
danmu_number_in_second = [0 for i in range(duration+1)]
danmu_number_in_second_presum = [0 for i in range(duration+1)]
interval = 30
minus_interval = 5
segment_max = 10;
video_segment = [[]for i in range(segment_max)]
now_index = 0

if duration<interval:
    print("Ha! The video is too short and just have fun~")
else:
    for i in range(len(all_list)):
        danmu_number_in_second[int(all_list[i][0])] += 1
    danmu_number_in_second_presum[0] = danmu_number_in_second[0]
    for i in range(1,duration):
        danmu_number_in_second_presum[i]=danmu_number_in_second[i]+danmu_number_in_second_presum[i-1]
    mx = -1
    index = -1
    for i in range(interval*2-1, duration):
        now = danmu_number_in_second_presum[i]
        if i>=interval:
            now -= danmu_number_in_second_presum[i-interval]
        pre_index = max(0, i-minus_interval)
        pre_sample = 0
        if(pre_index == 0):
            pre_sample=0
        else:
            pre_sample = danmu_number_in_second_presum[pre_index]-danmu_number_in_second_presum[max(0, pre_index-interval)]
        if now-pre_sample > mx:
            mx = now-pre_sample
            index = i
        
        
        if(now-pre_sample>150*(tot_danmu/8000)):
            length = len(video_segment[now_index])
            if(length > 0):
                if video_segment[now_index][length-1]+60<i:
                    now_index+=1
            video_segment[now_index].append(i)
                
    for i in range(now_index+1):
        if(len(video_segment[i]) == 0):
            continue
        mid = video_segment[i][len(video_segment[i])//2]
        start = max(0, mid-30)
        end = min(duration, mid+30)
        if end-start<60:
            start = max(0, end-60)
        print("%d %d now capture the segment"%(start, end))
        os.system("ffmpeg  -i ./fly.flv -vcodec copy -acodec copy -ss "+sec2hms(start)+" -to " + sec2hms(end) + " ./fly"+str(i)+".mp4 -y")
        process_ass.generate_ass(start, end, "fly"+str(i)+".ass")
        print("finish the video capture")