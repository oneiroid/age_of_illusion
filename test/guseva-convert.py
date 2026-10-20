"""Converts dat.csv of Guseva et al. (2023), osf.io/z8rjx, into the JSON used by oracle-real.js.
Usage: python3 test/guseva-convert.py dat.csv seqs.json"""
import collections, csv, json, sys

src, dst = sys.argv[1:3]
subs = collections.defaultdict(lambda: {'cond': None, 'blocks': collections.defaultdict(list)})
with open(src, encoding='utf-8-sig') as f:
    for r in csv.DictReader(f):
        s = subs[int(r['subject'])]
        s['cond'] = int(r['condition'])
        s['blocks'][int(r['block'])].append((int(r['trial']), 1 if r['choice'] == '1' else 0))
out = [{'sub': sid, 'cond': s['cond'], 'block': b, 'seq': ''.join(str(x) for _, x in sorted(rows))}
       for sid, s in sorted(subs.items()) for b, rows in sorted(s['blocks'].items())]
json.dump(out, open(dst, 'w'))
print(len(subs), 'participants,', len(out), 'blocks')
