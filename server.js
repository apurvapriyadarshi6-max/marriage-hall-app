require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const path = require("path");
const compression = require("compression");

/* FIX SRV DNS ISSUE */
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

/* --- 2. MIDDLEWARE --- */
app.use(compression());
// UPDATED: More explicit CORS to handle mobile/Netlify requests
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

/* --- 3. MONGODB CONNECTION --- */
const connectDB = async () => {
  try {
    const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!dbUri) {
      console.error("❌ Database URI is missing from Render Variables!");
      return;
    }

    await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Pandey Marriage Hall DB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
  }
};

connectDB();

/* --- 4. API ROUTES --- */
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
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

/* --- 7. SERVER START --- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server live on port ${PORT}`);
});