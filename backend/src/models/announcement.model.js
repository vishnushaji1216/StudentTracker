import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  sender: { 
    role: { type: String, required: true }, // 'admin' or 'teacher'
    id: { type: String, required: true },   // String to support 'admin_master' and ObjectIds
    name: { type: String }                  // Stores "Priya Sharma" for easy display
  },
  targetAudience: { 
    type: String, 
    enum: ['Everyone', 'Teachers', 'Parents', 'Class'], 
    required: true 
  },
  targetClass: { 
    type: String, 
    default: null // e.g., "9-A" (Used when targetAudience is 'Class')
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
  }
});

export default mongoose.model('Announcement', AnnouncementSchema);