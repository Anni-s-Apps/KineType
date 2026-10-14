import fs from 'fs';
import path from 'path';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const AUDIO_PATH = path.resolve('public/audio/kaash_tu_yahin_hoti.mp3');

const LYRICS_PROMPT = `
पता नहीं क्यों आज फिर, तेरी याद आई है...
तेरी तस्वीर अब भी फ़ोन में है, तेरी बातें मेरी धुन में हैं, मैं हँसता हूँ सब ठीक लगे, पर कुछ कमी सी सुकून में है।
वो शाम जो तेरे साथ कटी, वो बातें जो आधी रह गईं, मैं आज भी वहीं ठहरा हूँ, जहाँ से तेरी राह बदल गई।
और तुझसे अब कुछ कहना नहीं, पर दिल को भी समझाऊँ कैसे? तू पास नहीं, ये सच तो है, पर तुझको भुलाऊँ कैसे?
काश तू यहीं होती, मेरी बाँहों में नहीं तो नज़रों में होती, मैं कुछ न कहता, तू कुछ न कहती, बस थोड़ी सी रात और बाकी होती।
काश तू यहीं होती, मेरी हर ख़ुशी में शामिल होती, अब तू नहीं है, फिर भी जाने क्यों, मेरी हर दुआ में तू ही होती।
तुझे याद है वो छोटी सी बात? बिना वजह हँसना सारी रात? तेरा कहना, "तू पागल है," मेरा कहना, "हाँ, तेरे लिए ख़ास।"
अब वो गलियाँ भी चुप सी हैं, वो शामें कुछ गुमसुम सी हैं, मैं नए गाने सुनता हूँ, पर तेरी यादें उनमें भी हैं।
मैं अपनी दुनिया बना रहा हूँ, हर दिन ख़ुद को समझा रहा हूँ, पर कोई पूछे तू कैसी है, मैं आज भी मुस्कुरा रहा हूँ।
और तुझसे अब कुछ कहना नहीं, न तुझे वापस बुलाना है, बस जो भी था, वो सच तो था, दिल को इतना समझाना है।
काश तू यहीं होती, मेरी बातों की वजह भी होती, मैं कुछ न माँगता इस जहाँ से, बस तेरी हँसी मेरे पास होती।
काश तू यहीं होती, मेरी तन्हाई से अनजान होती, अब तू नहीं है, फिर भी जाने क्यों, मेरी हर दुआ में तू ही होती।
अगर कभी तू मेरा गाना सुने, और पल भर को तेरा दिल रुके, तो समझ लेना, कुछ बातें हैं, जो आज भी तेरे नाम लिखी हैं।
मैं तुझसे कोई वादा नहीं माँगता, न बीते लम्हों का हिसाब माँगता, बस एक छोटी सी ख़्वाहिश है, तू ख़ुश रहे... यही दिल चाहता है।
काश तू यहीं होती, मेरी कहानी का हिस्सा होती, हम साथ नहीं, कोई बात नहीं, तू मेरी ज़िंदगी का ख़ूबसूरत क़िस्सा होती।
काश तू यहीं होती, ये दिल थोड़ा आसान होता, तुझे पाना ज़रूरी तो नहीं, तुझसे प्यार ही काफ़ी होता।
काश तू यहीं होती... कुछ प्यार अधूरे रहकर भी, दिल के सबसे क़रीब होते हैं।
काश तू यहीं होती... काश तू यहीं होती...
`.trim();

async function transcribeWithPrompt() {
  console.log('Sending transcription with lyrics prompt to Groq...');
  const audioBuffer = fs.readFileSync(AUDIO_PATH);
  const blob = new Blob([audioBuffer], { type: 'audio/mp3' });

  const formData = new FormData();
  formData.append('file', blob, 'kaash_tu_yahin_hoti.mp3');
  formData.append('model', 'whisper-large-v3');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'word');
  formData.append('timestamp_granularities[]', 'segment');
  formData.append('language', 'hi');
  formData.append('prompt', LYRICS_PROMPT);

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: formData
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Groq API Error:', res.status, errText);
    process.exit(1);
  }

  const data = await res.json();
  console.log('Groq Transcription with Prompt Success!');
  console.log('Detected duration:', data.duration);
  console.log('Segments count:', data.segments?.length);
  console.log('Words count:', data.words?.length);

  fs.writeFileSync('audio_pipeline/transcripts/prompted_kaash_tu_yahin_hoti.json', JSON.stringify(data, null, 2), 'utf-8');
  console.log('Saved to audio_pipeline/transcripts/prompted_kaash_tu_yahin_hoti.json');
}

transcribeWithPrompt().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
