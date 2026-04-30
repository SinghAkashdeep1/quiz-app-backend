import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  icon: { type: String, required: true }, // URL or icon name
  color: { type: String, default: '#6200EE' }, // Hex color for the theme
}, { timestamps: true });

export default mongoose.model('Category', CategorySchema);
