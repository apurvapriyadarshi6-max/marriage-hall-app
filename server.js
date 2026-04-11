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
 * Crucial for MongoDB Atlas connectivity on cloud hosts like Render.
 */
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

/* --- 1. SECURITY & PERFORMANCE --- */
app.use(helmet({
    contentSecurityPolicy: false, // Allows CDNs like RemixIcon/FullCalendar
    crossOriginEmbedderPolicy: false
}));

app.use(compression()); // Gzip compression for faster dashboard loading

/* --- 2. ADVANCED CORS CONFIGURATION --- */
const allowedOrigins = [
    "https://marriage-hall-app.onrender.com", // Your Frontend
    "http://localhost:5000",                  // Local Testing
    "http://127.0.0.1:5000"
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
    credentials: true
}));

app.use(express.json());

// Request Logger (Helpful for debugging Render logs)
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

/* --- 3. MONGODB CONNECTION --- */
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
        // Automatic retry after 5 seconds
        setTimeout(connectDB, 5000);
    }
};
connectDB();

/* --- 4. STATIC ASSETS --- */
app.use(express.static(path.join(__dirname, "public")));

/* --- 5. API ROUTES --- */
app.get("/health", (req, res) => {
    res.status(200).json({ 
        status: "UP", 
        db: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected" 
    });
});

const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api/bookings", bookingRoutes);

/* --- 6. FRONTEND ROUTING & ERROR PREVENTION --- */
app.get("*", (req, res) => {
    // If an API request reaches here, it's a true 404
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: "API Endpoint not found" });
    }
    
    // Serve the SPA frontend
    const indexPath = path.join(__dirname, "public", "index.html");
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.status(404).send("Frontend assets not found in public folder.");
        }
    });
});

/* --- 7. GLOBAL ERROR BOUNDARY --- */
app.use((err, req, res, next) => {
    console.error("🚨 SERVER ERROR:", err.message);
    res.status(500).json({ 
        success: false, 
        message: "Internal Server Error"
    });
});

/* --- 8. START SERVER --- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Pandey Marriage Hall Backend live on port ${PORT}`);
});