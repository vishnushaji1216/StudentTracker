import express from "express";
import { 
  onboardUser, 
  onboardBulkUsers,
  getTeacherRegistry, 
  getStudentRegistry, 
  sendBroadcast,        
  getBroadcastHistory,
  deleteNotice,
  getStudentDetail,
  updateStudentProfile,
  getTeacherDetail, 
  updateTeacherProfile,
  getFeeDefaulters,
  getStudentFeeDetails,
  collectFeePayment
} from "../controllers/admin.controller.js";

import {
  assignFee, 
  recordPayment, 
  toggleStudentLock, 
  getStudentFees,
  getFeeDashboardStats
} from '../controllers/fee.controller.js';

import auth from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * Middleware: Admin Check
 * Reusable function to block non-admins
 */
const adminCheck = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied: Admins only" });
    }
    next();
};

/**
 * Route: POST /api/admin/onboard
 * Description: Registers a new Teacher or Student
 */
// We use 'auth' (your import) and 'adminCheck' (defined above)
router.post("/onboard", auth, adminCheck, onboardUser);
router.post("/onboard-bulk", auth, adminCheck, onboardBulkUsers);

router.get("/teachers", auth, getTeacherRegistry);
router.get("/students", auth, getStudentRegistry);

router.get("/teacher/:id", auth, getTeacherDetail);
router.put("/teacher/:id", auth, updateTeacherProfile);

router.get("/student/:id", auth, adminCheck, getStudentDetail); 
router.put("/student/:id", auth, adminCheck, updateStudentProfile);

// --- BROADCAST ROUTES ---
// Replaced 'protect' with 'auth' and 'admin' with 'adminCheck'
router.post('/broadcast', auth, adminCheck, sendBroadcast);
router.get('/broadcast-history', auth, adminCheck, getBroadcastHistory);
router.delete('/broadcast/:id', auth, adminCheck, deleteNotice);

//FEE
router.post('/fees/assign', auth, adminCheck, assignFee);          
router.post('/fees/pay', auth, adminCheck, recordPayment);         
router.post('/fees/lock', auth, adminCheck, toggleStudentLock);    
router.get('/fees/student/:studentId', auth, adminCheck, getStudentFees);
router.get('/fees/dashboard', auth, adminCheck, getFeeDashboardStats);
router.get('/fee-defaulters', auth, adminCheck, getFeeDefaulters);
router.get('/student/:studentId/fees', auth, adminCheck, getStudentFeeDetails)
router.post('/fees/collect', auth, adminCheck, collectFeePayment);

export default router;