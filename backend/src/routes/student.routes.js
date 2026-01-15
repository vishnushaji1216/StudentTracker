import express from "express";
import { 
  getStudentDashboard, 
  getStudentStats, 
  getStudentProfile 
} from "../controllers/student.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

// Middleware to ensure user is a Student (optional but good practice)
const studentCheck = (req, res, next) => {
    if (req.user.role !== 'parent' && req.user.role !== 'student') {
        // Note: Your model defaults to 'parent', assuming that maps to student login
        return res.status(403).json({ message: "Access denied: Students only" });
    }
    next();
};

router.get("/dashboard", auth, studentCheck, getStudentDashboard);
router.get("/stats", auth, studentCheck, getStudentStats);
router.get("/profile", auth, studentCheck, getStudentProfile);

export default router;