import express from "express";
import { stripeWebhook } from "../controllers/stripeController.js";

const router = express.Router();

router.post("/webhook", stripeWebhook);

export default router;