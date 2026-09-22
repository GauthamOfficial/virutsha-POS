require("dotenv").config();

const config = Object.freeze({
  port: process.env.PORT || 8000,
  databaseURI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/virutsha-pos",
  nodeEnv: process.env.NODE_ENV || "development",
  accessTokenSecret: process.env.JWT_SECRET || "dev-only-insecure-secret",

  // Comma separated list of frontend origins allowed to call this API.
  clientUrls: (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),

  seedAdmin: {
    name: process.env.SEED_ADMIN_NAME || "Admin",
    email: process.env.SEED_ADMIN_EMAIL || "admin@virutsha.lk",
    phone: process.env.SEED_ADMIN_PHONE || "0770000000",
    password: process.env.SEED_ADMIN_PASSWORD || "admin123",
  },
});

module.exports = config;
