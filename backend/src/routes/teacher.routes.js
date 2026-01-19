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
  // --- NEW IMPORTS ---
  submitGradebook, // <--- Import this
  getTeacherStudents, // You need this for loadInitialData
  getTeacherSubjects  // You need this for loadInitialData
} from "../controllers/teacher.controller.js";
import { 
   logHandwritingReview, 
   getHandwritingQueue,
   deleteHandwritingReview,
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
   PROFILE ROUTES
===================================================== */
router.get('/profile', auth, teacherCheck, getTeacherProfile);

/* =====================================================
   CLASS & DROPDOWN DATA ROUTES
===================================================== */
router.get("/classes", auth, teacherCheck, getMyClasses);
router.get("/classes/:classId/:subject", auth, teacherCheck, getClassDetail);
router.put("/classes/:classId/:subject/status", auth, teacherCheck, updateClassStatus);

// --- NEW ROUTES FOR GRADEBOOK DROPDOWNS ---
router.get("/students", auth, teacherCheck, getTeacherStudents); // For the student list
router.get("/my-subjects", auth, teacherCheck, getTeacherSubjects); // For the subject dropdown

/* =====================================================
   GRADEBOOK ROUTE (THE SUBMIT BUTTON)
===================================================== */
router.post("/gradebook/submit", auth, teacherCheck, submitGradebook); 

/* =====================================================
   ASSIGNMENT ROUTES
===================================================== */
router.post("/assignments", auth, teacherCheck, createAssignment);
router.get("/assignments", auth, teacherCheck, getAssignments);
router.delete("/assignments/:id", auth, teacherCheck, deleteAssignment);

/* =====================================================
   QUIZ ROUTES
===================================================== */
router.get("/quizzes", auth, teacherCheck, getQuizDashboard);
router.post("/quizzes", auth, teacherCheck, createQuiz);
router.get("/quizzes/:id", auth, teacherCheck, getQuizDetail);
router.put("/quizzes/:id", auth, teacherCheck, updateQuiz);

/* =====================================================
   NOTICE ROUTES
===================================================== */
router.post("/notices", auth, teacherCheck, postNotice);
router.get("/notices", auth, teacherCheck, getNotices);
router.delete("/notices/:id", auth, teacherCheck, deleteNotice);

/* =====================================================
   STUDENT DIRECTORY ROUTES
===================================================== */
router.get("/students/directory", auth, teacherCheck, getDirectory); 
// Note: Changed path slightly to avoid conflict with dropdown /students route above, 
// or you can reuse getDirectory if it returns the same format.

/* =====================================================
   SUBMISSION ROUTES
===================================================== */
router.post("/log/handwriting", auth, teacherCheck, upload.single("file"), logHandwritingReview);
router.get("/queue/handwriting", auth, teacherCheck, getHandwritingQueue);
router.delete("/log/handwriting/:submissionId", auth, teacherCheck, deleteHandwritingReview);

export default router;