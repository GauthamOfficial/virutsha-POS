const createHttpError = require("http-errors");
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Dish = require("../models/dishModel");
const { getSettings } = require("../models/settingsModel");
const { nextSequence } = require("../models/counterModel");

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// The bill is always rebuilt on the server from the saved dish prices, so a
// tampered or stale browser can never change what gets charged or recorded.
const buildBill = async ({ items, customerType, discount }) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw createHttpError(400, "Add at least one item to the bill.");
  }

  const dishIds = items.map((i) => i.dish);
  if (dishIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    throw createHttpError(400, "One of the items is invalid.");
  }

  const dishes = await Dish.find({ _id: { $in: dishIds } });
  const dishMap = new Map(dishes.map((d) => [String(d._id), d]));

  const isForeigner = customerType === "Foreigner";
  const lineItems = [];

  for (const item of items) {
    const dish = dishMap.get(String(item.dish));
    if (!dish) throw createHttpError(400, "One of the items is no longer on the menu.");

    const quantity = Math.floor(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) {
      throw createHttpError(400, `Quantity for ${dish.name} must be at least 1.`);
    }

    const unitPrice = isForeigner ? dish.priceForeign : dish.priceLocal;

    lineItems.push({
      dish: dish._id,
      name: dish.name,
      unitPrice: round2(unitPrice),
      quantity,
      amount: round2(unitPrice * quantity),
    });
  }

  const settings = await getSettings();

  const subtotal = round2(lineItems.reduce((sum, i) => sum + i.amount, 0));

  let discountValue = Number(discount) || 0;
  if (discountValue < 0) discountValue = 0;
  if (discountValue > subtotal) discountValue = subtotal;
  discountValue = round2(discountValue);

  const taxable = round2(subtotal - discountValue);
  const taxRate = Number(settings.taxRate) || 0;
  const tax = round2((taxable * taxRate) / 100);
  const total = round2(taxable + tax);

  return {
    items: lineItems,
    bills: { subtotal, discount: discountValue, taxRate, tax, total },
  };
};

const addOrder = async (req, res, next) => {
  try {
    const {
      customerType,
      customerDetails = {},
      items,
      paymentMethod,
      discount,
      amountPaid,
      note,
    } = req.body;

    const type = customerType === "Foreigner" ? "Foreigner" : "Local";
    // Anything unrecognised falls back to Cash rather than being rejected.
    const method = ["Card", "QR"].includes(paymentMethod) ? paymentMethod : "Cash";

    const { items: lineItems, bills } = await buildBill({
      items,
      customerType: type,
      discount,
    });

    const paid = Number(amountPaid) || 0;
    const changeGiven = method === "Cash" && paid > bills.total ? round2(paid - bills.total) : 0;

    const invoiceNo = await nextSequence("invoice");

    const order = await Order.create({
      invoiceNo,
      customerType: type,
      customerDetails: {
        name: (customerDetails.name || "").trim() || "Walk-in",
        phone: (customerDetails.phone || "").trim(),
        guests: Number(customerDetails.guests) || 1,
      },
      items: lineItems,
      bills,
      paymentMethod: method,
      amountPaid: paid || bills.total,
      changeGiven,
      note: (note || "").trim(),
      cashier: req.user?._id,
      cashierName: req.user?.name || "",
    });

    res.status(201).json({ success: true, message: "Bill saved!", data: order });
  } catch (error) {
    next(error);
  }
};

// Lets the cashier see the running total (and re-priced items) before saving,
// using exactly the same maths the saved bill will use.
const previewBill = async (req, res, next) => {
  try {
    const { customerType, items, discount } = req.body;
    const type = customerType === "Foreigner" ? "Foreigner" : "Local";
    const bill = await buildBill({ items, customerType: type, discount });
    res.status(200).json({ success: true, data: { customerType: type, ...bill } });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const { from, to, search, paymentMethod, customerType } = req.query;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const page = Math.max(Number(req.query.page) || 1, 1);

    const filter = {};

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (customerType) filter.customerType = customerType;

    if (search) {
      const asNumber = Number(search);
      filter.$or = [
        { "customerDetails.name": { $regex: search, $options: "i" } },
        { "customerDetails.phone": { $regex: search, $options: "i" } },
      ];
      if (!Number.isNaN(asNumber)) filter.$or.push({ invoiceNo: asNumber });
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(createHttpError(404, "Bill not found."));
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// Admin-only. A bill is never deleted — it is marked void so the numbering and
// the paper trail stay intact, and it drops out of the sales figures.
const voidOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return next(createHttpError(404, "Bill not found."));
    if (order.isVoided) return next(createHttpError(400, "That bill is already voided."));

    order.isVoided = true;
    order.voidReason = (reason || "").trim();
    await order.save();

    res.status(200).json({ success: true, message: "Bill voided.", data: order });
  } catch (error) {
    next(error);
  }
};

module.exports = { addOrder, previewBill, getOrders, getOrderById, voidOrder };
