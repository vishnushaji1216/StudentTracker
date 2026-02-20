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
  getClassSubjects,
  getMyClassDefaulters
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

import Submission from '../models/submission.model.js';
import Assignment from '../models/assignment.model.js';

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
router.get("/class-subjects", auth, teacherCheck, getClassSubjects);

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
router.get('/my-class-defaulters', auth, teacherCheck, getMyClassDefaulters);

router.get('/debug/audio-submissions', async (req, res) => {
   try {
     const teacherId = req.user?.id;
     
     // Get all audio submissions (no filters)
     const allAudio = await Submission.find({ type: 'audio' })
       .populate('student', 'name')
       .populate('assignment', 'title')
       .populate('teacher', 'name')
       .sort({ submittedAt: -1 });
 
     const summary = allAudio.map(sub => ({
       submissionId: sub._id,
       student: sub.student?.name || 'Unknown',
       assignment: sub.assignment?.title || 'N/A',
       teacher: sub.teacher?.name || 'Not graded yet',
       status: sub.status,
       rating: sub.obtainedMarks,
       fileUrl: sub.fileUrl ? 'Yes' : 'No',
       submittedAt: sub.submittedAt,
       hasTeacherId: !!sub.teacher
     }));
 
     // Also get teacher's assignments
     let teacherAssignments = [];
     if (teacherId) {
       const assignments = await Assignment.find({ teacher: teacherId }).select('_id title');
       teacherAssignments = assignments.map(a => ({ id: a._id, title: a.title }));
     }
 
     res.json({
       totalAudioSubmissions: allAudio.length,
       currentTeacherId: teacherId,
       teacherAssignments: teacherAssignments,
       submissions: summary,
       statusBreakdown: {
         pending: allAudio.filter(s => s.status === 'pending').length,
         submitted: allAudio.filter(s => s.status === 'submitted').length,
         graded: allAudio.filter(s => s.status === 'graded').length,
         other: allAudio.filter(s => !['pending', 'submitted', 'graded'].includes(s.status)).length
       }
     });
 
   } catch (error) {
     console.error('Debug error:', error);
     res.status(500).json({ error: error.message });
   }
 });
 
export default router;