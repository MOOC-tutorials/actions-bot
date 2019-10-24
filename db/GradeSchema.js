const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const GradeSchema = new Schema({
  owner: {
    type: String,
    required: true
  },
  repo: {
    type: String,
    required: true
  },
  grade: {
    type: Number,
    required:true
  }
});

module.exports = mongoose.model('Grade', GradeSchema);