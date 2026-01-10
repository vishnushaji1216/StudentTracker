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
  getQuizDashboard
} from "../controllers/teacher.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

/* =====================================================
   TEACHER ROLE CHECK MIDDLEWARE
===================================================== */
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
   CLASS ROUTES
===================================================== */
router.get("/classes", auth, teacherCheck, getMyClasses);
router.get("/classes/:classId/:subject", auth, teacherCheck, getClassDetail);
router.put("/classes/:classId/:subject/status", auth, teacherCheck, updateClassStatus);

/* =====================================================
   ASSIGNMENT ROUTES
===================================================== */
router.post("/assignments", auth, teacherCheck, createAssignment);
router.get("/assignments", auth, teacherCheck, getAssignments);
router.delete("/assignments/:id", auth, teacherCheck, deleteAssignment);

/* =====================================================
   QUIZ ROUTES
===================================================== */
router.post("/quizzes", auth, teacherCheck, createQuiz);
router.get("/quizzes", auth, teacherCheck, getQuizDashboard);

/* =====================================================
   NOTICE ROUTES
===================================================== */
router.post("/notices", auth, teacherCheck, postNotice);
router.get("/notices", auth, teacherCheck, getNotices);
router.delete("/notices/:id", auth, teacherCheck, deleteNotice);

/* =====================================================
   STUDENT DIRECTORY ROUTES
===================================================== */
router.get("/students", auth, teacherCheck, getDirectory);

export default router;
