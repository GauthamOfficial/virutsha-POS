const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getUserData,
  logout,
  getSetupStatus,
  getStaff,
  updateStaff,
  deleteStaff,
} = require("../controllers/userController");
const {
  isVerifiedUser,
  isAdmin,
  attachUserIfPresent,
} = require("../middlewares/tokenVerification");

router.route("/setup-status").get(getSetupStatus);

// Open only while the shop has no users yet; after that the controller
// requires an Admin token.
router.route("/register").post(attachUserIfPresent, register);
router.route("/login").post(login);
router.route("/logout").post(isVerifiedUser, logout);

router.route("/").get(isVerifiedUser, getUserData);

// Staff management (Admin only)
router.route("/staff").get(isVerifiedUser, isAdmin, getStaff);
router.route("/staff/:id").put(isVerifiedUser, isAdmin, updateStaff);
router.route("/staff/:id").delete(isVerifiedUser, isAdmin, deleteStaff);

module.exports = router;
