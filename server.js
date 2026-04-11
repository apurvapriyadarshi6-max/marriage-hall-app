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
// Helmet helps secure your app by setting various HTTP headers
app.use(helmet({
    contentSecurityPolicy: false, // Disabled to allow external CDNs (RemixIcon/FullCalendar)
}));

// Gzip compression for faster loading
app.use(compression());

/* --- 2. CORS HARD-FIX (PREFLIGHT GUARD) --- */
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
});

app.use(cors()); 
app.use(express.json());

// Request Logger for Render Dashboard
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

/* --- 3. MONGODB CONNECTION WITH RECONNECT LOGIC --- */
const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;

const connectDB = async () => {
    try {
        if (!dbUri) throw new Error("Database URI is missing from ENV variables!");
        
        await mongoose.connect(dbUri, {
            serverSelectionTimeoutMS: 15000, 
            socketTimeoutMS: 45000,
        });
        console.log("✅ MongoDB Connected Successfully");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err.message);
        // Retry connection after 5 seconds if it fails
        setTimeout(connectDB, 5000);
    }
};
connectDB();

/* --- 4. STATIC ASSETS --- */
app.use(express.static(path.join(__dirname, "public")));

/* --- 5. API ROUTES --- */
// Health Check (Keeps Render instance awake)
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "UP", 
        db: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected" 
    });
});

const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api/bookings", bookingRoutes);

/* --- 6. CATCH-ALL FRONTEND ROUTING --- */
app.get("*", (req, res) => {
    // If an API request reaches here, it's a 404
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: "API Endpoint not found" });
    }
    
    const indexPath = path.join(__dirname, "public", "index.html");
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error("❌ index.html missing in public folder");
            res.status(404).send("Application Files Missing.");
        }
    });
});

/* --- 7. ERROR BOUNDARY --- */
app.use((err, req, res, next) => {
    console.error("🚨 CRITICAL ERROR:", err.message);
    res.status(500).json({ 
        success: false, 
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? err.message : null
    });
});

/* --- 8. START SERVER --- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Pandey Marriage Hall Backend live on port ${PORT}`);
});