import { useEffect, useState, useRef } from "react";
import { Plus, Search, Edit, Trash2, Eye, Filter, ShoppingCart } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable, Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Modal } from "@/components/common/Modal";
import { ImageUpload } from "@/components/common/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSearch } from "@/contexts/SearchContext";
import { ExcelPreviewModal } from "@/components/inventory/ExcelPreviewModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api, { InventoryItem, Category } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { Pagination } from "@/components/common/Pagination";

export default function Inventory() {
  // const [excelFile, setExcelFile] = useState<File | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<File | null>(null);

  const [searchText, setSearchText] = useState("");
  const [sortKey, setSortKey] = useState<
    "serialNumber" | "pieces" | "purchaseCode" | "saleCode" | "weight" | null
  >(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const { query: globalQuery } = useSearch(); // Keep global search for navigation

  const [previewOpen, setPreviewOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    serialNumber: "",
    category: "",
    pieces: "1",
    weight: "",
    weightUnit: "carat" as "carat" | "gram",
    purchaseCode: "",
    saleCode: "",
    length: "",
    width: "",
    height: "",
    dimensionUnit: "mm",
    certification: "",
    location: "",
    status: "pending" as "pending" | "approved",
    description: "",
    images: [] as string[],
  });
  const [previewRows, setPreviewRows] = useState<ExcelPreviewRow[]>([]);
  const [allRows, setAllRows] = useState<ExcelPreviewRow[]>([]);
  const hasValidRows = previewRows.some((r) => r.isValid && !r.isDuplicate);
  const [saving, setSaving] = useState(false);

  // State for mark as sold functionality
  const [markAsSoldModalOpen, setMarkAsSoldModalOpen] = useState(false);
  const [itemToMarkAsSold, setItemToMarkAsSold] = useState<InventoryItem | null>(null);
  const [soldForm, setSoldForm] = useState({
    price: "",
    currency: "USD",
    soldDate: new Date().toISOString().split("T")[0],
    buyer: "",
  });
  const [selling, setSelling] = useState(false);

  const markAsSoldFromInventory = (item: InventoryItem) => {
    setItemToMarkAsSold(item);
    setSoldForm({
      price: "",
      currency: "USD",
      soldDate: new Date().toISOString().split("T")[0],
      buyer: "",
    });
    setMarkAsSoldModalOpen(true);
  };

  const handleMarkAsSoldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSelling(true);

    if (!itemToMarkAsSold) {
      toast({
        title: "Error",
        description: "No item selected to sell",
        variant: "destructive",
      });
      setSelling(false);
      return;
    }

    if (!soldForm.price || Number(soldForm.price) <= 0) {
      toast({
        title: "Invalid price",
        description: "Enter a valid sale price",
        variant: "destructive",
      });
      setSelling(false);
      return;
    }

    const response = await api.markAsSold({
      inventoryId: itemToMarkAsSold.id,
      price: Number(soldForm.price),
      currency: soldForm.currency,
      soldDate: soldForm.soldDate,
      buyer: soldForm.buyer || undefined,
    });

    if (!response.success) {
      toast({
        title: "Error",
        description: response.message,
        variant: "destructive",
      });
      setSelling(false);
      return;
    }

    toast({
      title: "Success",
      description: "Item marked as sold successfully",
    });

    setMarkAsSoldModalOpen(false);
    setItemToMarkAsSold(null);
    fetchData(); // Refresh the inventory list
    setSelling(false);
  };

  // Pagination state
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  // Effect to reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchText, categoryFilter, statusFilter, sortKey, sortDir]);

  // Effect to fetch data when page changes (including when page is reset due to filter changes)
  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    // Check if filters have changed compared to the last fetch
    // If filters changed and we're not on page 1, reset to page 1 and return early
    // This will trigger a re-render with page=1, which will then call fetchData again

    // Since we can't prevent the execution mid-way, we'll handle this differently
    // We'll use a ref to track if we just reset the page due to filter changes

    setLoading(true);

    try {
      const [inventoryRes, categoriesRes] = await Promise.all([
        api.getInventory({
          search: searchText,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          sortBy: sortKey || "createdAt",
          sortOrder: sortDir,
          page,
          limit: 10,
        }),
        api.getCategories(),
      ]);

      setItems(Array.isArray(inventoryRes.data) ? inventoryRes.data : []);
      setMeta(inventoryRes.meta);
      setCategories(Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes?.data || []));
    } catch (err) {
      console.error("Failed to load inventory data", err);
      setItems([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when search or filters change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); // Reset to first page when filters change
      fetchData();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchText, categoryFilter, statusFilter, sortKey, sortDir]);

  const openAddModal = () => {
    setSelectedItem(null);
    setFormData({
      serialNumber: "",
      category: "",
      pieces: "1",
      weight: "",
      weightUnit: "carat",
      purchaseCode: "",
      saleCode: "",
      length: "",
      width: "",
      height: "",
      dimensionUnit: "mm",
      certification: "",
      location: "",
      status: "pending",
      description: "",
      images: [],
    });
    setModalOpen(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      serialNumber: item.serialNumber,
      category:
        typeof item.category === "object" ? item.category.id : item.category,

      pieces: item.pieces.toString(),
      weight: item.weight.toString(),
      weightUnit: item.weightUnit,
      purchaseCode: "",
      saleCode: "",
      length: item.dimensions?.length?.toString() || "",
      width: item.dimensions?.width?.toString() || "",
      height: item.dimensions?.height?.toString() || "",
      dimensionUnit: item.dimensions?.unit || "mm",

      certification: item.certification || "",
      location: item.location,
      status: item.status,
      description: item.description || "",
      images: item.images || [],
    });
    setModalOpen(true);
  };

  const openViewModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  const openDeleteModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (!formData.category) {
      toast({
        title: "Category required",
        description: "Please select a category",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }
    const payload = {
      serialNumber: formData.serialNumber,
      category: formData.category,
      pieces: parseInt(formData.pieces, 10),
      weight: parseFloat(formData.weight),
      weightUnit: formData.weightUnit,
      purchaseCode: formData.purchaseCode,
      saleCode: formData.saleCode,
      dimensions: {
        length: Number(formData.length) || undefined,
        width: Number(formData.width) || undefined,
        height: Number(formData.height) || undefined,
        unit: formData.dimensionUnit,
      },
      certification: formData.certification || undefined,
      location: formData.location,
      status: formData.status,
      description: formData.description || undefined,
      images: formData.images.length > 0 ? formData.images : undefined,
    };

    const response = selectedItem
      ? await api.updateInventoryItem(selectedItem.id, payload)
      : await api.createInventoryItem(payload as unknown as InventoryItem);

    if (!response.success) {
      toast({
        title: "Duplicate Entry",
        description: response.message,
        variant: "destructive",
      });

      // 🔥 UX: focus serial number if duplicate
      if (response.field === "serialNumber") {
        document.getElementById("serialNumber")?.focus();
      }

      setSaving(false);
      return;
    }

    toast({
      title: "Success",
      description: selectedItem
        ? "Item updated successfully"
        : "Item added successfully",
    });

    setModalOpen(false); // ✅ close modal
    setSelectedItem(null); // ✅ reset state
    await fetchData(); // ✅ RELOAD INVENTORY LIST
    setSaving(false);
  };

  // const handleDelete = async () => {
  //   if (!selectedItem) return;

  //   const response = await api.deleteInventoryItem(selectedItem.id);

  //   if (response.error) {
  //     toast({
  //       title: "Error",
  //       description: response.error,
  //       variant: "destructive",
  //     });
  //   } else {
  //     toast({
  //       title: "Success",
  //       description: "Item deleted successfully",
  //     });
  //     setDeleteModalOpen(false);
  //     fetchData();
  //   }
  // };
  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      await api.deleteInventoryItem(selectedItem.id);

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });

      setDeleteModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  type ExcelPreviewRow = {
    serialNumber?: string;
    category?: string;
    pieces?: number;
    weight?: number;
    purchaseCode?: string;
    saleCode?: string;
    status?: string;
    isDuplicate?: boolean;
    isValid?: boolean;
  };

  // const handleExcelPreview = async (file: File) => {
  //   setExcelFile(file); // 🔥 VERY IMPORTANT

  //   const res = await api.previewInventoryExcel(file);

  //   if (!res.success) {
  //     toast({
  //       title: "Preview Failed",
  //       description: res.message || "Invalid Excel file",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setAllRows(res.data);
  //   setPreviewRows(res.data.slice(0, 20));
  //   setPreviewOpen(true);
  // };
  const handleExcelPreview = async (file: File) => {
    fileRef.current = file;

    const res = await api.previewInventoryExcel(file);

    if (!res?.success) {
      toast({
        title: "Preview Failed",
        description: res?.message || "Invalid Excel file",
        variant: "destructive",
      });
      return;
    }

    setAllRows(res.data);
    setPreviewRows(res.data.slice(0, 20));
    setPreviewOpen(true);
  };

  const columns: Column<InventoryItem>[] = [
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
        <span className="font-medium">{item.serialNumber}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
      // render: (item) =>
      //   typeof item.category === "object" ? item.category.name : "-",
      render: (item) =>
        item.category && typeof item.category === "object"
          ? item.category.name
          : "Deleted",
    },

    {
      key: "pieces",
      header: (
        <button
          onClick={() => {
            setSortKey("pieces");
            setSortDir(sortDir === "asc" ? "desc" : "asc");
          }}
          className="flex items-center gap-1"
        >
          Pieces {sortKey === "pieces" && (sortDir === "asc" ? "↑" : "↓")}
        </button>
      ),
      render: (item) => item.pieces,
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
      render: (item) => `${item.weight} ${item.weightUnit}`,
    },
    {
      key: "purchaseCode",
      header: (
        <button
          onClick={() => {
            setSortKey("purchaseCode");
            setSortDir(sortDir === "asc" ? "desc" : "asc");
          }}
          className="flex items-center gap-1"
        >
          Purchase Code {sortKey === "purchaseCode" && (sortDir === "asc" ? "↑" : "↓")}
        </button>
      ),
      render: (item) => item.purchaseCode || "-",
    },
    {
      key: "saleCode",
      header: (
        <button
          onClick={() => {
            setSortKey("saleCode");
            setSortDir(sortDir === "asc" ? "desc" : "asc");
          }}
          className="flex items-center gap-1"
        >
          Sale Code {sortKey === "saleCode" && (sortDir === "asc" ? "↑" : "↓")}
        </button>
      ),
      render: (item) => item.saleCode || "-",
    },
    {
  key: "dimensions",
  header: "Dimensions",
  render: (item) =>
    item.dimensions?.length ? (
      <span className="whitespace-nowrap min-w-[160px] inline-block">
        {item.dimensions.length} x {item.dimensions.width} x{" "}
        {item.dimensions.height} {item.dimensions.unit}
      </span>
    ) : (
      "-"
    ),
},


    {
      key: "certification",
      header: "Certification",
      render: (item) => item.certification || "-",
    },
    { key: "location", header: "Location" },
    {
      key: "status",
      header: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openViewModal(item)}
            className="h-8 w-8"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEditModal(item)}
            className="h-8 w-8"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openDeleteModal(item)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          {/* Mark as Sold button - only for pending/approved items */}
          {(item.status === "pending" || item.status === "approved") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // Navigate to Sold Items page and pre-select this item
                markAsSoldFromInventory(item);
              }}
              className="h-8 w-8 text-green-600 hover:text-green-800"
              title="Mark as Sold"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Inventory">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Array.isArray(categories) && categories.length > 0 ? (
                  categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No categories found
                  </div>
                )}
              </SelectContent>
            </Select>

            {/* <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Array.isArray(categories) && categories.length > 0 ? (
                  categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No categories found
                  </div>
                )}
              </SelectContent>
            </Select> */}

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">In Stock</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            {/* EXPORT */}
            <Button
              variant="outline"
              onClick={() => api.exportInventoryExcel()}
            >
              Export Excel
            </Button>

            {/* IMPORT */}
            {/* <label className="cursor-pointer"> */}
            {/* <input
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={async (e) => {
                  if (!e.target.files?.[0]) return;

                  const res = await api.importInventoryExcel(e.target.files[0]);

                  if (!res.success) {
                    toast({
                      title: "Import Failed",
                      description: res.message,
                      variant: "destructive",
                    });
                  } else {
                    toast({
                      title: "Import Successful",
                      description: `Inserted: ${res.data.inserted}, Skipped: ${res.data.skipped}`,
                    });
                    fetchData(); // 🔄 refresh table
                  }
                }}
              /> */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  handleExcelPreview(file);
                }}
              />
              <Button variant="secondary">Import Excel</Button>
            </label>

            {/* </label> */}

            {selectedIds.length > 0 && (
              <div className="fixed bottom-4 right-4 bg-card shadow-lg p-4 rounded-lg">
                <Button
                  onClick={() =>
                    api.bulkUpdateInventory(selectedIds, { status: "approved" })
                  }
                >
                  Approve Selected
                </Button>
              </div>
            )}

            {/* ADD ITEM */}
            <Button onClick={openAddModal} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>

          {/* <Button onClick={openAddModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>*/}
        </div>

        {/* Table */}
        <div className="royal-card">
          <DataTable
            columns={columns}
            data={items}
            loading={loading}
            keyExtractor={(item) => item.id}
            emptyMessage="No inventory items found"
          />
          <Pagination
            page={meta?.page}
            pages={meta?.pages}
            onChange={setPage}
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedItem ? "Edit Item" : "Add New Item"}
        size="lg"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[70vh] overflow-y-auto pr-2"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number *</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) =>
                  setFormData({ ...formData, serialNumber: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(categories) && categories.length > 0 ? (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No categories found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Pieces */}
            <div className="space-y-2">
              <Label>No. of Pieces *</Label>
              <Input
                type="number"
                min={1}
                value={formData.pieces}
                onChange={(e) =>
                  setFormData({ ...formData, pieces: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight *</Label>
              <div className="flex gap-2">
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: e.target.value })
                  }
                  required
                  className="flex-1"
                />
                <Select
                  value={formData.weightUnit}
                  onValueChange={(value: "carat" | "gram") =>
                    setFormData({ ...formData, weightUnit: value })
                  }
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carat">Carat</SelectItem>
                    <SelectItem value="gram">Gram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Purchase Code */}
            <div className="space-y-2">
              <Label>Purchase Code *</Label>
              <Input
                value={formData.purchaseCode}
                onChange={(e) =>
                  setFormData({ ...formData, purchaseCode: e.target.value })
                }
                required
              />
            </div>

            {/* Sale Code */}
            <div className="space-y-2">
              <Label>Sale Code *</Label>
              <Input
                value={formData.saleCode}
                onChange={(e) =>
                  setFormData({ ...formData, saleCode: e.target.value })
                }
                required
              />
            </div>

            {/* Dimensions */}
            <div className="space-y-2">
              <Label>Dimensions </Label>
              <div className="grid grid-cols-4 gap-3">
                <Input
                  placeholder="Length"
                  value={formData.length}
                  onChange={(e) =>
                    setFormData({ ...formData, length: e.target.value })
                  }
                />
                <Input
                  placeholder="Width"
                  value={formData.width}
                  onChange={(e) =>
                    setFormData({ ...formData, width: e.target.value })
                  }
                />
                <Input
                  placeholder="Height"
                  value={formData.height}
                  onChange={(e) =>
                    setFormData({ ...formData, height: e.target.value })
                  }
                />
                <Select
                  value={formData.dimensionUnit}
                  onValueChange={(value) =>
                    setFormData({ ...formData, dimensionUnit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="inch">inch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certification">Certification</Label>
              <Input
                id="certification"
                value={formData.certification}
                onChange={(e) =>
                  setFormData({ ...formData, certification: e.target.value })
                }
                placeholder="e.g., GIA, AGS"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "pending" | "approved") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">In Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Images</Label>
            <ImageUpload
              images={formData.images}
              onImagesChange={(images) => setFormData({ ...formData, images })}
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
              {saving ? "Saving..." : selectedItem ? "Update" : "Add Item"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Item Details"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Serial Number</Label>
                <p className="font-medium">{selectedItem.serialNumber}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Category</Label>
                <p className="font-medium">
                  {selectedItem.category?.name ?? "Deleted"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Pieces</Label>
                <p className="font-medium">{selectedItem.pieces}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Weight</Label>
                <p className="font-medium">
                  {selectedItem.weight} {selectedItem.weightUnit}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Purchase Code</Label>
                <p className="font-medium">
                  {selectedItem.purchaseCode || "-"}
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground">Sale Code</Label>
                <p className="font-medium">{selectedItem.saleCode || "-"}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Certification</Label>
                <p className="font-medium">
                  {selectedItem.certification || "-"}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Location</Label>
                <p className="font-medium">{selectedItem.location}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <StatusBadge status={selectedItem.status} />
                </div>
              </div>
            </div>
            {selectedItem.description && (
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="font-medium">{selectedItem.description}</p>
              </div>
            )}
            {selectedItem.images && selectedItem.images.length > 0 && (
              <div>
                <Label className="text-muted-foreground">Images</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {selectedItem.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Item ${idx + 1}`}
                      className="aspect-square rounded-md object-cover border border-border"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Item"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              {selectedItem?.serialNumber}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
      {/* Preview Modal */}
      <ExcelPreviewModal
        open={previewOpen}
        rows={previewRows}
        onClose={() => setPreviewOpen(false)}
        onConfirm={async () => {
          if (!fileRef.current) return;

          const res = await api.confirmInventoryImport(fileRef.current);

          if (!res.success) {
            toast({
              title: "Import Failed",
              description: res.message,
              variant: "destructive",
            });
            return;
          }

          toast({
            title: "Import Successful",
            description: `Inserted: ${res.data.inserted}, Skipped: ${res.data.skipped}`,
          });

          setPreviewOpen(false);
          fetchData();
        }}
      />

      {/* Mark as Sold Modal */}
      <Modal
        open={markAsSoldModalOpen}
        onClose={() => setMarkAsSoldModalOpen(false)}
        title="Mark Item as Sold"
        size="md"
      >
        {itemToMarkAsSold && (
          <form onSubmit={handleMarkAsSoldSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Item</Label>
              <p className="font-medium">{itemToMarkAsSold.serialNumber} — {itemToMarkAsSold.category?.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Sale Price *</Label>
                <div className="flex gap-2">
                  <Select
                    value={soldForm.currency}
                    onValueChange={(value) =>
                      setSoldForm({ ...soldForm, currency: value })
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
                    value={soldForm.price}
                    onChange={(e) =>
                      setSoldForm({ ...soldForm, price: e.target.value })
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
                  value={soldForm.soldDate}
                  onChange={(e) =>
                    setSoldForm({ ...soldForm, soldDate: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyer">Buyer Name</Label>
              <Input
                id="buyer"
                value={soldForm.buyer}
                onChange={(e) =>
                  setSoldForm({ ...soldForm, buyer: e.target.value })
                }
                placeholder="Optional buyer information"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMarkAsSoldModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={selling}>
                {selling ? "Processing..." : "Mark as Sold"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </MainLayout>
  );
}
