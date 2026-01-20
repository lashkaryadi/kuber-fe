import React, { useState, useEffect, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  const { getToken } = useAuth();

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
      const token = getToken();
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Category created successfully');
        // Call the parent's onCreateCategory function to update the state
        if (onCreateCategory) {
          onCreateCategory(name);
        }
      } else {
        toast.error(data.message || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
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
              {filteredCategories.map((category) => (
                <CommandItem
                  key={category._id}
                  value={category._id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    setSearchQuery("");
                  }}
                  className="py-2"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category._id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {category.name}
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreateCategory && filteredCategories.length === 0 && searchQuery && (
              <CommandGroup>
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