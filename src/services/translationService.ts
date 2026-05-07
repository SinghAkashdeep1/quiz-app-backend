import translate from '@iamtraction/google-translate';

// ─── In-memory cache: "text|lang" → translatedText ───────────────────────────
const translationCache = new Map<string, string>();

function cacheKey(text: string, to: string) {
  return `${to}|${text}`;
}

// ─── Rate limiter: ensure at least `minGap` ms between requests ───────────────
let lastRequestAt = 0;
const MIN_GAP_MS = 300; // be polite to Google's free endpoint

async function waitForSlot() {
  const now = Date.now();
  const wait = MIN_GAP_MS - (now - lastRequestAt);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

// ─── Core single-text translator with retry ───────────────────────────────────
async function translateOne(text: string, to: string, from = 'en', retries = 3): Promise<string> {
  if (!text || !text.trim()) return text;

  const key = cacheKey(text, to);
  if (translationCache.has(key)) return translationCache.get(key)!;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await waitForSlot();
      const res = await translate(text, { from, to });
      const translated = res.text;
      if (translated) {
        translationCache.set(key, translated);
        return translated;
      }
    } catch (err: any) {
      const isRateLimit = err?.message?.includes('429') || err?.message?.includes('Too Many');
      const backoff = isRateLimit ? 3000 * (attempt + 1) : 500;

      if (attempt < retries - 1) {
        console.warn(`[TranslationService] Retry ${attempt + 1} for "${text.slice(0, 40)}" → ${err.message}`);
        await new Promise(r => setTimeout(r, backoff));
      } else {
        console.error(`[TranslationService] Failed after ${retries} attempts: ${err.message}`);
      }
    }
  }

  // Fallback: return original text
  return text;
}

// ─── Public API ───────────────────────────────────────────────────────────────

class TranslationService {
  /**
   * Translate a single string.
   * Returns the original text if lang is 'en' or translation fails.
   */
  async translateText(text: string, to: string, from = 'en'): Promise<string> {
    if (!text || !to || to === 'en') return text;
    return translateOne(text, to, from);
  }

  /**
   * Translate an array of strings serially (to respect rate limits).
   * Returns the original array if lang is 'en'.
   */
  async translateBatch(texts: string[], to: string, from = 'en'): Promise<string[]> {
    if (!texts || texts.length === 0 || !to || to === 'en') return texts;

    const results: string[] = [];
    for (const text of texts) {
      const translated = await translateOne(text, to, from);
      results.push(translated);
    }
    return results;
  }

  /**
   * Translate a full question object (text + options + matchingPairs).
   */
  async translateQuestion(question: any, targetLang: string): Promise<any> {
    if (!targetLang || targetLang === 'en') return question;

    try {
      const allTexts: string[] = [question.text, ...(question.options || [])];

      // Track where matching pair texts start
      const pairStartIdx = allTexts.length;
      if (question.matchingPairs && Array.isArray(question.matchingPairs)) {
        for (const pair of question.matchingPairs) {
          allTexts.push(pair.left);
          allTexts.push(pair.right);
        }
      }

      const translated = await this.translateBatch(allTexts, targetLang);

      const translatedQuestion = {
        ...question,
        text: translated[0],
        options: translated.slice(1, 1 + (question.options?.length || 0)),
      };

      if (question.matchingPairs && Array.isArray(question.matchingPairs)) {
        translatedQuestion.matchingPairs = question.matchingPairs.map((_: any, i: number) => ({
          left: translated[pairStartIdx + i * 2],
          right: translated[pairStartIdx + i * 2 + 1],
        }));
      }

      return translatedQuestion;
    } catch (err) {
      console.error('[TranslationService] translateQuestion error:', err);
      return question;
    }
  }
}

export default new TranslationService();
