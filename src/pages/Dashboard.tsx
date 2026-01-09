import { useEffect, useState } from "react";
import {
  Package,
  CheckCircle,
  ShoppingCart,
  Clock,
  TrendingUp,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/common/StatCard";
import { LoadingPage } from "@/components/common/LoadingSpinner";
import { DataTable, Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import api, { DashboardStats, SoldItem } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const response = await api.getDashboardStats();

    if (response.error) {
      toast({
        title: "Error",
        description: response.error,
        variant: "destructive",
      });
      // Set default stats for UI display
      setStats({
        totalInventory: 0,
        approvedItems: 0,
        soldItems: 0,
        pendingApproval: 0,
        totalValue: 0,
        inStockValue: "-", // Default value
        recentSales: [],
      });
    } else if (response.data) {
      setStats(response.data);
    }
    setLoading(false);
  };

  const recentSalesColumns: Column<SoldItem>[] = [
    {
      key: "serialNumber",
      header: "Serial Number",
      render: (item) => (
        <span className="font-medium">
          {item.inventoryItem?.serialNumber ?? "—"}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (item) => item.inventoryItem.category?.name || "-",
    },
    {
      key: "price",
      header: "Sale Price",
      render: (item) => (
        <span className="font-medium">
          {item.currency} {item.price.toLocaleString()}
        </span>
      ),
    },
    {
      key: "soldDate",
      header: "Date",
      render: (item) => new Date(item.soldDate).toLocaleDateString(),
    },
  ];

  if (loading) {
    return (
      <MainLayout title="Dashboard">
        <LoadingPage />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Inventory"
            value={stats?.totalInventory || 0}
            icon={Package}
            variant="primary"
          />
          <StatCard
            title="In Stock Items"
            value={stats?.approvedItems || 0}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="Sold Items"
            value={stats?.soldItems || 0}
            icon={ShoppingCart}
            variant="default"
          />
          <StatCard
            title="Pending Approval"
            value={stats?.pendingApproval || 0}
            icon={Clock}
            variant="warning"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          
          <Card className="royal-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                <CardTitle className="font-serif text-lg">
                  In-Stock Inventory Value
                </CardTitle>
              </div>
              <CardDescription>
                Calculated as saleCode × weight for approved items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-serif font-bold text-foreground">
                {stats?.inStockValue === "-" ? "-" : `₹ ${stats?.inStockValue}`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales */}
        <Card className="royal-card">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Recent Sales</CardTitle>
            <CardDescription>
              Latest transactions from your inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={recentSalesColumns}
              data={stats?.recentSales || []}
              keyExtractor={(item) => item.id}
              emptyMessage="No recent sales"
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
