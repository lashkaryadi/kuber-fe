import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import api from "@/services/api";
import { toast } from "@/hooks/use-toast";

interface InvoiceItem {
  serialNumber: string;
  weight: number;
  pieces: number;
  price: number;
}

interface Invoice {
  id: string;
  clientName: string;
  pricePerUnit: number;
  totalWeight: number;
  totalAmount: number;
  items: InvoiceItem[];
  createdAt: string;
}

export default function InvoiceView() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const data = await api.getInvoiceById(id!);
        setInvoice(data);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load invoice",
          variant: "destructive",
        });
      }
    };

    fetchInvoice();
  }, [id]);

  if (!invoice) return null;

  return (
    <MainLayout title="Invoice">
      <div className="space-y-6">

        <Card className="p-4">
          <h2 className="text-lg font-semibold">
            Client: {invoice.clientName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Invoice Date: {new Date(invoice.createdAt).toLocaleDateString()}
          </p>
        </Card>

        <Card className="p-4 space-y-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Serial</th>
                <th>Weight</th>
                <th>Pieces</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{item.serialNumber}</td>
                  <td className="text-center">{item.weight}</td>
                  <td className="text-center">{item.pieces}</td>
                  <td className="text-right">₹ {item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-4 flex justify-end text-lg font-semibold">
          Total: ₹ {invoice.totalAmount.toFixed(2)}
        </Card>

      </div>
    </MainLayout>
  );
}
