const mongoose = require("mongoose");

// Single document holding shop-wide settings (receipt header, tax, currency).
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "shop", unique: true },

    restaurantName: { type: String, default: "VISA Tamil Kitchen" },
    addressLine: { type: String, default: "Sigiriya Road, Pothana, Kimbissa" },
    phone: { type: String, default: "+94 70 644 5506 / +94 71 778 5189" },

    currencySymbol: { type: String, default: "Rs" },
    currencyCode: { type: String, default: "LKR" },

    // 0 means no tax line is printed on the bill.
    taxRate: { type: Number, default: 0, min: 0 },
    taxLabel: { type: String, default: "Service Charge" },

    receiptFooter: { type: String, default: "Thank you! Please come again." },

    localLabel: { type: String, default: "Local" },
    foreignLabel: { type: String, default: "Foreigner" },
  },
  { timestamps: true }
);

const Settings = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);

// Always returns the single settings document, creating it on first use.
const getSettings = async () => {
  let settings = await Settings.findOne({ key: "shop" });
  if (!settings) settings = await Settings.create({ key: "shop" });
  return settings;
};

module.exports = { Settings, getSettings };
