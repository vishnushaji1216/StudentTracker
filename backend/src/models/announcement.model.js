import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  sender: { 
    role: { type: String, required: true }, 
    id: { type: String, required: true },   
    name: { type: String }                  
  },
  targetAudience: { 
    type: String, 
    enum: ['Everyone', 'Teachers', 'Parents', 'Class'], 
    required: true 
  },
  targetClass: { 
    type: String, 
    default: null 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  isUrgent: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: {
    type: Date, 
    required: true, 
    index: { expires: 0 }
  }}, { timestamps: true }
);

export default mongoose.model('Announcement', AnnouncementSchema);