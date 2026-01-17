import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable, Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCcw, Trash2, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/common/Pagination";
import {
  getRecycleBinItems,
  restoreRecycleBinItems,
  permanentlyDeleteRecycleBinItems,
  emptyRecycleBin,
  RecycleBinItem,
} from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { Modal } from "@/components/common/Modal";
import { Label } from "recharts";

export default function RecycleBin() {
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState<{
    total: number;
    page: number;
    pages: number;
  } | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"restore" | "delete" | "empty" | null>(null);

  useEffect(() => {
    fetchRecycleBin();
  }, [page, limit, entityTypeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchRecycleBin();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchRecycleBin = async () => {
    setLoading(true);
    try {
      const response = await getRecycleBinItems({
        page,
        limit,
        search: searchText || undefined,
        entityType: entityTypeFilter !== "all" ? entityTypeFilter : undefined,
      });

      if (response.success) {
        setItems(response.data || []);
        setMeta(response.meta || null);
      } else {
        setItems([]);
        setMeta(null);
      }
    } catch (error) {
      console.error("Failed to fetch recycle bin:", error);
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to restore",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await restoreRecycleBinItems(selectedIds);

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Items restored successfully",
        });
        setSelectedIds([]);
        fetchRecycleBin();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to restore items",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore items",
        variant: "destructive",
      });
    }

    setConfirmModalOpen(false);
    setConfirmAction(null);
  };

  const handlePermanentDelete = async () => {
    if (selectedIds.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to delete",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await permanentlyDeleteRecycleBinItems(selectedIds);

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Items permanently deleted",
        });
        setSelectedIds([]);
        fetchRecycleBin();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete items",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete items",
        variant: "destructive",
      });
    }

    setConfirmModalOpen(false);
    setConfirmAction(null);
  };

  const handleEmptyBin = async () => {
    try {
      const response = await emptyRecycleBin(
        entityTypeFilter !== "all" ? entityTypeFilter : undefined
      );

      if (response.success) {
        toast({
          title: "Success",
          description: response.message || "Recycle bin emptied",
        });
        setSelectedIds([]);
        fetchRecycleBin();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to empty recycle bin",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to empty recycle bin",
        variant: "destructive",
      });
    }

    setConfirmModalOpen(false);
    setConfirmAction(null);
  };

  const openConfirmModal = (action: "restore" | "delete" | "empty") => {
    setConfirmAction(action);
    setConfirmModalOpen(true);
  };

  const columns: Column<RecycleBinItem>[] = [
    {
      key: "checkbox",
      header: (
        <label className="flex items-center gap-1">
          
        <input
          type="checkbox"
          checked={selectedIds.length === items.length && items.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds(items.map((item) => item.id));
            } else {
              setSelectedIds([]);
            }
          }}
        />
        Select All
        </label>
      ),
      render: (item) => (
        < label className="flex items-center gap-1">
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
        Select
        </label>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (item) => (
        <span className="capitalize font-medium">
          {item.entityType === "inventory" ? "Inventory Item" : "Category"}
        </span>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (item) => (
        <span className="font-medium">
          {item.entityType === "inventory"
            ? item.entityData.serialNumber
            : item.entityData.name}
        </span>
      ),
    },
    {
      key: "details",
      header: "Details",
      render: (item) => {
        if (item.entityType === "inventory") {
          return (
            <span className="text-sm text-muted-foreground">
              {item.entityData.totalPieces || item.entityData.pieces} pcs, {" "}
              {item.entityData.totalWeight || item.entityData.weight}{" "}
              {item.entityData.weightUnit}
            </span>
          );
        } else {
          return (
            <span className="text-sm text-muted-foreground">
              {item.entityData.description || "-"}
            </span>
          );
        }
      },
    },
    {
      key: "deletedBy",
      header: "Deleted By",
      render: (item) => (
        <span className="text-sm">{item.deletedBy?.username || "-"}</span>
      ),
    },
    {
      key: "deletedAt",
      header: "Deleted At",
      render: (item) => (
        <span className="text-sm">
          {new Date(item.deletedAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "expiresAt",
      header: "Expires At",
      render: (item) => {
        const daysLeft = Math.ceil(
          (new Date(item.expiresAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        );
        return (
          <span
            className={`text-sm ${
              daysLeft <= 7 ? "text-red-600 font-semibold" : "text-muted-foreground"
            }`}
          >
            {daysLeft} days
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedIds([item.id]);
              openConfirmModal("restore");
            }}
            title="Restore"
            className="h-8 w-8 text-green-600 hover:text-green-800"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedIds([item.id]);
              openConfirmModal("delete");
            }}
            title="Permanently Delete"
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Recycle Bin">
      <div className="space-y-6">
        {/* Header & Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-muted-foreground">
            Deleted items are kept for 30 days before permanent deletion
          </p>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deleted items..."
                aria-label="Search deleted items"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={entityTypeFilter}
              onValueChange={setEntityTypeFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="category">Categories</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Action Buttons */}
        {selectedIds.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => openConfirmModal("restore")}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restore Selected ({selectedIds.length})
            </Button>
            <Button
              variant="destructive"
              onClick={() => openConfirmModal("delete")}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedIds.length})
            </Button>
          </div>
        )}

        {/* Empty Bin Button */}
        <div className="flex justify-end">
          <Button
            variant="destructive"
            onClick={() => {
              setConfirmAction("empty");
              setConfirmModalOpen(true);
            }}
            className="gap-2"
            disabled={items.length === 0}
          >
            <Trash2 className="h-4 w-4" />
            Empty Recycle Bin
          </Button>
        </div>

        {/* Table */}
        <div className="royal-card">
          <DataTable
            columns={columns}
            data={items}
            loading={loading}
            keyExtractor={(item) => item.id}
            emptyMessage="No deleted items found"
          />

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Items per page:
              </span>
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

            <Pagination
              page={meta?.page}
              pages={meta?.pages}
              onChange={setPage}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        open={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setConfirmAction(null);
        }}
        title={
          confirmAction === "restore"
            ? "Restore Items"
            : confirmAction === "delete"
            ? "Permanently Delete Items"
            : "Empty Recycle Bin"
        }
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            {confirmAction === "restore"
              ? `Are you sure you want to restore ${selectedIds.length} item(s)? They will be moved back to their original location.`
              : confirmAction === "delete"
              ? `Are you sure you want to permanently delete ${selectedIds.length} item(s)? This action cannot be undone.`
              : `Are you sure you want to empty the entire recycle bin? All items will be permanently deleted. This action cannot be undone.`}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmModalOpen(false);
                setConfirmAction(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={confirmAction === "restore" ? "default" : "destructive"}
              onClick={
                confirmAction === "restore"
                  ? handleRestore
                  : confirmAction === "delete"
                  ? handlePermanentDelete
                  : handleEmptyBin
              }
            >
              {confirmAction === "restore"
                ? "Restore"
                : confirmAction === "delete"
                ? "Delete Permanently"
                : "Empty Bin"}
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
