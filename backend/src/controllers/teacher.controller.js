import Teacher from "../models/teacher.model.js";
import Assignment from "../models/assignment.model.js";
import Announcement from "../models/announcement.model.js";

// --- 1. GET TEACHER'S CLASSES & PROFILE ---
export const getTeacherProfile = async (req, res) => {
  try {
    // Assuming req.user.id is set by your auth middleware
    const teacher = await Teacher.findById(req.user.id).select('name teacherCode'); 
    
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.status(200).json(teacher);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};

export const getMyClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.status(200).json({
      name: teacher.name,
      teacherCode: teacher.teacherCode,
      classTeachership: teacher.classTeachership,
      assignedClasses: teacher.assignments
    });
  } catch (error) {
    console.error("Get Classes Error:", error);
    res.status(500).json({ message: "Server error fetching classes" });
  }
};

// --- 2. CREATE A NEW TASK (ASSIGNMENT) ---
export const createAssignment = async (req, res) => {
  try {
    const { className, subject, title, description, type, dueDate, totalMarks, targetType, rollStart, rollEnd } = req.body;
    const teacherId = req.user.id;

    if (!className || !subject || !title) {
      return res.status(400).json({ message: "Class, Subject, and Title are required" });
    }

    const newAssignment = new Assignment({
      teacher: teacherId,
      className,
      subject,
      title,
      description,
      type: type || 'homework',
      dueDate,
      totalMarks: totalMarks || 100,
      targetType: targetType || 'all',
      rollRange: targetType === 'range' ? { start: Number(rollStart), end: Number(rollEnd) } : null
    });

    await newAssignment.save();

    res.status(201).json({ 
      message: "Assignment created successfully", 
      assignment: newAssignment 
    });

  } catch (error) {
    console.error("Create Assignment Error:", error);
    res.status(500).json({ message: "Failed to create assignment" });
  }
};

// --- 3. GET ASSIGNMENTS HISTORY ---
export const getAssignments = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const assignments = await Assignment.find({ teacher: teacherId }).sort({ createdAt: -1 });
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch assignments" });
  }
};

// --- 4. DELETE ASSIGNMENT ---
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this task" });
    }

    await assignment.deleteOne();
    res.status(200).json({ message: "Assignment deleted successfully" });

  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Failed to delete assignment" });
  }
};

// --- 5. POST A NOTICE ---
export const postNotice = async (req, res) => {
  try {
    const { title, message, target, targetClass, isUrgent } = req.body;
    const teacherId = req.user.id;
    
    const teacher = await Teacher.findById(teacherId);

    if (!title || !message || !target) {
      return res.status(400).json({ message: "Title, Message, and Target are required" });
    }

    const newAnnouncement = new Announcement({
      sender: { 
        role: 'teacher', 
        id: teacherId.toString(), // <--- FIX 1: Ensure String
        name: teacher.name 
      },
      targetAudience: target, 
      targetClass: targetClass, 
      title,
      message,
      isUrgent: isUrgent || false
    });

    await newAnnouncement.save();

    res.status(201).json({ 
      message: "Notice posted successfully", 
      notice: newAnnouncement 
    });

  } catch (error) {
    console.error("Post Notice Error:", error);
    res.status(500).json({ message: "Failed to post notice" });
  }
};

// --- 6. GET NOTICE BOARD ---
export const getNotices = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Fetch notices
    const notices = await Announcement.find({
      $or: [
        { 'sender.id': teacherId.toString() }, // <--- FIX 2: Ensure String for Query
        { targetAudience: 'Teachers' },
        { targetAudience: 'Everyone' }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json(notices);
  } catch (error) {
    console.error("Get Notices Error:", error);
    res.status(500).json({ message: "Failed to fetch notices" });
  }
};

// --- 7. DELETE NOTICE ---
export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Announcement.findById(id);

    if (!notice) {
      return res.status(404).json({ message: "Notice not found" });
    }

    // Security: Only the teacher who sent it can delete it
    // Admin notices cannot be deleted by teachers
    if (notice.sender.id !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this notice" });
    }

    await notice.deleteOne();
    res.status(200).json({ message: "Notice deleted successfully" });
  } catch (error) {
    console.error("Delete Notice Error:", error);
    res.status(500).json({ message: "Failed to delete notice" });
  }
};