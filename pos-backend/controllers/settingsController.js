const { Settings, getSettings } = require("../models/settingsModel");

const fetchSettings = async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const allowed = [
      "restaurantName",
      "addressLine",
      "phone",
      "currencySymbol",
      "currencyCode",
      "taxRate",
      "taxLabel",
      "receiptFooter",
      "otherServicesTitle",
      "otherServices",
      "localLabel",
      "foreignLabel",
    ];

    const update = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    }

    if (update.taxRate !== undefined) {
      const rate = Number(update.taxRate);
      update.taxRate = Number.isFinite(rate) && rate >= 0 ? rate : 0;
    }

    await getSettings(); // make sure the document exists before updating
    const settings = await Settings.findOneAndUpdate({ key: "shop" }, update, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, message: "Settings saved!", data: settings });
  } catch (error) {
    next(error);
  }
};

module.exports = { fetchSettings, updateSettings };
