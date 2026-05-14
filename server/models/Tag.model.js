const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, lowercase: true },
    color: { type: String, default: '#7c6cf2' },
    noteCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

tagSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Tag', tagSchema);
