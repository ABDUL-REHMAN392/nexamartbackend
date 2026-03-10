import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import User from "../models/User.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const DELIVERY_FEE = 150; // Rs. 150 flat
const FREE_DELIVERY = 2000; // Rs. 2000 se upar free delivery

// ─── Cancellable statuses ─────────────────────────
const CANCELLABLE = ["pending", "processing"];

// GET /api/orders

export const getMyOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments({ user: req.user._id }),
    ]);

    return successResponse(res, 200, "Orders retrieved successfully", {
      orders,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// GET /api/orders/:orderId
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id, // Sirf apna order dekh sake
    });

    if (!order) return errorResponse(res, 404, "Order not found");

    return successResponse(res, 200, "Order retrieved successfully", { order });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/orders
export const placeOrder = async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    // ── Validations ────────────────────────────────
    if (!paymentMethod)
      return errorResponse(res, 400, "Payment method is required");
    if (!["cod", "stripe"].includes(paymentMethod))
      return errorResponse(res, 400, "Payment method must be cod or stripe");

    // Stripe abhi available nahi
    if (paymentMethod === "stripe")
      return errorResponse(
        res,
        400,
        "Stripe payments coming soon! Please use COD for now",
      );

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
        "Please add a delivery address before placing an order",
      );

    // ── Price Calculate ────────────────────────────
    const itemsTotal = parseFloat(
      cart.items
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
        .toFixed(2),
    );

    const deliveryFee = itemsTotal >= FREE_DELIVERY ? 0 : DELIVERY_FEE;
    const totalAmount = parseFloat((itemsTotal + deliveryFee).toFixed(2));

    // ── Items Snapshot ─────────────────────────────
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

    // ── Address Snapshot ───────────────────────────
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

    // ── Order Create ───────────────────────────────
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      deliveryAddress,
      itemsTotal,
      deliveryFee,
      discount: 0,
      totalAmount,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "pending",
    });

    // ── Cart Clear ─────────────────────────────────
    cart.items = [];
    await cart.save();

    return successResponse(res, 201, "Order placed successfully!", { order });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// PUT /api/orders/:orderId/cancel
export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id,
    });

    if (!order) return errorResponse(res, 404, "Order not found");

    // Cancel sirf pending/processing pe
    if (!CANCELLABLE.includes(order.orderStatus))
      return errorResponse(
        res,
        400,
        `Order cannot be cancelled. Current status: ${order.orderStatus}`,
      );

    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = reason?.trim() || "Cancelled by customer";

    await order.save();

    return successResponse(res, 200, "Order cancelled successfully", { order });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};
