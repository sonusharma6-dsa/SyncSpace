const mongoose = require('mongoose');

const shareLinkSchema = new mongoose.Schema(
  {
    note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true, unique: true },
    token: { type: String, required: true, unique: true, index: true },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShareLink', shareLinkSchema);
