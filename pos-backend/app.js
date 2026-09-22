const path = require("path");
const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/database");
const config = require("./config/config");
const globalErrorHandler = require("./middlewares/globalErrorHandler");

const app = express();

// Menu photos travel as base64 inside the JSON body, so the default 100kb
// limit is far too small.
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "8mb" }));
app.use(cookieParser());

app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      // Allow same-origin / tools with no Origin header (curl, health checks).
      if (!origin) return callback(null, true);
      if (config.clientUrls.includes(origin)) return callback(null, true);

      // Any localhost port is fine in development, so the laptop setup does
      // not break if Vite picks a different port.
      if (config.nodeEnv !== "production" && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
  })
);

// Open the database connection on every request. connectDB caches it, so this
// is a no-op once connected and keeps things working on serverless hosts.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "ok", time: new Date().toISOString() });
});

app.use("/api/user", require("./routes/userRoute"));
app.use("/api/category", require("./routes/categoryRoute"));
app.use("/api/dish", require("./routes/dishRoute"));
app.use("/api/order", require("./routes/orderRoute"));
app.use("/api/report", require("./routes/reportRoute"));
app.use("/api/settings", require("./routes/settingsRoute"));

app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// On the laptop the built frontend is served by this same server, so the whole
// POS lives on one address (http://localhost:8000) with no CORS and no second
// terminal window. If the frontend has not been built, this is skipped.
const frontendDist = path.join(__dirname, "..", "pos-frontend", "dist");

if (fs.existsSync(path.join(frontendDist, "index.html"))) {
  app.use(express.static(frontendDist));

  // Any address that is not an API call hands back the app, so refreshing the
  // page on /bills or /reports works instead of 404ing.
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Virutsha POS API is running. Build the frontend to serve it from here.",
    });
  });
}

app.use(globalErrorHandler);

// Only listen when run directly. When Vercel imports this file it just wants
// the app object.
if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`☑️  Virutsha POS server listening on http://localhost:${config.port}`);
  });
}

module.exports = app;
