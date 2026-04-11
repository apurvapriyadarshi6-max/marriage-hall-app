/* =========================================
   Pandey Marriage Hall - UNIFIED SERVER
   File: server.js
   ========================================= */
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");

/**
 * FIX SRV DNS ISSUE
 * Mandatory for MongoDB Atlas connectivity on Render.
 */
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

/* --- 1. SECURITY & PERFORMANCE --- */
app.use(helmet({
    contentSecurityPolicy: false, // Allows CDNs like RemixIcon/FullCalendar
    crossOriginEmbedderPolicy: false
}));

app.use(compression()); // Gzip compression for faster dashboard loading
app.use(express.json());

// Unified CORS: Allow all because we are now Same-Origin, 
// but still good for local dev testing.
app.use(cors());

// Request Logger (Helpful for debugging Render logs)
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

/* --- 2. MONGODB CONNECTION --- */
const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;

const connectDB = async () => {
    try {
        if (!dbUri) throw new Error("Database URI is missing from ENV!");
        
        await mongoose.connect(dbUri, {
            serverSelectionTimeoutMS: 15000, 
            socketTimeoutMS: 45000,
        });
        console.log("✅ MongoDB Connected Successfully");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err.message);
        setTimeout(connectDB, 5000); // Retry every 5s
    }
};
connectDB();

/* --- 3. STATIC ASSETS & API --- */
// Serve everything inside the /public folder (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// API Routes
const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api/bookings", bookingRoutes);

// Health Check
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "UP", 
        db: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected" 
    });
});

/* --- 4. CATCH-ALL ROUTING --- */
app.get("*", (req, res) => {
    // If an API request reaches here, it's a true 404
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: "API Endpoint not found" });
    }
    
    // Serve index.html for any other request (SPA Support)
    const indexPath = path.join(__dirname, "public", "index.html");
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error("❌ index.html missing in public folder");
            res.status(404).send("Application Files Missing.");
        }
    });
});

/* --- 5. GLOBAL ERROR BOUNDARY --- */
app.use((err, req, res, next) => {
    console.error("🚨 SERVER ERROR:", err.message);
    res.status(500).json({ 
        success: false, 
        message: "Internal Server Error"
    });
});

/* --- 6. START SERVER --- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Pandey Marriage Hall Backend live on port ${PORT}`);
});