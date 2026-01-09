import { useEffect, useState, useRef } from "react";
import { Plus, Search, Edit, Trash2, Eye, Filter } from "lucide-react";
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

export default function Inventory() {
  // const [excelFile, setExcelFile] = useState<File | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<File | null>(null);

  // const [search, setSearch] = useState("");
  const { search } = useSearch();

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
    status: "pending" as "pending" | "approved" | "sold",
    description: "",
    images: [] as string[],
  });
  const [previewRows, setPreviewRows] = useState<ExcelPreviewRow[]>([]);
  const [allRows, setAllRows] = useState<ExcelPreviewRow[]>([]);
  const hasValidRows = previewRows.some((r) => r.isValid && !r.isDuplicate);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [inventoryRes, categoriesRes] = await Promise.all([
      api.getInventory(),
      api.getCategories(),
    ]);

    setItems(inventoryRes || []);
    setCategories(categoriesRes || []);

    setLoading(false);
  };
 const filteredItems = items.filter((item) => {
  const q = search.trim().toLowerCase();

  const matchesSearch =
    !q ||
    item.serialNumber.toLowerCase().includes(q) ||
    (item.category &&
      typeof item.category === "object" &&
      item.category.name.toLowerCase().includes(q)) ||
    (item.purchaseCode || "").toLowerCase().includes(q) ||
    (item.saleCode || "").toLowerCase().includes(q) ||
    (item.location || "").toLowerCase().includes(q) ||
    (item.certification || "").toLowerCase().includes(q) ||
    (item.dimensions &&
      `${item.dimensions.length} ${item.dimensions.width} ${item.dimensions.height}`
        .toLowerCase()
        .includes(q));

  const matchesCategory =
    categoryFilter === "all" || item.category?.id === categoryFilter;

  const matchesStatus =
    statusFilter === "all" || item.status === statusFilter;

  return matchesSearch && matchesCategory && matchesStatus;
});

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
      header: "Serial Number",
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

    { key: "pieces", header: "Pieces" },
    {
      key: "weight",
      header: "Weight",
      render: (item) => `${item.weight} ${item.weightUnit}`,
    },
    {
      key: "purchaseCode",
      header: "Purchase Code",
      render: (item) => item.purchaseCode || "-",
    },
    {
      key: "saleCode",
      header: "Sale Code",
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
            {/* <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div> */}
            {/* <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
  {cat.name}
</SelectItem>
                ))}
              </SelectContent>
            </Select> */}

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No categories found
                  </div>
                )}
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
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
                {categories.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No categories found
                  </div>
                )}

                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
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
            data={filteredItems}
            loading={loading}
            keyExtractor={(item) => item.id}
            emptyMessage="No inventory items found"
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
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
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
                onValueChange={(value: "pending" | "approved" | "sold") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
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
    </MainLayout>
  );
}
