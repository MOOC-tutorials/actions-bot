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
  }
});

module.exports = mongoose.model('Attempt', AttemptSchema);