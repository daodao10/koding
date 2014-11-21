#!/usr/bin/python
import os
import platform

import sgx, sse, web_tools

today = None
# today = web_tools.today(utcDiff = +4)

dbUri = web_tools.getDbUri()

s = sgx.SGX(dbUri = dbUri, today = today)
s.getSummary()
s.getDayTick()

s = sse.SSE(dbUri = dbUri, today = today)
s.getDayTick()
