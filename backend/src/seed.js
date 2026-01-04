import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import Teacher from "./models/teacher.model.js";
import Student from "./models/student.model.js";
import Syllabus from "./models/syllabus.model.js"; // Import the new model

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
    await Syllabus.deleteMany(); // Clear syllabus too

    const hashedPassword = await bcrypt.hash("PRIY89", 10);

    // 1. Create Teacher Objects
    const teacherData = [
      {
        name: "Priya Sharma",
        mobile: "9876543289",
        teacherCode: "T-2068", // Your UI example code
        password: hashedPassword,
        classTeachership: "9-A",
        assignments: [
          { class: "9-A", subject: "Mathematics" },
          { class: "10-B", subject: "Physics" },
          { class: "8-B", subject: "Physics" }
        ]
      },
    ];

    // 2. Insert Teachers & Get their IDs
    const createdTeachers = await Teacher.insertMany(teacherData);
    const priyaId = createdTeachers[0]._id; // We need this ID for the syllabus link

    console.log(`Teachers created. Priya's ID: ${priyaId}`);

    // 3. Create Students
    const students = [
      { name: "Arjun Kumar", mobile: "9123456780", rollNo: "24", className: "9-A", password: hashedPassword },
      { name: "Diya Singh", mobile: "9123456781", rollNo: "25", className: "9-A", password: hashedPassword },
      { name: "Karan Vohra", mobile: "9123456782", rollNo: "26", className: "9-A", password: hashedPassword },
      { name: "Fatima Z", mobile: "9123456783", rollNo: "27", className: "10-B", password: hashedPassword },
      { name: "Gaurav M", mobile: "9123456784", rollNo: "28", className: "10-C", password: hashedPassword },
    ];

    await Student.insertMany(students);

    // 4. Create Syllabus (The new part!)
    const syllabusData = [
      {
        teacher: priyaId, // Linking to Priya using her MongoDB _id
        className: "9-A",
        subject: "Mathematics",
        chapters: [
          { chapterNo: 1, title: "Number Systems", isCurrent: false, notesStatus: "Done", quizStatus: "Done" },
          { chapterNo: 5, title: "Arithmetic", isCurrent: true, notesStatus: "Done", quizStatus: "Pending" } // This will show on dashboard
        ]
      },
      {
        teacher: priyaId,
        className: "10-B",
        subject: "Physics",
        chapters: [
          { chapterNo: 3, title: "Light & Optics", isCurrent: true, notesStatus: "Pending", quizStatus: "Pending" }
        ]
      }
    ];

    await Syllabus.insertMany(syllabusData);

    console.log("Seeding completed successfully! 🎉");
    console.log("Login with: T-2068 / PRIY89");
    process.exit();
  } catch (err) {
    console.log("Seeding error:", err);
    process.exit(1);
  }
};

seedData();