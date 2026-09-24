const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    dish: { type: mongoose.Schema.Types.ObjectId, ref: "Dish" },
    name: { type: String, required: true },
    // The unit price actually charged, already resolved from the customer type.
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },

    // Discount on this line only, as a percentage of its own value.
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },

    // unitPrice x quantity, before this line's discount.
    grossAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },

    // What this line actually adds to the bill, after its own discount.
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Human-friendly bill number printed on the receipt.
    invoiceNo: { type: Number, unique: true, index: true },

    // Drives which of the two prices was used for this whole bill.
    customerType: {
      type: String,
      enum: ["Local", "Foreigner"],
      default: "Local",
      required: true,
    },

    customerDetails: {
      name: { type: String, default: "Walk-in" },
      phone: { type: String, default: "" },
      guests: { type: Number, default: 1 },
    },

    items: { type: [orderItemSchema], required: true },

    bills: {
      // Before any discount of either kind.
      subtotal: { type: Number, required: true, min: 0 },

      // Taken off individual lines, as a percentage of each.
      itemDiscount: { type: Number, default: 0, min: 0 },

      // Taken off the bill as a whole, as a flat amount.
      discount: { type: Number, default: 0, min: 0 },
      taxRate: { type: Number, default: 0, min: 0 },
      tax: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "QR"],
      default: "Cash",
      required: true,
    },
    amountPaid: { type: Number, default: 0, min: 0 },
    changeGiven: { type: Number, default: 0, min: 0 },

    note: { type: String, default: "" },

    cashier: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cashierName: { type: String, default: "" },

    // Kept so a mistaken bill can be voided without losing the record.
    isVoided: { type: Boolean, default: false },
    voidReason: { type: String, default: "" },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
