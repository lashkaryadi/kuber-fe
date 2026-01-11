import { useState } from 'react';
import  api  from '@/services/api';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface ImageUploadProps {
  inventoryId: string;
  initialImages?: string[];
  onImagesChange?: (images: string[]) => void;
}

export default function ImageUpload({ inventoryId, initialImages = [], onImagesChange }: ImageUploadProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const result = await api.uploadImage(file);
      
      if (result.error) {
        toast({
          title: 'Upload Error',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        const newImageUrl = result.data.url;
        const updatedImages = [...images, newImageUrl];
        setImages(updatedImages);
        
        if (onImagesChange) {
          onImagesChange(updatedImages);
        }
        
        toast({
          title: 'Success',
          description: 'Image uploaded successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Upload Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (url: string) => {
    const res = await api.deleteImage({
      imageUrl: url,
      inventoryId,
    });

    if (res.success) {
      const updatedImages = images.filter((img) => img !== url);
      setImages(updatedImages);
      
      if (onImagesChange) {
        onImagesChange(updatedImages);
      }
      
      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });
    } else {
      toast({
        title: 'Delete Error',
        description: res.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Upload Images
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={loading}
          className="block w-full text-sm text-gray-500
            file:me-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            hover:file:bg-blue-50"
        />
        {loading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img, index) => (
            <div key={index} className="relative group">
              <img
                src={img}
                alt={`Uploaded ${index}`}
                className="w-full h-32 object-cover rounded-md"
              />
              <button
                onClick={() => handleDelete(img)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ❌
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}