import express from "express";
import { getMyClasses, createAssignment, getAssignments,deleteAssignment,postNotice,getNotices,deleteNotice } from "../controllers/teacher.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

// Middleware to ensure user is a teacher
const teacherCheck = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: "Access denied: Teachers only" });
  }
  next();
};

// Routes
router.get("/classes", auth, teacherCheck, getMyClasses);
router.post("/assignments", auth, teacherCheck, createAssignment);
router.get("/assignments", auth, teacherCheck, getAssignments);
router.delete("/assignments/:id", auth, teacherCheck, deleteAssignment);
router.post("/notices", auth, teacherCheck, postNotice);
router.get("/notices", auth, teacherCheck, getNotices);
router.delete("/notices/:id", auth, teacherCheck, deleteNotice);


export default router;