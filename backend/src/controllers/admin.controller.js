import Teacher from "../models/teacher.model.js";
import Student from "../models/student.model.js";
import bcrypt from "bcryptjs";

// Helper function to generate the password
const generateDefaultPassword = (name, mobile) => {
  // 1. Remove spaces from name
  // 2. Take first 4 characters and make them Uppercase
  const namePart = name.replace(/\s/g, '').substring(0, 4).toUpperCase();
  // 3. Take last 2 digits of mobile
  const mobilePart = mobile.slice(-2);
  
  return namePart + mobilePart; // e.g., "ARJU45"
};

export const onboardUser = async (req, res) => {
  try {
    const { role, name, mobile, className, rollNo, assignments, classTeachership } = req.body;

    // 1. Validation: Check if user exists
    const existingUser = role === "teacher" 
      ? await Teacher.findOne({ mobile }) 
      : await Student.findOne({ $or: [{ rollNo }, { mobile }] });

    if (existingUser) {
      return res.status(400).json({ message: "User with this Mobile or Roll No already exists" });
    }

    // 2. Generate the password using your logic
    const plainPassword = generateDefaultPassword(name, mobile);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 3. Create User based on role
    let newUser;
    if (role === "teacher") {
      newUser = await Teacher.create({
        name,
        mobile,
        password: hashedPassword,
        teacherCode: `T-${Date.now().toString().slice(-4)}`, // Auto-generated code
        classTeachership,
        assignments
      });
    } else if (role === "student") {
      newUser = await Student.create({
        name,
        mobile, // Parent mobile used for login
        password: hashedPassword,
        rollNo,
        className
      });
    }

    // 4. Return success and the generated password so the Admin can tell the user
    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
      generatedPassword: plainPassword, // Sending back so the Admin can note it down
      user: {
        id: newUser._id,
        name: newUser.name,
        role: role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};