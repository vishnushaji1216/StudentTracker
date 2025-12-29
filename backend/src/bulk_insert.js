import mongoose from 'mongoose';
import fs from 'fs';
import csv from 'csv-parser';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Student from './models/student.model.js'; 

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "your_mongodb_uri_here";

const generatePassword = (name, mobile) => {
  const namePart = name.replace(/\s/g, '').substring(0, 4).toUpperCase();
  const mobilePart = mobile.toString().slice(-2);
  return namePart + mobilePart;
};

const runInsert = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB...");

    const students = [];
    
    // Read your CSV file (e.g., students.csv)
    fs.createReadStream('students.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Expected columns: name, mobile, rollNo, className
        students.push(row);
      })
      .on('end', async () => {
        console.log(`Processing ${students.length} students...`);
        
        for (const data of students) {
          const plainPassword = generatePassword(data.name, data.mobile);
          const hashedPassword = await bcrypt.hash(plainPassword, 10);

          await Student.create({
            name: data.name,
            mobile: data.mobile,
            rollNo: data.rollNo,
            className: data.className,
            password: hashedPassword
          });
          console.log(`Inserted: ${data.name} | Password: ${plainPassword}`);
        }
        
        console.log("Bulk insertion complete!");
        process.exit();
      });

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

runInsert();