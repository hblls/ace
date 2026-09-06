# -*- coding: utf-8 -*-
import json, re, sys

src = json.load(open('phr_batch_todo.json'))
out = json.load(open('phr_enriched.json'))

# irregular verb forms -> base
IRREG = {
 'be':['is','am','are','was','were','been','being'],
 'use':['used','using'],
 'break':['broke','broken','breaking'],
 'bring':['brought','bringing'],
 'lose':['lost','losing'],
 'run':['ran','running'],
 'take':['took','taken','taking'],
 'act':['acted','acting'],
 'add':['added','adding'],
 'agree':['agreed','agreeing'],
 'apologize':['apologized'],
 'apply':['applied'],
 'arrive':['arrived'],
 'ask':['asked'],
 'back':['backed'],
 'bark':['barked'],
 'belong':['belongs','belonged'],
 'bend':['bent','bending'],
 'call':['called','calls'],
 'cancel':['canceled','canceling','cancelled'],
 'care':['cares','cared'],
 'carry':['carried','carrying'],
 'catch':['caught','catching'],
 'change':['changed'],
 'check':['checked'],
 'clean':['cleaned'],
 'clear':['cleared'],
 'climb':['climbed'],
 'come':['came','coming'],
 'communicate':['communicates','communicated'],
 'compare':['compared'],
 'complain':['complained'],
 'copy':['copied'],
 'cover':['covered'],
 'date':['dates','dated'],
 'decide':['decided'],
 'depend':['depends','depended'],
 'die':['died','dying'],
 'dig':['dug','digging'],
 'dip':['dipped'],
 'disappear':['disappeared'],
 'do':['did','done','doing'],
 'dream':['dreamed','dreamt','dreaming'],
 'drip':['dripped'],
 'drive':['drove','driven','driving'],
 'drop':['dropped'],
 'dry':['dried'],
 'eat':['ate','eaten','eating'],
 'end':['ends','ended'],
 'fall':['fell','fallen','falling'],
 'feel':['felt','feeling'],
 'fight':['fought','fighting'],
 'fill':['filled'],
 'find':['found','finding'],
 'fly':['flew','flown','flying'],
 'focus':['focused'],
 'force':['forced'],
 'get':['got','gotten','getting'],
 'give':['gave','given','giving'],
 'go':['goes','went','gone','going'],
 'grow':['grew','grown','growing'],
 'hand':['handed'],
 'happen':['happened'],
 'hear':['heard','hearing'],
 'help':['helped'],
 'hold':['held','holding'],
 'hurry':['hurried'],
 'join':['joined'],
 'jump':['jumped'],
 'keep':['kept','keeping'],
 'knock':['knocked','knocking'],
 'know':['knew','known','knowing'],
}
form2base = {}
for base, forms in IRREG.items():
    form2base[base] = base
    for f in forms:
        form2base[f] = base

PLACE = {'a','b','an','the','sb','sth','do','doing','someone','something','sb.','...'}

def tok(s):
    s = re.sub(r"\([^)]*\)", " ", s)  # drop optional parentheticals e.g. (at)
    return re.findall(r"[a-z]+", s.lower())

def match_word(k, w):
    if k == w: return True
    if len(k) >= 3 and (w.startswith(k) or k.startswith(w)): return True
    if k in form2base and w in form2base and form2base[k] == form2base[w]: return True
    return False

def part_ok(part_tokens, en_tok):
    # subsequence match, dropping placeholders
    need = [t for t in part_tokens if t not in PLACE]
    i = 0
    for t in need:
        found = False
        while i < len(en_tok):
            if match_word(t, en_tok[i]):
                found = True
                i += 1
                break
            i += 1
        if not found:
            return False
    return True

problems = []
key_mismatch = []
for d in src:
    p = d['p']
    if p not in out:
        key_mismatch.append(p)
        continue
    rec = out[p]
    en2_tok = tok(rec['en2'])
    # per slash part
    parts = [tok(x) for x in p.split('/')]
    if not any(part_ok(pt, en2_tok) for pt in parts):
        problems.append((p, rec['en2']))
    # fields non-empty
    for fld in ('en2','cn2','note'):
        if not isinstance(rec.get(fld), str) or not rec[fld].strip():
            problems.append((p, f"empty field {fld}"))

print("KEYS in output:", len(out))
print("KEYS in input :", len(src))
print("KEY MISMATCH  :", key_mismatch)
print("PHRASE-USE PROBLEMS:", len(problems))
for pr in problems:
    print("  ", pr)
print("VALID JSON, 200 COVERED:", (len(out)==200 and not key_mismatch and not problems))
