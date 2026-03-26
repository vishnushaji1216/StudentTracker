import mongoose from 'mongoose';

const BehaviorLogSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Teacher', 
    required: true 
  },
  title: { 
    type: String, 
    required: true // e.g., "Excellent Participation", "Late for Class"
  },
  comment: { 
    type: String, 
    required: false 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5,
    default: 5
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

export default mongoose.model('BehaviorLog', BehaviorLogSchema);
