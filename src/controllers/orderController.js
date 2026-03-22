import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import User from "../models/User.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import {
  emitNewOrder,
  emitOrderStatusUpdate,
  emitOrderCancelledByAdmin,
  emitOrderPlaced,
} from "../config/socket.js";

// ── Delivery tiers (USD) ──────────────────────────
const DELIVERY_TIERS = [
  { maxKg: 0.5, fee: 2.99 },
  { maxKg: 2, fee: 5.99 },
  { maxKg: 5, fee: 9.99 },
  { maxKg: Infinity, fee: 14.99 },
];
function calcDeliveryFee(totalWeightKg) {
  const tier = DELIVERY_TIERS.find((t) => totalWeightKg <= t.maxKg);
  return tier ? tier.fee : DELIVERY_TIERS[DELIVERY_TIERS.length - 1].fee;
}

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
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
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
      user: req.user._id,
    });
    if (!order) return errorResponse(res, 404, "Order not found");
    return successResponse(res, 200, "Order retrieved successfully", { order });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/orders — COD with weight-based delivery
export const placeOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0)
      return errorResponse(res, 400, "Your cart is empty");

    const user = await User.findById(req.user._id);
    if (!user.savedAddress?.city)
      return errorResponse(
        res,
        400,
        "Please add a delivery address before placing an order",
      );

    const totalWeightKg = parseFloat(
      cart.items
        .reduce((sum, i) => sum + (i.weight || 0) * i.quantity, 0)
        .toFixed(3),
    );

    const itemsTotal = parseFloat(
      cart.items.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2),
    );
    const deliveryFee = parseFloat(calcDeliveryFee(totalWeightKg).toFixed(2));
    const totalAmount = parseFloat((itemsTotal + deliveryFee).toFixed(2));

    const orderItems = cart.items.map((item) => ({
      productId: item.productId,
      title: item.title,
      price: item.price,
      image: item.image,
      brand: item.brand,
      category: item.category,
      weight: item.weight || 0,
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
    };

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      deliveryAddress,
      itemsTotal,
      deliveryFee,
      totalWeightKg,
      discount: 0,
      totalAmount,
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "pending",
    });

    cart.items = [];
    await cart.save();

    // Admin ko new order notify karo
    await emitNewOrder({ ...order.toObject(), user: { name: user.name } });
    // Customer ko order placed confirmation
    await emitOrderPlaced(order);

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

    if (!CANCELLABLE.includes(order.orderStatus))
      return errorResponse(
        res,
        400,
        `Order cannot be cancelled. Current status: ${order.orderStatus}`,
      );

    order.orderStatus = "cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = reason?.trim() || "Cancelled by customer";
    order.paymentStatus = "failed";

    await order.save();

    // Admin ko notify karo — socket + DB notification
    await emitOrderStatusUpdate(order);

    return successResponse(res, 200, "Order cancelled successfully", { order });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// ─── ADMIN ROUTES ─────────────────────────────────

// GET /api/orders/admin/all
export const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const search = req.query.search?.trim();
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.orderStatus = status;

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const userIds = users.map((u) => u._id);
      filter.$or = [
        { user: { $in: userIds } },
        { orderNumber: { $regex: search, $options: "i" } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return successResponse(res, 200, "Orders retrieved successfully", {
      orders,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// PUT /api/orders/admin/:orderId/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!status) return errorResponse(res, 400, "Status is required");
    if (!validStatuses.includes(status))
      return errorResponse(
        res,
        400,
        `Invalid status. Must be: ${validStatuses.join(", ")}`,
      );

    const order = await Order.findById(req.params.orderId);
    if (!order) return errorResponse(res, 404, "Order not found");

    if (order.orderStatus === "cancelled")
      return errorResponse(res, 400, "Cancelled orders cannot be updated");

    // ── Admin Cancel ──────────────────────────────
    if (status === "cancelled") {
      order.orderStatus = "cancelled";
      order.cancelledAt = new Date();
      order.cancellationReason = reason?.trim() || "Cancelled by admin";
      order.paymentStatus =
        order.paymentStatus === "paid" ? "refunded" : "failed";

      await order.save();

      const refundInfo =
        order.paymentStatus === "refunded"
          ? {
              message:
                "COD order was already paid — cash refund to be handled manually.",
            }
          : null;

      // Customer ko notify karo — socket + DB notification
      await emitOrderCancelledByAdmin(order, refundInfo);

      return successResponse(res, 200, "Order cancelled by admin", {
        order,
        refund: refundInfo,
      });
    }

    // ── Normal Status Flow ─────────────────────────
    const statusFlow = ["pending", "processing", "shipped", "delivered"];
    const currentIndex = statusFlow.indexOf(order.orderStatus);
    const newIndex = statusFlow.indexOf(status);

    if (newIndex !== -1 && newIndex < currentIndex)
      return errorResponse(
        res,
        400,
        `Cannot move order back from ${order.orderStatus} to ${status}`,
      );

    order.orderStatus = status;

    if (status === "delivered") {
      order.deliveredAt = new Date();
      order.paymentStatus = "paid";
    }

    await order.save();

    // Customer + admin ko notify karo
    await emitOrderStatusUpdate(order);

    return successResponse(res, 200, "Order status updated", { order });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};
