import jsPDF from "jspdf";

export const generateInvoicePDF = (invoice: any) => {
  const doc = new jsPDF();

  const { invoiceNumber, invoiceDate, buyer, currency, amount, soldItem } =
    invoice;

  let y = 20;

  doc.setFontSize(18);
  doc.text("INVOICE", 105, y, { align: "center" });

  y += 10;
  doc.setFontSize(11);

  doc.text(`Invoice No: ${invoiceNumber}`, 20, y);
  doc.text(
    `Date: ${new Date(invoiceDate).toLocaleDateString()}`,
    150,
    y
  );

  y += 10;
  doc.text(`Buyer: ${buyer || "-"}`, 20, y);

  y += 10;
  doc.line(20, y, 190, y);

  y += 10;
  doc.setFont(undefined, "bold");
  doc.text("Item Details", 20, y);
  doc.setFont(undefined, "normal");

  y += 10;
  doc.text(`Serial Number: ${soldItem.inventoryItem.serialNumber}`, 20, y);

  y += 8;
  const categoryName = typeof soldItem.inventoryItem.category === "object"
    ? soldItem.inventoryItem.category.name
    : "Deleted Category";
  doc.text(
    `Category: ${categoryName}`,
    20,
    y
  );

  y += 8;
  doc.text(
    `Weight: ${soldItem.inventoryItem.weight} ${soldItem.inventoryItem.weightUnit}`,
    20,
    y
  );

  y += 12;
  doc.line(20, y, 190, y);

  y += 10;
  doc.setFont(undefined, "bold");
  doc.text("Total Amount", 20, y);
  doc.setFont(undefined, "normal");

  y += 8;
  doc.text(`${currency} ${amount}`, 20, y);

  y += 20;
  doc.setFontSize(10);
  doc.text(
    "This is a system generated invoice.",
    105,
    y,
    { align: "center" }
  );

  doc.save(`Invoice-${invoiceNumber}.pdf`);
};
