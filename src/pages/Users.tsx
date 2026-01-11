import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Shield, Search } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable, Column } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearch } from "@/contexts/SearchContext";
import api, { User } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Users() {
  const { user: currentUser } = useAuth();
  const { query: globalQuery } = useSearch(); // Use global search

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "staff" ,
  });

  const [saving, setSaving] = useState(false);

  /* ---------------- FETCH USERS ---------------- */

  const fetchUsers = async () => {
    setLoading(true);

    const response = await api.getUsers({ search: globalQuery }); // Pass search param

    if (!response.success) {
      toast({
        title: "Error",
        description: response.message,
        variant: "destructive",
      });
      setUsers([]);
    } else {
      setUsers(response.data);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchUsers();
    }
  }, [currentUser?.role, globalQuery]); // Fetch when global search changes

  /* ---------------- AUTH GUARD ---------------- */
  if (currentUser?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Use users directly since search is handled server-side

  /* ---------------- MODALS ---------------- */
  const openAddModal = () => {
    setSelectedUser(null);
    setFormData({
      username: "",
      email: "",
      password: "",
      role: "staff",
    });
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
    });
    setModalOpen(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = selectedUser
      ? {
          username: formData.username,
          email: formData.email,
          ...(formData.password && { password: formData.password }),
        }
      : {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        };

    const response = selectedUser
      ? await api.updateUser(selectedUser.id, payload)
      : await api.createUser(payload);

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
      description: selectedUser
        ? "User updated successfully"
        : "User created successfully",
    });

    setModalOpen(false);
    fetchUsers();
    setSaving(false);
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async () => {
    if (!selectedUser) return;

    const response = await api.deleteUser(selectedUser.id);

    if (!response.success) {
      toast({
        title: "Error",
        description: response.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "User deleted successfully",
    });

    setDeleteModalOpen(false);
    fetchUsers();
  };

  /* ---------------- TABLE ---------------- */
  const columns: Column<User>[] = [
    {
      key: "username",
      header: "Username",
      render: (item) => <span className="font-medium">{item.username}</span>,
    },
    {
      key: "email",
      header: "Email",
      render: (item) => item.email,
    },
    {
      key: "role",
      header: "Role",
      render: (item) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
            item.role === "admin"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {item.role === "admin" && <Shield className="h-3 w-3" />}
          {item.role}
        </span>
      ),
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
        <div className="flex items-center gap-1">
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
            disabled={
              item.id === currentUser?.id && currentUser?.role === "admin"
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  /* ---------------- UI ---------------- */
  return (
    <MainLayout title="Users">
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => api.exportUsersExcel()}
            >
              Export Excel
            </Button>
            <Button onClick={openAddModal} className="gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        <div className="royal-card">
          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            keyExtractor={(item) => item.id}
            emptyMessage="No users found"
          />
        </div>
      </div>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedUser ? "Edit User" : "Add User"}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Username</Label>
            <Input
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder={selectedUser ? "Leave blank to keep same" : ""}
              required={!selectedUser}
            />
          </div>

          <div>
            <Label>Role</Label>
            <Select
              value={formData.role}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff" disabled>Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : selectedUser ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete User"
        size="sm"
      >
        <p>
          Are you sure you want to delete{" "}
          <strong>{selectedUser?.username}</strong>?
        </p>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </MainLayout>
  );
}