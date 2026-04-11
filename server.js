require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const path = require("path");
const compression = require("compression");

/**
 * FIX SRV DNS ISSUE
 * Crucial for MongoDB Atlas connectivity on cloud hosts like Render.
 */
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

/* --- 1. PRE-MIDDLEWARE (HARD FIX FOR CORS & PREFLIGHT) --- */
// This manual injection ensures headers are present even if the server is under load
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    // Handle Preflight (OPTIONS) requests immediately
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
});

app.use(compression());
app.use(cors()); // Secondary layer
app.use(express.json());

// Request Logger (Useful for Render Dashboard logs)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve static files from 'public'
app.use(express.static(path.join(__dirname, "public")));

/* --- 2. HEALTH CHECK (FOR MONITORING) --- */
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "Server is alive 🚀", 
        db: mongoose.connection.readyState === 1 ? "Connected" : "Connecting..." 
    });
});

/* --- 3. MONGODB CONNECTION --- */
const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;

const connectDB = async () => {
    try {
        if (!dbUri) throw new Error("Database URI is missing from ENV variables!");
        
        await mongoose.connect(dbUri, {
            serverSelectionTimeoutMS: 15000, 
        });
        console.log("✅ MongoDB Connected Successfully");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err.message);
    }
};
connectDB();

/* --- 4. API ROUTES --- */
const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api/bookings", bookingRoutes);

/* --- 5. FRONTEND ROUTING & ERROR PREVENTION --- */
app.get("*", (req, res) => {
    // PROTECT API: If a request starts with /api but isn't found, return JSON.
    // This prevents the "Unexpected token <" error by NOT sending index.html
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: "API Route Not Found" });
    }
    
    const indexPath = path.join(__dirname, "public", "index.html");
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error("❌ Frontend Files Missing:", err.message);
            res.status(404).send("Frontend missing: Ensure public/index.html exists.");
        }
    });
});

/* --- 6. GLOBAL ERROR HANDLING --- */
app.use((err, req, res, next) => {
    console.error("🚨 SERVER ERROR:", err.stack);
    res.status(500).json({ success: false, message: "Internal Server Error" });
});

/* --- 7. START SERVER --- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Pandey Marriage Hall Backend live on port ${PORT}`);
});