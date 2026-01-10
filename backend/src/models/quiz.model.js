import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  marks: { type: Number, default: 1 }
});

const QuizSchema = new mongoose.Schema({
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Teacher', 
    required: true 
  },
  title: { type: String, required: true },
  questions: [QuestionSchema],
  totalMarks: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Quiz', QuizSchema);
