import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import Teacher from "./models/teacher.model.js";
import Student from "./models/student.model.js";

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
    console.log("Clearing old data…");
    await Teacher.deleteMany();
    await Student.deleteMany();

    const hashedPassword = await bcrypt.hash("123456", 10);

    const teachers = [
      {
        name: "John Sir",
        mobile: "9876543210",
        teacherCode: "T-101",
        subject: "Maths",
        password: hashedPassword,
      },
      {
        name: "Priya Madam",
        mobile: "9998887776",
        teacherCode: "T-102",
        subject: "Science",
        password: hashedPassword,
      },
    ];

    const students = [
      {
        name: "Rahul Kumar",
        mobile: "9123456789",
        rollNo: "2025-001",
        className: "10-A",
        password: hashedPassword,
      },
      {
        name: "Sneha R",
        mobile: "9123456789",
        rollNo: "2025-002",
        className: "10-A",
        password: hashedPassword,
      },
    ];

    await Teacher.insertMany(teachers);
    await Student.insertMany(students);

    console.log("Seeding completed successfully! 🎉");
    process.exit();
  } catch (err) {
    console.log("Seeding error:", err);
    process.exit(1);
  }
};

seedData();
