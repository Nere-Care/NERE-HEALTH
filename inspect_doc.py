import zipfile, re, os
path = r'Documentations NERE\\NERE Recap Technologies.docx'
if os.path.exists(path):
    with zipfile.ZipFile(path) as z:
        text = z.read('word/document.xml').decode('utf-8')
    clean = re.sub(r'<[^>]+>', ' ', text)
    keywords = ['python','fastapi','sqlalchemy','postgres','docker','react','flutter','node','vite','firebase','oauth']
    found = {k: bool(re.search(r'\\b'+re.escape(k)+r'\\b', clean, re.I)) for k in keywords}
    print('FOUND', found)
    for kw in keywords:
        if found[kw]:
            print(kw)
            match = re.search(r'(.{0,80}\\b'+re.escape(kw)+r'\\b.{0,80})', clean, re.I)
            if match:
                print(match.group(0))
else:
    print('MISSING', path)
