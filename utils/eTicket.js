function pdfSafe(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/([\\()])/g, "\\$1");
}

function pdfText(value, x, y, size, color = "1 1 1", font = "F1") {
  return `BT /${font} ${size} Tf ${color} rg ${x} ${y} Td (${pdfSafe(value)}) Tj ET\n`;
}

function gfMultiply(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function reedSolomonRemainder(data, degree) {
  const divisor = Array(degree).fill(0);
  divisor[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < degree; j += 1) {
      divisor[j] = gfMultiply(divisor[j], root);
      if (j + 1 < degree) divisor[j] ^= divisor[j + 1];
    }
    root = gfMultiply(root, 2);
  }
  const result = Array(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ result[0];
    result.shift();
    result.push(0);
    for (let i = 0; i < degree; i += 1) result[i] ^= gfMultiply(divisor[i], factor);
  }
  return result;
}

// Version 2-L is sufficient for the ticket reference and creates a crisp vector QR.
function createReferenceQr(reference) {
  const bytes = [...Buffer.from(String(reference), "utf8")];
  if (bytes.length > 32) throw new Error("Ticket reference is too long for the QR code.");
  const bits = [];
  const appendBits = (value, count) => {
    for (let i = count - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
  };
  appendBits(0b0100, 4);
  appendBits(bytes.length, 8);
  for (const byte of bytes) appendBits(byte, 8);
  for (let i = 0; i < Math.min(4, 272 - bits.length); i += 1) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((value, bit) => (value << 1) | bit, 0));
  }
  for (let pad = 0; data.length < 34; pad += 1) data.push(pad % 2 === 0 ? 0xec : 0x11);
  const allBytes = [...data, ...reedSolomonRemainder(data, 10)];
  const streamBits = allBytes.flatMap((byte) => Array.from({ length: 8 }, (_, i) => (byte >>> (7 - i)) & 1));

  const size = 25;
  const modules = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));
  const setFunction = (x, y, dark) => {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      modules[y][x] = dark;
      reserved[y][x] = true;
    }
  };

  const finder = (cx, cy) => {
    for (let dy = -1; dy <= 7; dy += 1) {
      for (let dx = -1; dx <= 7; dx += 1) {
        const x = cx + dx;
        const y = cy + dy;
        const within = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
        const dark = within && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
        setFunction(x, y, dark);
      }
    }
  };
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);

  for (let i = 8; i < size - 8; i += 1) {
    setFunction(i, 6, i % 2 === 0);
    setFunction(6, i, i % 2 === 0);
  }

  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      setFunction(18 + dx, 18 + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }

  // Reserve both format-information copies so data placement skips them.
  for (let i = 0; i <= 5; i += 1) setFunction(8, i, false);
  setFunction(8, 7, false);
  setFunction(8, 8, false);
  setFunction(7, 8, false);
  for (let i = 9; i < 15; i += 1) setFunction(14 - i, 8, false);
  for (let i = 0; i < 8; i += 1) setFunction(size - 1 - i, 8, false);
  for (let i = 8; i < 15; i += 1) setFunction(8, size - 15 + i, false);
  setFunction(8, size - 8, true);

  let bitIndex = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert += 1) {
      const upward = ((right + 1) & 2) === 0;
      const y = upward ? size - 1 - vert : vert;
      for (let offset = 0; offset < 2; offset += 1) {
        const x = right - offset;
        if (!reserved[y][x]) {
          const bit = bitIndex < streamBits.length ? streamBits[bitIndex] : 0;
          bitIndex += 1;
          modules[y][x] = Boolean(bit ^ ((x + y) % 2 === 0));
        }
      }
    }
  }

  let format = 0b01000; // Error correction L, mask pattern 0.
  let remainder = format << 10;
  for (let i = 14; i >= 10; i -= 1) {
    if ((remainder >>> i) & 1) remainder ^= 0x537 << (i - 10);
  }
  format = ((format << 10) | remainder) ^ 0x5412;
  const formatBit = (i) => ((format >>> i) & 1) !== 0;
  for (let i = 0; i <= 5; i += 1) setFunction(8, i, formatBit(i));
  setFunction(8, 7, formatBit(6));
  setFunction(8, 8, formatBit(7));
  setFunction(7, 8, formatBit(8));
  for (let i = 9; i < 15; i += 1) setFunction(14 - i, 8, formatBit(i));
  for (let i = 0; i < 8; i += 1) setFunction(size - 1 - i, 8, formatBit(i));
  for (let i = 8; i < 15; i += 1) setFunction(8, size - 15 + i, formatBit(i));
  setFunction(8, size - 8, true);
  return modules;
}

function qrPdfCommands(reference, x, y, moduleSize) {
  const matrix = createReferenceQr(reference);
  const quiet = 4 * moduleSize;
  const extent = matrix.length * moduleSize;
  let commands = `1 1 1 rg ${x - quiet} ${y - quiet} ${extent + quiet * 2} ${extent + quiet * 2} re f\n0 0 0 rg\n`;
  matrix.forEach((row, rowIndex) => row.forEach((dark, columnIndex) => {
    if (dark) commands += `${x + columnIndex * moduleSize} ${y + (matrix.length - 1 - rowIndex) * moduleSize} ${moduleSize} ${moduleSize} re f\n`;
  }));
  return commands;
}

export function createETicketPdf(order) {
  const reference = order.referenceNumber || `TCC-LEGACY-${String(order._id || "ORDER").slice(-6).toUpperCase()}`;
  const name = `${order.firstName} ${order.lastName}`;
  const eventDate = process.env.TICKET_EVENT_DATE || "30 January 2027 · 6:30 PM onwards";
  const venue = process.env.TICKET_EVENT_VENUE || "Port City Colombo";
  const amount = new Intl.NumberFormat("en-LK", { maximumFractionDigits: 2 }).format(order.paidAmount);
  const content = [
    "0.025 0.055 0.16 rg 0 0 842 595 re f\n",
    "0.98 0.72 0.20 rg 0 0 14 595 re f\n",
    "0.07 0.13 0.30 rg 32 28 778 539 re f\n",
    "0.98 0.72 0.20 rg 56 511 730 2 re f\n",
    pdfText("COLOMBO GROUP", 60, 548, 23, "1 1 1", "F2"),
    pdfText("PAST STUDENTS OF THOLANGAMUWA CENTRAL COLLEGE", 60, 528, 9, "0.88 0.90 0.95"),
    pdfText("E-TICKET  /  ENTRY PASS", 60, 475, 12, "0.98 0.72 0.20", "F2"),
    pdfText(order.eventName, 60, 425, 30, "1 1 1", "F2"),
    pdfText("APPROVED TICKET", 60, 391, 10, "0.44 0.83 0.66", "F2"),
    "0.16 0.23 0.39 rg 60 366 715 1 re f\n",
    pdfText("TICKET HOLDER", 60, 337, 9, "0.66 0.73 0.85"),
    pdfText(name, 60, 310, 18, "1 1 1", "F2"),
    pdfText("DATE & TIME", 60, 266, 9, "0.66 0.73 0.85"),
    pdfText(eventDate, 60, 243, 13, "1 1 1"),
    pdfText("VENUE", 60, 202, 9, "0.66 0.73 0.85"),
    pdfText(venue, 60, 178, 15, "1 1 1", "F2"),
    "0.98 0.72 0.20 rg 60 148 715 1 re f\n",
    pdfText("AMOUNT PAID", 60, 118, 9, "0.66 0.73 0.85"),
    pdfText(`LKR ${amount}`, 60, 83, 24, "0.98 0.72 0.20", "F2"),
    pdfText("REFERENCE NUMBER", 432, 337, 9, "0.66 0.73 0.85"),
    pdfText(reference, 432, 311, 18, "0.98 0.72 0.20", "F2"),
    qrPdfCommands(reference, 522, 155, 5),
    pdfText("Present this QR code or reference at the entrance.", 420, 118, 8, "0.88 0.90 0.95"),
    pdfText("REUNITE  /  NETWORK  /  CELEBRATE", 432, 83, 9, "0.98 0.72 0.20", "F2"),
  ].join("");

  const stream = Buffer.from(content, "ascii");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${stream.length} >>\nstream\n${stream.toString("ascii")}endstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "ascii"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "ascii");
}
