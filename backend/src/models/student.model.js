// backend/src/models/student.model.js
import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
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
    minlength: 10,
    maxlength: 10
  },
  rollNo: { 
    type: String, 
    required: true, 
    // unique: true 
  },
  className: { 
    type: String, 
    required: true 
  },
  role: {
    type: String,
    default: 'parent' 
  },
  profilePic: {
    type: String,
    default: null
  },
  stats: {
    // attendance: { type: Number, default: 0 },
    avgScore: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default mongoose.model('Student', StudentSchema);