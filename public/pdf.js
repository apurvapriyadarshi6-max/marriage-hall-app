function downloadBill(data) {
    // Note: Ensure jsPDF is loaded in your HTML: 
    // <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // --- Header Section ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(176, 30, 35); // Deep Red
    doc.text("PANDEY MARRIAGE HALL", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("Purani Bazar, Shivpuri Colony, Goh, Aurangabad, Bihar", 105, 27, { align: "center" });
    doc.text("Mobile: 9771592296", 105, 32, { align: "center" });
    
    doc.setLineWidth(0.5);
    doc.line(20, 38, 190, 38); // Horizontal Line

    // --- Customer Info ---
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("CUSTOMER DETAILS", 20, 48);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Booking ID: ${data.bookingId || "N/A"}`, 140, 48);
    doc.text(`Name: ${data.name}`, 20, 58);
    doc.text(`Phone: ${data.phone}`, 20, 65);
    doc.text(`Address: ${data.address || "-"}`, 20, 72);

    // --- Event Details ---
    doc.setFont("helvetica", "bold");
    doc.text("EVENT DETAILS", 20, 85);
    doc.setFont("helvetica", "normal");
    doc.text(`Occasion: ${data.occasion}`, 20, 93);
    doc.text(`Date: ${data.dateFrom} to ${data.dateTo || data.dateFrom}`, 20, 100);
    doc.text(`Timing: ${data.timeFrom} - ${data.timeTo}`, 20, 107);

    // --- Payment Table Box ---
    doc.setDrawColor(0);
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 115, 170, 30, 'F'); // Gray background box
    
    doc.setFont("helvetica", "bold");
    doc.text("Total Amount", 25, 125);
    doc.text("Paid Amount", 85, 125);
    doc.text("Balance Due", 145, 125);

    doc.setFont("helvetica", "normal");
    doc.text(`Rs. ${data.total}`, 25, 135);
    doc.setTextColor(39, 174, 96); // Green for paid
    doc.text(`Rs. ${data.paid}`, 85, 135);
    doc.setTextColor(214, 48, 49); // Red for remaining
    doc.text(`Rs. ${data.remaining}`, 145, 135);

    // --- Terms & Conditions ---
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TERMS & CONDITIONS:", 20, 160);
    doc.setFont("helvetica", "normal");
    
    const terms = [
        "1. All items brought into the hall are the responsibility of the customer.",
        "2. Amount once paid is non-refundable.",
        "3. Any damage to property will be charged to the customer.",
        "4. DJ is strictly prohibited from 10 PM to 6 AM.",
        "5. Parking is at your own risk."
    ];
    
    let yPos = 167;
    terms.forEach(term => {
        doc.text(term, 20, yPos);
        yPos += 7;
    });

    // --- Signatures ---
    doc.setFontSize(10);
    doc.text("__________________________", 20, 230);
    doc.text("Customer Signature", 25, 237);

    doc.text("__________________________", 130, 230);
    doc.text("Manager Signature", 140, 237);

    // Final Save
    doc.save(`Bill_${data.name.replace(/\s+/g, '_')}.pdf`);
}