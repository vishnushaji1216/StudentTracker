import mongoose from 'mongoose';

const AssignmentSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  className: { type: String, required: true },
  subject: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },

  type: { 
    type: String, 
    // Added 'exam' for Gradebook entries
    enum: ['homework', 'audio', 'quiz', 'exam'], 
    default: 'homework' 
  },

  // Only used if type === 'quiz' (Links to question bank)
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },

  status: { 
    type: String, 
    enum: ['Draft', 'Scheduled', 'Active', 'Completed'], 
    default: 'Draft' 
  },

  scheduledAt: { type: Date },

  // --- CONDITIONAL VALIDATION (The Fix) ---
  duration: { 
    type: Number, 
    required: function() { return this.type === 'quiz'; } 
  },
  passingScore: { 
    type: Number, 
    required: function() { return this.type === 'quiz'; } 
  },

  targetType: { 
    type: String, 
    enum: ['all', 'range'], 
    default: 'all', 
    required: function () {
      return this.type === 'audio';
    } 
  },
  
  rollRange: {
    start: { 
        type: Number,
        required: function() { return this.targetType === 'range'; }
    },
    end: { 
        type: Number,
        required: function() { return this.targetType === 'range'; }
    }
  },

  isOffline: { 
    type: Boolean, 
    default: false 
  },

  dueDate: { type: Date },
  totalMarks: { type: Number, default: 10 }

}, { timestamps: true });

export default mongoose.model('Assignment', AssignmentSchema);