/**
 * Pandey Marriage Hall - Dashboard Logic
 * Unified Version: Works on Localhost & Render automatically.
 */

// 1. SMART URL CONFIGURATION
const getApiUrl = () => {
    // If we are running the unified server, the frontend and backend 
    // share the same origin. A relative path is the safest 'one-time fix'.
    return "/api/bookings";
};

async function loadDashboard() {
    try {
        const apiUrl = getApiUrl();
        console.log("PMH System: Fetching data from", apiUrl);

        const res = await fetch(apiUrl);
        
        // Handle Server Errors (e.g., 404 if routes aren't mounted)
        if (!res.ok) {
            throw new Error(`HTTP Error ${res.status}: Check server.js route mounting.`);
        }
        
        const bookings = await res.json();

        // --- SAFETY CHECK: Guard against non-array responses ---
        if (!Array.isArray(bookings)) {
            console.error("Data received is not an array:", bookings);
            throw new Error("Invalid data format from server.");
        }

        // Initialize counters for the Pandey Marriage Hall Stats
        let pendingBookingsCount = 0;
        let totalRevenue = 0;
        let totalPendingAmount = 0;

        bookings.forEach(b => {
            // Convert to numbers safely to avoid NaN errors
            const paid = parseFloat(b.paid) || 0;
            const remaining = parseFloat(b.remaining) || 0;

            totalRevenue += paid;
            totalPendingAmount += remaining;

            // Logic: If money is still owed, it's a pending booking
            if (remaining > 0) {
                pendingBookingsCount++;
            }
        });

        // Professional Indian Rupee Formatter (INR)
        const formatCurrency = (num) => {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(num);
        };

        // Update Dashboard UI Elements
        updateElementText("totalBookings", bookings.length);
        updateElementText("pendingBookings", pendingBookingsCount);
        updateElementText("totalRevenue", formatCurrency(totalRevenue));
        updateElementText("pendingAmount", formatCurrency(totalPendingAmount));

        console.log("PMH System: Dashboard loaded successfully.");

    } catch (err) {
        console.error("Dashboard calculation error:", err);
        
        // Fallback UI: Show 'Offline' or '!' so the user knows something is wrong
        updateElementText("totalBookings", "--");
        updateElementText("pendingBookings", "!");
        updateElementText("totalRevenue", "Offline");
        updateElementText("pendingAmount", "Offline");
    }
}

/**
 * Utility: Safely updates the text of an element if it exists in index.html
 */
function updateElementText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.innerText = value;
    } else {
        console.warn(`UI Sync: Element with ID '${id}' missing from HTML.`);
    }
}

// Start the dashboard logic once the page is ready
document.addEventListener("DOMContentLoaded", loadDashboard);