/**
 * Pandey Marriage Hall - Dashboard Logic
 * Automatically switches between Local and Production APIs
 */

// 1. DYNAMIC URL CONFIGURATION
const getApiUrl = () => {
    const host = window.location.hostname;
    // If running on your laptop (localhost or 127.0.0.1)
    if (host === "localhost" || host === "127.0.0.1") {
        return "/api/bookings"; // Relative path uses your local port 5000
    }
    // If running on Netlify/Internet
    return "https://pandey-marriage-hall.onrender.com/api/bookings";
};

async function loadDashboard() {
    try {
        const apiUrl = getApiUrl();
        console.log("Fetching dashboard data from:", apiUrl);

        const res = await fetch(apiUrl);
        
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        
        const bookings = await res.json();

        // Initialize counters
        let pendingBookingsCount = 0;
        let totalRevenue = 0;
        let totalPendingAmount = 0;

        bookings.forEach(b => {
            const paid = parseFloat(b.paid) || 0;
            const remaining = parseFloat(b.remaining) || 0;

            totalRevenue += paid;
            totalPendingAmount += remaining;

            if (remaining > 0) {
                pendingBookingsCount++;
            }
        });

        // Professional Indian Rupee Formatter
        const formatCurrency = (num) => {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(num);
        };

        // Update UI Elements
        updateElementText("totalBookings", bookings.length);
        updateElementText("pendingBookings", pendingBookingsCount);
        updateElementText("totalRevenue", formatCurrency(totalRevenue));
        updateElementText("pendingAmount", formatCurrency(totalPendingAmount));

    } catch (err) {
        console.error("Dashboard calculation error:", err);
        // Show placeholders so the UI doesn't look broken
        updateElementText("totalBookings", "--");
        updateElementText("pendingBookings", "!");
        updateElementText("totalRevenue", "₹0");
        updateElementText("pendingAmount", "₹0");
    }
}

/**
 * Utility to safely update text content in the DOM
 */
function updateElementText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.innerText = value;
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", loadDashboard);