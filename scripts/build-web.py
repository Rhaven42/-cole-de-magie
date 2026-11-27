"""Construit la version web publiable (dist-web/) à partir de `npx expo export -p web`.

Usage : python3 scripts/build-web.py <dossier_export>
Les fichiers sont renommés en chemins courts et relatifs (a/N.ext, j/app.js) pour
fonctionner depuis n'importe quel sous-dossier.
"""
import os, re, shutil, sys

src = sys.argv[1]
out = os.path.join(os.path.dirname(__file__), '..', 'dist-web')
shutil.rmtree(out, ignore_errors=True)
os.makedirs(os.path.join(out, 'a'))
os.makedirs(os.path.join(out, 'j'))
jsdir = os.path.join(src, '_expo/static/js/web')
bundle_name = [f for f in os.listdir(jsdir) if f.endswith('.js')][0]
js = open(os.path.join(jsdir, bundle_name), encoding='utf-8').read()
refs = sorted(set(re.findall(r'"(/assets/[^"]+)"', js)), key=lambda r: (r.rsplit('.', 1)[1] != 'png', r))
for i, ref in enumerate(refs):
    ext = ref.rsplit('.', 1)[1]
    shutil.copy(os.path.join(src, ref.lstrip('/')), os.path.join(out, 'a', f'{i}.{ext}'))
    js = js.replace(f'"{ref}"', f'"./a/{i}.{ext}"')
open(os.path.join(out, 'j', 'app.js'), 'w', encoding='utf-8').write(js)
html = open(os.path.join(src, 'index.html'), encoding='utf-8').read()
html = html.replace('<html lang="en">', '<html lang="fr">')
html = re.sub(r'src="/_expo/static/js/web/[^"]+"', 'src="./j/app.js"', html)
html = html.replace('href="/favicon.ico"', 'href="./favicon.ico"')
html = html.replace('</style>', '  html, body, #root { touch-action: none; overscroll-behavior: none; }\n    </style>', 1)
open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(html)
shutil.copy(os.path.join(src, 'favicon.ico'), os.path.join(out, 'favicon.ico'))
print(len(refs), 'assets')
