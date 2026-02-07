import Fee from "../models/fee.model.js";
import Student from "../models/student.model.js";

export const assignFee = async (req, res) => {
    try {
      // Input: studentId OR className (to bulk assign), title, amount, date
      const { studentId, className, title, amount, dueDate, remarks } = req.body;
  
      let studentsToCharge = [];
  
      // Logic: If studentId provided, charge one. Else, charge whole class.
      if (studentId) {
          studentsToCharge = await Student.find({ _id: studentId });
      } else if (className) {
          studentsToCharge = await Student.find({ className: className });
      }
  
      if (studentsToCharge.length === 0) {
          return res.status(404).json({ message: "No students found to assign fee." });
      }
  
      // Create Fee Records
      const createdFees = await Promise.all(studentsToCharge.map(async (student) => {
          const newFee = new Fee({
              student: student._id,
              className: student.className,
              title,
              totalAmount: amount,
              remainingAmount: amount, // Initially same as total
              dueDate,
              remarks
          });
  
          const savedFee = await newFee.save();
  
          // Link Fee to Student Model
          student.fees.push(savedFee._id);
          await student.save();
  
          return savedFee;
      }));
  
      res.status(201).json({ 
          message: `Fee assigned to ${createdFees.length} students.`, 
          count: createdFees.length 
      });
  
    } catch (error) {
      console.error("Assign Fee Error:", error);
      res.status(500).json({ message: "Failed to assign fee" });
    }
  };
  
  // 2. RECORD PAYMENT (The "Collect Money" button)
  export const recordPayment = async (req, res) => {
    try {
      const { feeId, amount, mode, note } = req.body;
  
      const fee = await Fee.findById(feeId).populate('student');
      if (!fee) return res.status(404).json({ message: "Fee record not found" });
  
      // Validation: Don't accept more than owed
      if (fee.paidAmount + Number(amount) > fee.totalAmount) {
          return res.status(400).json({ message: "Payment exceeds total due amount." });
      }
  
      // A. Update Fee
      fee.transactions.push({
          amount: Number(amount),
          mode,
          note,
          date: new Date()
      });
      
      fee.paidAmount += Number(amount);
      
      // B. Save (Middleware will update status to 'Partial' or 'Paid')
      await fee.save();
  
      // C. AUTO-UNLOCK LOGIC
      // If the student was locked and they pay up, we check if they are "safe" now.
      // Rule: If THIS specific fee is now Paid, or if they just paid something (Partial),
      // we assume good faith and unlock them. 
      // (You can make this stricter by checking ALL fees if you want).
      if (fee.student.isFeeLocked) {
          fee.student.isFeeLocked = false;
          fee.student.lockReason = ""; // Clear reason
          await fee.student.save();
      }
  
      res.json({ 
          message: "Payment recorded successfully", 
          updatedFee: fee,
          studentUnlocked: !fee.student.isFeeLocked
      });
  
    } catch (error) {
      console.error("Record Payment Error:", error);
      res.status(500).json({ message: "Failed to record payment" });
    }
  };
  
  // 3. TOGGLE LOCK (Manual Override)
  export const toggleStudentLock = async (req, res) => {
    try {
      const { studentId, lockStatus, reason } = req.body;
  
      const student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ message: "Student not found" });
  
      student.isFeeLocked = lockStatus; // true = locked, false = unlocked
      student.lockReason = lockStatus ? (reason || "Administrative Lock") : "";
      
      await student.save();
  
      res.json({ 
          message: `Student ${lockStatus ? 'LOCKED' : 'UNLOCKED'} successfully.`, 
          isLocked: student.isFeeLocked 
      });
  
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle lock" });
    }
  };
  
  // 4. GET STUDENT FEE HISTORY
  export const getStudentFees = async (req, res) => {
      try {
          const { studentId } = req.params;
          const fees = await Fee.find({ student: studentId }).sort({ dueDate: 1 });
          
          // Calculate Total Outstanding for UI Header
          let totalDue = 0;
          fees.forEach(f => totalDue += f.remainingAmount);
  
          res.json({ fees, totalDue });
      } catch (error) {
          res.status(500).json({ message: "Error fetching fees" });
      }
  };

  export const getFeeDashboardStats = async (req, res) => {
    try {
      // A. BIG NUMBERS (Global Sums)
      const stats = await Fee.aggregate([
        { 
          $group: { 
            _id: null, 
            totalExpected: { $sum: "$totalAmount" },
            totalCollected: { $sum: "$paidAmount" },
            totalPending: { $sum: "$remainingAmount" }
          } 
        }
      ]);
  
      const summary = stats.length > 0 ? stats[0] : { totalExpected: 0, totalCollected: 0, totalPending: 0 };
  
      // B. DEFAULTERS LIST (Students with dues > 0)
      // We group by Student ID so if a student has 3 unpaid fees, they appear once with the total sum.
      const defaulters = await Fee.aggregate([
        { $match: { remainingAmount: { $gt: 0 } } }, // Only unpaid fees
        {
          $group: {
            _id: "$student", // Group by Student
            totalDue: { $sum: "$remainingAmount" }, // Sum their debt
            pendingCount: { $sum: 1 } // How many unpaid invoices?
          }
        },
        {
          $lookup: { // Join with Student table to get names
            from: "students",
            localField: "_id",
            foreignField: "_id",
            as: "studentInfo"
          }
        },
        { $unwind: "$studentInfo" }, // Flatten the array
        {
          $project: { // Clean up the output
            id: "$_id",
            name: "$studentInfo.name",
            className: "$studentInfo.className",
            grNumber: "$studentInfo.grNumber",
            parentMobile: "$studentInfo.mobile",
            isLocked: "$studentInfo.isFeeLocked",
            totalDue: 1,
            pendingCount: 1
          }
        },
        { $sort: { totalDue: -1 } } // Show highest debt first
      ]);
  
      res.json({ summary, defaulters });
  
    } catch (error) {
      console.error("Fee Dashboard Error:", error);
      res.status(500).json({ message: "Failed to load fee stats" });
    }
  };