import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import passport from "./config/passport.js";
import { initSocket } from "./config/socket.js";

import authRoutes    from "./routes/authRoutes.js";
import userRoutes    from "./routes/userRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import cartRoutes    from "./routes/cartRoutes.js";
import orderRoutes   from "./routes/orderRoutes.js";
import reviewRoutes  from "./routes/reviewRoutes.js";
import adminRoutes   from "./routes/adminRoutes.js";

const app        = express();
const httpServer = createServer(app);

connectDB();

// ── Socket.io init ─────────────────────────────────
initSocket(httpServer);

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

app.use("/api/auth",      authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/cart",      cartRoutes);
app.use("/api/orders",    orderRoutes);
app.use("/api/reviews",   reviewRoutes);
app.use("/api/admin",     adminRoutes);


app.get("/", (req, res) =>
  res.json({ message: "✅ NexaMart API is running!" })
);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));