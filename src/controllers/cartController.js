import Cart from "../models/Cart.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const MAX_ITEMS = 20; // Cart mein max unique products
const MAX_QUANTITY = 10; // Ek product ki max quantity

// ─── Helper: Cart nikalo ya banao ─────────────────
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

// ─── Helper: Item validate karo ──────────────────
const validateItem = (body) => {
  const { productId, title, price, image, quantity } = body;

  if (!productId) return "Product ID is required";
  if (typeof productId !== "number" || productId <= 0)
    return "Invalid product ID";
  if (!title || !title.trim()) return "Product title is required";
  if (price === undefined || price === null) return "Product price is required";
  if (typeof price !== "number" || price < 0) return "Invalid product price";
  if (!image || !image.trim()) return "Product image is required";
  if (quantity !== undefined) {
    if (typeof quantity !== "number" || quantity < 1)
      return "Quantity must be at least 1";
    if (quantity > MAX_QUANTITY)
      return `Maximum quantity per item is ${MAX_QUANTITY}`;
  }

  return null; // No error
};

// GET /api/cart
export const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    return successResponse(res, 200, "Cart retrieved successfully", { cart });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/cart
// Item add karo — agar pehle se hai to quantity add karo
export const addToCart = async (req, res) => {
  try {
    const validationError = validateItem(req.body);
    if (validationError) return errorResponse(res, 400, validationError);

    const {
      productId,
      title,
      price,
      image,
      brand,
      category,
      rating,
      quantity = 1,
    } = req.body;

    const cart = await getOrCreateCart(req.user._id);

    // Pehle se hai?
    const existingIndex = cart.items.findIndex(
      (i) => i.productId === productId,
    );

    if (existingIndex > -1) {
      // Quantity add karo — max check
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (newQty > MAX_QUANTITY)
        return errorResponse(
          res,
          400,
          `Maximum quantity for this item is ${MAX_QUANTITY}`,
        );

      cart.items[existingIndex].quantity = newQty;
    } else {
      // Naya item — limit check
      if (cart.items.length >= MAX_ITEMS)
        return errorResponse(
          res,
          400,
          `Cart can have a maximum of ${MAX_ITEMS} different items`,
        );

      cart.items.push({
        productId,
        title: title.trim(),
        price,
        image: image.trim(),
        brand: brand?.trim() || "",
        category: category?.trim() || "",
        rating: rating || 0,
        quantity,
      });
    }

    await cart.save();
    return successResponse(res, 200, "Item added to cart", { cart });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// POST /api/cart/merge
// Login ke baad guest cart merge karo
export const mergeCart = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items))
      return errorResponse(res, 400, "Items array is required");
    if (items.length === 0) return errorResponse(res, 400, "No items to merge");
    if (items.length > MAX_ITEMS)
      return errorResponse(
        res,
        400,
        `Cannot merge more than ${MAX_ITEMS} items at once`,
      );

    // Validate karo sab items
    for (const item of items) {
      const error = validateItem(item);
      if (error)
        return errorResponse(
          res,
          400,
          `Invalid item (productId: ${item.productId}): ${error}`,
        );
    }

    const cart = await getOrCreateCart(req.user._id);

    // Har guest item ko merge karo
    for (const guestItem of items) {
      const existingIndex = cart.items.findIndex(
        (i) => i.productId === guestItem.productId,
      );

      if (existingIndex > -1) {
        // Same product — quantities add karo (max check)
        const newQty =
          cart.items[existingIndex].quantity + (guestItem.quantity || 1);
        cart.items[existingIndex].quantity = Math.min(newQty, MAX_QUANTITY);
      } else {
        // Naya item — limit check
        if (cart.items.length >= MAX_ITEMS) break; // Limit reach — baaki ignore

        cart.items.push({
          productId: guestItem.productId,
          title: guestItem.title.trim(),
          price: guestItem.price,
          image: guestItem.image.trim(),
          brand: guestItem.brand?.trim() || "",
          category: guestItem.category?.trim() || "",
          rating: guestItem.rating || 0,
          quantity: Math.min(guestItem.quantity || 1, MAX_QUANTITY),
        });
      }
    }

    await cart.save();

    return successResponse(res, 200, "Cart merged successfully", { cart });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};
