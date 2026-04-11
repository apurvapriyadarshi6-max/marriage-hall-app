/**
 * Pandey Marriage Hall - Dashboard Logic
 * Automatically switches between Local and Production APIs
 * Includes safety checks for server responses
 */

// 1. DYNAMIC URL CONFIGURATION
const getApiUrl = () => {
    const host = window.location.hostname;
    // Detect if running on local laptop or Render/Netlify
    if (host === "localhost" || host === "127.0.0.1") {
        return "/api/bookings"; // Uses local port 5000 via proxy/relative path
    }
    return "https://pandey-marriage-hall.onrender.com/api/bookings";
};

async function loadDashboard() {
    try {
        const apiUrl = getApiUrl();
        console.log("Fetching dashboard data from:", apiUrl);

        const res = await fetch(apiUrl);
        
        // Handle HTTP errors (404, 500, etc)
        if (!res.ok) {
            throw new Error(`Server returned ${res.status}: Check if backend routes are mounted correctly.`);
        }
        
        const bookings = await res.json();

        // --- SAFETY CHECK: Ensure bookings is an Array ---
        // This prevents the "forEach is not a function" error
        if (!Array.isArray(bookings)) {
            console.error("Expected Array, but received:", bookings);
            throw new Error("Invalid data format received from server.");
        }

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

        // Update UI Elements with actual data
        updateElementText("totalBookings", bookings.length);
        updateElementText("pendingBookings", pendingBookingsCount);
        updateElementText("totalRevenue", formatCurrency(totalRevenue));
        updateElementText("pendingAmount", formatCurrency(totalPendingAmount));

    } catch (err) {
        console.error("Dashboard calculation error:", err);
        
        // Show fallback indicators so user knows there is a connection issue
        updateElementText("totalBookings", "--");
        updateElementText("pendingBookings", "!");
        updateElementText("totalRevenue", "Offline");
        updateElementText("pendingAmount", "Offline");
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

// Initialize when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", loadDashboard);