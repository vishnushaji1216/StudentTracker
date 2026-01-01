import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
  assignment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Assignment', 
    required: true 
  },
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  contentUrl: { 
    type: String 
  }, // URL to image or audio file
  status: { 
    type: String, 
    enum: ['pending', 'submitted', 'graded', 'late'], 
    default: 'pending' 
  },
  obtainedMarks: { 
    type: Number, 
    default: 0 
  },
  feedback: { 
    type: String 
  },
  submittedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

export default mongoose.model('Submission', SubmissionSchema);