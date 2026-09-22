const mongoose = require("mongoose");
const config = require("./config");

// Cached across invocations so a serverless host (Vercel) reuses one connection
// instead of opening a new one for every request.
let cached = global.__mongooseConn;
if (!cached) cached = global.__mongooseConn = { conn: null, promise: null };

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(config.databaseURI, {
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => {
        console.log(`✅ MongoDB connected: ${m.connection.host}/${m.connection.name}`);
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.log(`❌ Database connection failed: ${error.message}`);
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;
