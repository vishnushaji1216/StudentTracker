import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js"; 

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js"; 
import teacherRoutes from "./routes/teacher.routes.js";
import studentRoutes from "./routes/student.routes.js";

dotenv.config();
connectDB();

const app = express();

app.use((req, res, next) => {
  console.log(`📡 Request received: ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes); 
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRoutes);

app.get("/", (req, res) => {
  res.send("Backend running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));