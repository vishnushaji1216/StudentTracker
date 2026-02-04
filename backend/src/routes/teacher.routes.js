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
  getDirectory, 
  getClassDetail,
  updateClassStatus,
  createQuiz,
  getQuizDashboard,
  getQuizDetail,
  updateQuiz,
  submitGradebook, 
  getTeacherSubjects,
  getTeacherDashboardStats,
  getStudentReport,
  getClassSubjects
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
router.get("/class-subjects", protect, restrictTo("teacher"), getClassSubjects);

/* =====================================================
   STUDENT DATA
===================================================== */

router.get("/students", auth, teacherCheck, getDirectory); 
router.get("/student/:studentId/report", auth, teacherCheck, getStudentReport);

/* =====================================================
   SHARED DATA 
===================================================== */

router.get("/my-subjects", auth, teacherCheck, getTeacherSubjects); 
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