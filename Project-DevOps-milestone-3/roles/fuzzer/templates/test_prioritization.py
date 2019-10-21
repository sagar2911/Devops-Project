#!/usr/bin/env python3
import xml.etree.ElementTree as ET
import os
import pdb
import logging
dicti = {}

def getBuilds():
        builds = [x[0] for x in os.walk('/home/ubuntu/iTrust_Test_Reports')]
        print (builds[1:])
        return builds[1:]

def populateDicti(dicti,builds):
        path = builds[1]
        for r,d,f in os.walk(path):
                for file in f:
                        if '.xml' in file :
                                dicti[file] = {'time':[], 'failures':0}
        #print (dicti)
        print (len(dicti))

def getValues(dicti,builds):
        for test in dicti.keys():
                for build in builds:
                        path = build+'/'+test
                        tree = ET.parse(path)
                        root = tree.getroot()
                        #print (root.attrib['failures'])
                        if root.attrib['failures'] != '0' :
                                dicti[test]['failures']+=1
                        dicti[test]['time'].append(float(root.attrib['time']))

def findAvg(numbers):
        return float(sum(numbers)) / max(len(numbers), 1)

def avgTime(dicti):
        for test in dicti.keys():
                if test in dicti:
                        avg_time = findAvg(dicti[test]['time'])
                        dicti[test].update({'time':avg_time})

def sortArgs(dicti):
        sorted_d = sorted(dicti.items(), key=lambda x: (-x[1]['failures'], x[1]['time']))
        return sorted_d

#tree = ET.parse('/home/ubuntu/iTrust_Test_Reports/Build_4/TEST-edu.ncsu.csc.itrust2.apitest.APIGeneralCheckupTest.xml')
#root = tree.getroot()

#print (root.tag)
#print (root.attrib['name'],root.attrib['failures'],root.attrib['time'])
builds = getBuilds()
populateDicti(dicti,builds)
print (dicti)
getValues(dicti,builds)
print ('-------------------------------------------------------------------------------')
print (dicti)
avgTime(dicti)
print ('-------------------------------------------------------------------------------')
print (dicti)
sorted_d = sortArgs(dicti)
print ('---------------------------------------------------------------------------------')
print (sorted_d)
logging.basicConfig(filename="FinalReport.log", level=logging.INFO)
for test in sorted_d:
        testname = test[0].lstrip('TEST-')
        time = test[1]['time']
        failures = test[1]['failures']
        logging.info('name: %s; failures: %s; time: %s',testname,failures,time)

