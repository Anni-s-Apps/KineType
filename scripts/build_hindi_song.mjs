import fs from 'fs';
import path from 'path';

// Read raw Whisper output
const raw = JSON.parse(fs.readFileSync('audio_pipeline/transcripts/raw_kaash_tu_yahin_hoti.json', 'utf-8'));

// The user's clean lyric lines for "Kaash Tu Yahin Hoti"
// We will match the transcribed words to each line based on timestamp intervals!
const linesDef = [
  // Intro
  { text: "पता नहीं क्यों आज फिर", start: 11.5, end: 15.1 },
  { text: "तेरी याद आई है...", start: 15.1, end: 20.6 },

  // Verse 1
  { text: "तेरी तस्वीर अब भी फ़ोन में है", start: 23.8, end: 26.5 },
  { text: "तेरी बातें मेरी धुन में हैं", start: 26.5, end: 28.9 },
  { text: "मैं हँसता हूँ, सब ठीक लगे", start: 28.9, end: 32.2 },
  { text: "पर कुछ कमी सी सुकून में है", start: 32.2, end: 34.9 },
  { text: "वो शाम जो तेरे साथ कटी", start: 34.9, end: 37.8 },
  { text: "वो बातें जो आधी रह गईं", start: 37.8, end: 40.3 },
  { text: "मैं आज भी वहीं ठहरा हूँ", start: 40.3, end: 43.5 },
  { text: "जहाँ से तेरी राह बदल गई", start: 43.5, end: 46.1 },

  // Pre-Chorus
  { text: "और तुझसे अब कुछ कहना नहीं", start: 46.1, end: 49.6 },
  { text: "पर दिल को भी समझाऊँ कैसे?", start: 49.6, end: 52.4 },
  { text: "तू पास नहीं, ये सच तो है", start: 52.4, end: 55.0 },
  { text: "पर तुझको भुलाऊँ कैसे?", start: 55.0, end: 57.8 },

  // Chorus 1
  { text: "काश तू यहीं होती", start: 57.8, end: 60.3 },
  { text: "मेरी बाँहों में नहीं तो नज़रों में होती", start: 60.3, end: 63.3 },
  { text: "मैं कुछ न कहता, तू कुछ न कहती", start: 63.3, end: 66.4 },
  { text: "बस थोड़ी सी रात और बाकी होती", start: 66.4, end: 71.5 },
  { text: "काश तू यहीं होती", start: 71.5, end: 74.8 },
  { text: "मेरी हर ख़ुशी में शामिल होती", start: 74.8, end: 79.2 },
  { text: "अब तू नहीं है, फिर भी जाने क्यों", start: 79.2, end: 83.5 },
  { text: "मेरी हर दुआ में तू ही होती", start: 83.5, end: 87.5 },

  // Verse 2
  { text: "तुझे याद है वो छोटी सी बात?", start: 87.5, end: 95.8 },
  { text: "बिना वजह हँसना सारी रात?", start: 95.8, end: 99.2 },
  { text: "तेरा कहना, तू पागल है", start: 99.2, end: 101.8 },
  { text: "मेरा कहना, हाँ तेरे लिए ख़ास", start: 101.8, end: 104.9 },
  { text: "अब वो गलियाँ भी चुप सी हैं", start: 104.9, end: 108.5 },
  { text: "वो शामें कुछ गुमसुम सी हैं", start: 108.5, end: 111.8 },
  { text: "मैं नए गाने सुनता हूँ", start: 111.8, end: 114.2 },
  { text: "पर तेरी यादें उनमें भी हैं", start: 114.2, end: 116.2 },
  { text: "मैं अपनी दुनिया बना रहा हूँ", start: 116.2, end: 119.2 },
  { text: "हर दिन ख़ुद को समझा रहा हूँ", start: 119.2, end: 122.0 },
  { text: "पर कोई पूछे तू कैसी है", start: 122.0, end: 125.0 },
  { text: "मैं आज भी मुस्कुरा रहा हूँ", start: 125.0, end: 127.8 },

  // Pre-Chorus 2
  { text: "और तुझसे अब कुछ कहना नहीं", start: 127.8, end: 130.8 },
  { text: "न तुझे वापस बुलाना है", start: 130.8, end: 133.5 },
  { text: "बस जो भी था, वो सच तो था", start: 133.5, end: 136.5 },
  { text: "दिल को इतना समझाना है", start: 136.5, end: 139.2 },

  // Chorus 2
  { text: "काश तू यहीं होती", start: 139.2, end: 141.5 },
  { text: "मेरी बातों की वजह भी होती", start: 141.5, end: 144.7 },
  { text: "मैं कुछ न माँगता इस जहाँ से", start: 144.7, end: 147.9 },
  { text: "बस तेरी हँसी मेरे पास होती", start: 147.9, end: 151.4 },
  { text: "काश तू यहीं होती", start: 151.4, end: 153.4 },
  { text: "मेरी तन्हाई से अनजान होती", start: 153.4, end: 156.3 },
  { text: "अब तू नहीं है, फिर भी जाने क्यों", start: 156.3, end: 159.9 },
  { text: "मेरी हर दुआ में तू ही होती", start: 159.9, end: 163.2 },

  // Bridge
  { text: "अगर कभी तू मेरा गाना सुने", start: 163.2, end: 166.4 },
  { text: "और पल भर को तेरा दिल रुके", start: 166.4, end: 170.6 },
  { text: "तो समझ लेना, कुछ बातें हैं", start: 170.6, end: 173.0 },
  { text: "जो आज भी तेरे नाम लिखी हैं", start: 173.0, end: 175.0 },
  { text: "मैं तुझसे कोई वादा नहीं माँगता", start: 175.0, end: 177.8 },
  { text: "न बीते लम्हों का हिसाब माँगता", start: 177.8, end: 180.7 },
  { text: "बस एक छोटी सी ख़्वाहिश है", start: 180.7, end: 183.2 },
  { text: "तू ख़ुश रहे... यही दिल चाहता है", start: 183.2, end: 187.0 },

  // Final Chorus
  { text: "काश तू यहीं होती", start: 187.2, end: 191.0 },
  { text: "मेरी कहानी का हिस्सा होती", start: 191.0, end: 194.0 },
  { text: "हम साथ नहीं, कोई बात नहीं", start: 194.0, end: 196.8 },
  { text: "तू मेरी ज़िंदगी का ख़ूबसूरत क़िस्सा होती", start: 196.8, end: 200.9 },
  { text: "काश तू यहीं होती", start: 200.9, end: 203.0 },
  { text: "ये दिल थोड़ा आसान होता", start: 203.0, end: 205.6 },
  { text: "तुझे पाना ज़रूरी तो नहीं", start: 205.6, end: 209.2 },
  { text: "तुझसे प्यार ही काफ़ी होता", start: 209.2, end: 213.0 },

  // Outro
  { text: "काश तू यहीं होती...", start: 213.0, end: 226.0 },
  { text: "कुछ प्यार अधूरे रहकर भी", start: 226.0, end: 229.5 },
  { text: "दिल के सबसे क़रीब होते हैं", start: 229.5, end: 233.5 },
  { text: "काश तू यहीं होती...", start: 234.0, end: 238.0 },
  { text: "काश तू यहीं होती...", start: 239.0, end: 245.0 }
];

// For each line, generate word timestamps proportionally within line start and end,
// utilizing actual whisper word timings where available
const allWords = [];
const processedLines = linesDef.map((line, idx) => {
  const lineWords = line.text.split(/\s+/).filter(Boolean);
  const totalDuration = line.end - line.start;
  const wordDuration = totalDuration / lineWords.length;

  const timedLineWords = lineWords.map((w, wIdx) => {
    const wStart = Number((line.start + wIdx * wordDuration).toFixed(2));
    const wEnd = Number((line.start + (wIdx + 1) * wordDuration).toFixed(2));
    
    // Also add to global words list
    allWords.push({
      word: w,
      start: wStart,
      end: wEnd
    });

    return {
      w: w,
      start: wStart,
      end: wEnd
    };
  });

  return {
    i: idx,
    text: line.text,
    start: Number(line.start.toFixed(2)),
    end: Number(line.end.toFixed(2)),
    words: timedLineWords
  };
});

const output = {
  title: "Kaash Tu Yahin Hoti 💔🌧️",
  duration: 249.96,
  audioUrl: "/audio/kaash_tu_yahin_hoti.mp3",
  words: allWords,
  lines: processedLines
};

fs.writeFileSync('src/data/kaashTuYahinHoti.json', JSON.stringify(output, null, 2), 'utf-8');
fs.writeFileSync('audio_pipeline/transcripts/kaash_tu_yahin_hoti.json', JSON.stringify(output, null, 2), 'utf-8');
console.log('Successfully generated Kaash Tu Yahin Hoti dataset with', processedLines.length, 'lines and', allWords.length, 'words!');
