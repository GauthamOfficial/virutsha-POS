const createHttpError = require("http-errors");
const Category = require("../models/categoryModel");
const Dish = require("../models/dishModel");

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });

    // Attach a dish count so the menu tiles can show "6 Items".
    const counts = await Dish.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

    const data = categories.map((c) => ({
      ...c.toObject(),
      dishCount: countMap[String(c._id)] || 0,
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const addCategory = async (req, res, next) => {
  try {
    const { name, icon, bgColor, sortOrder } = req.body;
    if (!name || !name.trim()) return next(createHttpError(400, "Category name is required."));

    const exists = await Category.findOne({ name: name.trim() });
    if (exists) return next(createHttpError(400, "That category already exists."));

    const category = await Category.create({
      name: name.trim(),
      icon: icon || "🍽️",
      bgColor: bgColor || "#5b45b0",
      sortOrder: Number(sortOrder) || 0,
    });

    res.status(201).json({ success: true, message: "Category added!", data: category });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { name, icon, bgColor, sortOrder, isActive } = req.body;

    const update = {};
    if (name !== undefined) update.name = name.trim();
    if (icon !== undefined) update.icon = icon;
    if (bgColor !== undefined) update.bgColor = bgColor;
    if (sortOrder !== undefined) update.sortOrder = Number(sortOrder) || 0;
    if (isActive !== undefined) update.isActive = Boolean(isActive);

    const category = await Category.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!category) return next(createHttpError(404, "Category not found."));

    res.status(200).json({ success: true, message: "Category updated!", data: category });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const dishCount = await Dish.countDocuments({ category: req.params.id });
    if (dishCount > 0) {
      return next(
        createHttpError(
          400,
          `This category still has ${dishCount} dish(es). Move or delete them first.`
        )
      );
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return next(createHttpError(404, "Category not found."));

    res.status(200).json({ success: true, message: "Category deleted." });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCategories, addCategory, updateCategory, deleteCategory };
