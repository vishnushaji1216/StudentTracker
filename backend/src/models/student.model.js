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
    unique: true 
  },
  profilePic: {
    type: String,
    default: null
  },
  className: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Student', StudentSchema);