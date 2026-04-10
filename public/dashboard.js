/**
 * Loads and calculates statistics for the Dashboard
 */
async function loadDashboard() {
    try {
        const res = await fetch("/api/bookings");
        if (!res.ok) throw new Error("Failed to fetch bookings");
        
        const bookings = await res.json();

        // Initialize counters
        let pendingBookingsCount = 0;
        let totalRevenue = 0;
        let totalPendingAmount = 0;

        bookings.forEach(b => {
            // Use parseFloat and logical OR to ensure we are adding valid numbers
            const paid = parseFloat(b.paid) || 0;
            const remaining = parseFloat(b.remaining) || 0;

            totalRevenue += paid;
            totalPendingAmount += remaining;

            // Increment count if there is still money owed
            if (remaining > 0) {
                pendingBookingsCount++;
            }
        });

        // Helper function to format currency in Indian Rupees (INR)
        const formatCurrency = (num) => {
            return "₹" + num.toLocaleString('en-IN');
        };

        // Update UI with safety checks
        updateElementText("totalBookings", bookings.length);
        updateElementText("pendingBookings", pendingBookingsCount);
        updateElementText("totalRevenue", formatCurrency(totalRevenue));
        updateElementText("pendingAmount", formatCurrency(totalPendingAmount));

    } catch (err) {
        console.error("Dashboard calculation error:", err);
        // Optional: Show error on UI
        updateElementText("totalBookings", "!");
    }
}

/**
 * Utility to safely update text content
 */
function updateElementText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.innerText = value;
    }
}

// Initialize on load
loadDashboard();