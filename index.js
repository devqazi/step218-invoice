const { format, endOfMonth, startOfMonth, subDays } = window.dateFns;

const form = document.querySelector("form");
const generateBtn = document.querySelector('button[type="button"]');
const nameInput = document.getElementById("name");
const serialInput = document.getElementById("serial");
const emailInput = document.getElementById("email");
const idInput = document.getElementById("id");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const suggestions = document.querySelector(".suggestions");

const loadSavedData = () => {
  const rawData = localStorage.getItem("data");
  if (rawData) {
    const parsed = JSON.parse(rawData);
    for (let key in parsed) {
      document.querySelector(`[name="${key}"]`).value = parsed[key];
    }
  }
};

const saveData = (data) => {
  localStorage.setItem("data", JSON.stringify(data));
};

const generateFilename = (name, date) => {
  return [name, "STEP218 Invoice", format(date, "MMMM yy")].join("_");
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const generateInvoice = async () => {
  const serial = serialInput.value;
  const name = nameInput.value;
  const email = emailInput.value;
  const id = idInput.value;
  const amount = amountInput.value;
  const date = dateInput.value;

  saveData({ name, email, id });

  const blob = await step218Invoice({
    serial,
    amount,
    date,
    name,
    email,
    id,
    phone: "",
  });

  downloadBlob(blob, generateFilename(name, date));
};

const updateGenerateLabel = () => {
  if (nameInput.value && dateInput.value && generateBtn) {
    generateBtn.textContent = generateFilename(
      nameInput.value,
      dateInput.value
    );
  }
};

const autofillDateInput = (e) => {
  const id = e.target.dataset.id;
  if (id === "EOM") {
    dateInput.value = format(endOfMonth(new Date()), "yyyy-MM-dd");
  } else if (id === "EOLM") {
    dateInput.value = format(
      subDays(startOfMonth(new Date()), 1),
      "yyyy-MM-dd"
    );
  }
  updateGenerateLabel();
};

const init = () => {
  loadSavedData();
  nameInput.addEventListener("input", updateGenerateLabel);
  dateInput.addEventListener("input", updateGenerateLabel);
  if (generateBtn) {
    generateBtn.addEventListener("click", generateInvoice);
  }
  suggestions.addEventListener("click", autofillDateInput);
};

function step218Invoice({ serial, amount, date, name, phone, email, id }) {
  return new Promise((resolve, reject) => {
    const invoiceDate = new Date(date);
    const doc = new PDFDocument({ size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(new Blob(chunks, { type: "application/pdf" })));
    doc.on("error", reject);

    const minX = doc.page.margins.left;
    const minY = doc.page.margins.top;
    const maxX = doc.page.width - doc.page.margins.right;
    const maxY = doc.page.height - doc.page.margins.bottom;
    const contentW = maxX - minX;

    let cursorX = minX;
    let cursorY = minY;
    let offset = 4;

    // Title
    doc.font("Helvetica-Bold").fontSize(18);
    doc.text(name, cursorX, cursorY);
    doc.text("INVOICE", cursorX, cursorY, { align: "right", width: contentW });

    doc.font("Helvetica").fontSize(11);
    let lineHeight = doc.heightOfString("X");
    cursorY += lineHeight * 3;

    // Header boxes
    doc
      .fillColor("#f0f0f0")
      .rect(
        cursorX + (contentW * 5) / 7 - offset,
        cursorY - offset,
        contentW / 7,
        lineHeight * 2 + offset
      )
      .fill()
      .fillColor("#000000");
    doc
      .rect(
        cursorX + (contentW * 5) / 7 - offset,
        cursorY - offset,
        (contentW * 2) / 7 + offset * 2,
        lineHeight * 2 + offset
      )
      .stroke();

    doc.text(email, cursorX, cursorY);
    doc.text(phone, cursorX, cursorY + lineHeight);
    doc.text(serial, minX + (contentW * 6) / 7, cursorY, {
      align: "right",
      width: contentW / 7,
    });
    doc.text(
      format(invoiceDate, "dd MMM yyyy"),
      minX + (contentW * 6) / 7,
      cursorY + lineHeight,
      { align: "right", width: contentW / 7 }
    );
    doc.font("Helvetica-Bold");
    doc.text("INVOICE", minX + (contentW * 5) / 7, cursorY);
    doc.text("DATE", minX + (contentW * 5) / 7, cursorY + lineHeight);

    cursorY += lineHeight * 5;

    // BILL TO
    doc
      .fillColor("#f0f0f0")
      .rect(
        cursorX - offset,
        cursorY - offset,
        (contentW * 4) / 7,
        lineHeight + offset / 2
      )
      .fill()
      .fillColor("#000000");
    doc
      .rect(
        cursorX - offset,
        cursorY - offset,
        (contentW * 4) / 7,
        lineHeight * 4 + offset
      )
      .stroke();
    doc.font("Helvetica-Bold");
    doc.text("BILL TO", cursorX, cursorY);
    doc.font("Helvetica");
    doc.text("STEP218 LLC", cursorX, cursorY + lineHeight);
    doc.text(
      "327 Serra San Bruno Mountain View",
      cursorX,
      cursorY + lineHeight * 2
    );
    doc.text(
      "CA 94043, California, United States of America",
      cursorX,
      cursorY + lineHeight * 3
    );

    cursorY += lineHeight * 7;

    // Table
    doc.fillColor("#f0f0f0");
    doc
      .rect(
        cursorX - offset,
        cursorY - offset,
        contentW + offset * 2,
        lineHeight + offset / 2
      )
      .fill();
    doc
      .rect(
        cursorX - offset,
        cursorY + lineHeight * 8 - offset / 2,
        contentW + offset * 2,
        lineHeight + offset / 2
      )
      .fill();
    doc.fillColor("#000000");
    doc
      .rect(
        cursorX - offset,
        cursorY - offset,
        contentW + offset * 2,
        lineHeight * 9 + offset
      )
      .stroke();
    doc
      .moveTo(cursorX + (contentW * 6) / 7 - offset, cursorY - offset)
      .lineTo(cursorX + (contentW * 6) / 7 - offset, cursorY + lineHeight * 9)
      .stroke();

    doc.font("Helvetica-Bold");
    doc.text("DESCRIPTION", cursorX, cursorY);
    doc.text("AMOUNT", cursorX + (contentW * 6) / 7, cursorY);
    doc.font("Helvetica");
    doc.text(
      `Monthly Retainer - ${format(invoiceDate, "MMM yyyy")}`,
      cursorX,
      cursorY + lineHeight
    );
    doc.text(`$${amount}`, minX + (contentW * 6) / 7, cursorY + lineHeight, {
      align: "right",
      width: contentW / 7,
    });
    doc.text("Tax", cursorX, cursorY + lineHeight * 2);
    doc.text(`$0.00`, minX + (contentW * 6) / 7, cursorY + lineHeight * 2, {
      align: "right",
      width: contentW / 7,
    });
    doc.text("Note:", cursorX, cursorY + lineHeight * 4, { underline: true });
    doc.text("Please pay to:", cursorX, cursorY + lineHeight * 5);
    doc.text(`Payoneer Email: ${email}`, cursorX, cursorY + lineHeight * 6);
    doc.text(`Payoneer Customer ID: ${id}`, cursorX, cursorY + lineHeight * 7);
    doc.text(
      `$${amount}`,
      minX + (contentW * 6) / 7,
      cursorY + lineHeight * 8 + 1,
      { align: "right", width: contentW / 7 }
    );
    doc.font("Helvetica-Bold");
    doc.text("TOTAL", minX + (contentW * 5) / 7, cursorY + lineHeight * 8 + 1);

    cursorY += lineHeight * 11;

    doc.font("Helvetica");
    doc.text(
      "If you have any questions about this invoice, please contact",
      cursorX,
      cursorY,
      { align: "center", width: contentW }
    );
    const contacts = [name, phone, email].filter(Boolean).join(", ");
    doc.text(contacts, cursorX, cursorY + lineHeight, {
      align: "center",
      width: contentW,
    });

    doc.end();
  });
}

init();
