// backend/src/models/syllabus.model.js
import mongoose from 'mongoose';

const ChapterSchema = new mongoose.Schema({
  chapterNo: { type: Number, required: true },
  title: { type: String, required: true },
  
  // Status Flags requested
  notesStatus: { 
    type: String, 
    enum: ['Pending', 'Done'], 
    default: 'Pending' 
  },
  quizStatus: { 
    type: String, 
    enum: ['Pending', 'Done'], 
    default: 'Pending' 
  },
  isCompleted: { 
    type: Boolean, 
    default: false 
  },
  
  // To identify the active topic on the Dashboard
  isCurrent: { type: Boolean, default: false }
});

const SyllabusSchema = new mongoose.Schema({
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
  chapters: [ChapterSchema]
}, { timestamps: true });

export default mongoose.model('Syllabus', SyllabusSchema);