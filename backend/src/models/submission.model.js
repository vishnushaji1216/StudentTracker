import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
  // 1. LINKING (The "Or" Logic)
  assignment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Assignment', 
    required: false 
  },
  
  quiz: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quiz', 
    required: false 
  },

  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },

  type: {
    type: String,
    enum: ['quiz', 'homework', 'handwriting', 'audio', 'exam'], 
    default: 'homework'
  },

  obtainedMarks: { type: Number, default: 0 },
  totalMarks: { type: Number, required: true, default: 5 },

  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'submitted', 'graded', 'late', 'Graded'], 
    default: 'pending' 
  },

  fileUrl: { type: String },
  feedback: { type: String },
  
  quizResponses: [
    {
      questionIndex: { type: Number },
      selectedOption: { type: mongoose.Schema.Types.Mixed },
      isCorrect: { type: Boolean }
    }
  ],

  attemptStartedAt: { type: Date },
  attemptEndedAt: { type: Date },
  submittedAt: { type: Date, default: Date.now }

}, { timestamps: true });

export default mongoose.model('Submission', SubmissionSchema);