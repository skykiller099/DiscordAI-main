const mongoose = require('mongoose');

const geminiSchema = new mongoose.Schema({
  GuildId: {
    type: String,
    required: true,
    unique: true,
  },
  ChannelIds: { 
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model('GeminiConfig', geminiSchema);