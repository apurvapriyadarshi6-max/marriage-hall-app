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
  
  // Dates and Times (Stored as strings for easy PWA/Frontend manipulation)
  dateFrom: { type: String, required: true },
  dateTo: String,
  timeFrom: String,
  timeTo: String,

  // Breakdown of Costs
  hallPrice: { type: Number, default: 0 },
  rooms: { type: Number, default: 0 },
  roomPrice: { type: Number, default: 0 },
  
  // Array for extra services
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
 * PRE-SAVE HOOK
 * Automatically handles financials and unique ID generation
 */
BookingSchema.pre("save", async function () {
  const booking = this;

  // 1. Always sync the remaining balance
  booking.remaining = (booking.total || 0) - (booking.paid || 0);

  // 2. Generate permanent Booking ID only for new records
  if (booking.isNew && !booking.bookingId) {
    try {
      const year = new Date().getFullYear();
      
      // IMPROVED LOGIC: Find the most recently created booking to get the last ID
      // This prevents duplicate IDs if a middle record was deleted
      const lastBooking = await mongoose.model("Booking")
        .findOne({}, { bookingId: 1 })
        .sort({ createdAt: -1 });

      let nextNumber = 1;

      if (lastBooking && lastBooking.bookingId) {
        // Extract the number from 'PMH-2026-005' -> 5
        const lastIdParts = lastBooking.bookingId.split('-');
        const lastNumber = parseInt(lastIdParts[lastIdParts.length - 1]);
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
      
      // Format: PMH-2026-001, PMH-2026-002, etc.
      booking.bookingId = `PMH-${year}-${String(nextNumber).padStart(3, "0")}`;
      
    } catch (err) {
      console.error("ID Generation Error:", err);
      throw err; // Stops the save process if ID generation fails
    }
  }
});

module.exports = mongoose.model("Booking", BookingSchema);