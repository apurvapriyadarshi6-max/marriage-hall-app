require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const path = require("path");
const compression = require("compression");

/* FIX SRV DNS ISSUE (Crucial for Atlas connectivity on some hosts) */
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

/* --- 2. MIDDLEWARE --- */
app.use(compression());
app.use(cors()); // Allows Netlify to talk to this server
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

/* --- 3. MONGODB CONNECTION --- */
const connectDB = async () => {
  try {
    // FIX: Check both common names for the connection string
    const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!dbUri) {
      throw new Error("Database URI is missing from Render Environment Variables!");
    }

    await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Pandey Marriage Hall DB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    // Don't exit immediately on Render, let it retry
  }
};

connectDB();

/* --- 4. API ROUTES --- */
// Quick health check route to verify server is up
app.get("/health", (req, res) => res.send("Server is running! 🚀"));

const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api/bookings", bookingRoutes);

/* --- 5. FRONTEND CATCH-ALL --- */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* --- 6. GLOBAL ERROR HANDLING --- */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.stack);
  res.status(500).json({ 
    success: false,
    message: "Something went wrong on the server!",
  });
});

/* --- 7. SERVER START --- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server live on port ${PORT}`);
});