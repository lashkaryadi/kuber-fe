import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable, Column } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Edit, Trash2 } from "lucide-react";
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
  const [editMode, setEditMode] = useState(false);
  const [selectedSold, setSelectedSold] = useState<SoldItem | null>(null);

  const [approvedItems, setApprovedItems] = useState<InventoryItem[]>([]);
  const [soldItems, setSoldItems] = useState<SoldItem[]>([]);
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    inventoryId: "",
    price: "",
    currency: "USD",
    soldDate: new Date().toISOString().split("T")[0],
    buyer: "",
  });
  const [saving, setSaving] = useState(false);

  // Local search and sort state for Sold Items
  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState<"serialNumber" | "weight" | "price" | "buyer" | "soldDate" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Pagination state
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [page]); // Add page to dependency array

  // Trigger fetch when search or sort changes
  useEffect(() => {
    fetchData();
  }, [searchText, sortKey, sortDir, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [soldRes, inventoryRes] = await Promise.all([
        api.getSoldItems({
          page,
          limit: 10,
          search: searchText || undefined,
          sortBy: sortKey || undefined,
          sortOrder: sortDir || undefined
        }),
        api.getInventory({ status: "approved" }),
      ]);

      if (soldRes.success) {
        setSoldItems(Array.isArray(soldRes.data) ? soldRes.data : []);
        setMeta(soldRes.meta || null);
      } else {
        setSoldItems([]);
        setMeta(null);
      }

      // Handle inventory response defensively
      if (inventoryRes && typeof inventoryRes === 'object' && 'data' in inventoryRes) {
        setAvailableItems(Array.isArray(inventoryRes.data) ? inventoryRes.data : []);
      } else if (Array.isArray(inventoryRes)) {
        setAvailableItems(inventoryRes);
      } else {
        setAvailableItems([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setSoldItems([]);
      setAvailableItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setFormData({
      inventoryId: "",
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
      // Fetch only sellable items (approved items only)
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

    fetchData(); // refresh sold + inventory
  };

  const openEditModal = (item: SoldItem) => {
    setSelectedSold(item);
    setEditMode(true);
    setModalOpen(true);

    setFormData({
      inventoryId: item.inventoryItem?.id ?? "-", // not editable
      price: String(item.price),
      currency: item.currency,
      soldDate: item.soldDate.split("T")[0],
      buyer: item.buyer || "",
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

    // For new sales, validate that an item is selected
    if (!editMode && !formData.inventoryId) {
      toast({
        title: "Select item",
        description: "Please select an approved item to sell",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    const response =
      editMode && selectedSold
        ? await api.updateSold(selectedSold.id, {
            price: Number(formData.price),
            soldDate: formData.soldDate,
            buyer: formData.buyer || undefined,
          })
        : await api.markAsSold({
            inventoryId: formData.inventoryId,
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
      description: editMode ? "Sold item updated" : "Item marked as sold",
    });

    setModalOpen(false);
    setEditMode(false);
    setSelectedSold(null);

    // Refresh data after successful operation
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
        <span className="font-medium">
          {item.inventoryItem?.serialNumber ?? "-"}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (item) => item.inventoryItem.category?.name ?? "-",
    },
    {
      key: "weight",
      header: (
        <button
          onClick={() => {
            setSortKey("weight");
            setSortDir(sortDir === "asc" ? "desc" : "asc");
          }}
          className="flex items-center gap-1"
        >
          Weight {sortKey === "weight" && (sortDir === "asc" ? "↑" : "↓")}
        </button>
      ),
      render: (item) =>
        `${item.inventoryItem?.weight ?? "-"} ${
          item.inventoryItem?.weightUnit ?? "-"
        }`,
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditModal(item)}
            // title="Edit sale"
            title={editMode ? "Edit Sold Item" : "Mark Item as Sold"}
          >
            <Edit className=" h-4 w-4" />
          </Button>

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
            onClick={() => window.open(`/invoice/${item.id}`, "_blank")}
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
          <Pagination
            page={meta?.page}
            pages={meta?.pages}
            onChange={setPage}
          />
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
              onValueChange={(value) =>
                setFormData({ ...formData, inventoryId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an approved item" />
              </SelectTrigger>

              <SelectContent>
                {approvedItems.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No approved items available
                  </div>
                )}

                {approvedItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.serialNumber} — {item.category?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* <Select
              value={formData.inventoryId}
              onValueChange={(value) =>
                setFormData({ ...formData, inventoryId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an approved item" />
              </SelectTrigger>
              <SelectContent>
                {availableItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.serialNumber} - {item.category} ({item.weight}{' '}
                    {item.weightUnit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
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
