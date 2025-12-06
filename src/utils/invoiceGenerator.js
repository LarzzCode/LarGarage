import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper Format Rupiah (Tetap sama)
const formatRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

// TERIMA PARAMETER KEDUA: 'settings'
export const generateInvoice = (data, settings) => {
  const doc = new jsPDF();

  // Pastikan settings ada isinya (Default value jika error/loading)
  const workshopName = settings?.workshop_name || "BENGKEL PRO";
  const workshopAddress = settings?.address || "Alamat Bengkel Belum Diatur";
  const workshopPhone = settings?.phone || "-";
  const workshopOwner = settings?.owner || "Admin";

  // --- HEADER (DINAMIS DARI DATABASE) ---
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100);
  const brands = "ISUZU   DAIHATSU   DATSUN   HONDA   TOYOTA   SUZUKI   MITSUBISHI   CHEVROLET   HYUNDAI   KIA   MAZDA   FORD   NISSAN   BMW";
  doc.text(brands, 105, 10, { align: "center" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text(workshopName.toUpperCase(), 14, 20); // <-- NAMA BENGKEL DINAMIS

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("PERAWATAN & PERBAIKAN, ENGINE, INJECTION, AC, SPESIALIS AUTOMATIC", 14, 25);
  
  doc.setFont("helvetica", "normal");
  doc.text(workshopAddress, 14, 30); // <-- ALAMAT DINAMIS
  doc.text(`HP/Telp: ${workshopPhone}`, 14, 34); // <-- HP DINAMIS

  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  // ... (Bagian Info Pelanggan, Tabel, Total Harga TETAP SAMA KODENYA) ...
  // ... Copas bagian tengah dari kode sebelumnya disini ...
  // AGAR RINGKAS, SAYA LANGSUNG KE BAGIAN BAWAH YANG BERUBAH

  // INFO DETAIL
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const leftX = 14; const leftDataX = 50;
  const rightX = 120; const rightDataX = 150;
  let currentY = 48; const gap = 5;
  const invoiceNo = `INV/${new Date().getFullYear()}/${data.id}`;

  doc.text("Perihal", leftX, currentY);          doc.text(": SERVICE", leftDataX, currentY);
  doc.text("Nama Pelanggan", leftX, currentY + gap);  doc.text(`: ${data.customer.toUpperCase()}`, leftDataX, currentY + gap);
  doc.text("Jenis Kendaraan", leftX, currentY + gap*2); doc.text(`: ${data.car.toUpperCase()}`, leftDataX, currentY + gap*2);
  doc.text("Nomor Polisi", leftX, currentY + gap*3);    doc.text(`: ${data.plate.toUpperCase()}`, leftDataX, currentY + gap*3);
  doc.text("VIN / Rangka", leftX, currentY + gap*4);    doc.text(`: ${data.vin ? data.vin.toUpperCase() : "-"}`, leftDataX, currentY + gap*4);

  doc.text("No. Invoice", rightX, currentY + gap);    doc.text(`: ${invoiceNo}`, rightDataX, currentY + gap);
  doc.text("KM / Miles", rightX, currentY + gap*2);   doc.text(`: -`, rightDataX, currentY + gap*2);

  // TABEL
  let tableRows = [];
  
  if (data.items && data.items.length > 0) {
    // Jika ada data items dari JSON
    tableRows = data.items.map((item, index) => [
      (index + 1).toString(),
      item.qty.toString(),
      item.category === "Jasa" ? "JASA" : "PCS", // Satuan otomatis
      item.name.toUpperCase(),
      formatRupiah(item.price),
      formatRupiah(item.total)
    ]);
  } else {
    // Fallback jika data items kosong (support data lama)
    const jasaPrice = data.price * 0.3;
    const partsPrice = data.price * 0.7;
    tableRows = [
      ["1", "1", "SET", "Jasa Service & Tune Up (Est)", formatRupiah(jasaPrice), formatRupiah(jasaPrice)],
      ["2", "1", "SET", "Sparepart & Oli (Est)", formatRupiah(partsPrice), formatRupiah(partsPrice)]
    ];
  }

  // Tambahkan baris kosong agar tabel tetap panjang ke bawah
  while (tableRows.length < 6) {
    tableRows.push(["", "", "", "", "", ""]);
  }

  autoTable(doc, {
    head: [["NO.", "QTY", "UNIT", "NAMA BARANG / JASA", "HARGA", "JUMLAH"]],
    body: tableRows,
    startY: 80,
    theme: 'grid',
    styles: { fontSize: 9, lineColor: [0, 0, 0], lineWidth: 0.1, textColor: 0 },
    headStyles: { fillColor: [255, 255, 255], textColor: 0, lineWidth: 0.1, lineColor: 0 },
  });

  // TOTAL & FOOTER
  const finalY = doc.lastAutoTable.finalY + 5;
  const boxX = 120; const boxWidth = 76; const lineHeight = 7;
  
  doc.rect(boxX, finalY, boxWidth, lineHeight);
  doc.setFont("helvetica", "bold");
  doc.text("JUMLAH Rp.", boxX + 2, finalY + 5);
  doc.text(formatRupiah(data.price), 194, finalY + 5, { align: "right" });

  doc.rect(boxX, finalY + lineHeight, boxWidth, lineHeight);
  doc.text("DISC", boxX + 2, finalY + lineHeight + 5);
  doc.text("Rp 0", 194, finalY + lineHeight + 5, { align: "right" });

  doc.rect(boxX, finalY + (lineHeight*2), boxWidth, lineHeight);
  doc.text("TOTAL BAYAR", boxX + 2, finalY + (lineHeight*2) + 5);
  doc.text(formatRupiah(data.price), 194, finalY + (lineHeight*2) + 5, { align: "right" });

  // TANDA TANGAN (DINAMIS DARI SETTINGS)
  const dateY = finalY + (lineHeight*3) + 10;
  doc.setFont("helvetica", "normal");
  doc.text(`Tangerang Selatan, ${new Date().toLocaleDateString("id-ID")}`, 158, dateY, { align: "center" });

  doc.text("Tanda Terima,", 30, dateY, { align: "center" });
  doc.text("( ........................ )", 30, dateY + 25, { align: "center" });

  doc.text("Hormat Kami", 158, dateY + 5, { align: "center" });
  doc.text(`( ${workshopOwner.toUpperCase()} )`, 158, dateY + 25, { align: "center" }); // <-- NAMA ADMIN DINAMIS

  doc.save(`Invoice_${data.plate}.pdf`);
};