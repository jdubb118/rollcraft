#!/usr/bin/env python3
"""Test the /api/create-sprite endpoint on a Grapple Quest draft deploy.
Spends one PixelLab generation (belt-only, no photo). Saves the PNG to /tmp."""
import json
import sys
import base64
import urllib.request

url = sys.argv[1] + '/api/create-sprite'
req = urllib.request.Request(
    url,
    data=json.dumps({'belt': 'blue', 'size': 32}).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST',
)
with urllib.request.urlopen(req, timeout=130) as resp:
    d = json.load(resp)

if 'image' in d:
    with open('/tmp/gq-sprite-test.png', 'wb') as f:
        f.write(base64.b64decode(d['image']))
    print(f"SPRITE GENERATED OK — /tmp/gq-sprite-test.png ({len(d['image'])} b64 chars)")
else:
    print('ERROR:', json.dumps(d)[:400])
