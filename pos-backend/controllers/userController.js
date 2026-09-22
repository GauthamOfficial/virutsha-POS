const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const config = require("../config/config");

const signToken = (user) =>
  jwt.sign({ _id: user._id }, config.accessTokenSecret, { expiresIn: "30d" });

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isActive: user.isActive,
});

// Creating staff accounts. The very first account ever created becomes the
// Admin (so the shop can get started); every account after that must be
// created by a logged-in Admin.
const register = async (req, res, next) => {
  try {
    const { name, phone, email, password, role } = req.body;

    if (!name || !phone || !email || !password) {
      return next(createHttpError(400, "Name, phone, email and password are required."));
    }
    if (String(password).length < 6) {
      return next(createHttpError(400, "Password must be at least 6 characters."));
    }

    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    if (!isFirstUser) {
      if (!req.user) return next(createHttpError(401, "Please log in as an Admin to add staff."));
      if (req.user.role !== "Admin") return next(createHttpError(403, "Only an Admin can add staff."));
    }

    const exists = await User.findOne({ email: String(email).toLowerCase() });
    if (exists) return next(createHttpError(400, "That email is already registered."));

    const newUser = await User.create({
      name,
      phone,
      email,
      password,
      role: isFirstUser ? "Admin" : role === "Admin" ? "Admin" : "Cashier",
    });

    res.status(201).json({
      success: true,
      message: isFirstUser ? "Admin account created!" : "Staff account created!",
      data: publicUser(newUser),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(createHttpError(400, "Email and password are required."));
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return next(createHttpError(401, "Invalid email or password."));
    if (!user.isActive) return next(createHttpError(403, "This account is disabled."));

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return next(createHttpError(401, "Invalid email or password."));

    const accessToken = signToken(user);
    const isProd = config.nodeEnv === "production";

    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
    });

    res.status(200).json({
      success: true,
      message: "Logged in successfully!",
      // Also returned so the frontend can store it and send it as a Bearer
      // token — needed when the site and API are on different domains.
      token: accessToken,
      data: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const getUserData = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: publicUser(req.user) });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie("accessToken");
    res.status(200).json({ success: true, message: "Logged out." });
  } catch (error) {
    next(error);
  }
};

// Used by the login screen to show "create the first Admin" instead of a
// login form on a brand new installation.
const getSetupStatus = async (req, res, next) => {
  try {
    const userCount = await User.countDocuments();
    res.status(200).json({ success: true, data: { needsSetup: userCount === 0 } });
  } catch (error) {
    next(error);
  }
};

const getStaff = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: users.map(publicUser) });
  } catch (error) {
    next(error);
  }
};

const updateStaff = async (req, res, next) => {
  try {
    const { name, phone, role, isActive, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return next(createHttpError(404, "Staff member not found."));

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role === "Admin" ? "Admin" : "Cashier";
    if (isActive !== undefined) user.isActive = Boolean(isActive);
    if (password) {
      if (String(password).length < 6) {
        return next(createHttpError(400, "Password must be at least 6 characters."));
      }
      user.password = password;
    }

    // Never let the shop lock itself out of the admin area.
    if (user.role !== "Admin" || user.isActive === false) {
      const activeAdmins = await User.countDocuments({
        role: "Admin",
        isActive: true,
        _id: { $ne: user._id },
      });
      if (activeAdmins === 0) {
        return next(createHttpError(400, "There must be at least one active Admin."));
      }
    }

    await user.save();
    res.status(200).json({ success: true, message: "Staff updated.", data: publicUser(user) });
  } catch (error) {
    next(error);
  }
};

const deleteStaff = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(createHttpError(404, "Staff member not found."));

    const activeAdmins = await User.countDocuments({
      role: "Admin",
      isActive: true,
      _id: { $ne: user._id },
    });
    if (activeAdmins === 0) {
      return next(createHttpError(400, "There must be at least one active Admin."));
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: "Staff removed." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getUserData,
  logout,
  getSetupStatus,
  getStaff,
  updateStaff,
  deleteStaff,
};
