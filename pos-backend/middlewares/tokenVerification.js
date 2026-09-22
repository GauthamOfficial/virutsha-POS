const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/userModel");

// Reads the token from the cookie (same-origin setup) or from an
// Authorization: Bearer header (works when the frontend and API sit on
// different domains, e.g. two Vercel projects).
const readToken = (req) => {
  if (req.cookies && req.cookies.accessToken) return req.cookies.accessToken;

  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);

  return null;
};

const isVerifiedUser = async (req, res, next) => {
  try {
    const token = readToken(req);
    if (!token) return next(createHttpError(401, "Please log in to continue."));

    const decoded = jwt.verify(token, config.accessTokenSecret);

    const user = await User.findById(decoded._id);
    if (!user) return next(createHttpError(401, "User no longer exists."));
    if (!user.isActive) return next(createHttpError(403, "This account is disabled."));

    req.user = user;
    next();
  } catch (error) {
    next(createHttpError(401, "Session expired. Please log in again."));
  }
};

// Attaches req.user when a valid token is present, but never blocks the
// request. Used by /register, which is open only while no user exists yet.
const attachUserIfPresent = async (req, res, next) => {
  try {
    const token = readToken(req);
    if (token) {
      const decoded = jwt.verify(token, config.accessTokenSecret);
      const user = await User.findById(decoded._id);
      if (user && user.isActive) req.user = user;
    }
  } catch (error) {
    // Ignore an invalid token here; the controller decides what to do.
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "Admin") {
    return next(createHttpError(403, "Only an Admin can do this."));
  }
  next();
};

module.exports = { isVerifiedUser, isAdmin, attachUserIfPresent };
