import mongoose from 'mongoose';

const AssignmentSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  className: { type: String, required: true },
  subject: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },

  type: { 
    type: String, 
    enum: ['homework', 'audio', 'quiz'], 
    default: 'homework' 
  },

  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },

  status: { 
    type: String, 
    enum: ['Draft', 'Scheduled', 'Active', 'Completed'], 
    default: 'Draft' 
  },

  scheduledAt: { type: Date },
  duration: { type: Number, default: 30 },
  passingScore: { type: Number, default: 40 },

  targetType: { type: String, enum: ['all', 'range'], default: 'all' },
  rollRange: {
    start: { type: Number },
    end: { type: Number }
  },

  dueDate: { type: Date },
  totalMarks: { type: Number, default: 100 }
}, { timestamps: true });

export default mongoose.model('Assignment', AssignmentSchema);
