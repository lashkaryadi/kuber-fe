import React, { useState, useEffect, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/services/api';

interface Category {
  _id: string;
  name: string;
}

interface CategorySelectorProps {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  onCreateCategory?: (name: string) => void;
  placeholder?: string;
  className?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  value,
  onChange,
  onCreateCategory,
  placeholder = 'Select a category...',
  className
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;

    return categories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  // Find selected category
  const selectedCategory = useMemo(() => {
    return categories.find(cat => cat._id === value);
  }, [categories, value]);

  const handleCreateCategory = async (name: string) => {
    try {
      const response = await api.createCategory({ name });

      if (response.success) {
        toast.success('Category created successfully');
        // Call the parent's onCreateCategory function to update the state
        if (onCreateCategory) {
          onCreateCategory(name);
        }
      } else {
        toast.error(response.message || 'Failed to create category');
      }
    } catch (error: unknown) {
      const err = error as any;
      if (err?.response?.status === 409) {
        toast.error('Category already exists');
      } else {
        toast.error('Failed to create category: ' + (err?.response?.data?.message || err.message));
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedCategory ? selectedCategory.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search categories..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>
              <div className="p-2">
                <p className="text-sm text-muted-foreground">No categories found.</p>
                {onCreateCategory && (
                  <Button
                    variant="ghost"
                    className="mt-2 w-full justify-start"
                    onClick={() => {
                      const newCategoryName = prompt('Enter new category name:');
                      if (newCategoryName && newCategoryName.trim()) {
                        handleCreateCategory(newCategoryName.trim());
                        setOpen(false);
                      }
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create "{searchQuery}"
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredCategories.map((category) => {
                const id = (category._id || category.id)?.toString();
                if (!id) return null;

                return (
                  <CommandItem
                    key={id}
                    value={id}
                    onSelect={() => onChange(id)}
                  >
                    {category.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {onCreateCategory && filteredCategories.length === 0 && searchQuery && (
              <CommandGroup key="create-new-group">
                <CommandItem
                  onSelect={() => {
                    handleCreateCategory(searchQuery);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className="py-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create "{searchQuery}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};