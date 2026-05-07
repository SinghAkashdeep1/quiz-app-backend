const translate = require('@iamtraction/google-translate');
async function test() {
  try {
    const r1 = await translate('Science', { from: 'en', to: 'hi' });
    console.log('Hindi Science:', r1.text);
    const r2 = await translate('What is the capital of France?', { from: 'en', to: 'hi' });
    console.log('Hindi question:', r2.text);
    const r3 = await translate('Mathematics', { from: 'en', to: 'es' });
    console.log('Spanish Mathematics:', r3.text);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
