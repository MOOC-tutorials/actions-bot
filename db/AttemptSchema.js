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
    type: String,
    required: true
  }
}, {
  timestamps: true
});

AttemptSchema.index({title:1, email: 1, repo: 1});
module.exports = mongoose.model('Attempt', AttemptSchema);