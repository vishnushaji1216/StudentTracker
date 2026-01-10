import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },

  contentUrl: { type: String },
  feedback: { type: String },

  quizResponses: [
    {
      questionIndex: { type: Number, required: true },
      selectedOption: { type: Number, required: true },
      isCorrect: { type: Boolean }
    }
  ],

  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'submitted', 'graded', 'late'], 
    default: 'pending' 
  },

  attemptStartedAt: { type: Date },
  attemptEndedAt: { type: Date },

  obtainedMarks: { type: Number, default: 0 },
  submittedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Submission', SubmissionSchema);
