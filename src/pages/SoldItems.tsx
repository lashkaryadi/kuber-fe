import { useEffect, useState, useCallback } from "react";
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
import { useAuth } from "@/contexts/AuthContext";

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

// Role-based permissions
const { user } = useAuth();
const isAdmin = user?.role === 'admin';

// Define fetchData before useEffect to avoid TS2448 error
const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const [salesRes, inventoryRes] = await Promise.all([
      api.getSales({
        page,
        limit, // ✅ Pass limit
        sortOrder: sortDir || undefined,
      }),
      api.getInventoryForSale(),
    ]);

    if (salesRes.success) {
      setSoldItems(Array.isArray(salesRes.data) ? salesRes.data : []);
      setMeta(salesRes.meta || null);
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
}, [page, limit, searchText, sortKey, sortDir]);

useEffect(() => {
  fetchData();
}, [page, limit, fetchData]); // ✅ Added limit dependency and fetchData

useEffect(() => {
  const timer = setTimeout(() => {
    setPage(1); // Reset to page 1 when search/sort changes
    fetchData();
  }, 300);
  return () => clearTimeout(timer);
}, [searchText, sortKey, sortDir, fetchData]);

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
  const response = await api.getInventoryForSale();

  if (response.success) {
    setApprovedItems(response.data);
  } else {
    setApprovedItems([]);
    toast({
      title: "Error",
      description: response.message || "Failed to fetch inventory for sale",
      variant: "destructive",
    });
  }
} catch (err: unknown) {
  setApprovedItems([]);
  const message =
    err instanceof Error
      ? err.message
      : "Failed to fetch inventory for sale";

  toast({
    title: "Error",
    description: message,
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

    if (!confirm("⚠️ Are you sure?\nThis will restore inventory quantities.")) {
      return;
    }

    const res = await api.undoSale(soldId);

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

const response = await api.sellInventoryItem({
  inventoryId: formData.inventoryId,
  soldShapes: [{
    shapeName: "General", // Using a general shape name for now
    pieces: Number(formData.soldPieces),
    weight: Number(formData.soldWeight),
    pricePerCarat: Number(formData.price) / Number(formData.soldWeight) || 0,
    lineTotal: Number(formData.price)
  }],
  customer: { name: formData.buyer || "Walk-in Customer" },
  invoiceNumber: `INV-${Date.now()}`
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
aria-label="Select all sold items"
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
aria-label={`Select sold item ${item.inventoryItem.serialNumber}`}
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
render: (item) => {
  // Check if the inventory item has shapes
  if (item.inventoryItem?.shapes && item.inventoryItem.shapes.length > 0) {
    return (
      <div className="space-y-1">
        {item.inventoryItem.shapes.map((shape) => (
          <div key={`${item.inventoryItem._id}-${shape.name || shape.shape || Math.random()}`} className="text-xs">
            <span className="font-medium">{shape.name || "Shape"}:</span> {shape.pieces} pcs
          </div>
        ))}
        <div className="pt-1 border-t border-gray-200">
          <span className="font-medium">Total:</span> {item.soldPieces ?? "-"} pcs
        </div>
      </div>
    );
  }
  return item.soldPieces ?? "-";
},
},
{
key: "soldWeight",
header: "Sold Weight",
render: (item) => {
  // Check if the inventory item has shapes
  if (item.inventoryItem?.shapes && item.inventoryItem.shapes.length > 0) {
    return (
      <div className="space-y-1">
        {item.inventoryItem.shapes.map((shape) => (
          <div key={`${item.inventoryItem._id}-${shape.name || shape.shape || Math.random()}`} className="text-xs">
            <span className="font-medium">{shape.name || "Shape"}:</span> {shape.weight} {item.inventoryItem?.weightUnit ?? "-"}
          </div>
        ))}
        <div className="pt-1 border-t border-gray-200">
          <span className="font-medium">Total:</span> {item.soldWeight ?? "-"} {item.inventoryItem?.weightUnit ?? "-"}
        </div>
      </div>
    );
  }
  return `${item.soldWeight ?? "-"} ${item.inventoryItem?.weightUnit ?? "-"}`;
},
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

      {isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          disabled={item.cancelled} // Disable if sale is cancelled
          onClick={() => handleUndo(item.id)}
          title={item.cancelled ? "Cancelled" : "Undo Sale"}
          className={item.cancelled ? "text-muted-foreground" : "h-10 w-10 text-destructive hover:text-destructive"}
        >
          <Trash2 className="h-4 w-4" />
          {item.cancelled && "Cancelled"} {/* Show cancelled state */}
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={async () => {
          try {
            // ✅ FETCH OR CREATE INVOICE
            const invoice = await api.getInvoiceBySold(item.id);

            // ✅ OPEN IN NEW TAB
            window.open(`/invoice-preview/${invoice._id}`, "_blank");
          } catch (error) {
            console.error("Invoice error:", error);
            toast({
              title: "Error",
              description: "Failed to load invoice",
              variant: "destructive",
            });
          }
        }}
        title="View Invoice"
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
                aria-label="Search sold items"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-3"
              />
            </div>
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


    </MainLayout>
  );
}

