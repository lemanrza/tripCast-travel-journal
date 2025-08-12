import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Upload, X } from "lucide-react";
import { Input } from "./ui/input";
import { useState } from "react";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import { useWatch } from "react-hook-form";

function NestedImages({ destIndex, control, register, setValue }: any) {
  const [uploading, setUploading] = useState(false);

  // Watch the current image value
  const currentImage = useWatch({ control, name: `destinations.${destIndex}.image` });

  // Handle single image upload to Cloudinary
  const handleImageUpload = async (file: File): Promise<void> => {
    if (!file) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await controller.post(`${endpoints.upload}/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.success && response.data?.url) {
        // Update the image field with the uploaded data
        setValue(`destinations.${destIndex}.image`, {
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
      setUploading(false);
    }
  };

  const clearImage = () => {
    setValue(`destinations.${destIndex}.image`, undefined);
  };

  return (
    <div className="space-y-2">
      <Label className="font-medium">Image</Label>

      {currentImage?.url ? (
        <div className="space-y-2">
          <img
            src={currentImage.url}
            alt="Destination image"
            className="w-full h-32 object-cover rounded-lg"
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Destination Image</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearImage}
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
            {uploading ? "Uploading..." : "Upload an image for this destination"}
          </p>
          <Input
            type="file"
            accept="image/*"
            className="max-w-xs mx-auto"
            disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                await handleImageUpload(file);
              }
            }}
          />
        </div>
      )}

      {/* Hidden inputs for form registration */}
      <div className="hidden">
        <Input {...register(`destinations.${destIndex}.image.url` as const)} />
        <Input {...register(`destinations.${destIndex}.image.public_id` as const)} />
      </div>
    </div>
  );
}

export default NestedImages;