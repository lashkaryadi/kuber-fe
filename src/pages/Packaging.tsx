import { useEffect, useState } from "react";
import { Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable, Column } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import { toast } from "@/hooks/use-toast";

interface Packaging {
  id: string;
  clientName: string;
  totalItems: number;
  createdAt: string;
}

export default function Packaging() {
  const [packaging, setPackaging] = useState<Packaging[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchPackaging = async () => {
    try {
      const data = await api.getPackaging();
      setPackaging(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load packaging",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackaging();
  }, []);

  const columns: Column<Packaging>[] = [
    {
      key: "clientName",
      header: "Client",
    },
    {
      key: "totalItems",
      header: "Items",
    },
    {
      key: "createdAt",
      header: "Created",
      render: (item) => new Date(item.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/packaging/${item.id}`)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <MainLayout title="Packaging">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Manage lots sent to clients
          </p>
          <Button onClick={() => navigate("/packaging/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Packaging
          </Button>
        </div>

        <div className="royal-card">
          <DataTable
            columns={columns}
            data={packaging}
            loading={loading}
            keyExtractor={(item) => item.id}
            emptyMessage="No packaging found"
          />
        </div>
      </div>
    </MainLayout>
  );
}
