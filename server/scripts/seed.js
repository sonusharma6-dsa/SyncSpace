require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User.model');
const Note = require('../models/Note.model');
const Tag = require('../models/Tag.model');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/notemesh';

const seedNotes = [
  {
    title: 'Welcome to NoteMesh',
    content: '# Welcome to NoteMesh\n\nCapture ideas fast, search everything, and keep your notes in one calm place.\n\n- Press **N** to create a note\n- Press **Ctrl/Cmd + K** to open the command palette\n- Use tags like `writing`, `research`, and `ideas` to stay organized',
    tags: ['welcome', 'getting-started'],
    isPinned: true,
  },
  {
    title: 'Daily writing checklist',
    content: '## Draft ritual\n\n- [ ] Collect rough ideas\n- [ ] Pull three sources\n- [ ] Draft the first paragraph\n- [ ] Tighten the headline\n\n> Keep momentum high by staying in edit mode until the draft exists.',
    tags: ['writing', 'checklist'],
  },
  {
    title: 'Research snippets',
    content: '### PKM notes\n\nPersonal knowledge tools work best when capture is frictionless and retrieval is instant.\n\n```js\nconst note = {\n  title: "Idea",\n  tags: ["pkm", "research"]\n};\n```',
    tags: ['research', 'pkm'],
  },
  {
    title: 'Archive me later',
    content: 'A note you can archive to test the lifecycle.',
    tags: ['demo'],
    isArchived: true,
  },
];

const colorForTag = (name) => {
  const palette = ['#7c6cf2', '#3b82f6', '#14b8a6', '#f97316', '#ef4444', '#f59e0b'];
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
};

(async () => {
  try {
    await mongoose.connect(mongoUri);

    const email = (process.env.DEMO_USER_EMAIL || 'demo@notemesh.local').toLowerCase().trim();
    const password = process.env.DEMO_USER_PASSWORD || 'demopass123';
    const name = process.env.DEMO_USER_NAME || 'Demo User';

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, password });
    }

    await Note.deleteMany({ user: user._id });
    await Tag.deleteMany({ user: user._id });

    const created = await Note.insertMany(seedNotes.map((note) => ({
      user: user._id,
      slug: note.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      excerpt: note.content.replace(/[#>*`\-\[\]]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180),
      lastEditedAt: new Date(),
      ...note,
    })));

    const tagCounts = new Map();
    created.forEach((note) => {
      (note.tags || []).forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1));
    });

    if (tagCounts.size) {
      await Tag.insertMany(Array.from(tagCounts.entries()).map(([tag, noteCount]) => ({
        user: user._id,
        name: tag,
        noteCount,
        color: colorForTag(tag),
      })));
    }

    console.log(`Seeded ${created.length} notes for ${email}`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
