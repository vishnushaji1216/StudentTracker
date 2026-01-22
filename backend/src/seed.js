import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import fs from "fs";
import { Parser } from "json2csv";

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
    // Logic: First 4 caps of name + last 2 digits of mobile
    const namePart = name.substring(0, 4).toUpperCase();
    const phonePart = mobile.slice(-2);
    return `${namePart}${phonePart}`;
};

const seedData = async () => {
  await connectDB();

  try {
    console.log("Clearing old data...");
    // Clear all collections to ensure a clean slate
    await Teacher.deleteMany();
    await Student.deleteMany();
    await Syllabus.deleteMany(); 
    await Assignment.deleteMany();
    await Submission.deleteMany();

    const csvData = []; // Store data for CSV export

    // --- 1. CREATE TEACHERS ---
    const teachersList = [
        { 
            name: "Priya Sharma", 
            mobile: "9876543210", 
            code: "T-2068", 
            class: "9-A", 
            subjects: [
                { class: "9-A", subject: "Mathematics" },
                { class: "10-B", subject: "Physics" }
            ] 
        },
        { 
            name: "Rohan Verma", 
            mobile: "9876543255", 
            code: "T-2069", 
            class: "10-B", 
            subjects: [
                { class: "10-B", subject: "Mathematics" },
                { class: "8-A", subject: "Science" }
            ] 
        },
        { 
            name: "Anjali Gupta", 
            mobile: "9876543299", 
            code: "T-2070", 
            class: "8-A", 
            subjects: [
                { class: "8-A", subject: "English" },
                { class: "9-A", subject: "English" }
            ] 
        }
    ];

    const teacherDocs = [];

    for (const t of teachersList) {
        const rawPass = generatePassword(t.name, t.mobile);
        const hashedPass = await bcrypt.hash(rawPass, 10);

        const newTeacher = new Teacher({
            name: t.name,
            mobile: t.mobile,
            teacherCode: t.code,
            password: hashedPass,
            classTeachership: t.class,
            assignments: t.subjects
        });

        const savedTeacher = await newTeacher.save();
        teacherDocs.push(savedTeacher);
        
        // Add to CSV Data
        csvData.push({
            Role: "Teacher",
            Name: t.name,
            ID_Roll: t.code,
            Class: t.class,
            Password: rawPass // Saving raw password for your reference
        });

        console.log(`Teacher Created: ${t.name} (${rawPass})`);
    }

    // --- 2. CREATE SYLLABUS ---
    // Mapping Syllabus to specific teachers based on their subjects
    const syllabusData = [
        // Priya (Math 9-A)
        {
            teacher: teacherDocs[0]._id,
            className: "9-A",
            subject: "Mathematics",
            chapters: [
                { chapterNo: 1, title: "Real Numbers", isCompleted: true, notesStatus: "Done", quizStatus: "Done" },
                { chapterNo: 5, title: "Arithmetic Progressions", isCurrent: true, notesStatus: "Done", quizStatus: "Pending" }
            ]
        },
        // Rohan (Science 8-A)
        {
            teacher: teacherDocs[1]._id,
            className: "8-A",
            subject: "Science",
            chapters: [
                { chapterNo: 1, title: "Crop Production", isCompleted: true, notesStatus: "Done", quizStatus: "Done" },
                { chapterNo: 2, title: "Microorganisms", isCurrent: true, notesStatus: "Pending", quizStatus: "Pending" }
            ]
        }
    ];

    await Syllabus.insertMany(syllabusData);

    // --- 3. CREATE STUDENTS ---
    const studentNames = [
        // 9-A
        "Arjun Kumar", "Diya Singh", "Rohan Gupta", "Ananya Roy", "Vikram Malhotra",
        "Sana Khan", "Ishaan Reddy", "Neha Kapoor", "Rahul Mehta", "Simran Kaur",
        // 10-B
        "Fatima Zara", "Kabir Singh", "Meera Iyer", "Rahul Verma", "Sanya Kapoor",
        "Aryan Joshi", "Pooja Hegde", "Karan Johar", "Shruti Hassan", "Varun Dhawan",
        // 8-A
        "Ishaan Patel", "Zara Khan", "Ayaan Das", "Kiara Advani", "Dhruv Rathee",
        "Nora Fatehi", "Tiger Shroff", "Alia Bhatt", "Ranbir Kapoor", "Deepika P"
    ];

    const classMap = {
        "9-A": studentNames.slice(0, 10),
        "10-B": studentNames.slice(10, 20),
        "8-A": studentNames.slice(20, 30)
    };

    let rollCounter = 1;

    for (const [className, names] of Object.entries(classMap)) {
        rollCounter = 1; // Reset roll no for each class
        for (const name of names) {
            // Generate dummy mobile: 9000 + classIdentifier + rollNo
            const classIdentifier = className === "9-A" ? "1" : className === "10-B" ? "2" : "3";
            const mobile = `9000000${classIdentifier}${rollCounter.toString().padStart(2, '0')}`;
            
            const rawPass = generatePassword(name, mobile);
            const hashedPass = await bcrypt.hash(rawPass, 10);

            const newStudent = {
                name: name,
                mobile: mobile,
                rollNo: rollCounter.toString(),
                className: className,
                password: hashedPass,
                stats: { avgScore: Math.floor(Math.random() * (95 - 60 + 1)) + 60 } // Random score 60-95
            };

            await Student.create(newStudent);

            // Add to CSV Data
            csvData.push({
                Role: "Student",
                Name: name,
                ID_Roll: rollCounter.toString(),
                Class: className,
                Password: rawPass
            });
            
            rollCounter++;
        }
    }

    console.log("Students Created!");

    // --- 4. EXPORT TO CSV ---
    const fields = ["Role", "Name", "ID_Roll", "Class", "Password"];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    fs.writeFileSync("school_data.csv", csv);
    console.log("✅ Data exported to school_data.csv");

    process.exit();
  } catch (err) {
    console.log("Seeding error:", err);
    process.exit(1);
  }
};

seedData();