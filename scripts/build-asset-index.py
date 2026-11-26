#!/usr/bin/env python3
"""Régénère src/assets/index.ts à partir des fichiers de src/assets/sprites et src/assets/textures."""
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets')


def entries(folder, ext):
    d = os.path.join(ROOT, folder)
    out = []
    for f in sorted(os.listdir(d)):
        if not f.endswith(ext):
            continue
        name = f[: -len(ext)]
        w, h = Image.open(os.path.join(d, f)).size
        key = name if '-' not in name else f"'{name}'"
        out.append(f"  {key}: {{ src: require('./{folder}/{f}'), w: {w}, h: {h} }},")
    return out


lines = [
    '/* Généré par scripts/build-asset-index.py — ne pas modifier à la main. */',
    "import type { ImageSourcePropType } from 'react-native';",
    '',
    'export interface SpriteDef {',
    '  src: ImageSourcePropType;',
    '  w: number;',
    '  h: number;',
    '}',
    '',
    'export const SPRITES = {',
    *entries('sprites', '.png'),
    '} satisfies Record<string, SpriteDef>;',
    '',
    'export type SpriteName = keyof typeof SPRITES;',
    '',
    '/** Textures (SpriteCook, mode texture, raccordables). */',
    'export const TEXTURES = {',
    *entries('textures', '.jpg'),
    '} satisfies Record<string, SpriteDef>;',
    '',
    'export type TextureName = keyof typeof TEXTURES;',
    '',
]
with open(os.path.join(ROOT, 'index.ts'), 'w') as fh:
    fh.write('\n'.join(lines))
print('ok')
