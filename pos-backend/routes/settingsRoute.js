const express = require("express");
const router = express.Router();
const { fetchSettings, updateSettings } = require("../controllers/settingsController");
const { isVerifiedUser, isAdmin } = require("../middlewares/tokenVerification");

router.route("/").get(isVerifiedUser, fetchSettings);
router.route("/").put(isVerifiedUser, isAdmin, updateSettings);

module.exports = router;
