import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import XLSX from "xlsx";
import fs from "fs";

// Import ALL Models to ensure complete cleanup
import Teacher from "./models/teacher.model.js";
import Student from "./models/student.model.js";
import Syllabus from "./models/syllabus.model.js"; 
import Assignment from "./models/assignment.model.js";
import Announcement from "./models/announcement.model.js";
import Fee from "./models/fee.model.js";
import Quiz from "./models/quiz.model.js";
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

const seedData = async () => {
  await connectDB();

  try {
    // --- 0. CLEAR DATABASE (The Purge) ---
    console.log("🧹 Clearing ALL database collections...");
    
    // Delete data from all collections in parallel for speed
    await Promise.all([
        Teacher.deleteMany(),
        Student.deleteMany(),
        Syllabus.deleteMany(),
        Assignment.deleteMany(),
        Announcement.deleteMany(),
        Fee.deleteMany(),
        Quiz.deleteMany(),
        Submission.deleteMany()
    ]);
    
    console.log("✨ Database completely wiped.");

    const teacherExcelData = []; 
    const studentExcelData = [];

    // Define the 6 classes
    const classes = ["8-A", "8-B", "9-A", "9-B", "10-A", "10-B"];

    // --- 1. CREATE 10 TEACHERS ---
    console.log("👨‍🏫 Creating 10 Teachers...");
    
    // 10 Teacher Profiles
    const teacherSpecs = [
        // 6 Class Teachers (will be assigned to classes index 0-5)
        { name: "Priya Sharma", mobile: "9876543210", code: "T-101", sub: "Mathematics" },
        { name: "Rohan Verma", mobile: "9876543211", code: "T-102", sub: "Science" },
        { name: "Anjali Gupta", mobile: "9876543212", code: "T-103", sub: "English" },
        { name: "Suresh Raina", mobile: "9876543213", code: "T-104", sub: "History" },
        { name: "Vikram Rathore", mobile: "9876543214", code: "T-105", sub: "Geography" },
        { name: "Meera Bai", mobile: "9876543215", code: "T-106", sub: "Hindi" },
        
        // 4 Subject Teachers (No class teachership)
        { name: "Kabir Das", mobile: "9876543216", code: "T-107", sub: "Physics" },
        { name: "Sarah Jones", mobile: "9876543217", code: "T-108", sub: "Chemistry" },
        { name: "Rahul Dravid", mobile: "9876543218", code: "T-109", sub: "Biology" },
        { name: "Zoya Khan", mobile: "9876543219", code: "T-110", sub: "Computer Science" }
    ];

    const teacherDocs = [];

    for (let i = 0; i < teacherSpecs.length; i++) {
        const t = teacherSpecs[i];
        
        // First 6 teachers get a class, remaining 4 get null
        const assignedClass = i < 6 ? classes[i] : null; 

        const rawPass = generatePassword(t.name, t.mobile);
        const hashedPass = await bcrypt.hash(rawPass, 10);

        const newTeacher = await Teacher.create({
            name: t.name,
            mobile: t.mobile,
            teacherCode: t.code,
            password: hashedPass,
            classTeachership: assignedClass, 
            assignments: [] 
        });

        teacherDocs.push(newTeacher);
        
        teacherExcelData.push({ 
            Name: t.name, 
            Mobile: t.mobile, 
            Code: t.code, 
            Subject: t.sub,
            Role: assignedClass ? `Class Teacher (${assignedClass})` : "Subject Teacher", 
            Password: rawPass 
        });
    }

    // --- 2. ASSIGN TEACHERS TO CLASSES (MIN 4 PER CLASS) ---
    console.log("📚 Assigning Subject Allocations...");

    for (const className of classes) {
        // 1. Identify the Class Teacher for this class (if any)
        const classTeacher = teacherDocs.find(t => t.classTeachership === className);
        
        // 2. Filter out the class teacher from the pool to pick random additional ones
        const otherTeachers = teacherDocs.filter(t => t._id.toString() !== classTeacher._id.toString());
        
        // 3. Shuffle and pick 3 additional teachers
        const additionalTeachers = otherTeachers.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        // 4. Combine them (1 Class Teacher + 3 Subject Teachers = 4 Teachers)
        const facultyForClass = [classTeacher, ...additionalTeachers];

        // 5. Update DB Records
        for (const teacher of facultyForClass) {
            const originalSpec = teacherSpecs.find(s => s.code === teacher.teacherCode);
            
            // Add to Teacher's assignment list
            await Teacher.findByIdAndUpdate(teacher._id, {
                $push: { assignments: { class: className, subject: originalSpec.sub } }
            });

            // Create Syllabus entry
            await Syllabus.create({
                teacher: teacher._id,
                className,
                subject: originalSpec.sub,
                chapters: [
                    { chapterNo: 1, title: "Introduction to " + originalSpec.sub, isCurrent: true, notesStatus: "Pending", quizStatus: "Pending" }
                ]
            });
        }
    }

    // --- 3. CREATE STUDENTS (5 PER CLASS) ---
    console.log("🎓 Creating 30 Students (5 per class)...");
    
    const studentNames = [
        "Arjun", "Diya", "Rohan", "Ananya", "Vikram", "Sana", "Ishaan", "Neha", "Rahul", "Simran",
        "Fatima", "Kabir", "Meera", "Aryan", "Sanya", "Pooja", "Karan", "Shruti", "Varun", "Ishaan",
        "Zara", "Ayaan", "Kiara", "Dhruv", "Nora", "Tiger", "Alia", "Ranbir", "Deepika", "John"
    ];

    let studentIdx = 0;
    let grCounter = 2024001;

    for (const className of classes) {
        for (let i = 0; i < 5; i++) {
            const name = `${studentNames[studentIdx % studentNames.length]} ${['Kumar', 'Singh', 'Gupta', 'Roy'][Math.floor(Math.random() * 4)]}`;
            const mobile = `910000${grCounter.toString().slice(-4)}`;
            const grNumber = `GR-${grCounter}`;
            const rawPass = generatePassword(name, mobile);
            
            await Student.create({
                name, 
                mobile, 
                rollNo: (i + 1).toString(), 
                grNumber, 
                className,
                password: await bcrypt.hash(rawPass, 10),
                stats: { avgScore: 0 }
            });

            // Keep track of class name in data object for filtering later
            studentExcelData.push({ 
                Name: name, 
                Class: className, 
                Roll: i+1, 
                GR: grNumber, 
                Mobile: mobile, 
                Password: rawPass 
            });

            studentIdx++;
            grCounter++;
        }
    }

    // --- 4. EXPORT EXCEL (SEPARATE SHEETS) ---
    try {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Teachers
        const teacherSheet = XLSX.utils.json_to_sheet(teacherExcelData);
        XLSX.utils.book_append_sheet(wb, teacherSheet, "Teachers");

        // Sheet 2-N: Each Class gets its own sheet
        for (const className of classes) {
            // Filter students belonging to this class
            const classStudents = studentExcelData.filter(s => s.Class === className);
            
            if (classStudents.length > 0) {
                // Create a sheet for this specific class
                const classSheet = XLSX.utils.json_to_sheet(classStudents);
                XLSX.utils.book_append_sheet(wb, classSheet, className);
            }
        }

        XLSX.writeFile(wb, "SchoolData.xlsx");
        console.log("✅ Data seeded successfully.");
        console.log("📊 SchoolData.xlsx created with separate sheets for 'Teachers' and each Class.");

    } catch (e) { 
        console.log("⚠️ Excel generation failed:", e.message); 
    }

    process.exit();
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seedData();