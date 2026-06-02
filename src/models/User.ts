import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  role: { type: String, enum: ['guest', 'user', 'admin'], default: 'user' },
  guestId: { type: String, unique: true, sparse: true }, // For identifying guests (e.g. deviceId)
  
  // Gamification
  coins: { type: Number, default: 100 }, // Default coins for new users
  // Per-category hearts for guests
  categoryCredits: [{
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    hearts: { type: Number, default: 3 },
    lastRefillAt: { type: Date },
    refillsToday: { type: Number, default: 0 },
    lastRefillDate: { type: Date },
    progressIndex: { type: Number, default: 0 },
    heartsEmptyAt: { type: Date }
  }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  totalLevel: { type: Number, default: 1 }, // Global level based on correct answers
  // Analytics Summary
  totalGamesPlayed: { type: Number, default: 0 },
  totalQuestionsAttempted: { type: Number, default: 0 },
  totalCorrectAnswers: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  
  // Streak System
  streaks: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastPlayDate: { type: Date },
    lastLoginDate: { type: Date },
    history: [{ type: Date }], // Dates of activity
  },
  
  // Settings / Metadata
  conversionStatus: { type: String, enum: ['none', 'converted'], default: 'none' },
  convertedAt: { type: Date },
  
  // Progress Tracking
  categoryLevels: [{
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 }
  }],
  completedLevels: [{
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    score: { type: Number },
    stars: { type: Number }, // 1, 2, or 3 stars
    completedAt: { type: Date, default: Date.now }
  }],
  
  // Password Reset
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },

  // Onboarding
  onboarding: {
    type: Map,
    of: Boolean,
    default: {}
  },
}, { timestamps: true });

// Update accuracy before saving
UserSchema.pre('save', function() {
  if (this.totalQuestionsAttempted > 0) {
    this.accuracy = (this.totalCorrectAnswers / this.totalQuestionsAttempted) * 100;
  }
});

export default mongoose.model('User', UserSchema);
