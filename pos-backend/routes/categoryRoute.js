const express = require("express");
const router = express.Router();
const {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");

router.route("/").get(isVerifiedUser, getCategories);
router.route("/").post(isVerifiedUser, isAdmin, addCategory);
router.route("/:id").put(isVerifiedUser, isAdmin, updateCategory);
router.route("/:id").delete(isVerifiedUser, isAdmin, deleteCategory);

module.exports = router;
