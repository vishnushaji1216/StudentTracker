import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import Teacher from "./models/teacher.model.js";
import Student from "./models/student.model.js";
import Syllabus from "./models/syllabus.model.js"; 

dotenv.config({ path: "./.env" });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected for seeding");
  } catch (err) {
    console.log("DB connection error:", err);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  try {
    console.log("Clearing old data...");
    await Teacher.deleteMany();
    await Student.deleteMany();
    await Syllabus.deleteMany(); 

    const hashedPassword = await bcrypt.hash("PRIY89", 10);

    // 1. Create Teacher
    const priya = new Teacher({
        name: "Priya Sharma",
        mobile: "9876543210",
        teacherCode: "T-2068",
        password: hashedPassword,
        classTeachership: "9-A",
        assignments: [
          { class: "9-A", subject: "Mathematics" },
          { class: "10-B", subject: "Physics" },
          { class: "8-A", subject: "Science" }
        ]
    });
    
    await priya.save();
    console.log(`Teacher Created: ${priya._id}`);

    // 2. Create Syllabus (Linked to Teacher)
    const syllabusData = [
      {
        teacher: priya._id,
        className: "9-A",
        subject: "Mathematics",
        chapters: [
          { chapterNo: 1, title: "Real Numbers", isCompleted: true, notesStatus: "Done", quizStatus: "Done" },
          { chapterNo: 5, title: "Arithmetic Progressions", isCurrent: true, notesStatus: "Done", quizStatus: "Pending" }
        ]
      },
      {
        teacher: priya._id,
        className: "10-B",
        subject: "Physics",
        chapters: [
          { chapterNo: 3, title: "Light & Optics", isCurrent: true, notesStatus: "Pending", quizStatus: "Pending" }
        ]
      }
    ];

    await Syllabus.insertMany(syllabusData);

    // 3. Create 15 Students
    const students = [
      // --- CLASS 9-A ---
      { name: "Arjun Kumar", mobile: "9000000001", rollNo: "1", className: "9-A", password: hashedPassword, stats: { avgScore: 78 } },
      { name: "Diya Singh", mobile: "9000000002", rollNo: "2", className: "9-A", password: hashedPassword, stats: { avgScore: 85 } },
      { name: "Rohan Gupta", mobile: "9000000003", rollNo: "3", className: "9-A", password: hashedPassword, stats: { avgScore: 62 } },
      { name: "Ananya Roy", mobile: "9000000004", rollNo: "4", className: "9-A", password: hashedPassword, stats: { avgScore: 91 } },
      { name: "Vikram Malhotra", mobile: "9000000005", rollNo: "5", className: "9-A", password: hashedPassword, stats: { avgScore: 70 } },

      // --- CLASS 10-B ---
      { name: "Fatima Zara", mobile: "9000000011", rollNo: "1", className: "10-B", password: hashedPassword, stats: { avgScore: 88 } },
      { name: "Kabir Singh", mobile: "9000000012", rollNo: "2", className: "10-B", password: hashedPassword, stats: { avgScore: 74 } },
      { name: "Meera Iyer", mobile: "9000000013", rollNo: "3", className: "10-B", password: hashedPassword, stats: { avgScore: 81 } },
      { name: "Rahul Verma", mobile: "9000000014", rollNo: "4", className: "10-B", password: hashedPassword, stats: { avgScore: 65 } },
      { name: "Sanya Kapoor", mobile: "9000000015", rollNo: "5", className: "10-B", password: hashedPassword, stats: { avgScore: 90 } },

      // --- CLASS 8-A ---
      { name: "Ishaan Patel", mobile: "9000000021", rollNo: "1", className: "8-A", password: hashedPassword, stats: { avgScore: 76 } },
      { name: "Zara Khan", mobile: "9000000022", rollNo: "2", className: "8-A", password: hashedPassword, stats: { avgScore: 89 } },
      { name: "Ayaan Das", mobile: "9000000023", rollNo: "3", className: "8-A", password: hashedPassword, stats: { avgScore: 92 } },
      { name: "Kiara Advani", mobile: "9000000024", rollNo: "4", className: "8-A", password: hashedPassword, stats: { avgScore: 84 } },
      { name: "Dhruv Rathee", mobile: "9000000025", rollNo: "5", className: "8-A", password: hashedPassword, stats: { avgScore: 77 } },
    ];

    await Student.insertMany(students);

    console.log("Seeding completed successfully! 🎉");
    console.log("Teacher Login: T-2025-08 / 123456");
    process.exit();
  } catch (err) {
    console.log("Seeding error:", err);
    process.exit(1);
  }
};

seedData();