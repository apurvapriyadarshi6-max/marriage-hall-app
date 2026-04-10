require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
const path = require("path");
const compression = require("compression");

/* FIX SRV DNS ISSUE (Crucial for Atlas connectivity on some hosts) */
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// 1. Initialize the app FIRST
const app = express();

/* --- 2. SECURITY MIDDLEWARE --- */
// Now that 'app' is initialized, we can use it.
app.use((req, res, next) => {
    const secretKey = "Pandey786"; 
    
    // Check if the URL has the key, or if it's an API call, or if it's a file (like .css or .js)
    if (
        req.query.key === secretKey || 
        req.path.includes('/api') || 
        req.path.includes('.') || 
        (req.get('Referer') && req.get('Referer').includes(`key=${secretKey}`))
    ) {
        next();
    } else {
        // Styled error message for unauthorized users
        res.status(403).send(`
            <div style="text-align:center; padding:50px; font-family:sans-serif;">
                <h1 style="color:#b01e23;">Unauthorized Access</h1>
                <p>Please use your private link to access the Pandey Marriage Hall Manager.</p>
            </div>
        `);
    }
});

/* --- 3. MIDDLEWARE --- */
app.use(compression()); 
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

/* --- 4. MONGODB CONNECTION --- */
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from environment variables!");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Increased to 30s to help with slow connections
      socketTimeoutMS: 45000,
    });
    console.log("✅ Pandey Marriage Hall DB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1); 
  }
};

connectDB();

/* --- 5. API ROUTES --- */
const bookingRoutes = require("./routes/bookingRoutes");
app.use("/api/bookings", bookingRoutes);

/* --- 6. FRONTEND CATCH-ALL --- */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* --- 7. GLOBAL ERROR HANDLING --- */
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err.stack);
  res.status(500).json({ 
    success: false,
    message: "Something went wrong on the server!",
    error: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message 
  });
});

/* --- 8. SERVER START --- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server live on port ${PORT}`);
});