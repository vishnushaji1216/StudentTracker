import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import XLSX from "xlsx";
import fs from "fs";

import Teacher from "./models/teacher.model.js";
import Student from "./models/student.model.js";
import Syllabus from "./models/syllabus.model.js"; 
import Assignment from "./models/assignment.model.js";
import Submission from "./models/submission.model.js";

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

const generatePassword = (name, mobile) => {
    const namePart = name.replace(/\s/g, '').substring(0, 4).toUpperCase();
    const phonePart = mobile.slice(-2);
    return `${namePart}${phonePart}`;
};

const getRandomScore = (max) => {
    const min = Math.ceil(max * 0.4);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Shuffle helper to pick 5 random teachers
const getRandomTeachers = (teachers, count) => {
    return [...teachers].sort(() => 0.5 - Math.random()).slice(0, count);
};

const seedData = async () => {
  await connectDB();

  try {
    console.log("🧹 Clearing old data...");
    await Teacher.deleteMany();
    await Student.deleteMany();
    await Syllabus.deleteMany(); 
    await Assignment.deleteMany();
    await Submission.deleteMany();

    const teacherExcelData = []; 
    const studentExcelData = [];

    // --- 1. CREATE 10 TEACHERS ---
    console.log("👨‍🏫 Creating 10 Teachers...");
    const teacherSpecs = [
        { name: "Priya Sharma", mobile: "9876543210", code: "T-101", class: "9-A", sub: "Mathematics" },
        { name: "Rohan Verma", mobile: "9876543211", code: "T-102", class: "10-A", sub: "Science" },
        { name: "Anjali Gupta", mobile: "9876543212", code: "T-103", class: "8-A", sub: "English" },
        { name: "Suresh Raina", mobile: "9876543213", code: "T-104", class: null, sub: "History" },
        { name: "Vikram Rathore", mobile: "9876543214", code: "T-105", class: null, sub: "Geography" },
        { name: "Meera Bai", mobile: "9876543215", code: "T-106", class: null, sub: "Hindi" },
        { name: "Kabir Das", mobile: "9876543216", code: "T-107", class: null, sub: "Physics" },
        { name: "Sarah Jones", mobile: "9876543217", code: "T-108", class: null, sub: "Chemistry" },
        { name: "Rahul Dravid", mobile: "9876543218", code: "T-109", class: null, sub: "Biology" },
        { name: "Zoya Khan", mobile: "9876543219", code: "T-110", class: null, sub: "Computer Science" }
    ];

    const teacherDocs = [];
    for (const t of teacherSpecs) {
        const rawPass = generatePassword(t.name, t.mobile);
        const hashedPass = await bcrypt.hash(rawPass, 10);
        // Initially create teachers without assignments (we will add them dynamically)
        const newTeacher = await Teacher.create({
            name: t.name,
            mobile: t.mobile,
            teacherCode: t.code,
            password: hashedPass,
            classTeachership: t.class,
            assignments: [] 
        });
        teacherDocs.push(newTeacher);
        teacherExcelData.push({ Name: t.name, Mobile: t.mobile, Code: t.code, Role: t.class ? "Class Teacher" : "Subject Teacher", Password: rawPass });
    }

    // --- 2. DYNAMIC ACADEMIC SETUP (5 TEACHERS PER CLASS) ---
    console.log("📚 Assigning 5 Random Teachers to each Class...");
    const classes = ["8-A", "8-B", "9-A", "9-B", "10-A", "10-B"];
    const classAssignments = {}; // Stores which teachers are in which class
    const examMap = {}; // key: className_teacherId_type, value: assignmentId

    for (const className of classes) {
        const selectedTeachers = getRandomTeachers(teacherDocs, 5); // Pick only 5
        classAssignments[className] = selectedTeachers;

        for (const teacher of selectedTeachers) {
            const subject = teacherSpecs.find(s => s.code === teacher.teacherCode).sub;

            // Update Teacher's assignments array in DB
            await Teacher.findByIdAndUpdate(teacher._id, {
                $push: { assignments: { class: className, subject: subject } }
            });

            // Create Syllabus
            await Syllabus.create({
                teacher: teacher._id,
                className,
                subject,
                chapters: [{ chapterNo: 1, title: "Introduction", isCurrent: true }]
            });

            // Create Unit Exam
            const uExam = await Assignment.create({
                teacher: teacher._id, className, subject, title: "Unit Exam 2", type: "exam", totalMarks: 25, status: "Completed", dueDate: new Date()
            });
            // Create Term Exam
            const tExam = await Assignment.create({
                teacher: teacher._id, className, subject, title: "Term Exam 1", type: "exam", totalMarks: 50, status: "Completed", dueDate: new Date()
            });

            examMap[`${className}_${teacher._id}_Unit`] = uExam._id;
            examMap[`${className}_${teacher._id}_Term`] = tExam._id;
        }
    }

    // --- 3. CREATE STUDENTS & MARKS ---
    console.log("🎓 Creating Students & Injecting Marks...");
    const studentNames = [
        "Arjun", "Diya", "Rohan", "Ananya", "Vikram", "Sana", "Ishaan", "Neha", "Rahul", "Simran",
        "Fatima", "Kabir", "Meera", "Aryan", "Sanya", "Pooja", "Karan", "Shruti", "Varun", "Ishaan",
        "Zara", "Ayaan", "Kiara", "Dhruv", "Nora", "Tiger", "Alia", "Ranbir", "Deepika", "John"
    ];

    let studentIdx = 0;
    let grCounter = 2024001;

    for (const className of classes) {
        const assignedTeachers = classAssignments[className];

        for (let i = 0; i < 5; i++) {
            const name = `${studentNames[studentIdx % studentNames.length]} ${['Kumar', 'Singh', 'Gupta', 'Roy'][Math.floor(Math.random() * 4)]}`;
            const mobile = `910000${grCounter.toString().slice(-4)}`;
            const grNumber = `GR-${grCounter}`;
            const rawPass = generatePassword(name, mobile);
            
            const newStudent = await Student.create({
                name, mobile, rollNo: (i + 1).toString(), grNumber, className,
                password: await bcrypt.hash(rawPass, 10),
                stats: { avgScore: 0 }
            });

            studentExcelData.push({ Name: name, Class: className, Roll: i+1, GR: grNumber, Mobile: mobile, Password: rawPass });

            // Create Submissions ONLY for the 5 assigned teachers
            for (const teacher of assignedTeachers) {
                await Submission.create({
                    student: newStudent._id,
                    teacher: teacher._id,
                    assignment: examMap[`${className}_${teacher._id}_Unit`],
                    type: "exam",
                    status: "Graded",
                    obtainedMarks: getRandomScore(25),
                    totalMarks: 25
                });

                await Submission.create({
                    student: newStudent._id,
                    teacher: teacher._id,
                    assignment: examMap[`${className}_${teacher._id}_Term`],
                    type: "exam",
                    status: "Graded",
                    obtainedMarks: getRandomScore(50),
                    totalMarks: 50
                });
            }
            studentIdx++;
            grCounter++;
        }
    }

    // --- 4. EXPORT EXCEL ---
    try {
        const teacherSheet = XLSX.utils.json_to_sheet(teacherExcelData);
        const studentSheet = XLSX.utils.json_to_sheet(studentExcelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, teacherSheet, "Teachers");
        XLSX.utils.book_append_sheet(wb, studentSheet, "Students");
        XLSX.writeFile(wb, "SchoolData.xlsx");
        console.log("✅ Data seeded. SchoolData.xlsx generated.");
    } catch (e) { 
        console.log("⚠️ Excel generation failed, but DB is seeded."); 
    }

    process.exit();
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seedData();