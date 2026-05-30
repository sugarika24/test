import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

import { connectDatabase } from "./src/db/db.js";
import authRoutes from "./src/routes/auth.Routes.js";
import profileRoutes from "./src/routes/profile.Routes.js";
import adminRoutes from "./src/routes/admin.Routes.js";
import categoryRoutes from "./src/routes/category.Routes.js";
import subcategoryRoutes from "./src/routes/subcategory.Routes.js";
import helperSkillRoutes from "./src/routes/helperSkill.Routes.js";
import helperDiscovery from "./src/routes/helperDiscovery.Routes.js";
import bookingRoutes from "./src/routes/booking.Routes.js";
import reviewRoutes from "./src/routes/review.Routes.js";
import notificationRoutes from "./src/routes/notification.Routes.js";
import chatRoutes from "./src/routes/chat.Routes.js";
import adminSkillRoutes from "./src/routes/adminSkill.Routes.js";
import paymentRoutes from "./src/routes/payment.Routes.js";
import emergencyRoutes from "./src/routes/emergency.Routes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Make io available inside controllers/routes
app.set("io", io);

// Middlewares
app.use(cors());
app.use(express.json());

// Static uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Socket connection
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", (userId) => {
    if (!userId) return;

    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room user_${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subcategoryRoutes);
app.use("/api/helper/skills", helperSkillRoutes);
app.use("/api/helpers", helperDiscovery);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminSkillRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/emergency-alerts", emergencyRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Homigo API running successfully",
  });
});

// Connect database
connectDatabase();

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});