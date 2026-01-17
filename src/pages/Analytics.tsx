import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import api from "@/services/api";;
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface AnalyticsData {
  totals: {
    revenue: number;
    cost: number;
    profit: number;
  };
  monthly: Array<{
    _id: {
      month: number;
      year: number;
    };
    revenue: number;
    profit: number;
  }>;
  categories: Array<{
    _id: string;
    revenue: number;
    cost: number;
    profit: number;
    count: number;
  }>;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.getProfitAnalytics();
        setData(response);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load analytics",
          variant: "destructive",
        });
      }
    };
    load();
  }, []);

  if (!data) return <div className="p-6">Loading...</div>;

  const monthlyData = data.monthly.map((m: any) => ({
    label: `${m._id.month}/${m._id.year}`,
    revenue: m.revenue,
    profit: m.profit,
  }));

  return (
    <MainLayout title="Analytics">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            View business performance and profit analytics
          </p>
          <Button onClick={() => api.exportProfitExcel()}>
            Export Excel
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{data.totals.revenue?.toFixed(2) || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{data.totals.cost?.toFixed(2) || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{data.totals.profit?.toFixed(2) || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Profit Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Profit</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Profit']} />
                  <Line type="monotone" dataKey="profit" stroke="#3b82f6" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Categories Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Top Categories</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
