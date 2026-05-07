import { translate } from '@vitalets/google-translate-api';

async function test() {
  const texts = ['General Knowledge', 'Science', 'Mathematics'];
  const taggedTexts = texts.map((t, idx) => `[[${idx}]] ${t}`);
  const content = taggedTexts.join('\n');
  const to = 'hi';

  try {
    console.log('Sending to Google Translate:', content);
    const res = await translate(content, { to });
    console.log('Response:', res.text);
    
    const results = new Array(texts.length).fill('');
    texts.forEach((_, idx) => {
      const regex = new RegExp(`\\[{1,2}${idx}\\]{1,2}\\s*(.*?)(?=\\s*\\[{1,2}\\d+\\]{1,2}|$)`, 's');
      const match = res.text.match(regex);
      if (match) {
        console.log(`Match ${idx}:`, match[1]);
        results[idx] = match[1].trim();
      } else {
        console.log(`Match ${idx} failed`);
      }
    });
    console.log('Final Results:', results);
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test();
