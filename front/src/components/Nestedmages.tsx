import { useFieldArray } from "react-hook-form";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "./ui/input";

function NestedImages({ control, register, destIndex }: any) {
  const { fields, append, remove } = useFieldArray({ control, name: `destinations.${destIndex}.images` });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="font-medium">Images</Label>
        <Button type="button" variant="secondary" onClick={() => append({ url: "", public_id: "" })}>
          <Plus className="mr-2 h-4 w-4" /> Add Image
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground">No images yet. Add a URL and public_id for each uploaded image.</p>
      )}

      <div className="space-y-3">
        {fields.map((field, idx) => (
          <div key={field.id} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input placeholder="Image URL" {...register(`destinations.${destIndex}.images.${idx}.url` as const)} />
            <div className="flex gap-2">
              <Input placeholder="Public ID" {...register(`destinations.${destIndex}.images.${idx}.public_id` as const)} />
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)} aria-label="Remove image">
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NestedImages;