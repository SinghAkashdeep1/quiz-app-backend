import mongoose from 'mongoose';

const TranslationSchema = new mongoose.Schema({
  key: { type: String, required: true }, // The English string or a key
  lang: { type: String, required: true }, // The target language code
  text: { type: String, required: true }, // The translated text
}, { timestamps: true });

// Compound index to quickly find a translation for a specific string in a specific language
TranslationSchema.index({ key: 1, lang: 1 }, { unique: true });

export default mongoose.model('Translation', TranslationSchema);
