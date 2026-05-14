const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, trim: true, default: 'Untitled note' },
    slug: { type: String, trim: true, index: true },
    content: { type: String, default: '' },
    excerpt: { type: String, default: '' },
    tags: [{ type: String, trim: true, lowercase: true }],
    isPinned: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    isFavorite: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    lastEditedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

noteSchema.index({ user: 1, isDeleted: 1, isArchived: 1, isPinned: -1, updatedAt: -1 });
noteSchema.index({ user: 1, tags: 1 });
noteSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('Note', noteSchema);
