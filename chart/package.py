def append_dir(fpath):
    import os,sys
    parentDir = os.path.join(os.path.dirname(__file__), fpath)
    sys.path.append(parentDir);
