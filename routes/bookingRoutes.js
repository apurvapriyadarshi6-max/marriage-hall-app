const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

/**
 * @route   GET /api/bookings
 * @desc    Fetch all bookings with optional Search and Month/Year filtering
 */
router.get("/", async (req, res) => {
    try {
        const { search, month, year } = req.query;
        let query = {};

        // 1. Advanced Search Logic (Name, ID, or Phone)
        if (search && search.trim() !== "") {
            const searchRegex = { $regex: search.trim(), $options: 'i' };
            query.$or = [
                { name: searchRegex },
                { bookingId: searchRegex },
                { phone: searchRegex },
                { occasion: searchRegex }
            ];
        }

        // 2. Filter Logic: specific Month and Year (matches YYYY-MM format)
        if (month && year) {
            const prefix = `${year}-${month.padStart(2, '0')}`;
            query.dateFrom = { $regex: `^${prefix}` }; 
        } else if (year) {
            // Filter by year only
            query.dateFrom = { $regex: `^${year}` };
        }

        const bookings = await Booking.find(query).sort({ dateFrom: 1 }); // Sorted by event date
        res.json(bookings);
    } catch (err) {
        console.error("Booking Fetch Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * @route   GET /api/bookings/:id
 * @desc    Get a single booking by ID (Crucial for the Edit Page)
 */
router.get("/:id", async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: "Booking not found" });
        res.json(booking);
    } catch (err) {
        res.status(500).json({ error: "Invalid Booking ID format" });
    }
});

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking with automatic balance calculation
 */
router.post("/", async (req, res) => {
    try {
        const { total, paid, name, phone, dateFrom } = req.body;
        
        // Basic Validation
        if (!name || !phone || !dateFrom) {
            return res.status(400).json({ error: "Name, Phone, and Date are required." });
        }

        // Generate a simple readable Booking ID if not provided (e.g., PMH-12345)
        const bookingId = req.body.bookingId || `PMH-${Math.floor(1000 + Math.random() * 9000)}`;

        const bookingData = {
            ...req.body,
            bookingId,
            remaining: (parseFloat(total) || 0) - (parseFloat(paid) || 0)
        };

        const newBooking = new Booking(bookingData);
        const savedBooking = await newBooking.save();
        res.status(201).json(savedBooking);
    } catch (err) {
        console.error("Save Error:", err);
        res.status(400).json({ error: err.message });
    }
});

/**
 * @route   PUT /api/bookings/:id
 * @desc    Update an existing booking & re-calculate balance
 */
router.put("/:id", async (req, res) => {
    try {
        const { total, paid } = req.body;
        
        // Find existing record first to ensure math is correct
        const current = await Booking.findById(req.params.id);
        if (!current) return res.status(404).json({ message: "Booking not found" });

        const updateData = { ...req.body };

        // Math Safety: Use new values if provided, otherwise fall back to current database values
        const finalTotal = total !== undefined ? parseFloat(total) : current.total;
        const finalPaid = paid !== undefined ? parseFloat(paid) : current.paid;
        
        updateData.remaining = (finalTotal || 0) - (finalPaid || 0);

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { 
                new: true, // Returns the updated object
                runValidators: true 
            }
        );

        res.json(updatedBooking);
    } catch (err) {
        console.error("Update Error:", err);
        res.status(400).json({ error: err.message });
    }
});

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Delete a booking permanently
 */
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Booking.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: "Booking not found" });
        res.json({ message: "Booking deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Could not delete booking" });
    }
});

module.exports = router;