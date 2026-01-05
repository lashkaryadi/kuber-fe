import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    if (images.length + files.length > maxImages) {
      toast({
        title: 'Too many images',
        description: `Maximum ${maxImages} images allowed`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      const response = await api.uploadImage(file);
      if (response.data?.url) {
        newImages.push(response.data.url);
      } else if (response.error) {
        toast({
          title: 'Upload failed',
          description: response.error,
          variant: 'destructive',
        });
      }
    }

    onImagesChange([...images, ...newImages]);
    setUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-md border border-border overflow-hidden group"
          >
            <img
              src={image}
              alt={`Upload ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'aspect-square rounded-md border-2 border-dashed border-border',
              'flex flex-col items-center justify-center gap-2',
              'text-muted-foreground hover:border-primary/50 hover:text-primary/70',
              'transition-colors cursor-pointer',
              uploading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {uploading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
            ) : (
              <>
                <Upload className="h-6 w-6" />
                <span className="text-xs">Upload</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
