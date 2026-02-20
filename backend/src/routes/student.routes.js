import express from "express";
import multer from "multer";
import path from "path";
import { 
  getStudentDashboard, 
  getStudentStats, 
  getStudentProfile,
  submitAssignment,
  getStudentNotices, // Don't forget this if you haven't added it
  // --- NEW QUIZ IMPORTS ---
  getAvailableQuizzes,
  getQuizForStudent,
  submitQuiz,
  getQuizResult
} from "../controllers/student.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

// --- MULTER CONFIG (Keep existing) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/jpg',
    'audio/wav', 'audio/mpeg', 'audio/m4a'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({ storage, fileFilter });

// --- MIDDLEWARE ---
const studentCheck = (req, res, next) => {
    if (req.user.role !== 'parent' && req.user.role !== 'student') {
        return res.status(403).json({ message: "Access denied: Students only" });
    }
    next();
};

// --- CORE ROUTES ---
router.get("/dashboard", auth, studentCheck, getStudentDashboard);
router.get("/stats", auth, studentCheck, getStudentStats);
router.get("/profile", auth, studentCheck, getStudentProfile);
router.get("/notices", auth, studentCheck, getStudentNotices);

// --- ASSIGNMENT SUBMISSION ---
router.post("/submit", auth, studentCheck, upload.single('file'), submitAssignment);

// --- NEW QUIZ ROUTES ---
router.get("/quizzes", auth, studentCheck, getAvailableQuizzes); // List of quizzes
router.get("/quiz/:id", auth, studentCheck, getQuizForStudent); // Start specific quiz
router.post("/quiz/submit", auth, studentCheck, submitQuiz); // Submit answers
router.get("/quiz/:quizId/result", auth, studentCheck, getQuizResult);

export default router;