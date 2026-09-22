const mongoose = require("mongoose");

const dishSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // The two prices. Both are stored on every dish so the cashier can switch
    // between Local and Foreigner pricing at any moment without re-entering items.
    priceLocal: { type: Number, required: true, min: 0 },
    priceForeign: { type: Number, required: true, min: 0 },

    // Image is kept as a compressed data URL (base64) so it works the same on a
    // laptop with no internet and on a serverless host with no writable disk.
    image: { type: String, default: "" },

    isAvailable: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

dishSchema.index({ category: 1, sortOrder: 1 });

module.exports = mongoose.models.Dish || mongoose.model("Dish", dishSchema);
