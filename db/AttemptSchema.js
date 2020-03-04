const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const AttemptSchema = new Schema({
  owner: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  repo: {
    type: String,
    required: true
  },
  email: {
    type: String
  }
}, {
  timestamps: true
});

AttemptSchema.index({email: 1, repo: 1});
module.exports = mongoose.model('Attempt', AttemptSchema);