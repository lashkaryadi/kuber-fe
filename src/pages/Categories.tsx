import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DataTable, Column } from '@/components/common/DataTable';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api, { Category } from '@/services/api';
import { toast } from '@/hooks/use-toast';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const response = await api.getCategories();

    if (response.error) {
      toast({
        title: 'Error',
        description: response.error,
        variant: 'destructive',
      });
    } else if (response.data) {
      setCategories(response.data);
    }
    setLoading(false);
  };

  const openAddModal = () => {
    setSelectedCategory(null);
    setFormData({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setModalOpen(true);
  };

  const openDeleteModal = (category: Category) => {
    setSelectedCategory(category);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: formData.name,
      description: formData.description || undefined,
    };

    const response = selectedCategory
      ? await api.updateCategory(selectedCategory.id, payload)
      : await api.createCategory(payload as Category);

    if (response.error) {
      toast({
        title: 'Error',
        description: response.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: selectedCategory
          ? 'Category updated successfully'
          : 'Category added successfully',
      });
      setModalOpen(false);
      fetchCategories();
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    const response = await api.deleteCategory(selectedCategory.id);

    if (response.error) {
      toast({
        title: 'Error',
        description: response.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
      setDeleteModalOpen(false);
      fetchCategories();
    }
  };

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Category Name',
      render: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (item) => (
        <span className="text-muted-foreground">{item.description || '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (item) => new Date(item.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
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
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Categories">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Manage gemstone categories for your inventory
          </p>
          <Button onClick={openAddModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>

        <div className="royal-card">
          <DataTable
            columns={columns}
            data={categories}
            loading={loading}
            keyExtractor={(item) => item.id}
            emptyMessage="No categories found"
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedCategory ? 'Edit Category' : 'Add New Category'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Diamond, Ruby, Emerald"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : selectedCategory ? 'Update' : 'Add Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-medium text-foreground">
              {selectedCategory?.name}
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
    </MainLayout>
  );
}
