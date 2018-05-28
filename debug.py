#!/usr/bin/env python
# -*- coding: utf-8 -*-

def save(filename, content):
  oFile = file(filename, 'wb')
  oFile.write(content)
  oFile.close()

def read(filename):
  f = open(filename,'rb')
  content = f.read()
  f.close()
  return content