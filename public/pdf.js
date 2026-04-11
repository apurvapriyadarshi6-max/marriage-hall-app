async function downloadBill(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- 1. Background Watermark (Status) ---
    doc.setFontSize(60);
    doc.setTextColor(240, 240, 240); // Very light gray
    doc.setFont("helvetica", "bold");
    const statusText = data.remaining <= 0 ? "FULLY PAID" : "PAYMENT DUE";
    doc.text(statusText, pageWidth / 2, 150, { align: "center", angle: 45 });

    // --- 2. Header Section ---
    doc.setFillColor(176, 30, 35); // Signature Red
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("PANDEY MARRIAGE HALL", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text("Purani Bazar, Shivpuri Colony, Goh, Aurangabad, Bihar", pageWidth / 2, 28, { align: "center" });
    doc.text("Mobile: +91 9771592296 | GSTIN: Applied", pageWidth / 2, 34, { align: "center" });

    // --- 3. Customer & Invoice Info Box ---
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(15, 45, 180, 40, 3, 3, 'S'); // Box for info
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 20, 52);
    doc.setFont("helvetica", "normal");
    doc.text(`${data.name}`, 20, 60);
    doc.text(`${data.phone}`, 20, 66);
    doc.text(`${data.address || "N/A"}`, 20, 72);

    doc.setFont("helvetica", "bold");
    doc.text("INVOICE DETAILS:", 120, 52);
    doc.setFont("helvetica", "normal");
    doc.text(`Booking ID:  ${data.bookingId || "N/A"}`, 120, 60);
    doc.text(`Event Date:  ${data.dateFrom}`, 120, 66);
    doc.text(`Occasion:    ${data.occasion}`, 120, 72);

    // --- 4. Itemized Charges Table ---
    let y = 95;
    doc.setFillColor(50, 50, 50); // Dark header
    doc.rect(15, y, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("Description", 20, y + 5.5);
    doc.text("Amount (Rs.)", 190, y + 5.5, { align: "right" });

    y += 8;
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");

    // Add Hall Price
    const items = [];
    if(data.hallPrice) items.push(["Marriage Hall Booking", data.hallPrice]);
    if(data.rooms) items.push([`${data.rooms} Guest Rooms (@Rs.${data.roomPrice})`, (data.rooms * data.roomPrice)]);
    
    // Add Extra Requirements
    if(data.extraRequirements) {
        data.extraRequirements.forEach(ex => {
            if(ex.price > 0) items.push([ex.desc || "Extra Service", ex.price]);
        });
    }

    items.forEach((item, index) => {
        const bgColor = index % 2 === 0 ? 255 : 248; // Zebra stripes
        doc.setFillColor(bgColor);
        doc.rect(15, y, 180, 8, 'F');
        doc.text(item[0], 20, y + 5.5);
        doc.text(item[1].toLocaleString('en-IN'), 190, y + 5.5, { align: "right" });
        y += 8;
    });

    // --- 5. Summary Section ---
    y += 5;
    doc.setLineWidth(0.5);
    doc.line(120, y, 195, y);
    
    y += 7;
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total:", 120, y);
    doc.text(`Rs. ${data.total.toLocaleString('en-IN')}`, 190, y, { align: "right" });
    
    y += 7;
    doc.setTextColor(39, 174, 96);
    doc.text("Advance Paid:", 120, y);
    doc.text(`Rs. ${data.paid.toLocaleString('en-IN')}`, 190, y, { align: "right" });
    
    y += 7;
    doc.setTextColor(176, 30, 35);
    doc.setFontSize(12);
    doc.text("Balance Due:", 120, y);
    doc.text(`Rs. ${data.remaining.toLocaleString('en-IN')}`, 190, y, { align: "right" });

    // --- 6. Terms (Hindi + English for better local trust) ---
    y = 190;
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TERMS & CONDITIONS (नियम एवं शर्तें):", 15, y);
    doc.setFont("helvetica", "normal");
    
    const terms = [
        "1. Booking amount is non-refundable (बुकिंग राशि वापस नहीं होगी).",
        "2. Damage to hall property will be charged to the customer.",
        "3. Music/DJ strictly allowed only until 10:00 PM.",
        "4. The management is not responsible for loss of personal belongings."
    ];
    
    terms.forEach(term => {
        y += 6;
        doc.text(term, 15, y);
    });

    // --- 7. Signature Footer ---
    doc.setFontSize(10);
    doc.text("__________________________", 25, 260);
    doc.text("Customer Signature", 32, 265);

    doc.text("__________________________", 135, 260);
    doc.text("For Pandey Marriage Hall", 140, 265);

    // Footer Note
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("This is a computer generated receipt.", pageWidth / 2, 285, { align: "center" });

    // --- 8. Final Download ---
    doc.save(`Receipt_${data.bookingId}_${data.name}.pdf`);
}