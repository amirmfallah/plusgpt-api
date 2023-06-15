const mongoose = require("mongoose");

const fileSchema = mongoose.Schema({
  key: {
    type: String,
    required: true,
  },
  conversationId: {
    type: String,
    required: false,
  },
  processed: {
    type: Boolean,
    required: true,
  },
  error: {
    type: Boolean,
    required: true,
    default: false,
  },
  chunks: {
    type: Object,
  },
  chars: {
    type: Number,
  },
});

const File = mongoose.models.File || mongoose.model("File", fileSchema);

module.exports = {
  newFile: async (file) => {
    return await File.create(file);
  },
  updateFile: async (filter, revision) => {
    return await File.findOneAndUpdate(filter, revision);
  },
  getFile: async (filter) => {
    return await File.findOne(filter);
  },
  File,
};
