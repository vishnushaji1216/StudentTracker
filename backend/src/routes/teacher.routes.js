import express from "express";
import {
  getMyClasses,
  getTeacherProfile,
  createAssignment,
  getAssignments,
  deleteAssignment,
  postNotice,
  getNotices,
  deleteNotice,
  getDirectory, // <--- Unified function for Directory AND Gradebook
  getClassDetail,
  updateClassStatus,
  createQuiz,
  getQuizDashboard,
  getQuizDetail,
  updateQuiz,
  submitGradebook, 
  getTeacherSubjects,
  getTeacherDashboardStats
} from "../controllers/teacher.controller.js";
import { 
   logHandwritingReview, 
   getHandwritingQueue,
   deleteHandwritingReview,
   getAudioQueue,
   logAudioReview,
} from "../controllers/submission.controller.js";
import auth from "../middleware/auth.middleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const teacherCheck = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: "Access denied: Teachers only" });
  }
  next();
};

/* =====================================================
   PROFILE & DASHBOARD
===================================================== */
router.get('/profile', auth, teacherCheck, getTeacherProfile);
router.get("/dashboard-stats", auth, teacherCheck, getTeacherDashboardStats);

/* =====================================================
   CLASS MANAGEMENT
===================================================== */
router.get("/classes", auth, teacherCheck, getMyClasses);
router.get("/classes/:classId/:subject", auth, teacherCheck, getClassDetail);
router.put("/classes/:classId/:subject/status", auth, teacherCheck, updateClassStatus);

/* =====================================================
   SHARED DATA (DIRECTORY & GRADEBOOK)
===================================================== */
// ✅ FIXED: Points to getDirectory. Handles both cases:
// 1. Directory Screen -> calls /students (Returns All)
// 2. Gradebook Screen -> calls /students?className=9-A (Returns 9-A only)
router.get("/students", auth, teacherCheck, getDirectory); 

// For Gradebook Subject Dropdown
router.get("/my-subjects", auth, teacherCheck, getTeacherSubjects); 

// Gradebook Submit
router.post("/gradebook/submit", auth, teacherCheck, submitGradebook);

/* =====================================================
   ASSIGNMENTS
===================================================== */
router.post("/assignments", auth, teacherCheck, createAssignment);
router.get("/assignments", auth, teacherCheck, getAssignments);
router.delete("/assignments/:id", auth, teacherCheck, deleteAssignment);

/* =====================================================
   QUIZZES
===================================================== */
router.get("/quizzes", auth, teacherCheck, getQuizDashboard);
router.post("/quizzes", auth, teacherCheck, createQuiz);
router.get("/quizzes/:id", auth, teacherCheck, getQuizDetail);
router.put("/quizzes/:id", auth, teacherCheck, updateQuiz);

/* =====================================================
   NOTICES
===================================================== */
router.post("/notices", auth, teacherCheck, postNotice);
router.get("/notices", auth, teacherCheck, getNotices);
router.delete("/notices/:id", auth, teacherCheck, deleteNotice);

/* =====================================================
   SUBMISSIONS (Reviewing Homework)
===================================================== */
router.post("/log/handwriting", auth, teacherCheck, upload.single("file"), logHandwritingReview);
router.get("/queue/handwriting", auth, teacherCheck, getHandwritingQueue);
router.delete("/log/handwriting/:submissionId", auth, teacherCheck, deleteHandwritingReview);
router.get("/queue/audio", auth, teacherCheck, getAudioQueue);
router.post("/log/audio", auth, teacherCheck, logAudioReview);

export default router;