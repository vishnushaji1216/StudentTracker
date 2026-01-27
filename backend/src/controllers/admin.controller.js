import Teacher from "../models/teacher.model.js";
import Student from "../models/student.model.js";
import Announcement from "../models/announcement.model.js";
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

export const onboardBulkUsers = async (req, res) => {
  try {
    const { users } = req.body; // Expects array: [{ role, name, mobile, className, rollNo }]

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: "No users provided" });
    }

    const studentsToInsert = [];
    const errors = [];

    // Process loop
    for (const [index, user] of users.entries()) {
      try {
        // Generate Password
        const plainPassword = generateDefaultPassword(user.name, user.mobile);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        if (user.role === 'student') {
          studentsToInsert.push({
            name: user.name,
            mobile: user.mobile,
            password: hashedPassword,
            className: user.className,
            rollNo: user.rollNo,
            role: 'student' // Explicitly set role
          });
        }
      } catch (err) {
        errors.push({ row: index + 1, error: err.message });
      }
    }

    // Bulk Insert (ordered: false allows valid rows to insert even if some fail)
    let insertedCount = 0;
    if (studentsToInsert.length > 0) {
      try {
        const result = await Student.insertMany(studentsToInsert, { ordered: false });
        insertedCount = result.length;
      } catch (e) {
        // insertMany throws error if ANY doc fails, but keeps successful ones if ordered: false
        insertedCount = e.insertedDocs.length;
        // Collect duplicate key errors
        e.writeErrors.forEach(err => {
          errors.push({ 
            msg: `Duplicate detected`, 
            detail: err.errmsg.includes('rollNo') ? 'Roll No exists' : 'Mobile exists' 
          });
        });
      }
    }

    res.status(201).json({
      message: "Bulk Import Processed",
      summary: {
        totalReceived: users.length,
        successfullyAdded: insertedCount,
        failed: errors.length
      },
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    console.error("Bulk Error:", error);
    res.status(500).json({ message: "Server error during bulk import", error: error.message });
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

export const sendBroadcast = async (req, res) => {
  try {
    const { target, subject, message, isUrgent } = req.body;

    if (!target || !subject || !message) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // Check if Announcement model is loaded
    if (!Announcement) {
      throw new Error("Announcement Model is not loaded! Check imports.");
    }

    const newAnnouncement = new Announcement({
      targetAudience: target,
      title: subject,
      message,
      isUrgent: isUrgent || false,
      sender: { role: 'admin', id: req.user?.id } // Safe access to ID
    });

    await newAnnouncement.save();

    res.status(201).json({ 
      message: "Broadcast sent successfully", 
      data: newAnnouncement 
    });

  } catch (error) {
    res.status(500).json({ message: "Server error sending broadcast", error: error.message });
  }
};

export const getBroadcastHistory = async (req, res) => {
  try {
    // Admin sees EVERYTHING (Global Feed) to moderate
    const history = await Announcement.find({})
      .sort({ createdAt: -1 })
      .limit(50); // Increased limit

    res.status(200).json(history);
  } catch (error) {
    console.error("History Error:", error);
    res.status(500).json({ message: "Could not fetch history" });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Announcement.findById(id);

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    // Admin has super-power to delete ANY notice (Admin's or Teacher's)
    await notice.deleteOne();
    
    res.status(200).json({ message: "Notice deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Failed to delete notice" });
  }
};