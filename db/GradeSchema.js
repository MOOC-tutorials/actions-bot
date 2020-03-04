const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const GradeSchema = new Schema({
  examenId:{
    type:String,
    required: true
  },
  owner: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  serviceUrl: {
    type: String,
    required: true
  },
  sourceId: {
    type: String,
    required:true
  },
  activity:{
    type: String,
    required:true
  },
  repo:{
    type: String
  },
  grade:{
    type: Number
  }
}, {
  timestamps: true
});

GradeSchema.index({email: 1, examenId: 1});
module.exports = mongoose.model('Grade', GradeSchema);