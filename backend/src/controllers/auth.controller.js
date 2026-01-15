import Teacher from "../models/teacher.model.js";
import Student from "../models/student.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Detect if input is 10-digit mobile number
const isMobile = (text) => /^[0-9]{10}$/.test(text);

export const loginUser = async (req, res) => {
  try {
    const { role, input, password } = req.body;

    if (!role || !input || !password) {
      return res.status(400).json({ message: "All fields required" });
    }
    
    //ADMIN LOGIN BYPASS
    if (input === process.env.ADMIN_SUPER_KEY && password === process.env.ADMIN_PASSWORD) {
  
      const token = jwt.sign(
        { id: "admin_master", role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );
    
      return res.json({
        message: "Admin login successful",
        role: "admin",
        user: { name: "Super Admin", role: "admin" },
        token,
      });
    }

    let user = null;
    let inputField = "";

    // ----- TEACHER LOGIN -----
    if (role === "teacher") {
      if (isMobile(input)) {
        inputField = "mobile";
        user = await Teacher.findOne({ mobile: input });
      } else {
        inputField = "teacherCode";
        user = await Teacher.findOne({ teacherCode: input });
      }
    }

    // ----- STUDENT LOGIN (PARENT) -----
    else if (role === "parent") {
      if (isMobile(input)) {
        inputField = "mobile";
        user = await Student.findOne({ mobile: input });
      }
      // } else {
      //   inputField = "rollNo";
      //   user = await Student.findOne({ rollNo: input });
      // }
    }

    // No user found
    if (!user) {
      return res.status(404).json({ message: `${role} not found with ${inputField}` });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    // JWT token
    const token = jwt.sign(
      { id: user._id, role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      message: "Login successful",
      role,
      user,
      token
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const switchStudent = async (req, res) => {
  try {
    const { targetId } = req.body;
    const currentId = req.user.id; // From current Valid Token

    // 1. Fetch both students
    const currentStudent = await Student.findById(currentId);
    const targetStudent = await Student.findById(targetId);

    if (!targetStudent) {
      return res.status(404).json({ message: "Target student not found" });
    }

    // 2. SECURITY CHECK: Ensure they are actually siblings
    // We strictly check if they share the SAME mobile number.
    if (currentStudent.mobile !== targetStudent.mobile) {
      return res.status(403).json({ message: "Access Denied: Not a sibling account." });
    }

    // 3. Generate NEW Token for the Target Student
    const token = jwt.sign(
      { id: targetStudent._id, role: targetStudent.role || 'parent' }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: targetStudent._id,
        name: targetStudent.name,
        className: targetStudent.className,
        role: targetStudent.role || 'parent'
      }
    });

  } catch (error) {
    console.error("Switch Error:", error);
    res.status(500).json({ message: "Switch failed" });
  }
};