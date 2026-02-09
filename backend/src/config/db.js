import mongoose from "mongoose";
import { startHandwritingResetCron } from "../utils/handwritingResetCron.js";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
    startHandwritingResetCron();
    console.log("cron");
  } catch (err) {
    console.error("DB Error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
