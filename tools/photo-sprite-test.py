#!/usr/bin/env python3
"""Test the PHOTO-upload path of /api/create-sprite (the viral feature).
Usage: photo-sprite-test.py <deploy-url> <photo-path>  — SPENDS 1 PixelLab credit."""
import json
import sys
import base64
import urllib.request

url = sys.argv[1] + '/api/create-sprite'
photo_path = sys.argv[2]  # must be a 256x256 PNG (client resizes before upload)
with open(photo_path, 'rb') as f:
    photo_b64 = base64.b64encode(f.read()).decode()

req = urllib.request.Request(
    url,
    data=json.dumps({
        'photo': photo_b64,
        'description': 'Testy BJJ fighter in white gi, white belt, standing fighting stance, front facing, full body, pixel art game character sprite',
        'size': 32,
    }).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST',
)
with urllib.request.urlopen(req, timeout=130) as resp:
    d = json.load(resp)

if 'image' in d:
    with open('/tmp/gq-photo-sprite.png', 'wb') as f:
        f.write(base64.b64decode(d['image']))
    print(f"PHOTO SPRITE OK — /tmp/gq-photo-sprite.png ({len(d['image'])} b64 chars)")
else:
    print('ERROR:', json.dumps(d)[:400])
