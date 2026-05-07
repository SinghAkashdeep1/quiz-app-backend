import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  type: { type: String, enum: ['mcq', 'boolean', 'image', 'matching', 'multiple_correct'], default: 'mcq', required: true },
  text: { type: String },
  imageUrl: { type: String },
  options: [{ type: String }],
  optionImages: [{ type: String }],
  correctAnswerIndex: { type: Number },
  correctAnswerIndices: [{ type: Number }],
  matchingPairs: [{
    left: { type: String },
    right: { type: String }
  }],
  playCount: { type: Number, default: 0 },
  correctAnswerCount: { type: Number, default: 0 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  weightage: { type: Number, default: 10 },
  timeLimit: { type: Number, default: 30 }, // in seconds

  translations: {
    type: Map,
    of: {
      text: { type: String },
      options: [{ type: String }],
      matchingPairs: [{
        left: { type: String },
        right: { type: String }
      }]
    },
    default: {}
  },
  isAlternative: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date }

}, { timestamps: true });

export default mongoose.model('Question', QuestionSchema);
