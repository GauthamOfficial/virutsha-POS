const express = require("express");
const router = express.Router();
const {
  getDishes,
  getDishById,
  addDish,
  updateDish,
  deleteDish,
} = require("../controllers/dishController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");

router.route("/").get(isVerifiedUser, getDishes);
router.route("/").post(isVerifiedUser, isAdmin, addDish);
router.route("/:id").get(isVerifiedUser, getDishById);
router.route("/:id").put(isVerifiedUser, isAdmin, updateDish);
router.route("/:id").delete(isVerifiedUser, isAdmin, deleteDish);

module.exports = router;
