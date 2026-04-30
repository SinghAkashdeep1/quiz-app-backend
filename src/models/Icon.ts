import mongoose from 'mongoose';

const IconSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  label: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('Icon', IconSchema);
