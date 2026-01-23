import mongoose from "mongoose";

const feeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  className: { type: String, required: true },
  title: { type: String, required: true }, // e.g., "Annual Bus Fee"
  
  // The Money Logic
  totalAmount: { type: Number, required: true }, // e.g., 10,000
  paidAmount: { type: Number, default: 0 },      // e.g., 4,000
  remainingAmount: { type: Number, required: true }, // e.g., 6,000 (Auto-calc)
  
  dueDate: { type: Date, required: true },
  
  // Status is derived from amounts
  status: { 
    type: String, 
    enum: ['Pending', 'Partial', 'Paid', 'Overdue'], 
    default: 'Pending' 
  },
  
  remarks: { type: String } // e.g., "Scholarship Applied", "Route 5 Bus"
}, { timestamps: true });

// Middleware to auto-calculate remainingAmount before saving
feeSchema.pre('save', function(next) {
  this.remainingAmount = this.totalAmount - this.paidAmount;
  
  if (this.remainingAmount <= 0) {
    this.status = 'Paid';
    this.remainingAmount = 0;
  } else if (this.paidAmount > 0 && this.dueDate >= new Date()) {
    this.status = 'Partial';
  } else if (this.dueDate < new Date()) {
    this.status = 'Overdue';
  }
  
  next();
});

const Fee = mongoose.model("Fee", feeSchema);
export default Fee;