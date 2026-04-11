/**
 * Pandey Marriage Hall - Unified Booking Manager Logic
 * Handles dynamic data loading, filtering, and customer financials with "No-Minus" protection.
 */

let bookingsData = [];

// 1. DYNAMIC API URL
const getApiBaseUrl = () => {
    return (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        ? "" // Local relative path
        : "https://pmh-personal.onrender.com"; // Production URL
};

const API_URL = `${getApiBaseUrl()}/api/bookings`;

/**
 * HELPER: Converts "2024-05-12" to "12 May 2024"
 */
function formatDateDisplay(dateStr) {
    if (!dateStr) return "-";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const parts = dateStr.split("-"); 
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIndex = parseInt(parts[1]) - 1; 
    const day = parseInt(parts[2]);
    return `${day} ${months[monthIndex]} ${year}`;
}

// --- ACTION FUNCTIONS ---

function makeCall(phone) {
    window.location.href = `tel:${phone}`;
}

function shareOnWhatsApp(id) {
    const b = bookingsData.find(item => item._id === id);
    if (!b) return;

    const start = formatDateDisplay(b.dateFrom);
    const end = formatDateDisplay(b.dateTo);
    const dateRange = (b.dateTo && b.dateTo !== b.dateFrom) ? `${start} to ${end}` : start;
    
    // NO-MINUS FIX for WhatsApp
    const displayBalance = Math.max(0, b.remaining || 0);

    const message = `*PANDEY MARRIAGE HALL - RECEIPT*%0A------------------------------%0A*Customer:* ${b.name}%0A*Event:* ${b.occasion}%0A*Dates:* ${dateRange}%0A------------------------------%0A*Total Amount:* ₹${b.total}%0A*Paid Amount:* ₹${b.paid}%0A*Remaining Balance:* ₹${displayBalance}%0A------------------------------%0A_Thank you for choosing Pandey Marriage Hall!_`;

    window.open(`https://wa.me/91${b.phone}?text=${message}`, '_blank');
}

// --- DATA LOADING & RENDERING ---

async function loadBookings() {
    const list = document.getElementById("bookingList");
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Server responded with error");
        
        bookingsData = await res.json();
        
        if (list) list.innerHTML = ""; 
        displayBookings(bookingsData);
        
    } catch (err) {
        console.error("Error loading bookings:", err);
        if(list) {
            list.innerHTML = `<div style="text-align:center; padding:50px;">
                <p style="color:red;">Error connecting to server.</p>
                <button onclick="location.reload()" style="padding:10px; border-radius:8px; background:var(--pmh-red); color:white; border:none;">Retry</button>
            </div>`;
        }
    }
}

/**
 * Renders the UI and calculates Top Summary Stats
 */
function displayBookings(data) {
    const table = document.getElementById("bookingTable");
    const list = document.getElementById("bookingList"); 
    const collectedEl = document.getElementById("totalCollected");
    const dueEl = document.getElementById("totalDue");
    
    if (table) table.innerHTML = "";
    if (list) list.innerHTML = "";

    let runningCollected = 0;
    let runningDue = 0;

    if (data.length === 0) {
        if (table) table.innerHTML = "<tr><td colspan='9' style='text-align:center;'>No bookings found</td></tr>";
        if (list) list.innerHTML = "<p style='text-align:center; padding:20px;'>No bookings found.</p>";
        if (collectedEl) collectedEl.innerText = "₹0";
        if (dueEl) dueEl.innerText = "₹0";
        return;
    }

    data.forEach(b => {
        // NO-MINUS FIX: Ensure we never calculate or show negative balances
        const displayBalance = Math.max(0, b.remaining || 0);

        runningCollected += parseFloat(b.paid) || 0;
        runningDue += displayBalance;

        const start = formatDateDisplay(b.dateFrom);
        const end = formatDateDisplay(b.dateTo);
        const dateRangeText = (b.dateTo && b.dateTo !== b.dateFrom) ? `${start} — ${end}` : start;
        
        let status = "Pending";
        if (displayBalance <= 0) status = "Paid";
        else if (b.paid > 0) status = "Partial";
        const statusClass = status.toLowerCase();

        // Mobile Card Render
        if (list) {
            const card = document.createElement("div");
            card.className = `booking-card status-${statusClass}`;
            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="name">${b.name}</div>
                        <div class="id">ID: ${b.bookingId || "-"}</div>
                    </div>
                    <span class="badge status-${statusClass}">${status}</span>
                </div>
                <div class="card-body">
                    <div><i class="ri-phone-line"></i> ${b.phone}</div>
                    <div><i class="ri-calendar-event-line"></i> ${dateRangeText}</div>
                    
                    <div style="font-weight: 600; color: var(--pmh-dark); margin-top: 5px;">
                        <i class="ri-money-rupee-circle-fill"></i> Total Amount: ₹${b.total}
                    </div>
                    <div style="font-weight: 800; color: ${displayBalance > 0 ? 'var(--danger)' : 'var(--success)'};">
                        <i class="ri-hand-coin-fill"></i> Required to Pay: ₹${displayBalance}
                    </div>
                </div>
                <div class="card-footer">
                    <div class="btn-group">
                        <button class="action-btn btn-call" onclick="makeCall('${b.phone}')"><i class="ri-phone-fill"></i></button>
                        <button class="action-btn btn-whatsapp" onclick="shareOnWhatsApp('${b._id}')"><i class="ri-whatsapp-line"></i></button>
                        ${displayBalance > 0 ? `<button class="action-btn btn-pay" onclick="quickPay('${b._id}', ${b.paid}, ${b.total}, '${b.name}')"><i class="ri-hand-coin-line"></i></button>` : ''}
                        <button class="action-btn btn-edit" onclick="editBooking('${b._id}')"><i class="ri-edit-line"></i></button>
                        <button class="action-btn btn-bill" onclick="generateBill('${b._id}')"><i class="ri-file-list-3-line"></i></button>
                        <button class="action-btn btn-del" onclick="deleteBooking('${b._id}')"><i class="ri-delete-bin-line"></i></button>
                    </div>
                </div>`;
            list.appendChild(card);
        }

        // Desktop Table Render
        if (table) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${b.bookingId || "-"}</td>
                <td><b>${b.name}</b></td>
                <td>${b.phone}</td>
                <td>${b.occasion || "-"}</td>
                <td>${dateRangeText}</td>
                <td>₹${b.total}</td>
                <td style="color:${displayBalance > 0 ? 'red' : 'green'}; font-weight:bold;">₹${displayBalance}</td>
                <td><span class="badge status-${statusClass}">${status}</span></td>
                <td>
                    <div class="btn-group">
                        <button class="action-btn btn-whatsapp" onclick="shareOnWhatsApp('${b._id}')"><i class="ri-whatsapp-line"></i></button>
                        ${displayBalance > 0 ? `<button class="action-btn btn-pay" onclick="quickPay('${b._id}', ${b.paid}, ${b.total}, '${b.name}')"><i class="ri-hand-coin-line"></i></button>` : ''}
                        <button class="action-btn btn-bill" onclick="generateBill('${b._id}')"><i class="ri-file-list-3-line"></i></button>
                        <button class="action-btn btn-del" onclick="deleteBooking('${b._id}')"><i class="ri-delete-bin-line"></i></button>
                    </div>
                </td>`;
            table.appendChild(row);
        }
    });

    // Update Top Summary Bar (Currency Formatting en-IN)
    const f = new Intl.NumberFormat('en-IN');
    if (collectedEl) collectedEl.innerText = "₹" + f.format(runningCollected);
    if (dueEl) dueEl.innerText = "₹" + f.format(runningDue);
}

// --- MODAL & UPDATES ---

function quickPay(id, currentPaid, total, name) {
    const rawRemaining = total - currentPaid;
    const displayBalance = Math.max(0, rawRemaining); // NO-MINUS FIX
    
    const modal = document.getElementById("paymentModal");
    const nameTag = document.getElementById("modalCustomerName");
    const balanceText = document.getElementById("modalBalanceText");
    const confirmBtn = document.getElementById("confirmPaymentBtn");
    const input = document.getElementById("paymentInput");

    modal.style.display = "flex";
    if(nameTag) nameTag.innerText = name;
    if(balanceText) balanceText.innerText = `Remaining Due: ₹${displayBalance}`;
    input.value = "";
    setTimeout(() => input.focus(), 100);

    confirmBtn.onclick = async () => {
        const amt = parseFloat(input.value);
        if (!amt || amt <= 0) return alert("Enter valid amount");

        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paid: parseFloat(currentPaid) + amt })
            });

            if (res.ok) {
                closeModal();
                loadBookings();
            }
        } catch (err) { alert("Payment failed"); }
    };
}

function closeModal() {
    document.getElementById("paymentModal").style.display = "none";
}

async function deleteBooking(id) {
    if (!confirm("Delete booking?")) return;
    try {
        const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (res.ok) loadBookings();
    } catch (err) { console.error("Delete failed"); }
}

function filterBookings() {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const month = document.getElementById("monthFilter").value;
    const year = document.getElementById("yearFilter").value;

    const filtered = bookingsData.filter(b => {
        const matchSearch = b.name.toLowerCase().includes(search) || 
                            (b.bookingId && b.bookingId.toLowerCase().includes(search)) || 
                            b.phone.includes(search);
        let matchMonth = true, matchYear = true;
        if (b.dateFrom) {
            const parts = b.dateFrom.split("-");
            if (month) matchMonth = parts[1] === month;
            if (year) matchYear = parts[0] === year;
        }
        return matchSearch && matchMonth && matchYear;
    });
    displayBookings(filtered);
}

function editBooking(id) {
    window.location.href = `new-booking.html?id=${id}`;
}

function generateYears() {
    const select = document.getElementById("yearFilter");
    if (!select) return;
    const currentYear = new Date().getFullYear();
    select.innerHTML = `<option value="">Years</option>`;
    for (let i = currentYear - 1; i <= currentYear + 3; i++) {
        const opt = document.createElement("option");
        opt.value = i; opt.text = i;
        select.appendChild(opt);
    }
}

// --- RECEIPT GENERATOR ---

function generateBill(id) {
    const b = bookingsData.find(item => item._id === id);
    if (!b) return;
    
    const displayBalance = Math.max(0, b.remaining || 0); // NO-MINUS FIX

    const win = window.open("", "_blank", "width=800,height=900");
    const dateRange = (b.dateTo && b.dateTo !== b.dateFrom) 
        ? `${formatDateDisplay(b.dateFrom)} to ${formatDateDisplay(b.dateTo)}` 
        : formatDateDisplay(b.dateFrom);

    win.document.write(`
        <html>
        <head>
            <title>Receipt - ${b.name}</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #333; }
                .header { text-align: center; border-bottom: 3px double #333; padding-bottom: 15px; margin-bottom: 25px; }
                .title { font-size: 32px; font-weight: 800; color: #b01e23; margin-bottom: 5px; }
                .address { font-size: 14px; font-weight: 600; color: #666; }
                .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .info-box div { margin-bottom: 5px; font-size: 15px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                th, td { border: 1px solid #ccc; padding: 15px; text-align: left; }
                th { background: #f4f4f4; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; }
                .total-row { font-size: 18px; font-weight: 800; }
                .terms { margin-top: 40px; padding: 20px; border: 1px solid #eee; background: #fafafa; border-radius: 10px; }
                .terms h3 { margin: 0 0 10px 0; font-size: 16px; color: #b01e23; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                .terms ol { padding-left: 20px; margin: 0; font-size: 13px; line-height: 1.6; }
                .sig-box { display: flex; justify-content: space-between; margin-top: 70px; }
                .sig { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 5px; font-weight: bold; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">पांडेय मैरेज हॉल</div>
                <div class="address">पुरानी बाजार – शिवपुरी कॉलोनी, गोह | औरंगाबाद, बिहार</div>
                <div class="address">मो: +91 9771592296</div>
            </div>

            <div class="info-grid">
                <div class="info-box">
                    <div><b>Customer:</b> ${b.name}</div>
                    <div><b>Phone:</b> ${b.phone}</div>
                    <div><b>Address:</b> ${b.address || "-"}</div>
                </div>
                <div class="info-box" style="text-align: right;">
                    <div><b>Booking ID:</b> ${b.bookingId || "-"}</div>
                    <div><b>Receipt Date:</b> ${new Date().toLocaleDateString('en-IN')}</div>
                </div>
            </div>

            <table>
                <thead>
                    <tr><th>Description</th><th>Details</th></tr>
                </thead>
                <tbody>
                    <tr><td>Event Type / Occasion</td><td><b>${b.occasion || "-"}</b></td></tr>
                    <tr><td>Event Date(s)</td><td>${dateRange}</td></tr>
                    <tr><td>Timings</td><td>${b.timeFrom || "-"} to ${b.timeTo || "-"}</td></tr>
                </tbody>
            </table>

            <table>
                <thead>
                    <tr><th>Total Amount</th><th>Paid Advance</th><th>Remaining Balance</th></tr>
                </thead>
                <tbody>
                    <tr class="total-row">
                        <td>₹${b.total}</td>
                        <td style="color: #27ae60;">₹${b.paid}</td>
                        <td style="color: #e74c3c;">₹${displayBalance}</td>
                    </tr>
                </tbody>
            </table>

            <div class="terms">
                <h3>नियम एवं शर्तें (Terms & Conditions):</h3>
                <ol>
                    <li>हॉल में लाए गए सभी सामान की जिम्मेदारी स्वयं ग्राहक की होगी।</li>
                    <li>बुकिंग के समय जमा किया गया अग्रिम पैसा (Advance) किसी भी स्थिति में वापस नहीं होगा।</li>
                    <li>हॉल की संपत्ति को किसी भी प्रकार का नुकसान होने पर ग्राहक को उसका पूरा हर्जाना देना होगा।</li>
                    <li>सरकारी नियमों के अनुसार रात 10 बजे के बाद डीजे (DJ) पूर्णतः प्रतिबंधित है।</li>
                    <li>हॉल में किसी भी प्रकार की अवैध गतिविधि या नशीली वस्तुओं का सेवन वर्जित है।</li>
                    <li>कार्यक्रम के निर्धारित समय के पश्चात हॉल खाली करना अनिवार्य होगा।</li>
                    <li>पार्किंग अपने जोखिम पर करें, प्रबंधन किसी भी नुकसान के लिए जिम्मेदार नहीं होगा।</li>
                </ol>
            </div>

            <div class="sig-box">
                <div class="sig">Customer Signature</div>
                <div class="sig">Authorized Signatory<br><small>Pandey Marriage Hall</small></div>
            </div>

            <div style="text-align: center; margin-top: 40px;" class="no-print">
                <button onclick="window.print()" style="padding: 12px 25px; cursor: pointer; background: #333; color: #fff; border: none; border-radius: 5px; font-weight: bold;">
                    PRINT INVOICE
                </button>
            </div>
        </body>
        </html>
    `);
    win.document.close();
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    generateYears();
    loadBookings();
});