import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import passport from "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import stripeRoutes from "./routes/stripeRoutes.js";
const app = express();

connectDB();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/stripe", stripeRoutes);
app.get("/", (req, res) => res.json({ message: "nexmart" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
