import express from "express";
import multer from "multer";
import path from "path";
import { 
  getStudentDashboard, 
  getStudentStats, 
  getStudentProfile,
  submitAssignment // <--- Import the new function
} from "../controllers/student.controller.js";
import auth from "../middleware/auth.middleware.js";

const router = express.Router();

// --- 1. CONFIGURE MULTER (File Handler) ---
// This saves the file temporarily to an 'uploads' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this folder exists in your root!
  },
  filename: (req, file, cb) => {
    // Naming: "timestamp-originalname"
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Filter to allow Images AND Audio
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/jpg',
    'audio/wav',      // <--- REQUIRED for Audio
    'audio/mpeg',
    'audio/m4a'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and audio are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter 
});


// --- 2. MIDDLEWARE ---
const studentCheck = (req, res, next) => {
    if (req.user.role !== 'parent' && req.user.role !== 'student') {
        return res.status(403).json({ message: "Access denied: Students only" });
    }
    next();
};

// --- 3. ROUTES ---
router.get("/dashboard", auth, studentCheck, getStudentDashboard);
router.get("/stats", auth, studentCheck, getStudentStats);
router.get("/profile", auth, studentCheck, getStudentProfile);

// ✅ NEW SUBMISSION ROUTE
// 'file' must match the name used in FormData.append('file', ...)
router.post("/submit", auth, studentCheck, upload.single('file'), submitAssignment);

export default router;