import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import XLSX from "xlsx";

import Teacher from "./models/teacher.model.js";
import Student from "./models/student.model.js";
import Syllabus from "./models/syllabus.model.js";
import Assignment from "./models/assignment.model.js";
import Submission from "./models/submission.model.js";

dotenv.config({ path: "./.env" });

/* -------------------- DB -------------------- */
const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected");
};

/* -------------------- HELPERS -------------------- */
const generatePassword = (name, mobile) =>
  `${name.replace(/\s/g, "").slice(0, 4).toUpperCase()}${mobile.slice(-2)}`;

const getRandomScore = (max) =>
  Math.floor(Math.random() * (max * 0.6 + 1)) + Math.floor(max * 0.4);

/* -------------------- SEED -------------------- */
const seedData = async () => {
  await connectDB();

  try {
    await Promise.all([
      Teacher.deleteMany(),
      Student.deleteMany(),
      Syllabus.deleteMany(),
      Assignment.deleteMany(),
      Submission.deleteMany()
    ]);

    const teacherExcelData = [];
    const studentExcelDataByClass = {};

    /* -------------------- TEACHERS -------------------- */
    const teachers = [
      {
        name: "Priya Sharma",
        mobile: "9876543210",
        code: "T-2068",
        class: "9-A",
        subjects: [
          { class: "9-A", subject: "Mathematics" },
          { class: "9-B", subject: "Mathematics" }
        ]
      },
      {
        name: "Rohan Verma",
        mobile: "9876543255",
        code: "T-2069",
        class: "10-B",
        subjects: [
          { class: "10-A", subject: "Science" },
          { class: "10-B", subject: "Science" }
        ]
      },
      {
        name: "Anjali Gupta",
        mobile: "9876543299",
        code: "T-2070",
        class: "8-A",
        subjects: [
          { class: "8-A", subject: "English" },
          { class: "8-B", subject: "English" }
        ]
      }
    ];

    const teacherDocs = [];

    for (const t of teachers) {
      const rawPass = generatePassword(t.name, t.mobile);
      const teacher = await Teacher.create({
        ...t,
        teacherCode: t.code,
        password: await bcrypt.hash(rawPass, 10),
        classTeachership: t.class,
        assignments: t.subjects
      });

      teacherDocs.push(teacher);
      teacherExcelData.push({
        Name: t.name,
        Mobile: t.mobile,
        Code: t.code,
        Subjects: t.subjects.map(s => `${s.class}-${s.subject}`).join(", "),
        Password: rawPass
      });
    }

    /* -------------------- STUDENTS (5 PER CLASS) -------------------- */
    const classMap = {
      "8-A": ["Arjun Kumar", "Diya Singh", "Rohan Gupta", "Ananya Roy", "Vikram Malhotra"],
      "8-B": ["Sana Khan", "Ishaan Reddy", "Neha Kapoor", "Rahul Mehta", "Simran Kaur"],
      "9-A": ["Kabir Singh", "Meera Iyer", "Fatima Zara", "Rahul Verma", "Sanya Kapoor"],
      "9-B": ["Aryan Joshi", "Pooja Hegde", "Karan Johar", "Shruti Hassan", "Varun Dhawan"],
      "10-A": ["Ishaan Patel", "Zara Khan", "Ayaan Das", "Kiara Advani", "Dhruv Rathee"],
      "10-B": ["Alia Bhatt", "Ranbir Kapoor", "Deepika Padukone", "Tiger Shroff", "Nora Fatehi"]
    };

    const classTeacherMap = {
      "8-A": { teacherIdx: 2, subject: "English" },
      "8-B": { teacherIdx: 2, subject: "English" },
      "9-A": { teacherIdx: 0, subject: "Mathematics" },
      "9-B": { teacherIdx: 0, subject: "Mathematics" },
      "10-A": { teacherIdx: 1, subject: "Science" },
      "10-B": { teacherIdx: 1, subject: "Science" }
    };

    let grCounter = 2024001;

    for (const [className, students] of Object.entries(classMap)) {
      studentExcelDataByClass[className] = [];
      let roll = 1;

      const { teacherIdx, subject } = classTeacherMap[className];
      const teacherId = teacherDocs[teacherIdx]._id;

      const unitExam = await Assignment.create({
        teacher: teacherId,
        className,
        subject,
        title: "Unit Exam",
        type: "exam",
        totalMarks: 25
      });

      const termExam = await Assignment.create({
        teacher: teacherId,
        className,
        subject,
        title: "Term Exam",
        type: "exam",
        totalMarks: 50
      });

      for (const name of students) {
        const mobile = `90000000${roll}${teacherIdx}`;
        const rawPass = generatePassword(name, mobile);

        const student = await Student.create({
          name,
          mobile,
          rollNo: roll,
          grNumber: `GR-${grCounter}`,
          className,
          password: await bcrypt.hash(rawPass, 10)
        });

        const unitMarks = getRandomScore(25);
        const termMarks = getRandomScore(50);

        await Submission.insertMany([
          {
            student: student._id,
            teacher: teacherId,
            assignment: unitExam._id,
            obtainedMarks: unitMarks,
            totalMarks: 25
          },
          {
            student: student._id,
            teacher: teacherId,
            assignment: termExam._id,
            obtainedMarks: termMarks,
            totalMarks: 50
          }
        ]);

        const total = unitMarks + termMarks;
        const avg = Math.round((total / 75) * 100);

        studentExcelDataByClass[className].push({
          Name: name,
          RollNo: roll,
          "GR Number": `GR-${grCounter}`,
          [`${subject} - Unit Exam (25)`]: unitMarks,
          [`${subject} - Term Exam (50)`]: termMarks,
          [`${subject} - Total (75)`]: total,
          [`${subject} - Avg %`]: avg,
          Password: rawPass
        });

        roll++;
        grCounter++;
      }
    }

    /* -------------------- EXPORT EXCEL -------------------- */
    const teacherWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      teacherWb,
      XLSX.utils.json_to_sheet(teacherExcelData),
      "Teachers"
    );
    XLSX.writeFile(teacherWb, "teachers.xlsx");

    const studentWb = XLSX.utils.book_new();
    for (const [cls, data] of Object.entries(studentExcelDataByClass)) {
      XLSX.utils.book_append_sheet(
        studentWb,
        XLSX.utils.json_to_sheet(data),
        cls
      );
    }
    XLSX.writeFile(studentWb, "students.xlsx");

    console.log("✅ 30 students seeded (5 per section) with subject-wise marks");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
