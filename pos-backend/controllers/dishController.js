const createHttpError = require("http-errors");
const Dish = require("../models/dishModel");
const Category = require("../models/categoryModel");

// Images arrive as data URLs from the admin form. Cap the size so one photo
// can never bloat a document past what MongoDB will accept.
const MAX_IMAGE_CHARS = 700 * 1024; // ~500 KB of binary once base64 is decoded

const validateImage = (image) => {
  if (!image) return null;
  if (!/^data:image\/(png|jpe?g|webp|gif);base64,/.test(image)) {
    return "Image must be a PNG, JPG, WEBP or GIF file.";
  }
  if (image.length > MAX_IMAGE_CHARS) {
    return "Image is too large. Please choose a smaller photo.";
  }
  return null;
};

const parsePrice = (value, label) => {
  const num = Number(value);
  if (value === undefined || value === null || value === "" || Number.isNaN(num) || num < 0) {
    return { error: `${label} must be a number of 0 or more.` };
  }
  return { value: Math.round(num * 100) / 100 };
};

const getDishes = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.availableOnly === "true") filter.isAvailable = true;

    const dishes = await Dish.find(filter)
      .populate("category", "name icon bgColor")
      .sort({ sortOrder: 1, name: 1 });

    res.status(200).json({ success: true, data: dishes });
  } catch (error) {
    next(error);
  }
};

const getDishById = async (req, res, next) => {
  try {
    const dish = await Dish.findById(req.params.id).populate("category", "name icon bgColor");
    if (!dish) return next(createHttpError(404, "Dish not found."));
    res.status(200).json({ success: true, data: dish });
  } catch (error) {
    next(error);
  }
};

const addDish = async (req, res, next) => {
  try {
    const { name, description, category, priceLocal, priceForeign, image, isAvailable, sortOrder } =
      req.body;

    if (!name || !name.trim()) return next(createHttpError(400, "Dish name is required."));
    if (!category) return next(createHttpError(400, "Please choose a category."));

    const categoryExists = await Category.findById(category);
    if (!categoryExists) return next(createHttpError(400, "That category does not exist."));

    const local = parsePrice(priceLocal, "Local price");
    if (local.error) return next(createHttpError(400, local.error));

    const foreign = parsePrice(priceForeign, "Foreigner price");
    if (foreign.error) return next(createHttpError(400, foreign.error));

    const imageError = validateImage(image);
    if (imageError) return next(createHttpError(400, imageError));

    const dish = await Dish.create({
      name: name.trim(),
      description: (description || "").trim(),
      category,
      priceLocal: local.value,
      priceForeign: foreign.value,
      image: image || "",
      isAvailable: isAvailable === undefined ? true : Boolean(isAvailable),
      sortOrder: Number(sortOrder) || 0,
    });

    const populated = await dish.populate("category", "name icon bgColor");
    res.status(201).json({ success: true, message: "Dish added!", data: populated });
  } catch (error) {
    next(error);
  }
};

const updateDish = async (req, res, next) => {
  try {
    const { name, description, category, priceLocal, priceForeign, image, isAvailable, sortOrder } =
      req.body;

    const update = {};

    if (name !== undefined) {
      if (!name.trim()) return next(createHttpError(400, "Dish name is required."));
      update.name = name.trim();
    }
    if (description !== undefined) update.description = description.trim();

    if (category !== undefined) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) return next(createHttpError(400, "That category does not exist."));
      update.category = category;
    }

    if (priceLocal !== undefined) {
      const local = parsePrice(priceLocal, "Local price");
      if (local.error) return next(createHttpError(400, local.error));
      update.priceLocal = local.value;
    }

    if (priceForeign !== undefined) {
      const foreign = parsePrice(priceForeign, "Foreigner price");
      if (foreign.error) return next(createHttpError(400, foreign.error));
      update.priceForeign = foreign.value;
    }

    if (image !== undefined) {
      const imageError = validateImage(image);
      if (imageError) return next(createHttpError(400, imageError));
      update.image = image || "";
    }

    if (isAvailable !== undefined) update.isAvailable = Boolean(isAvailable);
    if (sortOrder !== undefined) update.sortOrder = Number(sortOrder) || 0;

    const dish = await Dish.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate("category", "name icon bgColor");

    if (!dish) return next(createHttpError(404, "Dish not found."));

    res.status(200).json({ success: true, message: "Dish updated!", data: dish });
  } catch (error) {
    next(error);
  }
};

const deleteDish = async (req, res, next) => {
  try {
    const dish = await Dish.findByIdAndDelete(req.params.id);
    if (!dish) return next(createHttpError(404, "Dish not found."));
    res.status(200).json({ success: true, message: "Dish deleted." });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDishes, getDishById, addDish, updateDish, deleteDish };
