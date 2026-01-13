import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable, Column } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Trash2, Zap } from "lucide-react";
import { Pagination } from "@/components/common/Pagination";
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select";
import api, { SoldItem, InventoryItem } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";

export default function SoldItems() {
type PaginationMeta = {
  page: number;
  pages: number;
  total: number;
};

const [approvedItems, setApprovedItems] = useState<InventoryItem[]>([]);
const [soldItems, setSoldItems] = useState<SoldItem[]>([]);
const [loading, setLoading] = useState(true);
const [modalOpen, setModalOpen] = useState(false);
const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null);
const [formData, setFormData] = useState({
inventoryId: "",
soldPieces: "",
soldWeight: "",
price: "",
currency: "USD",
soldDate: new Date().toISOString().split("T")[0],
buyer: "",
});
const [saving, setSaving] = useState(false);
const [selectedIds, setSelectedIds] = useState<string[]>([]);

// Pagination & filters
const [searchText, setSearchText] = useState("");
const [sortKey, setSortKey] = useState<"serialNumber" | "weight" | "price" | "buyer" | "soldDate" | null>(null);
const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
const [page, setPage] = useState(1);
const [limit, setLimit] = useState(10); // ✅ NEW: Customizable limit
const [meta, setMeta] = useState<PaginationMeta | null>(null);

useEffect(() => {
fetchData();
}, [page, limit]); // ✅ Added limit dependency

useEffect(() => {
const timer = setTimeout(() => {
setPage(1); // Reset to page 1 when search/sort changes
fetchData();
}, 300);
return () => clearTimeout(timer);
}, [searchText, sortKey, sortDir]);

const fetchData = async () => {
setLoading(true);
try {
const [soldRes, inventoryRes] = await Promise.all([
api.getSoldItems({
page,
limit, // ✅ Pass limit
search: searchText || undefined,
sortBy: sortKey || undefined,
sortOrder: sortDir || undefined,
}),
api.getSellableInventory(),
]);

  if (soldRes.success) {
    setSoldItems(Array.isArray(soldRes.data) ? soldRes.data : []);
    setMeta(soldRes.meta || null);
  } else {
    setSoldItems([]);
    setMeta(null);
  }

  if (inventoryRes && typeof inventoryRes === "object" && "data" in inventoryRes) {
    setApprovedItems(Array.isArray(inventoryRes.data) ? inventoryRes.data : []);
  } else if (Array.isArray(inventoryRes)) {
    setApprovedItems(inventoryRes);
  } else {
    setApprovedItems([]);
  }
} catch (error) {
  console.error("Error fetching data:", error);
  setSoldItems([]);
  setApprovedItems([]);
  setMeta(null);
} finally {
  setLoading(false);
}
};

  const openModal = () => {
    setFormData({
      inventoryId: "",
      soldPieces: "",
      soldWeight: "",
      price: "",
      currency: "USD",
      soldDate: new Date().toISOString().split("T")[0],
      buyer: "",
    });
    // setModalOpen(true);
  };

  const openMarkSoldModal = async () => {
setModalOpen(true);

try {
  const response = await api.getSellableInventory();

  if (response.success) {
    setApprovedItems(response.data);
  } else {
    setApprovedItems([]);
    toast({
      title: "Error",
      description: response.message || "Failed to fetch sellable inventory",
      variant: "destructive",
    });
  }
} catch (err: any) {
  setApprovedItems([]);
  toast({
    title: "Error",
    description: err?.response?.data?.message || "Failed to fetch sellable inventory",
    variant: "destructive",
  });
}
};

  const handleUndo = async (soldId: string) => {
if (!soldId) {
toast({
title: "Error",
description: "Invalid sold item",
variant: "destructive",
});
return;
}

const res = await api.undoSold(soldId);

if (!res.success) {
  toast({
    title: "Error",
    description: res.message,
    variant: "destructive",
  });
  return;
}

toast({
  title: "Success",
  description: "Sale undone, item moved back to inventory",
});

fetchData();
};

// ✅ NEW: Sell All Quick Fill
const handleSellAll = () => {
if (!selectedInventory) return;

setFormData({
  ...formData,
  soldPieces: String(selectedInventory.availablePieces || selectedInventory.pieces || 0),
  soldWeight: String(selectedInventory.availableWeight || selectedInventory.weight || 0),
});
};

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();

if (!formData.price || Number(formData.price) <= 0) {
  toast({
    title: "Invalid price",
    description: "Enter a valid sale price",
    variant: "destructive",
  });
  return;
}

if (!formData.soldPieces || Number(formData.soldPieces) <= 0) {
  toast({
    title: "Invalid pieces",
    description: "Enter a valid number of pieces to sell",
    variant: "destructive",
  });
  return;
}

if (!formData.soldWeight || Number(formData.soldWeight) <= 0) {
  toast({
    title: "Invalid weight",
    description: "Enter a valid weight to sell",
    variant: "destructive",
  });
  return;
}

// Validate against available inventory
const exceedsPieces = Number(formData.soldPieces) > (selectedInventory?.availablePieces || selectedInventory?.pieces || 0);
const exceedsWeight = Number(formData.soldWeight) > (selectedInventory?.availableWeight || selectedInventory?.weight || 0);

if (exceedsPieces || exceedsWeight) {
  toast({
    title: "Invalid quantity",
    description: exceedsPieces
      ? "Sold pieces exceed available stock"
      : "Sold weight exceeds available stock",
    variant: "destructive",
  });
  return;
}

if (!formData.inventoryId) {
  toast({
    title: "Select item",
    description: "Please select an approved item to sell",
    variant: "destructive",
  });
  return;
}

setSaving(true);

const response = await api.markAsSold({
  inventoryId: formData.inventoryId,
  soldPieces: Number(formData.soldPieces),
  soldWeight: Number(formData.soldWeight),
  price: Number(formData.price),
  currency: formData.currency,
  soldDate: formData.soldDate,
  buyer: formData.buyer || undefined,
});

if (!response.success) {
  toast({
    title: "Error",
    description: response.message,
    variant: "destructive",
  });
  setSaving(false);
  return;
}

toast({
  title: "Success",
  description: "Item marked as sold",
});

setModalOpen(false);
await fetchData();
setSaving(false);
};

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   if (!formData.inventoryId) {
  //     toast({
  //       title: "Select item",
  //       description: "Please select an approved item",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   if (!formData.price || Number(formData.price) <= 0) {
  //     toast({
  //       title: "Invalid price",
  //       description: "Enter a valid sale price",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setSaving(true);

  //   const response = await api.markAsSold({
  //     inventoryId: formData.inventoryId,
  //     price: Number(formData.price),
  //     currency: formData.currency,
  //     soldDate: formData.soldDate,
  //     buyer: formData.buyer || undefined,
  //   });

  //   if (!response.success) {
  //     toast({
  //       title: "Error",
  //       description: response.message,
  //       variant: "destructive",
  //     });
  //     setSaving(false);
  //     return;
  //   }

  //   toast({
  //     title: "Success",
  //     description: "Item marked as sold",
  //   });

  //   setModalOpen(false);
  //   fetchData();
  //   setSaving(false);
  // };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   // 🔒 basic validation
  //   if (!formData.inventoryId) {
  //     toast({
  //       title: "Select item",
  //       description: "Please select an approved item",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   if (!formData.price || Number(formData.price) <= 0) {
  //     toast({
  //       title: "Invalid price",
  //       description: "Enter a valid sale price",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setSaving(true);

  //   try {
  //     const response = await api.markAsSold({
  //       inventoryId: formData.inventoryId,
  //       price: Number(formData.price),
  //       currency: formData.currency,
  //       soldDate: formData.soldDate,
  //       buyer: formData.buyer || undefined,
  //     });

  //     if (!response?.success) {
  //       toast({
  //         title: "Error",
  //         description: response?.message || "Failed to mark item as sold",
  //         variant: "destructive",
  //       });
  //       setSaving(false);
  //       return;
  //     }

  //     toast({
  //       title: "Success",
  //       description: "Item marked as sold successfully",
  //     });

  //     setModalOpen(false);
  //     fetchData(); // 🔁 refresh sold + approved list
  //   } catch (err) {
  //     toast({
  //       title: "Error",
  //       description: "Something went wrong",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  // const columns: Column<SoldItem>[] = [
  //   {
  //     key: "serialNumber",
  //     header: "Serial Number",
  //     render: (item) => (
  //       <span className="font-medium">{item.inventoryItem.serialNumber}</span>
  //     ),
  //   },
  //   {
  //     key: "category",
  //     header: "Category",
  //     // render: (item) => item.inventoryItem.category,
  //     render: (item) => item.inventoryItem.category?.name ?? "-",

  //   },
  //   {
  //     key: "weight",
  //     header: "Weight",
  //     render: (item) =>
  //       `${item.inventoryItem.weight} ${item.inventoryItem.weightUnit}`,
  //   },
  //   {
  //     key: "price",
  //     header: "Sale Price",
  //     render: (item) => (
  //       <span className="font-semibold">
  //         {item.currency} {item.price.toLocaleString()}
  //       </span>
  //     ),
  //   },
  //   {
  //     key: "buyer",
  //     header: "Buyer",
  //     render: (item) => item.buyer || "-",
  //   },
  //   {
  //     key: "soldDate",
  //     header: "Sold Date",
  //     render: (item) => new Date(item.soldDate).toLocaleDateString(),
  //   },
  // ];

  const columns: Column<SoldItem>[] = [
{
key: "checkbox",
header: (
<input
type="checkbox"
checked={selectedIds.length === soldItems.length && soldItems.length > 0}
onChange={(e) => {
if (e.target.checked) {
setSelectedIds(soldItems.map((item) => item.id));
} else {
setSelectedIds([]);
}
}}
/>
),
render: (item) => (
<input
type="checkbox"
checked={selectedIds.includes(item.id)}
onChange={(e) => {
if (e.target.checked) {
setSelectedIds([...selectedIds, item.id]);
} else {
setSelectedIds(selectedIds.filter((id) => id !== item.id));
}
}}
/>
),
},
{
key: "rowNumber",
header: "#",
render: (item, index) => (
<span className="text-muted-foreground">
  {(page - 1) * limit + index + 1}
</span>
),
},
{
key: "serialNumber",
header: (
<button
onClick={() => {
setSortKey("serialNumber");
setSortDir(sortDir === "asc" ? "desc" : "asc");
}}
className="flex items-center gap-1"
>
Serial Number {sortKey === "serialNumber" && (sortDir === "asc" ? "↑" : "↓")}
</button>
),
render: (item) => (
<span className="font-medium">{item.inventoryItem?.serialNumber ?? "-"}</span>
),
},
{
key: "category",
header: "Category",
render: (item) =>
  typeof item.inventoryItem.category === "object"
    ? item.inventoryItem.category.name
    : "-",
},
{
key: "soldPieces",
header: "Sold Pieces",
render: (item) => item.soldPieces ?? "-",
},
{
key: "soldWeight",
header: "Sold Weight",
render: (item) =>
  `${item.soldWeight ?? "-"} ${item.inventoryItem?.weightUnit ?? "-"}`,
},
{
key: "price",
header: (
<button
onClick={() => {
setSortKey("price");
setSortDir(sortDir === "asc" ? "desc" : "asc");
}}
className="flex items-center gap-1"
>
Sale Price {sortKey === "price" && (sortDir === "asc" ? "↑" : "↓")}
</button>
),
render: (item) => (
<span className="font-semibold">
{item.currency} {item.price.toLocaleString()}
</span>
),
},
{
key: "buyer",
header: (
<button
onClick={() => {
setSortKey("buyer");
setSortDir(sortDir === "asc" ? "desc" : "asc");
}}
className="flex items-center gap-1"
>
Buyer {sortKey === "buyer" && (sortDir === "asc" ? "↑" : "↓")}
</button>
),
render: (item) => item.buyer || "-",
},
{
key: "soldDate",
header: (
<button
onClick={() => {
setSortKey("soldDate");
setSortDir(sortDir === "asc" ? "desc" : "asc");
}}
className="flex items-center gap-1"
>
Sold Date {sortKey === "soldDate" && (sortDir === "asc" ? "↑" : "↓")}
</button>
),
render: (item) => new Date(item.soldDate).toLocaleDateString(),
},
{
key: "actions",
header: "Actions",
render: (item) => (
<div className="flex gap-1">
{/* ❌ REMOVED: Edit button (causes accounting bugs) */}

      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleUndo(item.id)}
        title="Undo Sale"
        className="h-10 w-10 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={async () => {
          try {
            const invoice = await api.getInvoiceBySold(item.id);
            window.open(`/invoice-preview/${invoice._id}`, "_blank");
          } catch (error) {
            window.open(`/invoice/${item.id}`, "_blank");
          }
        }}
      >
        <FileText className="h-4 w-4" />
      </Button>
    </div>
  ),
},
];

  return (
    <MainLayout title="Sold Items">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-muted-foreground">
            Track sold items and sales history
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => api.exportSoldItemsExcel()}
            >
              Export Excel
            </Button>
<Button
        disabled={selectedIds.length === 0}
        onClick={async () => {
          const invoice = await api.createBulkInvoice(selectedIds);
          window.open(`/invoice-preview/${invoice._id}`, "_blank");
        }}
      >
        Generate Bulk Invoice ({selectedIds.length})
      </Button>
            <div className="relative flex-1 max-w-sm">
              <Input
                placeholder="Search sold items..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-3"
              />
            </div>
            <Button onClick={openMarkSoldModal} className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Mark as Sold
            </Button>
          </div>
        </div>

    <div className="royal-card">
      <DataTable
        columns={columns}
        data={soldItems}
        loading={loading}
        keyExtractor={(item) => item.id}
        emptyMessage="No sold items found"
      />

      {/* ✅ NEW: Customizable Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Items per page:</span>
          <Select
            value={String(limit)}
            onValueChange={(value) => {
              setLimit(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Pagination page={meta?.page} pages={meta?.pages} onChange={setPage} />
      </div>
    </div>
      </div>

      {/* Mark as Sold Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Mark Item as Sold"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
        <Label htmlFor="inventoryId">Select Item *</Label>
        <Select
          value={formData.inventoryId}
          onValueChange={(value) => {
            const inv = approvedItems.find((i) => i.id === value);
            setSelectedInventory(inv || null);
            setFormData({ ...formData, inventoryId: value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an approved item" />
          </SelectTrigger>

          <SelectContent>
            {approvedItems.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No approved items available</div>
            )}

            {approvedItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.serialNumber} — {item.category?.name} (Pieces: {item.availablePieces || item.pieces}, Weight:{" "}
                {item.availableWeight || item.weight} {item.weightUnit})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedInventory && (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">
            Available:
            <span className="ml-2 font-medium text-foreground">
              {selectedInventory.availablePieces || selectedInventory.pieces} pcs |{" "}
              {selectedInventory.availableWeight || selectedInventory.weight} {selectedInventory.weightUnit}
            </span>
          </div>

          {/* ✅ NEW: Sell All Button */}
          <Button type="button" variant="outline" size="sm" onClick={handleSellAll} className="gap-2">
            <Zap className="h-3 w-3" />
            Sell All
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="soldPieces">Sold Pieces *</Label>
          <Input
            id="soldPieces"
            type="number"
            value={formData.soldPieces}
            onChange={(e) => setFormData({ ...formData, soldPieces: e.target.value })}
            placeholder="Pieces to sell"
            required
            className="flex-1"
          />
          {selectedInventory &&
            Number(formData.soldPieces) > (selectedInventory?.availablePieces || selectedInventory?.pieces || 0) && (
              <p className="text-sm text-red-500">
                Sold pieces exceed available stock ({selectedInventory.availablePieces || selectedInventory.pieces} pcs)
              </p>
            )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="soldWeight">Sold Weight *</Label>
          <Input
            id="soldWeight"
            type="number"
            step="0.01"
            value={formData.soldWeight}
            onChange={(e) => setFormData({ ...formData, soldWeight: e.target.value })}
            placeholder="Weight to sell"
            required
            className="flex-1"
          />
          {selectedInventory &&
            Number(formData.soldWeight) > (selectedInventory?.availableWeight || selectedInventory?.weight || 0) && (
              <p className="text-sm text-red-500">
                Sold weight exceeds available stock ({selectedInventory.availableWeight || selectedInventory.weight}{" "}
                {selectedInventory.weightUnit})
              </p>
            )}
        </div>
      </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Sale Price *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, currency: value })
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="0.00"
                  required
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="soldDate">Sold Date *</Label>
              <Input
                id="soldDate"
                type="date"
                value={formData.soldDate}
                onChange={(e) =>
                  setFormData({ ...formData, soldDate: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buyer">Buyer Name</Label>
            <Input
              id="buyer"
              value={formData.buyer}
              onChange={(e) =>
                setFormData({ ...formData, buyer: e.target.value })
              }
              placeholder="Optional buyer information"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Mark as Sold"}
            </Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
