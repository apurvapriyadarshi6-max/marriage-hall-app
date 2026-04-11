/* --- GLOBAL CONFIG & STATE --- */
const params = new URLSearchParams(window.location.search);
const editId = params.get("id");
// Use absolute path for reliability across different deployment environments
const API_URL = "https://pandey-marriage-hall.onrender.com/api/bookings";

/* --- UI HELPERS --- */

// Sync Date/Time labels for the "Touch-Point" UI
function updateLabel(inputId, labelId) {
    const input = document.getElementById(inputId);
    const label = document.getElementById(labelId);
    if (input && label && input.value) {
        label.innerText = input.value;
        label.style.color = "#b01e23"; // Signature Red when selected
    }
}

// Handle sliding panels for Hall, Rooms, and Extra Charges
function slideToggle(boxId, checkbox) {
    const el = document.getElementById(boxId);
    if (!el) return;
    el.style.display = checkbox.checked ? 'block' : 'none';
    
    // If turned off, clear values so they don't add to calculation
    if (!checkbox.checked) {
        el.querySelectorAll('input').forEach(i => i.value = '');
        calculateTotal();
    }
}

function checkOccasion() {
    const val = document.getElementById("occasion").value;
    const other = document.getElementById("otherOccasion");
    if (other) {
        other.style.display = (val === "Other") ? "block" : "none";
    }
}

/* --- DYNAMIC EXTRA CHARGES --- */

function addRequirement(desc = "", price = "") {
    const container = document.getElementById("reqBody");
    if (!container) return;

    const div = document.createElement("div");
    div.className = "charge-row";
    div.innerHTML = `
        <input type="text" class="reqDesc" placeholder="e.g. DJ/Decor" value="${desc}">
        <input type="number" class="reqPrice" placeholder="Price ₹" value="${price}" oninput="calculateTotal()">
        <button type="button" class="btn-mini-del" onclick="this.parentElement.remove(); calculateTotal();">
            <i class="ri-delete-bin-line"></i>
        </button>
    `;
    container.appendChild(div);
}

/* --- CALCULATION LOGIC --- */

function calculateTotal() {
    let total = 0;

    // 1. Hall Price
    const hallTog = document.getElementById("hallToggle");
    if (hallTog && hallTog.checked) {
        total += parseFloat(document.getElementById("hallPrice").value) || 0;
    }

    // 2. Room Price calculation
    const roomTog = document.getElementById("roomToggle");
    if (roomTog && roomTog.checked) {
        const count = parseFloat(document.getElementById("rooms").value) || 0;
        const rate = parseFloat(document.getElementById("roomPrice").value) || 0;
        total += (count * rate);
    }

    // 3. Extra Requirements (DJ, Catering, etc.)
    document.querySelectorAll(".reqPrice").forEach(input => {
        total += parseFloat(input.value) || 0;
    });

    // Update UI Summary
    const paid = parseFloat(document.getElementById("paid").value) || 0;
    const remaining = total - paid;

    document.getElementById("total").innerText = Math.round(total);
    const dPaid = document.getElementById("displayPaid");
    if (dPaid) dPaid.innerText = Math.round(paid);
    
    const remEl = document.getElementById("remaining");
    if (remEl) {
        remEl.innerText = Math.round(remaining);
        remEl.style.color = remaining > 0 ? "#ff7675" : "#2ecc71"; // Red if due, Green if cleared
    }
}

/* --- DATA HANDLING --- */

async function saveBooking() {
    const saveBtn = document.querySelector(".btn-primary");
    
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const dateFrom = document.getElementById("dateFrom").value;

    if (!name || !phone || !dateFrom) {
        return alert("⚠️ Please fill mandatory fields: Name, Phone, and Start Date.");
    }

    // Collect extra requirements array
    const requirements = [];
    document.querySelectorAll(".charge-row").forEach(row => {
        const desc = row.querySelector(".reqDesc").value.trim();
        const price = parseFloat(row.querySelector(".reqPrice").value) || 0;
        if (desc) requirements.push({ desc, price });
    });

    const bookingData = {
        name,
        phone,
        email: document.getElementById("email").value.trim(),
        address: document.getElementById("address").value.trim(),
        occasion: document.getElementById("occasion").value === "Other" 
                  ? document.getElementById("otherOccasion").value 
                  : document.getElementById("occasion").value,
        dateFrom,
        dateTo: document.getElementById("dateTo").value || dateFrom,
        timeFrom: document.getElementById("timeFrom").value,
        timeTo: document.getElementById("timeTo").value,
        hallPrice: document.getElementById("hallToggle").checked ? (parseFloat(document.getElementById("hallPrice").value) || 0) : 0,
        rooms: document.getElementById("roomToggle").checked ? (parseFloat(document.getElementById("rooms").value) || 0) : 0,
        roomPrice: document.getElementById("roomToggle").checked ? (parseFloat(document.getElementById("roomPrice").value) || 0) : 0,
        extraRequirements: requirements,
        total: parseFloat(document.getElementById("total").innerText),
        paid: parseFloat(document.getElementById("paid").value) || 0,
        remaining: parseFloat(document.getElementById("remaining").innerText)
    };

    saveBtn.disabled = true;
    saveBtn.innerText = "PROCESSING...";

    try {
        const url = editId ? `${API_URL}/${editId}` : API_URL;
        const method = editId ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bookingData)
        });

        if (res.ok) {
            alert("✅ Booking Saved Successfully!");
            window.location.href = "bookings.html";
        } else {
            throw new Error("Failed to save");
        }
    } catch (err) {
        console.error("Save Error:", err);
        alert("❌ Error: Could not connect to server.");
        saveBtn.disabled = false;
        saveBtn.innerText = "💾 SAVE BOOKING";
    }
}

/* --- INITIALIZATION & EDIT LOAD --- */

window.addEventListener("DOMContentLoaded", async () => {
    // 1. Initial Calculation Setup
    calculateTotal();

    // 2. Load Existing Data if in Edit Mode
    if (editId) {
        document.getElementById("pageTitle").innerText = "EDIT BOOKING";
        try {
            const res = await fetch(`${API_URL}/${editId}`);
            if (!res.ok) throw new Error("Could not find booking");
            const b = await res.json();

            // Basic Fields
            document.getElementById("name").value = b.name || "";
            document.getElementById("phone").value = b.phone || "";
            document.getElementById("email").value = b.email || "";
            document.getElementById("address").value = b.address || "";
            document.getElementById("dateFrom").value = b.dateFrom || "";
            document.getElementById("dateTo").value = b.dateTo || "";
            document.getElementById("timeFrom").value = b.timeFrom || "";
            document.getElementById("timeTo").value = b.timeTo || "";

            // Sync Visual Labels
            updateLabel('dateFrom', 'startDateLabel');
            updateLabel('dateTo', 'endDateLabel');
            updateLabel('timeFrom', 'timeInLabel');
            updateLabel('timeTo', 'timeOutLabel');

            // Occasion logic
            const occSelect = document.getElementById("occasion");
            const standardOptions = Array.from(occSelect.options).map(opt => opt.value);
            if (standardOptions.includes(b.occasion)) {
                occSelect.value = b.occasion;
            } else {
                occSelect.value = "Other";
                const otherInp = document.getElementById("otherOccasion");
                if (otherInp) {
                    otherInp.value = b.occasion;
                    otherInp.style.display = "block";
                }
            }

            // Hall Logic
            if (b.hallPrice > 0) {
                const hTog = document.getElementById("hallToggle");
                hTog.checked = true;
                slideToggle("hallPriceBox", hTog);
                document.getElementById("hallPrice").value = b.hallPrice;
            }

            // Room Logic
            if (b.rooms > 0) {
                const rTog = document.getElementById("roomToggle");
                rTog.checked = true;
                slideToggle("roomDetailsBox", rTog);
                document.getElementById("rooms").value = b.rooms;
                document.getElementById("roomPrice").value = b.roomPrice;
            }

            // Extra Charges
            if (b.extraRequirements && b.extraRequirements.length > 0) {
                b.extraRequirements.forEach(req => addRequirement(req.desc, req.price));
            }

            document.getElementById("paid").value = b.paid || 0;
            calculateTotal();
            
        } catch (err) {
            console.error("Fetch Error:", err);
            alert("Error loading booking details.");
        }
    }
});