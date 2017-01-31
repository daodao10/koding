
import sys
import codecs
import tushare as ts


def etl(code):
    try:
        df = ts.get_h_data(code, start="1995-01-01")
        df.to_csv("./d/cn_{0}_d.csv".format(code), columns=["close"])
    except Exception as e:
        print(e)

def get_symbols(symbolFile):
    symbolList = []
    try:
        f = codecs.open(symbolFile, mode='r')
        lines = f.readlines()
        lines.pop(0)
        for l in lines:
            splits = str.split(l, ',')
            if len(splits) > 0:
                symbolList.append(splits[0])
        f.close()
    except Exception as e:
        print(e)
        sys.exit()

    return symbolList

if __name__ == "__main__":
    symbols = get_symbols('./s/cn_ts.txt')
    for s in symbols:
        print(s)
        etl(s)
    # etl('300291')
