import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import api from "@/services/api";
import { toast } from "@/hooks/use-toast";

interface PackagingItem {
  inventory: {
    id: string;
    serialNumber: string;
    category: { name: string };
    weight: number;
    weightUnit: string;
    pieces: number;
    purchaseCode?: string;
    saleCode?: string;
  };
}

interface Packaging {
  id: string;
  clientName: string;
  createdAt: string;
  items: PackagingItem[];
}

export default function PackagingDetails() {
  const { id } = useParams(); // packagingId
  const navigate = useNavigate();

  const [packaging, setPackaging] = useState<Packaging | null>(null);
  const [keptItemIds, setKeptItemIds] = useState<string[]>([]);
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  /* ---------------- FETCH PACKAGING ---------------- */
  useEffect(() => {
    const fetchPackaging = async () => {
      try {
        const data = await api.getPackagingById(id!);
        setPackaging(data);

        // default: all items kept
        setKeptItemIds(data.items.map((i: PackagingItem) => i.inventory.id));
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load packaging",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPackaging();
  }, [id]);

  /* ---------------- CALCULATIONS ---------------- */
  const keptItems =
    packaging?.items.filter((i) => keptItemIds.includes(i.inventory.id)) || [];

  const totalWeight = keptItems.reduce((sum, i) => sum + i.inventory.weight, 0);

  const totalPieces = keptItems.reduce((sum, i) => sum + i.inventory.pieces, 0);

  const totalAmount = totalWeight * pricePerUnit;

  /* ---------------- ACTIONS ---------------- */
  const toggleItem = (itemId: string) => {
    setKeptItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleGenerateInvoice = async () => {
    if (keptItemIds.length === 0) {
      toast({
        title: "No items selected",
        description: "All items will be returned. Invoice not generated.",
      });
      return;
    }

    if (!pricePerUnit || pricePerUnit <= 0) {
      toast({
        title: "Price required",
        description: "Enter valid price per unit",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      const invoice = await api.generateInvoice({
        packagingId: packaging!.id,
        keptItemIds,
        pricePerUnit,
      });

      toast({
        title: "Invoice created",
        description: "Redirecting to invoice",
      });

      navigate(`/invoices/${invoice.id}`);
    } catch (err: any) {
      toast({
        title: "Error",
        description:
          err?.response?.data?.message || "Failed to generate invoice",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  /* ---------------- UI ---------------- */
  if (loading) {
    return (
      <MainLayout title="Packaging">
        <p>Loading...</p>
      </MainLayout>
    );
  }

  if (!packaging) return null;

  return (
    <MainLayout title="Packaging Details">
      <div className="space-y-6">
        {/* HEADER */}
        <Card className="p-4 space-y-2">
          <h2 className="text-lg font-semibold">
            Client: {packaging.clientName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Created: {new Date(packaging.createdAt).toLocaleDateString()}
          </p>
        </Card>

        {/* ITEMS */}
        <Card className="p-4 space-y-4">
          <h3 className="font-medium">Items in Lot</h3>

          {packaging.items.map((item) => {
            const inv = item.inventory;
            const checked = keptItemIds.includes(inv.id);

            return (
              <div
                key={inv.id}
                className="flex items-center justify-between border p-3 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleItem(inv.id)}
                  />

                  <div>
                    <p className="font-medium">{inv.serialNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {typeof inv.category === "object" ? inv.category.name : "Deleted"} • {inv.weight} {inv.weightUnit} •{" "}
                      {inv.pieces} pcs
                    </p>
                    {(inv.purchaseCode || inv.saleCode) && (
                      <p className="text-xs text-muted-foreground">
                        {inv.purchaseCode && `PC: ${inv.purchaseCode}`}{" "}
                        {inv.saleCode && `| SC: ${inv.saleCode}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>

        {/* BILLING */}
        <Card className="p-4 space-y-4">
          <h3 className="font-medium">Billing</h3>

          <div className="flex gap-4 items-center">
            <label htmlFor="pricePerUnit" className="text-sm">
              Price / Weight
            </label>

            <input
              id="pricePerUnit"
              type="number"
              className="border rounded px-3 py-1 w-32"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(Number(e.target.value))}
              min={0}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Weight</p>
              <p className="font-medium">{totalWeight}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Pieces</p>
              <p className="font-medium">{totalPieces}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Amount</p>
              <p className="font-medium">₹ {totalAmount.toFixed(2)}</p>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleGenerateInvoice} disabled={generating}>
              {generating ? "Generating..." : "Generate Invoice"}
            </Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
