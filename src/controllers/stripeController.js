import Stripe from "stripe";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import User from "../models/User.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/orders/create-payment-intent
// Frontend se call hoga — checkout pe
export const createPaymentIntent = async (req, res) => {
  try {
    // ── Cart Check ─────────────────────────────────
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0)
      return errorResponse(res, 400, "Your cart is empty");

    // ── Address Check ──────────────────────────────
    const user = await User.findById(req.user._id);
    if (!user.savedAddress || !user.savedAddress.city)
      return errorResponse(
        res,
        400,
        "Please add a delivery address before checkout",
      );

    // ── Price Calculate ────────────────────────────
    const DELIVERY_FEE = 150;
    const FREE_DELIVERY = 2000;

    const itemsTotal = parseFloat(
      cart.items
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
        .toFixed(2),
    );
    const deliveryFee = itemsTotal >= FREE_DELIVERY ? 0 : DELIVERY_FEE;
    const totalAmount = parseFloat((itemsTotal + deliveryFee).toFixed(2));

    // ── Stripe Payment Intent ──────────────────────
    // Amount cents mein hona chahiye (dollars) ya paisa (PKR)
    // PKR ke liye: rupees * 100
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Paisa mein
      currency: "pkr",
      metadata: {
        userId: req.user._id.toString(),
        cartId: cart._id.toString(),
      },
    });

    // ── Pending Order Create ───────────────────────
    // Webhook se "paid" hoga — abhi pending rakho
    const orderItems = cart.items.map((item) => ({
      productId: item.productId,
      title: item.title,
      price: item.price,
      image: item.image,
      brand: item.brand,
      category: item.category,
      quantity: item.quantity,
      subtotal: parseFloat((item.price * item.quantity).toFixed(2)),
    }));

    const deliveryAddress = {
      formatted: user.savedAddress.formatted,
      street: user.savedAddress.street || "",
      city: user.savedAddress.city,
      state: user.savedAddress.state || "",
      country: user.savedAddress.country,
      postalCode: user.savedAddress.postalCode || "",
      lat: user.savedAddress.lat || null,
      lng: user.savedAddress.lng || null,
    };

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      deliveryAddress,
      itemsTotal,
      deliveryFee,
      discount: 0,
      totalAmount,
      paymentMethod: "stripe",
      paymentStatus: "pending",
      orderStatus: "pending",
      stripePaymentIntentId: paymentIntent.id,
    });

    return successResponse(res, 200, "Payment intent created", {
      clientSecret: paymentIntent.client_secret, // Frontend ko chahiye
      orderId: order._id,
      orderNumber: order.orderNumber,
      totalAmount,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/stripe/webhook
// Stripe khud call karta hai — payment confirm/fail
// ⚠️ Is route pe express.json() nahi lagana — raw body chahiye
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    // Verify: request Stripe ka hi hai
    event = stripe.webhooks.constructEvent(
      req.body, // raw body
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Webhook signature failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // ── Payment Successful ─────────────────────────
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    try {
      const order = await Order.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });

      if (order) {
        order.paymentStatus = "paid";
        order.orderStatus = "processing"; // Auto processing pe
        await order.save();

        // Cart clear karo
        await Cart.findOneAndUpdate({ user: order.user }, { items: [] });

        console.log(`✅ Order ${order.orderNumber} paid successfully`);
      }
    } catch (error) {
      console.error("Webhook order update failed:", error.message);
    }
  }

  // ── Payment Failed ─────────────────────────────
  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;

    try {
      const order = await Order.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });

      if (order) {
        order.paymentStatus = "failed";
        order.orderStatus = "cancelled";
        order.cancellationReason = "Payment failed";
        order.cancelledAt = new Date();
        await order.save();

        console.log(`❌ Order ${order.orderNumber} payment failed`);
      }
    } catch (error) {
      console.error("Webhook payment failed update error:", error.message);
    }
  }

  // Stripe ko 200 bhejo — warna retry karta rahega
  res.status(200).json({ received: true });
};
