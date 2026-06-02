import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  icon: { type: String, required: true }, // URL or icon name
  color: { type: String, default: '#6200EE' }, // Hex color for the theme
  isGuestAllowed: { type: Boolean, default: true },
  maxGuestAttempts: { type: Number, default: 3 },
  guestCreditLimit: { type: Number, default: 3 }, // Max incorrect answers per session
  guestAccess: {
    easy: { type: Boolean, default: true },
    medium: { type: Boolean, default: false },
    hard: { type: Boolean, default: false },
  },
  guestHeartsConfig: {
    maxHearts: { type: Number, default: 3 },
    refillCount: { type: Number, default: 3 },
    refillCooldownHours: { type: Number, default: 14 },
    dailyRefillLimit: { type: Number, default: 3 },
    rewards: {
      easy: { type: Number, default: 1 },
      medium: { type: Number, default: 2 },
      hard: { type: Number, default: 3 },
    }
  },
  rewards: {
    easy: { type: Number, default: 10 },
    medium: { type: Number, default: 20 },
    hard: { type: Number, default: 50 },
  },
  lifelines: {
    aiHints: {
      freePerLevel: { type: Number, default: 1 },
      coinCost: { type: Number, default: 10 }
    },
    fiftyFifty: {
      freePerLevel: { type: Number, default: 1 },
      coinCost: { type: Number, default: 10 }
    },
    changeQuestion: {
      freePerLevel: { type: Number, default: 1 },
      coinCost: { type: Number, default: 10 }
    },
    stopTimer: {
      freePerLevel: { type: Number, default: 1 },
      coinCost: { type: Number, default: 10 }
    }
  },
  translations: {
    type: Map,
    of: {
      name: { type: String }
    },
    default: {}
  },
  isArchived: { type: Boolean, default: false },
  archivedAt: { type: Date }
}, { timestamps: true });

CategorySchema.index({ name: 1 }, { unique: true });

export default mongoose.model('Category', CategorySchema);
