require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const path = require("path");
const compression = require("compression");

/* * FIX SRV DNS ISSUE 
 * Crucial for MongoDB Atlas connectivity on cloud hosts like Render.
 */
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();

/* --- 1. HEALTH CHECK (MUST BE TOP) --- */
// This is now at the very top to bypass all other logic.
app.get("/health", (req, res) => {
    res.status(200).send("Server is running! 🚀");
});

/* --- 2. MIDDLEWARE --- */
app.use(compression());
app.use(cors({
    origin: '*', // Allows all origins (Netlify, localhost, etc.)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Log every request to Render logs so we can debug "Not Found" errors
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve static files from the 'public' folder
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
const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api/bookings", bookingRoutes);

/* --- 5. FRONTEND CATCH-ALL (MUST BE BOTTOM) --- */
/** * If no API route or static file is found, send index.html.
 * This handles PWA/Netlify routing.
 */
app.get("*", (req, res) => {
    const indexPath = path.join(__dirname, "public", "index.html");
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error("❌ Failed to send index.html:", err.message);
            res.status(404).send("Front-end files missing or index.html not found in public folder.");
        }
    });
});

/* --- 6. GLOBAL ERROR HANDLING --- */
app.use((err, req, res, next) => {
    console.error("🚨 SERVER ERROR:", err.stack);
    res.status(500).json({ success: false, message: "Internal Server Error" });
});

/* --- 7. SERVER START --- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Pandey Marriage Hall Server live on port ${PORT}`);
});