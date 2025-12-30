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

export const getTeacherRegistry = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { teacherCode: { $regex: search, $options: "i" } }
        ]
      };
    }

    const teachers = await Teacher.find(query);

    const formattedTeachers = teachers.map(t => {
      // Logic to find Main Subject (the one that appears most in assignments)
      const subjectCounts = {};
      t.assignments.forEach(a => {
        subjectCounts[a.subject] = (subjectCounts[a.subject] || 0) + 1;
      });
      const mainSubject = Object.keys(subjectCounts).reduce((a, b) => 
        subjectCounts[a] > subjectCounts[b] ? a : b, "N/A"
      );

      return {
        _id: t._id,
        name: t.name,
        teacherCode: t.teacherCode,
        profilePic: t.profilePic,
        roleDisplay: t.classTeachership ? `CLASS TEACHER: ${t.classTeachership}` : "SUBJECT TEACHER",
        mainSubject: mainSubject,
        avgPerformance: "82%", // Dummy value until Marks model is linked
        isClassTeacher: !!t.classTeachership
      };
    });

    res.status(200).json(formattedTeachers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching teachers", error: err.message });
  }
};

export const getStudentRegistry = async (req, res) => {
  try {
    const { className, search } = req.query;
    let query = {};

    // Only fetch if a class is selected (as per your requirement)
    if (className) {
      query.className = className;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { rollNo: { $regex: search, $options: "i" } }
      ];
    }

    // If no class selected and no search, we return empty list or specific message
    if (!className && !search) {
      return res.status(200).json([]);
    }

    const students = await Student.find(query);

    const formattedStudents = students.map(s => ({
      _id: s._id,
      name: s.name,
      rollNo: s.rollNo,
      parentMobile: s.mobile,
      profilePic: s.profilePic,
      performance: "75%", // Dummy value
      className: s.className
    }));

    res.status(200).json(formattedStudents);
  } catch (err) {
    res.status(500).json({ message: "Error fetching students", error: err.message });
  }
};