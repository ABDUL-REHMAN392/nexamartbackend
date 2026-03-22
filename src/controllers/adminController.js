import User from "../models/User.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

// GET /api/admin/dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // ── Users ─────────────────────────────────────
    const [totalUsers, newUsersThisMonth, newUsersLastMonth] =
      await Promise.all([
        User.countDocuments({ isActive: true }),
        User.countDocuments({ createdAt: { $gte: startOfMonth } }),
        User.countDocuments({
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        }),
      ]);

    // ── Orders ────────────────────────────────────
    const [totalOrders, ordersThisMonth, ordersLastMonth, ordersByStatus] =
      await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Order.countDocuments({
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        }),
        Order.aggregate([
          { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
        ]),
      ]);

    // ── Revenue ───────────────────────────────────
    const [totalRevenueData, revenueThisMonthData, revenueLastMonthData] =
      await Promise.all([
        Order.aggregate([
          { $match: { paymentStatus: "paid" } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
        Order.aggregate([
          {
            $match: {
              paymentStatus: "paid",
              createdAt: { $gte: startOfMonth },
            },
          },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
        Order.aggregate([
          {
            $match: {
              paymentStatus: "paid",
              createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
            },
          },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
      ]);

    const totalRevenue = totalRevenueData[0]?.total || 0;
    const revenueThisMonth = revenueThisMonthData[0]?.total || 0;
    const revenueLastMonth = revenueLastMonthData[0]?.total || 0;

    // ── Reviews ───────────────────────────────────
    const [totalReviews, reviewsThisMonth] = await Promise.all([
      Review.countDocuments({ isHidden: false }),
      Review.countDocuments({
        createdAt: { $gte: startOfMonth },
        isHidden: false,
      }),
    ]);

    // ── Recent Orders ─────────────────────────────
    const recentOrders = await Order.find()
      .populate("user", "name email avatar")
      .sort({ createdAt: -1 })
      .limit(5);

    // ── Monthly Revenue Chart (last 6 months) ─────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // ── Top Products ──────────────────────────────
    const topProducts = await Order.aggregate([
      { $match: { orderStatus: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          title: { $first: "$items.title" },
          image: { $first: "$items.image" },
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    // ── Growth % Calculate ────────────────────────
    const calcGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    };

    // ── Orders Status Map ─────────────────────────
    const statusMap = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    ordersByStatus.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    return successResponse(res, 200, "Dashboard stats retrieved", {
      overview: {
        totalUsers,
        totalOrders,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalReviews,
      },
      thisMonth: {
        newUsers: newUsersThisMonth,
        orders: ordersThisMonth,
        revenue: parseFloat(revenueThisMonth.toFixed(2)),
        reviews: reviewsThisMonth,
      },
      growth: {
        users: calcGrowth(newUsersThisMonth, newUsersLastMonth),
        orders: calcGrowth(ordersThisMonth, ordersLastMonth),
        revenue: calcGrowth(revenueThisMonth, revenueLastMonth),
      },
      ordersByStatus: statusMap,
      recentOrders,
      monthlyRevenue,
      topProducts,
    });
  } catch (error) {
    console.error("controller error:", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const skip = (page - 1) * limit;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -refreshToken -otp -otpExpiry")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return successResponse(res, 200, "Users retrieved", {
      users,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });
  } catch (error) {
    console.error("controller error:", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};

// PUT /api/admin/users/:id/toggle-active
export const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 404, "User not found");
    if (user.role === "admin")
      return errorResponse(res, 400, "Cannot deactivate admin account");

    user.isActive = !user.isActive;
    await user.save();

    return successResponse(
      res,
      200,
      user.isActive ? "User activated" : "User deactivated",
      { isActive: user.isActive },
    );
  } catch (error) {
    console.error("controller error:", error);
    return errorResponse(res, 500, "Something went wrong. Please try again.");
  }
};
