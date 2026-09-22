const express = require("express");
const router = express.Router();
const { getSalesReport, getOverview } = require("../controllers/reportController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");

router.route("/overview").get(isVerifiedUser, getOverview);
router.route("/sales").get(isVerifiedUser, isAdmin, getSalesReport);

module.exports = router;
