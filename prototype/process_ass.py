# -*- coding: utf-8 -*-
"""
Created on Thu May  7 22:13:44 2020

@author: 宝宝天龙
"""

def time_offset(tim2, offset):
    tim1 = tim2.split(":")
    tim1[0] = tim1[0].lstrip('0')
    tim1[1] = tim1[1].lstrip('0')
    tim1[2] = tim1[2].lstrip('0')
    if len(tim1[0]) == 0:
        tim1[0] = '0'
    if len(tim1[1]) == 0:
        tim1[1] = '0'
    if len(tim1[2]) == 0:
        tim1[2] = '0'
    tim = eval(tim1[0])*3600+eval(tim1[1])*60+eval(tim1[2])
    now = tim-offset
    if(now < 0.0):
        return tim2
    h = now//3600
    now -= 3600*h
    m = now //60
    now -= m*60
    return "{:d}:{:0>2d}:{:0>2d}".format(int(h), int(m), int(now//1))+("{:.2f}".format(now-int(now//1))).lstrip('0')

def between(start, end, tim):
    
    tim1 = tim.split(":")
    tim1[0] = tim1[0].lstrip('0')
    tim1[1] = tim1[1].lstrip('0')
    tim1[2] = tim1[2].lstrip('0')
    if len(tim1[0]) == 0:
        tim1[0] = '0'
    if len(tim1[1]) == 0:
        tim1[1] = '0'
    if len(tim1[2]) == 0:
        tim1[2] = '0'
    
    seconds = eval(tim1[0])*3600+eval(tim1[1])*60+eval(tim1[2])
    if seconds>=start and seconds<=end:
        return True, time_offset(tim, start)
    else:
        return False, "0:00:00"

def generate_ass(start, end, output_filename):
    output = open(output_filename, "w", encoding="utf-8")
    with open("fly.ass", 'r', encoding="utf-8") as f:
        for line1 in f.readlines():
#            line1 = f.readline()
            item = line1.split(' ')
            line = ""
            if(item[0] == "Dialogue:"):
                time = item[1].split(',')
                flag, result = between(start, end, time[1])
                if flag:
                    line = item[0]
                    line += time[0]
                    line += ","
                    line += result
                    line += ","
                    if time_offset(time[1], start) == time[1]:
                        line += time[2]
                    else:
                        line += time_offset(time[2], start)
                    line += line1[33:]
                    output.writelines(line)
            else:
                output.write(line1)
    
    output.close()
                

    
        