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
                { phone: searchRegex }
            ];
        }

        // 2. Filter Logic: specific Month and Year
        if (month && year && month !== "" && year !== "") {
            // Ensures prefix is YYYY-MM (e.g., 2026-04)
            const prefix = `${year}-${month.padStart(2, '0')}`;
            query.dateFrom = { $regex: `^${prefix}` }; 
        }

        const bookings = await Booking.find(query).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        console.error("Booking Fetch Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/**
 * @route   GET /api/bookings/:id
 * @desc    Get a single booking by ID
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
        const { total, paid } = req.body;
        
        // Server-side math safety
        const bookingData = {
            ...req.body,
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
        const updateData = { ...req.body };

        // If prices are being updated, re-calculate remaining balance
        if (total !== undefined || paid !== undefined) {
            // We fetch the current record if one value is missing to ensure correct math
            const current = await Booking.findById(req.params.id);
            if (current) {
                const newTotal = total !== undefined ? parseFloat(total) : current.total;
                const newPaid = paid !== undefined ? parseFloat(paid) : current.paid;
                updateData.remaining = newTotal - newPaid;
            }
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { 
                returnDocument: 'after', 
                runValidators: true 
            }
        );

        if (!updatedBooking) return res.status(404).json({ message: "Booking not found" });
        res.json(updatedBooking);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @route   DELETE /api/bookings/:id
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