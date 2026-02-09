import Teacher from "../models/teacher.model.js";
import Student from "../models/student.model.js";
import Announcement from "../models/announcement.model.js";
import Submission from "../models/submission.model.js";
import Syllabus from "../models/syllabus.model.js";
import Assignment from "../models/assignment.model.js"
import Fee from "../models/fee.model.js";
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
    const { role, name, mobile, className, grNumber, rollNo, assignments, classTeachership } = req.body;

    // 1. Validation: Check if user exists
    // Included grNumber in the $or check for students as it must be unique
    const existingUser = role === "teacher" 
      ? await Teacher.findOne({ mobile }) 
      : await Student.findOne({ $or: [{ rollNo, className }, { mobile }, { grNumber }] });

    if (existingUser) {
      return res.status(400).json({ 
        message: "User with this Mobile, GR Number, or Roll No in this class already exists" 
      });
    }

    // 2. Generate the password
    const plainPassword = generateDefaultPassword(name, mobile);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // 3. Create User based on role
    let newUser;
    if (role === "teacher") {
      newUser = await Teacher.create({
        name,
        mobile,
        password: hashedPassword,
        teacherCode: `T-${Date.now().toString().slice(-4)}`,
        classTeachership,
        assignments
      });
    } else if (role === "student") {
      newUser = await Student.create({
        name,
        mobile,
        password: hashedPassword,
        rollNo,
        className, 
        grNumber // Included new GR Number field
      });
    }

    // 4. Return success
    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`,
      generatedPassword: plainPassword,
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
    const { users } = req.body; // Expects array: [{ role, name, mobile, className, rollNo, grNumber }]

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: "No users provided" });
    }

    const studentsToInsert = [];
    const errors = [];

    // Process loop
    for (const [index, user] of users.entries()) {
      try {
        // Validation: Ensure grNumber is present for bulk students
        if (user.role === 'student' && !user.grNumber) {
          throw new Error("GR Number is required for student registration");
        }

        const plainPassword = generateDefaultPassword(user.name, user.mobile);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        if (user.role === 'student') {
          studentsToInsert.push({
            name: user.name,
            mobile: user.mobile,
            password: hashedPassword,
            className: user.className,
            rollNo: user.rollNo,
            grNumber: user.grNumber, // Included in bulk object
            role: 'student'
          });
        }
      } catch (err) {
        errors.push({ row: index + 1, error: err.message });
      }
    }

    // Bulk Insert
    let insertedCount = 0;
    if (studentsToInsert.length > 0) {
      try {
        const result = await Student.insertMany(studentsToInsert, { ordered: false });
        insertedCount = result.length;
      } catch (e) {
        insertedCount = e.insertedDocs ? e.insertedDocs.length : 0;
        
        // Detailed error reporting for duplicates
        if (e.writeErrors) {
          e.writeErrors.forEach(err => {
            let detail = "Duplicate entry";
            if (err.errmsg.includes('rollNo')) detail = 'Roll No exists';
            else if (err.errmsg.includes('mobile')) detail = 'Mobile exists';
            else if (err.errmsg.includes('grNumber')) detail = 'GR Number exists';

            errors.push({ 
              msg: `Registration failed`, 
              detail: detail 
            });
          });
        }
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
    // if (!className && !search) {
    //   return res.status(200).json([]);
    // }

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

    const daysToLive = isUrgent ? 14 : 7;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + daysToLive);

    const newAnnouncement = new Announcement({
      targetAudience: target,
      title: subject,
      message,
      isUrgent: isUrgent || false,
      sender: { role: 'admin', id: req.user?.id }, // Safe access to ID
      expiresAt: expirationDate
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

const mapStarsToGrade = (stars) => {
  if (!stars) return 'B'; // Default if not set
  if (stars >= 5) return 'A';
  if (stars >= 4) return 'B';
  if (stars >= 3) return 'C';
  if (stars >= 2) return 'D';
  return 'E';
};

// --- MERGED & UPDATED CONTROLLER ---
export const getStudentDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch Student Identity & Fees
    const student = await Student.findById(id).populate('fees');
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 2. Identify Class Teacher
    const classTeacher = await Teacher.findOne({ classTeachership: student.className })
      .select('name mobile profilePic');

    // --- 3. DATA FETCHING: ALL GRADED SUBMISSIONS ---
    const allGradedSubs = await Submission.find({ 
        student: id, 
        status: 'graded' 
    })
    .populate('assignment', 'title subject type') 
    .populate('quiz', 'title')
    .sort({ submittedAt: -1 });

    // A. Calculate Overall Student Average
    let totalObtained = 0;
    let totalPossible = 0;
    allGradedSubs.forEach(sub => {
        totalObtained += sub.obtainedMarks || 0;
        totalPossible += sub.totalMarks || 100;
    });
    const studentOverallAvg = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;

    // B. Calculate Class Average (Aggregation)
    const classStats = await Submission.aggregate([
        { $match: { status: 'graded' } },
        { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'st' } },
        { $unwind: '$st' },
        { $match: { 'st.className': student.className } },
        { 
            $group: { 
                _id: null, 
                avg: { $avg: { $multiply: [{ $divide: ["$obtainedMarks", "$totalMarks"] }, 100] } } 
            } 
        }
    ]);
    const classOverallAvg = classStats.length > 0 ? Math.round(classStats[0].avg) : 0;

    // --- 4. SUBJECT BREAKDOWN ---
    const syllabusList = await Syllabus.find({ className: student.className }).populate('teacher', 'name');

    const subjectData = await Promise.all(syllabusList.map(async (doc) => {
      const subjectName = doc.subject;
      
      // I. Filter Submissions for this Subject
      const subGrades = allGradedSubs.filter(s => 
          s.subject === subjectName || 
          (s.assignment && s.assignment.subject === subjectName)
      );
      
      // II. Calculate Subject Score
      let sObt = 0, sPos = 0;
      subGrades.forEach(s => { 
          sObt += s.obtainedMarks || 0; 
          sPos += s.totalMarks || 100; 
      });
      const myScore = sPos > 0 ? Math.round((sObt / sPos) * 100) : 0;

      // III. Latest Exam
      const latestExam = subGrades.find(s => ['exam', 'quiz'].includes(s.type));
      let examTitle = "No Exams";
      if (latestExam) {
          examTitle = latestExam.assignment?.title || latestExam.quiz?.title || "Test";
      }

      // IV. Notebook Status
      const pendingCount = await Submission.countDocuments({
         student: id,
         subject: subjectName,
         status: { $in: ['pending', 'submitted', 'in-progress'] }
      });

      return {
        id: subjectName.toLowerCase(),
        name: subjectName,
        teacher: doc.teacher?.name || "Unknown",
        initials: subjectName.substring(0, 2).toUpperCase(),
        color: doc.color || '#4f46e5',
        bgColor: '#eef2ff',
        
        // Metrics
        score: myScore,
        avg: classOverallAvg,
        
        // 👇 CHANGED: Removed getGrade(), now showing percentage directly
        grade: myScore + "%", 
        
        chapter: doc.chapters.find(c => c.isCurrent)?.title || "No Active Chapter",
        notebook: pendingCount === 0 ? "Checked" : "Pending",
        
        examName: examTitle,
        examScore: latestExam ? latestExam.obtainedMarks : '-',
        examTotal: latestExam ? latestExam.totalMarks : '-',
        isExamDone: !!latestExam,
        
        isWeak: myScore < (classOverallAvg - 10) 
      };
    }));

    // --- 5. RETURN RESPONSE ---
    res.status(200).json({
      identity: {
        id: student._id,
        name: student.name,
        className: student.className,
        rollNo: student.rollNo,
        grNumber: student.grNumber || "N/A",
        mobile: student.mobile,
        profilePic: student.profilePic,
        initials: student.name.substring(0,2).toUpperCase()
      },
      metrics: {
        avgScore: studentOverallAvg + "%",
        writingGrade: mapStarsToGrade(student.stats?.writingStars),
        feeStatus: (student.fees && student.fees.some(f => f.status === 'Overdue')) ? 'Overdue' : 'Clear'
      },
      chart: {
        studentAvg: studentOverallAvg,
        classAvg: classOverallAvg,
        trend: studentOverallAvg >= classOverallAvg ? 'Above Average' : 'Below Average'
      },
      classTeacher: classTeacher ? {
        name: classTeacher.name,
        mobile: classTeacher.mobile,
        pic: classTeacher.profilePic
      } : null,
      subjects: subjectData
    });

  } catch (error) {
    console.error("Student Detail Error:", error);
    res.status(500).json({ message: "Server error fetching student details" });
  }
};

// --- UPDATE STUDENT PROFILE (For the Edit Button) ---
export const updateStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, className, rollNo } = req.body;
    
    const updated = await Student.findByIdAndUpdate(
      id, 
      { name, mobile, className, rollNo },
      { new: true }
    );
    
    res.status(200).json({ message: "Profile updated", student: updated });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

export const getTeacherDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id).select('-password');
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.status(200).json(teacher);
  } catch (error) {
    res.status(500).json({ message: "Error fetching teacher", error: error.message });
  }
};

// --- UPDATE TEACHER PROFILE ---
export const updateTeacherProfile = async (req, res) => {
  try {
    const { id } = req.params;
    // Updates Name, Mobile, Class Teachership, and Assignments
    const { name, mobile, classTeachership, assignments } = req.body;
    
    const updated = await Teacher.findByIdAndUpdate(
      id, 
      { name, mobile, classTeachership, assignments },
      { new: true }
    );
    
    res.status(200).json({ message: "Teacher updated", teacher: updated });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

export const getFeeDefaulters = async (req, res) => {
  try {
    const { search, className } = req.query;
    let query = {};

    // 1. Search Logic (Name or GR Number)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { grNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // 2. Class Filter
    if (className && className !== 'All') {
      query.className = className;
    }

    // 3. Fetch Students & Populate Unpaid Fees
    const students = await Student.find(query)
      .select('name className rollNo grNumber profilePic fees')
      .populate({
        path: 'fees',
        match: { status: { $ne: 'Paid' } }, // Only get unpaid fees
        select: 'remainingAmount dueDate'
      })
      .lean(); // Convert to plain JS objects for performance

    // 4. Process Data (Calculate Totals)
    const processedList = students
      .map(student => {
        const totalDue = student.fees.reduce((sum, f) => sum + f.remainingAmount, 0);
        
        // Find the earliest due date (most urgent)
        const oldestDueDate = student.fees.length > 0 
          ? student.fees.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0].dueDate 
          : null;

        return {
          _id: student._id,
          name: student.name,
          className: student.className,
          grNumber: student.grNumber,
          profilePic: student.profilePic,
          initials: student.name.substring(0, 2).toUpperCase(),
          totalDue,
          oldestDueDate
        };
      })
      .filter(s => s.totalDue > 0); // Only show students who owe money

    // Sort by highest debt first
    processedList.sort((a, b) => b.totalDue - a.totalDue);

    res.json(processedList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching defaulters" });
  }
};

export const getStudentFeeDetails = async (req, res) => {
  try {
    const { studentId } = req.params;

    // 1. Fetch Student
    const studentDoc = await Student.findById(studentId);
    if (!studentDoc) return res.status(404).json({ message: "Student not found" });

    // 2. Fetch Fees
    const studentFees = await Fee.find({ student: studentId }).sort({ dueDate: 1 });

    // ... (Your history logic here) ...
    let history = [];
    studentFees.forEach(fee => {
      if (fee.transactions) {
        fee.transactions.forEach(txn => {
          history.push({
            feeTitle: fee.title,
            amount: txn.amount,
            date: txn.date,
            mode: txn.mode,
            note: txn.note
          });
        });
      }
    });
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 3. SEND RESPONSE
    res.json({
      fees: studentFees.filter(f => f.status !== 'Paid'),
      history: history.slice(0, 10),
      
      // --- THE CRITICAL FIX ---
      // Map the database field 'isFeeLocked' to the frontend key 'isLocked'
      isLocked: studentDoc.isFeeLocked || false, 
      // ------------------------

      contact: studentDoc.mobile || ""
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching details" });
  }
};

export const collectFeePayment = async (req, res) => {
  console.log("!!! CONTROLLER REACHED !!!"); // If you don't see this, the problem is in your routes file.
  
  try {
    console.log("DATA RECEIVED:", JSON.stringify(req.body));
    
    const { feeId, amount, mode, remark } = req.body;
    
    if (!feeId) {
       console.log("FAILED: No feeId");
       return res.status(400).json({ message: "No feeId sent" });
    }

    const fee = await Fee.findById(feeId);
    if (!fee) {
       console.log("FAILED: Fee not found in DB");
       return res.status(404).json({ message: "Fee not found" });
    }

    fee.paidAmount += Number(amount);
    fee.transactions.push({
      amount: Number(amount),
      mode: mode,
      note: remark
    });

    await fee.save();
    console.log("SUCCESS: Saved to DB");
    res.status(200).json({ message: "Success" });

  } catch (error) {
    console.error("CATCH ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};