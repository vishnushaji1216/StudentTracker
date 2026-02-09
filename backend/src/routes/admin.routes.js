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

import { manualHandwritingReset } from '../utils/handwritingResetCron.js';

import Submission from '../models/submission.model.js';

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
router.post("/onboard", auth, adminCheck, onboardUser);
router.post("/onboard-bulk", auth, adminCheck, onboardBulkUsers);

router.get("/teachers", auth, getTeacherRegistry);
router.get("/students", auth, getStudentRegistry);

router.get("/teacher/:id", auth, getTeacherDetail);
router.put("/teacher/:id", auth, updateTeacherProfile);

router.get("/student/:id", auth, adminCheck, getStudentDetail); 
router.put("/student/:id", auth, adminCheck, updateStudentProfile);

// --- BROADCAST ROUTES ---
router.post('/broadcast', auth, adminCheck, sendBroadcast);
router.get('/broadcast-history', auth, adminCheck, getBroadcastHistory);
router.delete('/broadcast/:id', auth, adminCheck, deleteNotice);

// --- FEE ROUTES ---
router.post('/fees/assign', auth, adminCheck, assignFee);          
router.post('/fees/pay', auth, adminCheck, recordPayment);         
router.post('/fees/lock', auth, adminCheck, toggleStudentLock);    
router.get('/fees/student/:studentId', auth, adminCheck, getStudentFees);
router.get('/fees/dashboard', auth, adminCheck, getFeeDashboardStats);
router.get('/fee-defaulters', auth, adminCheck, getFeeDefaulters);
router.get('/student/:studentId/fees', auth, adminCheck, getStudentFeeDetails)
router.post('/fees/collect', auth, adminCheck, collectFeePayment);

// --- HANDWRITING RESET ROUTE (FOR TESTING) ---
/**
 * Route: GET /api/admin/reset-handwriting
 * Description: Manually trigger handwriting reset (for testing cron logic)
 * Remove auth temporarily for testing, then add it back: auth, adminCheck
 */
router.get('/reset-handwriting', async (req, res) => {
  try {
    console.log('🔧 Manual handwriting reset triggered...');
    
    const result = await manualHandwritingReset();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        count: result.count
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('❌ Admin reset error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to reset handwriting submissions',
      error: error.message 
    });
  }
});


router.get('/check-handwriting', async (req, res) => {
  try {
    const allHandwriting = await Submission.find({
      type: { $regex: /^handwriting$/i }
    })
    .populate('student', 'name rollNo className')
    .sort({ submittedAt: -1 });

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const summary = allHandwriting.map(sub => ({
      student: sub.student?.name || 'Unknown',
      roll: sub.student?.rollNo || 'N/A',
      status: sub.status,
      rating: sub.obtainedMarks,
      submittedAt: sub.submittedAt,
      daysAgo: Math.floor((Date.now() - new Date(sub.submittedAt)) / (1000 * 60 * 60 * 24)),
      isOlderThan7Days: new Date(sub.submittedAt) < oneWeekAgo
    }));

    res.json({
      total: allHandwriting.length,
      oneWeekAgo: oneWeekAgo.toISOString(),
      currentDate: new Date().toISOString(),
      submissions: summary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. FORCE RESET (for testing - ignores date)
router.get('/reset-handwriting-force', async (req, res) => {
  try {
    const result = await Submission.updateMany(
      {
        type: { $regex: /^handwriting$/i },
        status: { $in: ['graded', 'Graded'] }
      },
      {
        $set: { 
          status: 'pending',
          obtainedMarks: 0,
          feedback: '',
          tags: []
        }
      }
    );

    res.json({
      success: true,
      message: `Force reset ${result.modifiedCount} handwriting submissions`,
      count: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. NORMAL RESET (only resets if >7 days old)
router.get('/reset-handwriting', async (req, res) => {
  try {
    const result = await manualHandwritingReset();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;