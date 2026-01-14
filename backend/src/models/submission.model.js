import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
  // 1. MAKE ASSIGNMENT OPTIONAL
  assignment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Assignment', 
    required: false  // <--- CRITICAL FIX: Must be false
  },

  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  
  // 2. Add Teacher so we know who reviewed it
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },

  // 3. Add 'Handwriting' to types
  type: {
    type: String,
    enum: ['Quiz', 'Homework', 'Handwriting', 'Audio'], 
    default: 'Homework'
  },

  fileUrl: { type: String }, // For the Supabase image URL
  contentUrl: { type: String }, // Backward compatibility
  
  feedback: { type: String },
  tags: [String], // For ["Neat Work"] tags

  quizResponses: [
    {
      questionIndex: { type: Number },
      selectedOption: { type: Number },
      isCorrect: { type: Boolean }
    }
  ],

  // 4. ADD 'Graded' TO ENUM
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'submitted', 'graded', 'late', 'Graded'], // <--- CRITICAL FIX
    default: 'pending' 
  },

  attemptStartedAt: { type: Date },
  attemptEndedAt: { type: Date },

  obtainedMarks: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 5 }, // Context for 5-star rating
  submittedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Submission', SubmissionSchema);