const config = require("../config/config");

const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Something went wrong.";

  // Turn mongoose problems into messages a shop owner can act on.
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(" ");
  } else if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "value";
    message = `That ${field} is already used.`;
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid id.";
  }

  if (statusCode >= 500) console.error(err);

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    errorStack: config.nodeEnv === "development" ? err.stack : undefined,
  });
};

module.exports = globalErrorHandler;
