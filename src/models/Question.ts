import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  type: { type: String, enum: ['mcq', 'boolean', 'image'], default: 'mcq', required: true },
  text: { type: String, required: true },
  imageUrl: { type: String },
  options: [{ type: String, required: true }],
  correctAnswerIndex: { type: Number, required: true },
  playCount: { type: Number, default: 0 },
  correctAnswerCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Question', QuestionSchema);
