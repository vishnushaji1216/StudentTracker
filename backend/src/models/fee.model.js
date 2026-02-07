import mongoose from "mongoose";

const feeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  className: { type: String, required: true },
  title: { type: String, required: true }, // e.g., "Term 1 Tuition"
  
  // Money Logic
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, required: true }, // Auto-calc
  
  dueDate: { type: Date, required: true },
  
  // Status
  status: { 
    type: String, 
    enum: ['Pending', 'Partial', 'Paid', 'Overdue'], 
    default: 'Pending' 
  },
  
  // Payment History (The Ledger)
  transactions: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    mode: { type: String, enum: ['Cash', 'Online', 'UPI', 'Cheque'], default: 'Cash' },
    note: String // e.g., "Paid by Father via GPay"
  }],

  remarks: { type: String } // General notes like "Scholarship Applied"

}, { timestamps: true });

// --- MIDDLEWARE: Auto-Calculate Balance & Status ---
feeSchema.pre('save', function(next) {
  // 1. Calculate Remaining
  this.remainingAmount = this.totalAmount - this.paidAmount;
  
  // 2. Determine Status
  const now = new Date();
  
  if (this.remainingAmount <= 0) {
    this.status = 'Paid';
    this.remainingAmount = 0; // Prevent negative numbers
  } else if (this.paidAmount > 0) {
    this.status = 'Partial';
  } else if (this.dueDate < now) {
    this.status = 'Overdue';
  } else {
    this.status = 'Pending';
  }
  
  next();
});

export default mongoose.model("Fee", feeSchema);