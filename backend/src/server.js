import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js"; 
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js"; 
import teacherRoutes from "./routes/teacher.routes.js"

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes); 
app.use("/api/teacher", teacherRoutes);

app.get("/", (req, res) => {
  res.send("Backend running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));