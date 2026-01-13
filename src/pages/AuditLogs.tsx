import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable, Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import api from "@/services/api";
import { toast } from "@/hooks/use-toast";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  user: string;
  createdAt: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAuditLogs();
      // Map the response to match our interface
      const mappedLogs = (res.data || []).map((log: any) => ({
        ...log,
        user: log.performedBy?.email || "-",
      }));
      setLogs(mappedLogs);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (window.confirm("Are you sure you want to clear all audit logs? This action cannot be undone.")) {
      try {
        const response = await api.clearAuditLogs();

        if (response.success) {
          toast({
            title: "Success",
            description: response.message || "Audit logs cleared successfully",
          });
          fetchLogs(); // Refresh the logs after clearing
        } else {
          toast({
            title: "Error",
            description: response.message || "Failed to clear audit logs",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Failed to clear audit logs", err);
        toast({
          title: "Error",
          description: "Failed to clear audit logs",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns: Column<AuditLog>[] = [
    {
      key: "rowNumber",
      header: "#",
      render: (log, index) => (
        <span className="text-muted-foreground">
          {index + 1}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (log) => (
        <span className="font-medium uppercase">{log.action}</span>
      ),
    },
    {
      key: "entityType",
      header: "Entity Type",
      render: (log) => (
        <span className="capitalize">{log.entityType}</span>
      ),
    },
    {
      key: "entityName",
      header: "Entity Name",
      render: (log) => (
        <span className="font-medium">{log.entityName}</span>
      ),
    },
    {
      key: "user",
      header: "User",
      render: (log) => log.performedBy?.email || "-",
    },
    {
      key: "createdAt",
      header: "Date",
      render: (log) =>
        new Date(log.createdAt).toLocaleString(),
    },
  ];

  return (
    <MainLayout title="Audit Logs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Track all critical system actions
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => api.exportAuditLogsExcel()}
            >
              Export Excel
            </Button>

            <Button
              variant="destructive"
              onClick={handleClearLogs}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear Logs
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="royal-card">
          <DataTable
            columns={columns}
            data={logs}
            loading={loading}
            keyExtractor={(log) => log.id}
            emptyMessage="No audit logs found"
          />
        </div>
      </div>
    </MainLayout>
  );
}
