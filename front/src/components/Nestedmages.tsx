import { useFieldArray } from "react-hook-form";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Plus, Trash2, Upload, X } from "lucide-react";
import { Input } from "./ui/input";
import { useState } from "react";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";

function NestedImages({ control, register, destIndex }: any) {
  const { fields, append, remove, update } = useFieldArray({ 
    control, 
    name: `destinations.${destIndex}.images` 
  });
  
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadingMultiple, setUploadingMultiple] = useState(false);

  // Handle single image upload to Cloudinary
  const handleImageUpload = async (file: File, imageIndex: number): Promise<void> => {
    if (!file) return;

    setUploadingIndex(imageIndex);
    
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await controller.post(`${endpoints.upload}/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.success && response.data?.url) {
        // Update the specific image field with the uploaded data
        update(imageIndex, {
          url: response.data.url,
          public_id: response.data.public_id,
        });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error: any) {
      console.error("Image upload error:", error);
      if (error.response?.data?.message) {
        alert(`Failed to upload image: ${error.response.data.message}`);
      } else {
        alert("Failed to upload image. Please try again.");
      }
    } finally {
      setUploadingIndex(null);
    }
  };

  // Handle multiple image uploads to Cloudinary
  const handleMultipleImageUpload = async (files: FileList): Promise<void> => {
    if (!files || files.length === 0) return;

    setUploadingMultiple(true);
    
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append("images", file);
      });

      const response = await controller.post(`${endpoints.upload}/images`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.success && response.data) {
        // Add each uploaded image as a new field
        response.data.forEach((imageData: {url: string, public_id: string}) => {
          append({
            url: imageData.url,
            public_id: imageData.public_id,
          });
        });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error: any) {
      console.error("Multiple image upload error:", error);
      if (error.response?.data?.message) {
        alert(`Failed to upload images: ${error.response.data.message}`);
      } else {
        alert("Failed to upload images. Please try again.");
      }
    } finally {
      setUploadingMultiple(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="font-medium">Images</Label>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => append({ url: "", public_id: "" })}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Single
          </Button>
          <div className="relative">
            <Input
              type="file"
              accept="image/*"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploadingMultiple}
              onChange={async (e) => {
                if (e.target.files) {
                  await handleMultipleImageUpload(e.target.files);
                  // Reset the input
                  e.target.value = '';
                }
              }}
            />
            <Button 
              type="button" 
              variant="secondary" 
              size="sm"
              disabled={uploadingMultiple}
            >
              <Upload className="mr-2 h-4 w-4" /> 
              {uploadingMultiple ? "Uploading..." : "Upload Multiple"}
            </Button>
          </div>
        </div>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No images yet. Click "Add Single" to add an empty slot or "Upload Multiple" to select and upload multiple photos at once.
        </p>
      )}

      <div className="space-y-4">
        {fields.map((field: any, idx) => (
          <div key={field.id} className="border rounded-lg p-4 space-y-3">
            {/* Show uploaded image preview or upload area */}
            {field.url ? (
              <div className="space-y-2">
                <img
                  src={field.url}
                  alt={`Destination image ${idx + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Image {idx + 1}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      update(idx, { url: "", public_id: "" });
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-dashed border-2 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  {uploadingIndex === idx ? "Uploading..." : "Upload an image"}
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  className="max-w-xs mx-auto"
                  disabled={uploadingIndex === idx}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      await handleImageUpload(file, idx);
                    }
                  }}
                />
              </div>
            )}

            {/* Delete button for the entire image entry */}
            <div className="flex justify-end">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => remove(idx)} 
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Image Slot
              </Button>
            </div>

            {/* Hidden inputs for form registration */}
            <div className="hidden">
              <Input {...register(`destinations.${destIndex}.images.${idx}.url` as const)} />
              <Input {...register(`destinations.${destIndex}.images.${idx}.public_id` as const)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NestedImages;