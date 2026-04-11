require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const dns = require("dns");

// Fix for DNS issues on certain cloud hosts
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

/* --- 1. MIDDLEWARE --- */
app.use(express.json());

// Robust CORS configuration
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

/* --- 2. MONGODB --- */
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

/* --- 3. ROUTES --- */
// Health Check
app.get("/health", (req, res) => res.status(200).json({ status: "UP" }));

// API Mounting - ENSURE FOLDER NAMES ARE LOWERCASE
const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api/bookings", bookingRoutes);

/* --- 4. STATIC FILES & CATCH-ALL --- */
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
    // If it's an API request that wasn't caught, return JSON 404
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: "Endpoint not found" });
    }
    // Otherwise serve frontend
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* --- 5. START --- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server live on port ${PORT}`);
});