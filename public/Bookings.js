let bookingsData = [];

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

// --- NEW ACTION FUNCTIONS ---

// 1. Direct Calling Logic
function makeCall(phone) {
    window.location.href = `tel:${phone}`;
}

// 2. Direct WhatsApp Text Receipt Logic
function shareOnWhatsApp(id) {
    const b = bookingsData.find(item => item._id === id);
    if (!b) return;

    const start = formatDateDisplay(b.dateFrom);
    const end = formatDateDisplay(b.dateTo);
    const dateRange = (b.dateTo && b.dateTo !== b.dateFrom) ? `${start} to ${end}` : start;

    const message = `*PANDEY MARRIAGE HALL - RECEIPT*%0A------------------------------%0A*Customer:* ${b.name}%0A*Event:* ${b.occasion}%0A*Dates:* ${dateRange}%0A------------------------------%0A*Total Amount:* ₹${b.total}%0A*Paid Amount:* ₹${b.paid}%0A*Remaining Balance:* ₹${b.remaining}%0A------------------------------%0A_Thank you for choosing Pandey Marriage Hall!_`;

    window.open(`https://wa.me/91${b.phone}?text=${message}`, '_blank');
}

// 1. Load data from the server (UPDATED WITH RENDER URL)
async function loadBookings() {
    try {
        // Points directly to your Render backend
        const res = await fetch("https://pandey-marriage-hall.onrender.com/api/bookings");
        
        if (!res.ok) throw new Error("Failed to fetch");
        bookingsData = await res.json();
        displayBookings(bookingsData);
    } catch (err) {
        console.error("Error loading bookings:", err);
        const table = document.getElementById("bookingTable");
        if(table) table.innerHTML = `<tr><td colspan="10" style="text-align:center; color:red;">Error loading data from server.</td></tr>`;
    }
}

// 2. Display bookings (Supports Desktop Table & Mobile Cards)
function displayBookings(data) {
    const table = document.getElementById("bookingTable");
    const list = document.getElementById("bookingList"); 
    
    if (table) table.innerHTML = "";
    if (list) list.innerHTML = "";

    if (data.length === 0) {
        if (table) table.innerHTML = "<tr><td colspan='10' style='text-align:center;'>No bookings found</td></tr>";
        if (list) list.innerHTML = "<div style='text-align:center; padding:20px;'>No bookings found</div>";
        return;
    }

    data.forEach(b => {
        const start = formatDateDisplay(b.dateFrom);
        const end = formatDateDisplay(b.dateTo);
        const dateRangeText = (b.dateTo && b.dateTo !== b.dateFrom) ? `${start} — ${end}` : start;
        
        let status = "Pending";
        if (b.remaining <= 0) status = "Paid";
        else if (b.paid > 0) status = "Partial";
        const statusClass = status.toLowerCase();

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
                    <div><i class="ri-phone-line"></i> <b>${b.phone}</b></div>
                    <div class="date-row">
                        <i class="ri-calendar-event-line"></i> 
                        <span class="date-pill">${dateRangeText}</span>
                    </div>
                    <div><i class="ri-mickey-line"></i> ${b.occasion || "-"}</div>
                    <div style="color:${b.remaining > 0 ? '#e74c3c' : '#27ae60'}; font-weight:bold; font-size: 1.1rem;">
                        <i class="ri-money-rupee-circle-line"></i> Bal: ₹${b.remaining}
                    </div>
                </div>
                <div class="card-footer">
                    <div class="price-info"><small>Total: ₹${b.total}</small></div>
                    <div class="btn-group">
                        <button class="action-btn btn-call" title="Call Customer" onclick="makeCall('${b.phone}')"><i class="ri-phone-fill"></i></button>
                        <button class="action-btn btn-whatsapp" title="WhatsApp Receipt" onclick="shareOnWhatsApp('${b._id}')"><i class="ri-whatsapp-line"></i></button>
                        ${b.remaining > 0 ? `<button class="action-btn btn-pay" onclick="quickPay('${b._id}', ${b.paid}, ${b.total}, '${b.name}')"><i class="ri-hand-coin-line"></i></button>` : ''}
                        <button class="action-btn btn-edit" onclick="editBooking('${b._id}')"><i class="ri-edit-line"></i></button>
                        <button class="action-btn btn-bill" onclick="generateBill('${b._id}')"><i class="ri-file-list-3-line"></i></button>
                        <button class="action-btn btn-del" onclick="deleteBooking('${b._id}')"><i class="ri-delete-bin-line"></i></button>
                    </div>
                </div>
            `;
            list.appendChild(card);
        }

        if (table) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${b.bookingId || "-"}</strong></td>
                <td>${b.name}</td>
                <td><a href="tel:${b.phone}" style="text-decoration:none; color:inherit; font-weight:bold;">${b.phone}</a></td>
                <td>${b.occasion || "-"}</td>
                <td style="font-size:0.85rem;">${dateRangeText}</td>
                <td>₹${b.total}</td>
                <td>₹${b.paid}</td>
                <td style="color:${b.remaining > 0 ? 'red' : 'green'}; font-weight:bold;">₹${b.remaining}</td>
                <td><span class="status-badge status-${statusClass}">${status}</span></td>
                <td>
                    <div style="display:flex; gap:5px;">
                        <button class="action-btn btn-call" title="Call" onclick="makeCall('${b.phone}')"><i class="ri-phone-fill"></i></button>
                        <button class="action-btn btn-whatsapp" title="WhatsApp" onclick="shareOnWhatsApp('${b._id}')"><i class="ri-whatsapp-line"></i></button>
                        ${b.remaining > 0 ? `<button class="action-btn btn-pay" onclick="quickPay('${b._id}', ${b.paid}, ${b.total}, '${b.name}')">Pay</button>` : ''}
                        <button class="action-btn btn-edit" onclick="editBooking('${b._id}')">Edit</button>
                        <button class="action-btn btn-bill" onclick="generateBill('${b._id}')">Bill</button>
                        <button class="action-btn btn-del" onclick="deleteBooking('${b._id}')">Delete</button>
                    </div>
                </td>
            `;
            table.appendChild(row);
        }
    });
}

// --- ENHANCED QUICK PAY HANDLER (UPDATED WITH RENDER URL) ---
function quickPay(id, currentPaid, total, name) {
    const remaining = total - currentPaid;
    const modal = document.getElementById("paymentModal");
    const nameTag = document.getElementById("modalCustomerName");
    const balanceText = document.getElementById("modalBalanceText");
    const confirmBtn = document.getElementById("confirmPaymentBtn");
    const input = document.getElementById("paymentInput");

    modal.style.display = "flex";
    if(nameTag) nameTag.innerText = name;
    if(balanceText) balanceText.innerText = `Pending Balance: ₹${remaining}`;
    input.value = "";
    setTimeout(() => input.focus(), 100);

    confirmBtn.onclick = async () => {
        const amt = parseFloat(input.value);
        if (!amt || isNaN(amt) || amt <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        const newPaidTotal = parseFloat(currentPaid) + amt;
        try {
            // Updated to point to Render backend
            const res = await fetch("https://pandey-marriage-hall.onrender.com/api/bookings/" + id, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    paid: newPaidTotal,
                    remaining: Math.round(total - newPaidTotal) 
                })
            });

            if (res.ok) {
                closeModal();
                loadBookings();
            } else {
                alert("❌ Error updating payment.");
            }
        } catch (err) { console.error("Payment error:", err); }
    };
}

function closeModal() {
    const modal = document.getElementById("paymentModal");
    if(modal) modal.style.display = "none";
}

// 3. Delete a booking (UPDATED WITH RENDER URL)
async function deleteBooking(id) {
    if (!confirm("Are you sure you want to delete this booking?")) return;
    try {
        const res = await fetch("https://pandey-marriage-hall.onrender.com/api/bookings/" + id, { method: "DELETE" });
        if (res.ok) loadBookings();
    } catch (err) { console.error("Delete error:", err); }
}

// 4. Search and Filter Logic
function filterBookings() {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const month = document.getElementById("monthFilter").value;
    const year = document.getElementById("yearFilter").value;

    const filtered = bookingsData.filter(b => {
        const matchSearch = b.name.toLowerCase().includes(search) || (b.bookingId && b.bookingId.toLowerCase().includes(search)) || b.phone.includes(search);
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

// 5. Navigate to edit page
function editBooking(id) {
    window.location.href = "new-booking.html?id=" + id;
}

// 6. Generate Year Options
function generateYears() {
    const select = document.getElementById("yearFilter");
    if (!select) return;
    const currentYear = new Date().getFullYear();
    select.innerHTML = `<option value="">Year</option>`;
    for (let i = currentYear - 2; i <= currentYear + 5; i++) {
        const option = document.createElement("option");
        option.value = i; option.text = i;
        select.appendChild(option);
    }
}

// 7. FULL BILL GENERATOR (Everything Kept Intact)
function generateBill(id) {
    const booking = bookingsData.find(b => b._id === id);
    if (!booking) return;

    const win = window.open("", "_blank", "width=900,height=800");
    const billDateRange = booking.dateTo && booking.dateTo !== booking.dateFrom 
        ? `${formatDateDisplay(booking.dateFrom)} to ${formatDateDisplay(booking.dateTo)}`
        : formatDateDisplay(booking.dateFrom);

    win.document.write(`
<html>
<head>
    <title>Receipt - ${booking.name}</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .title { font-size: 30px; font-weight: bold; color: #b01e23; }
        .sub-header { font-size: 14px; margin-top: 5px; }
        .bill-info { display: flex; justify-content: space-between; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        table, th, td { border: 1px solid #444; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .terms { margin-top: 30px; font-size: 13px; line-height: 1.6; border: 1px solid #ccc; padding: 15px; background: #fafafa; }
        .terms h3 { margin-top: 0; color: #b01e23; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .signatures { display: flex; justify-content: space-between; margin-top: 60px; font-weight: bold; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">पांडेय मैरेज हॉल</div>
        <div class="sub-header">
            पुरानी बाजार – शिवपुरी कॉलोनी, गोह <br>
            औरंगाबाद, बिहार – 824203 <br>
            मोबाइल: +91 9771592296
        </div>
    </div>

    <div class="bill-info">
        <div>
            <strong>Customer Details:</strong><br>
            Name: ${booking.name}<br>
            Phone: ${booking.phone}<br>
            Address: ${booking.address || "-"}<br>
            Email: ${booking.email || "-"}
        </div>
        <div style="text-align: right;">
            <strong>Booking ID:</strong> ${booking.bookingId || "-"}<br>
            <strong>Date:</strong> ${new Date().toLocaleDateString()}
        </div>
    </div>

    <table>
        <thead>
            <tr><th colspan="2">Booking & Event Details</th></tr>
        </thead>
        <tbody>
            <tr><td>Occasion</td><td>${booking.occasion || "-"}</td></tr>
            <tr><td>Event Date</td><td>${billDateRange}</td></tr>
            <tr><td>Timing</td><td>${booking.timeFrom || "-"} - ${booking.timeTo || "-"}</td></tr>
        </tbody>
    </table>

    <table>
        <thead>
            <tr>
                <th>Total Charges</th>
                <th>Paid Amount</th>
                <th>Remaining Balance</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="font-size: 18px;">₹${booking.total}</td>
                <td style="font-size: 18px; color: green;">₹${booking.paid}</td>
                <td style="font-size: 18px; color: red; font-weight: bold;">₹${booking.remaining}</td>
            </tr>
        </tbody>
    </table>

    <div class="terms">
        <h3>पांडेय मैरेज हॉल – नियम एवं शर्तें</h3>
        1. हॉल में लाए गए सभी सामान की जिम्मेदारी स्वयं ग्राहक की होगी।<br>
        2. बुकिंग के बाद जमा किया गया पैसा वापस नहीं होगा।<br>
        3. किसी भी सामान को नुकसान होने पर ग्राहक जुर्माना देगा।<br>
        4. चोरी होने पर कानूनी कार्यवाही होगी।<br>
        5. रात 10 बजे से सुबह 6 बजे तक DJ मना है।<br>
        6. हॉल में तोड़-फोड़ करने पर जुर्माना लगेगा।<br>
        7. तिथि बदलने के लिए प्रबंधन की अनुमति आवश्यक होगी।<br>
        8. कार्यक्रम के बाद हॉल साफ छोड़ना होगा।<br>
        9. अवैध कार्य करना मना है।<br>
        10. समय पर हॉल खाली करना अनिवार्य होगा।<br>
        11. बिजली उपकरण से छेड़छाड़ मना है।<br>
        12. दुर्घटना के लिए प्रबंधन जिम्मेदार नहीं होगा।<br>
        13. पार्किंग अपने जोखिम पर होगी।<br>
        14. बुकिंग करते समय ग्राहक इन नियमों को स्वीकार करता है।
    </div>

    <div class="signatures">
        <div style="text-align: right;">Subodh Kumar Pandey<br>Signature</div>
    </div>

    <p style="text-align:center; margin-top:40px;" class="no-print">
        <button onclick="window.print()" style="padding:10px 20px; cursor:pointer;">Print Invoice</button>
    </p>
</body>
</html>
    `);
    win.document.close();
}

// 8. Initialization
document.addEventListener("DOMContentLoaded", () => {
    generateYears();
    loadBookings();
});