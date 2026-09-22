const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    icon: { type: String, default: "🍽️" },
    bgColor: { type: String, default: "#5b45b0" },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Category || mongoose.model("Category", categorySchema);
