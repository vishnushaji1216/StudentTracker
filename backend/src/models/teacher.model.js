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
  profilePic: {
    type: String,
    default: null
  },
  subject: { type: String } 
}, { timestamps: true });

export default mongoose.model('Teacher', TeacherSchema);