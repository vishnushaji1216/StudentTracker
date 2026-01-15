import express from "express";
import { loginUser, switchStudent } from "../controllers/auth.controller.js";
import auth from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/login", loginUser);
router.post("/switch", auth, switchStudent);

export default router;
