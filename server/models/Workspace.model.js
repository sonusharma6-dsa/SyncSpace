const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  inviteCode: { type: String, required: true, unique: true, minlength: 6, maxlength: 6 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'editor' },
  }],
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Workspace', workspaceSchema);
