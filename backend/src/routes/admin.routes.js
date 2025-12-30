import express from "express";
import { onboardUser, getTeacherRegistry, getStudentRegistry } from "../controllers/admin.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * Route: POST /api/admin/onboard
 * Description: Registers a new Teacher or Student
 * Access: Private (Admin only)
 */
router.post("/onboard", auth, (req, res, next) => {
    // Only allow users with the 'admin' role (logged in via super key)
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admins only" });
    }
    next();
}, onboardUser);

router.get("/teachers", auth, getTeacherRegistry);
router.get("/students", auth, getStudentRegistry);

export default router;