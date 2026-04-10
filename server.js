require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const path = require("path");
const compression = require("compression");

/* FIX SRV DNS ISSUE (Crucial for Atlas connectivity on some hosts) */
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// 1. Initialize the app
const app = express();

/* --- 2. MIDDLEWARE --- */
app.use(compression()); // Shrinks data size for faster mobile loading
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

/* --- 3. MONGODB CONNECTION --- */
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from environment variables!");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Helps prevent the "10 minute" loading hang
      socketTimeoutMS: 45000,
    });
    console.log("✅ Pandey Marriage Hall DB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1); 
  }
};

connectDB();

/* --- 4. API ROUTES --- */
const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api/bookings", bookingRoutes);

/* --- 5. FRONTEND CATCH-ALL --- */
/** * This ensures that if you refresh the page on your mobile, 
 * it won't show a 404 error.
 */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* --- 6. GLOBAL ERROR HANDLING --- */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.stack);
  res.status(500).json({ 
    success: false,
    message: "Something went wrong on the server!",
    error: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message 
  });
});

/* --- 7. SERVER START --- */
const PORT = process.env.PORT || 5000;

// Listening on 0.0.0.0 is required for Render deployment
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server live on port ${PORT}`);
});