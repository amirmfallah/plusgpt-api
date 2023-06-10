const mongoose = require("mongoose");

const fileSchema = mongoose.Schema({
  key: {
    type: String,
    required: true,
  },
  processed: {
    type: String,
    required: true,
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
  File,
};
