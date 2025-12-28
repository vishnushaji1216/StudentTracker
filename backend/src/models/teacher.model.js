// backend/src/models/teacher.model.js
import mongoose from 'mongoose';

const TeacherSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  mobile: { 
    type: String, 
    required: true, 
    unique: true,
    minlength: 10,
    maxlength: 10
  },
  teacherCode: { 
    type: String, 
    required: true, 
    unique: true 
  },
  role: {
    type: String,
    default: 'teacher'
  },
  classTeachership: { 
    type: String 
  },
  assignments: [{
    class: { type: String },
    subject: { type: String }
  }],
  profilePic: {
    type: String,
    default: null
  }
}, { timestamps: true });

export default mongoose.model('Teacher', TeacherSchema);