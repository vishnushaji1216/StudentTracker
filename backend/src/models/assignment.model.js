import mongoose from 'mongoose';

const AssignmentSchema = new mongoose.Schema({
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Teacher', 
    required: true 
  },
  className: { 
    type: String, 
    required: true 
  }, 
  subject: { 
    type: String, 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  type: { 
    type: String, 
    enum: ['homework', 'audio', 'quiz'], 
    default: 'homework' 
  },
  
  // --- NEW FIELDS FOR RANGE ASSIGNMENT ---
  targetType: {
    type: String,
    enum: ['all', 'range'],
    default: 'all'
  },
  rollRange: {
    start: { type: Number }, // e.g., 1
    end: { type: Number }    // e.g., 15
  },

  dueDate: { 
    type: Date 
  },
  totalMarks: { 
    type: Number, 
    default: 100 
  }
}, { timestamps: true });

export default mongoose.model('Assignment', AssignmentSchema);