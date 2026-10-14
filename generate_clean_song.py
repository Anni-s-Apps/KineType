import json
import re

with open('pdoom-video-main/work_groq.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

groq_words = data['words']
duration = data.get('duration', 223.88)

# Format words
clean_words = []
for w in groq_words:
    clean_words.append({
        'word': w['word'].strip(),
        'start': round(w['start'], 3),
        'end': round(w['end'], 3)
    })

# Add Intro line if vocals start after 3s
lines = []
if clean_words and clean_words[0]['start'] > 4.0:
    intro_words = [
        {'w': "Oh,", 'start': 2.0, 'end': 3.5},
        {'w': "oh-oh...", 'start': 3.5, 'end': 5.5},
        {'w': "Better", 'start': 6.0, 'end': 7.5},
        {'w': "on", 'start': 7.5, 'end': 8.5},
        {'w': "My", 'start': 8.5, 'end': 9.5},
        {'w': "Own", 'start': 9.5, 'end': 11.5},
    ]
    lines.append({
        'i': 0,
        'text': "Oh, oh-oh... Better on My Own",
        'start': 0.0,
        'end': clean_words[0]['start'] - 0.2,
        'words': intro_words
    })

# Natural grouping of spoken words
cur_words = []
cur_start = None

for w in clean_words:
    w_text = w['word']
    st = w['start']
    en = w['end']
    
    if not cur_words:
        cur_start = st
        cur_words.append({'w': w_text, 'start': st, 'end': en})
    else:
        prev_en = cur_words[-1]['end']
        gap = st - prev_en
        ends_punct = bool(re.search(r'[.,?!]$', cur_words[-1]['w'])) and len(cur_words) >= 4
        
        if gap > 0.45 or len(cur_words) >= 7 or (ends_punct and gap > 0.25):
            line_text = ' '.join(cw['w'] for cw in cur_words)
            lines.append({
                'i': len(lines),
                'text': line_text,
                'start': round(cur_start, 3),
                'end': round(prev_en + 0.3, 3),
                'words': list(cur_words)
            })
            cur_words = [{'w': w_text, 'start': st, 'end': en}]
            cur_start = st
        else:
            cur_words.append({'w': w_text, 'start': st, 'end': en})

if cur_words:
    line_text = ' '.join(cw['w'] for cw in cur_words)
    lines.append({
        'i': len(lines),
        'text': line_text,
        'start': round(cur_start, 3),
        'end': round(cur_words[-1]['end'] + 0.3, 3),
        'words': list(cur_words)
    })

final_data = {
    'title': 'Better on My Own 🌙🎧',
    'duration': duration,
    'audioUrl': '/audio/better_on_my_own.mp3',
    'words': clean_words,
    'lines': lines
}

with open('src/data/defaultSong.json', 'w', encoding='utf-8') as f:
    json.dump(final_data, f, indent=2)

print(f"Generated {len(clean_words)} words and {len(lines)} lines in src/data/defaultSong.json")
for l in lines[:8]:
    print(f"[{l['start']}s -> {l['end']}s]: {l['text']}")
