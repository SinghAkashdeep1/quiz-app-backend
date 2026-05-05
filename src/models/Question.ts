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
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  weightage: { type: Number, default: 10 },
  timeLimit: { type: Number, default: 30 }, // in seconds
  translations: {
    type: Map,
    of: new mongoose.Schema({
      text: { type: String, required: true },
      options: [{ type: String, required: true }]
    }, { _id: false })
  }
}, { timestamps: true });

export default mongoose.model('Question', QuestionSchema);
