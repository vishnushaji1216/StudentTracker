import Teacher from "../models/teacher.model.js";
import Assignment from "../models/assignment.model.js";

// --- 1. GET TEACHER'S CLASSES & PROFILE ---
export const getMyClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const teacher = await Teacher.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.status(200).json({
      name: teacher.name,               // <--- Added Name
      teacherCode: teacher.teacherCode, // <--- Added Code
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
      // Handle Target
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

// --- 4. DELETE ASSIGNMENTS
export const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Ensure the teacher deleting it is the one who created it
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