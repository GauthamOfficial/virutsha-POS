const express = require("express");
const router = express.Router();
const {
  addOrder,
  previewBill,
  getOrders,
  getOrderById,
  voidOrder,
} = require("../controllers/orderController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");

router.route("/").post(isVerifiedUser, addOrder);
router.route("/").get(isVerifiedUser, getOrders);
router.route("/preview").post(isVerifiedUser, previewBill);
router.route("/:id").get(isVerifiedUser, getOrderById);
router.route("/:id/void").put(isVerifiedUser, isAdmin, voidOrder);

module.exports = router;
