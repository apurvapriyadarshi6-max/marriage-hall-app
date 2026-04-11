/**
 * Pandey Marriage Hall - Dashboard Logic
 * Unified Version: Works on Localhost & Render automatically.
 * FIX: Prevents negative "Due Balance" and incorrect "Unpaid Count".
 */

// 1. SMART URL CONFIGURATION
const getApiUrl = () => {
    // Relative path is best for unified deployments to avoid CORS
    return "/api/bookings";
};

async function loadDashboard() {
    try {
        const apiUrl = getApiUrl();
        console.log("PMH System: Fetching dashboard data from", apiUrl);

        const res = await fetch(apiUrl);
        
        if (!res.ok) {
            throw new Error(`HTTP Error ${res.status}: Check server.js route mounting.`);
        }
        
        const bookings = await res.json();

        // --- SAFETY CHECK: Guard against non-array responses ---
        if (!Array.isArray(bookings)) {
            console.error("Data received is not an array:", bookings);
            throw new Error("Invalid data format from server.");
        }

        // Initialize counters
        let actualPendingCount = 0;
        let totalRevenue = 0;
        let totalDueAmount = 0;

        bookings.forEach(b => {
            // Convert to numbers safely
            const totalBill = parseFloat(b.total) || 0;
            const paidAmt = parseFloat(b.paid) || 0;
            
            // Revenue is the actual cash collected
            totalRevenue += paidAmt;

            // NO-MINUS LOGIC: Calculate balance for this customer
            const balance = totalBill - paidAmt;

            // Only add to "Total Due" if the customer actually owes money
            if (balance > 0) {
                totalDueAmount += balance;
                actualPendingCount++;
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
        updateElementText("pendingBookings", actualPendingCount);
        updateElementText("totalRevenue", formatCurrency(totalRevenue));
        updateElementText("pendingAmount", formatCurrency(totalDueAmount));

        console.log("PMH System: Dashboard updated (Negative balances filtered).");

    } catch (err) {
        console.error("Dashboard calculation error:", err);
        
        // Fallback UI
        updateElementText("totalBookings", "--");
        updateElementText("pendingBookings", "!");
        updateElementText("totalRevenue", "Offline");
        updateElementText("pendingAmount", "Offline");
    }
}

/**
 * Utility: Safely updates the text of an element if it exists in the HTML
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