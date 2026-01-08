import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { generateInvoicePDF } from "@/services/pdfService";
import { Loader2 } from "lucide-react";

export default function InvoicePreview() {
  const { soldId } = useParams();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!soldId) return;

  api.getInvoiceBySold(soldId)
    .then((res) => setInvoice(res))
    .catch(() => setInvoice(null))
    .finally(() => setLoading(false));
}, [soldId]);


  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    );
  }
  const item = invoice.soldItem.inventoryItem;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Invoice</h1>

      <div className="border p-4 rounded-md space-y-2">
        <p><b>Invoice No:</b> {invoice.invoiceNumber}</p>
        <p><b>Date:</b> {new Date(invoice.invoiceDate).toDateString()}</p>
        <p><b>Buyer:</b> {invoice.buyer || "-"}</p>
      </div>

      <div className="border rounded p-4 space-y-2">
        <p><b>Serial:</b> {item.serialNumber}</p>
        <p><b>Category:</b> {item.category?.name}</p>
        <p><b>Weight:</b> {item.weight} {item.weightUnit}</p>
        <p className="font-bold text-lg">
          Amount: {invoice.currency} {invoice.amount}
        </p>
      </div>

      <div className="flex gap-3">
        {/* <Button
          onClick={() =>
            window.open(`/api/invoices/${invoice._id}/pdf`, "_blank")
          }
        >
          Download PDF
        </Button> */}
        <Button onClick={() => generateInvoicePDF(invoice)}>
        Download PDF
      </Button>

        <Button variant="outline" onClick={() => window.print()}>
          Print
        </Button>
      </div>
    </div>
  );
}
