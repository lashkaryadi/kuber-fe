import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { getCompany } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Download, Printer } from "lucide-react";

export default function InvoicePreview() {
  const { soldId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!soldId) return;

    Promise.all([api.getInvoiceBySold(soldId), getCompany()])
      .then(([invoiceRes, companyRes]) => {
        setInvoice(invoiceRes);
        setCompany(companyRes);
      })
      .catch(() => {
        setInvoice(null);
        setCompany(null);
      })
      .finally(() => setLoading(false));
  }, [soldId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoice?._id) return;

    try {
      await api.downloadInvoicePDF(invoice._id);
    } catch (error) {
      alert("Failed to download invoice PDF");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl mb-4">Invoice not found</p>
        <Button onClick={() => navigate("/sold")}>Go Back</Button>
      </div>
    );
  }

  const item = invoice.soldItem.inventoryItem;
  const price = invoice.soldItem.price || 0;
  const taxRate = company?.taxRate || 0;
  const cgstRate = taxRate / 2;
  const sgstRate = taxRate / 2;
  const subtotal = price;
  const cgstAmount = (subtotal * cgstRate) / 100;
  const sgstAmount = (subtotal * sgstRate) / 100;
  const total = subtotal + cgstAmount + sgstAmount;
  const currency = invoice.soldItem.currency || "INR";

  const formatCurrency = (amount: number) => {
    const symbols: any = { USD: "$", EUR: "€", GBP: "£", INR: "₹" };
    return `${symbols[currency] || currency} ${amount.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Action Buttons - Hidden on Print */}
      <div className="max-w-4xl mx-auto mb-6 px-4 print:hidden">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate("/sold")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sold Items
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice Container */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
        <div className="p-12">
          {/* Header Section */}
          <div className="border-b-2 border-gray-200 pb-8 mb-8">
            <div className="flex justify-between items-start">
              {/* Company Info */}
              <div className="flex items-start gap-4">
                {company?.logoUrl && (
                  <img
                    src={`http://localhost:5001${company.logoUrl}`}
                    alt="Company Logo"
                    className="h-20 w-20 object-contain"
                  />
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {company?.companyName || "Company Name"}
                  </h1>
                  <div className="text-sm text-gray-600 space-y-1">
                    {company?.address && <p>{company.address}</p>}
                    {company?.gstNumber && <p>GSTIN: {company.gstNumber}</p>}
                    {company?.phone && <p>Phone: {company.phone}</p>}
                    {company?.email && <p>Email: {company.email}</p>}
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="text-right">
                <div className="bg-primary/10 px-6 py-3 rounded-lg mb-4">
                  <h2 className="text-2xl font-bold text-primary">
                    TAX INVOICE
                  </h2>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">
                    Invoice No:{" "}
                    <span className="text-primary">
                      {invoice.invoiceNumber}
                    </span>
                  </p>
                  <p>
                    Date:{" "}
                    {new Date(
                      invoice.invoiceDate || invoice.soldItem.soldDate
                    ).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To Section */}
          <div className="mb-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Bill To
              </h3>
              <p className="text-lg font-semibold text-gray-800">
                {invoice.soldItem.buyer || "Walk-in Customer"}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Weight
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.serialNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.category?.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">
                      {item.weight} {item.weightUnit}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(subtotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                {taxRate > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        CGST ({cgstRate.toFixed(2)}%):
                      </span>
                      <span className="font-medium">
                        {formatCurrency(cgstAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        SGST ({sgstRate.toFixed(2)}%):
                      </span>
                      <span className="font-medium">
                        {formatCurrency(sgstAmount)}
                      </span>
                    </div>
                  </>
                )}

                <div className="border-t-2 border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">
                      Total:
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {invoice.notes && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Notes
                </h4>
                <p className="text-sm text-gray-600">{invoice.notes}</p>
              </div>
            )}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Payment Terms
              </h4>
              <p className="text-sm text-gray-600">
                {invoice.paymentTerms || "Payment due within 7 days"}
              </p>
            </div>
          </div>

          {/* Signature Section */}
          <div className="border-t-2 border-gray-200 pt-8">
            <div className="flex justify-end">
              <div className="text-center">
                {company?.signatureUrl && (
                  <div className="mb-2">
                    <img
                      src={`http://localhost:5001${company.signatureUrl}`}
                      alt="Signature"
                      className="h-16 w-auto mx-auto"
                    />
                  </div>
                )}
                <div className="border-t border-gray-300 pt-2 w-48">
                  <p className="text-xs font-semibold text-gray-600">
                    Authorized Signature
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {company?.companyName || ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Thank you for your business!
            </p>
            <p className="text-xs text-gray-400 mt-1">
              This is a computer-generated invoice and does not require a
              physical signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
