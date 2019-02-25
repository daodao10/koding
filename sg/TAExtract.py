import os, sys
import zipfile
import fnmatch
import shutil

import package
package.append_dir('../..')

from koding import web_tools

def extract(srcDir, pattern):
    listOfFiles = os.listdir(srcDir)
    for entry in listOfFiles:
        if fnmatch.fnmatch(entry, pattern):
            fileHandle = open(srcDir + entry, 'rb')
            try:
                zf = zipfile.ZipFile(fileHandle)
                for name in zf.namelist():
                    try:
                        data = zf.read(name)
                    except:
                        print('%s file' % name)
                        print("Unexpected error: ", sys.exc_info()[0])
                    else:
                        web_tools.save(srcDir + name, data)
                        print ('%s => done' % entry)

            except zipfile.BadZipfile:
                print('ERROR: bad zip file %s' % entry)

            fileHandle.close()

def rename(destDir, srcDir, pattern):
    listOfFiles = os.listdir(srcDir)
    for entry in listOfFiles:
        if fnmatch.fnmatch(entry, pattern):
            srcFile = srcDir + entry
            fileHandle = open(srcFile, "r")
            try:
                fileHandle.next()
                row2 = fileHandle.next() 
                # ...
                fileNameParts = row2.split(",", 1)
                fileHandle.close()
                shutil.move(srcFile, destDir + fileNameParts[0] + '.SI.csv')
                print('%s => saved ' % (fileNameParts[0] + '.SI'))
            except(StopIteration):
                fileHandle.close()

if __name__ == "__main__":
    srcDir = './src-hid/'
    outDir = './dest-hid/'

    extract(srcDir, "*.zip" )
    rename(outDir, srcDir, "*.csv")
