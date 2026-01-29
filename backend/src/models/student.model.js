// backend/src/models/student.model.js
import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  // Added GR Number section
  grNumber: { 
    type: String, 
    required: true, 
    unique: true // Recommended to ensure each student has a unique General Register number
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
    required: false, 
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
  // Link to Fee Schema: This allows you to store and populate fee details
  fees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fee'
  }],
  stats: {
    avgScore: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default mongoose.model('Student', StudentSchema);