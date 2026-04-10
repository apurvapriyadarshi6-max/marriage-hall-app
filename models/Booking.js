const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  email: { type: String, trim: true },
  address: String,
  occasion: String,
  
  // Dates and Times
  dateFrom: { type: String, required: true },
  dateTo: String,
  timeFrom: String,
  timeTo: String,

  // Breakdown of Costs
  hallPrice: { type: Number, default: 0 },
  rooms: { type: Number, default: 0 },
  roomPrice: { type: Number, default: 0 },
  
  // Array to store extra services (Catering, Decoration, etc.)
  extraRequirements: [
    {
      desc: String,
      price: Number,
    }
  ],

  // Final Financials
  total: {
    type: Number,
    default: 0,
  },
  paid: {
    type: Number,
    default: 0,
  },
  remaining: {
    type: Number,
    default: 0,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

/**
 * AUTO-GENERATE bookingId BEFORE SAVING
 * FIXED: Removed 'next' to prevent "TypeError: next is not a function"
 */
BookingSchema.pre("save", async function () {
  const booking = this;

  // 1. Calculate Remaining Amount automatically
  booking.remaining = (booking.total || 0) - (booking.paid || 0);

  // 2. Generate permanent Booking ID only for new records
  if (booking.isNew && !booking.bookingId) {
    try {
      const year = new Date().getFullYear();
      
      // We search for the total count of documents
      const count = await mongoose.model("Booking").countDocuments();
      
      // Format: PMH-2026-001
      booking.bookingId = `PMH-${year}-${String(count + 1).padStart(3, "0")}`;
      
    } catch (err) {
      // In async middleware, throwing the error tells Mongoose something went wrong
      throw err;
    }
  }
});

module.exports = mongoose.model("Booking", BookingSchema);