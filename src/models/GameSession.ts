import mongoose from 'mongoose';

const GameSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  score: { type: Number, default: 0 },
  questionsAttempted: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 }, // Total time in seconds
  isGuest: { type: Boolean, default: false },
  playedAt: { type: Date, default: Date.now },
}, { timestamps: true });

GameSessionSchema.pre('save', function() {
  if (this.questionsAttempted > 0) {
    this.accuracy = (this.correctAnswers / this.questionsAttempted) * 100;
  }
});

export default mongoose.model('GameSession', GameSessionSchema);
