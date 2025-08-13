import * as React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Lock, Upload } from "lucide-react";
import DestinationCard from "@/components/DestinationCard";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { listSchema } from "@/validations/createListSchemas";

import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import type { RootState } from "@/store/store";
import { addList } from "@/features/userSlice";
import { enqueueSnackbar } from "notistack";



export type TravelListFormValues = z.infer<typeof listSchema>;

export default function CreateTravelList() {
  const [tagInput, setTagInput] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = React.useState<string>("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);

  const form = useForm({
    resolver: zodResolver(listSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: [],
      isPrivate: false,
      collaborators: "",
      destinations: [
        {
          name: "",
          country: "",
          datePlanned: "",
          dateVisited: "",
          status: "wishlist" as const,
          notes: "",
          image: undefined,
        },
      ],
    },
    mode: "onTouched",
  });

  const { register, handleSubmit, control, setValue, watch, formState } = form;
  const { errors } = formState;

  const { fields: destinationFields, append, remove } = useFieldArray({
    control,
    name: "destinations"
  });

  const handleImageUpload = async (file: File): Promise<string | null> => {
    if (!file) return null;

    setIsUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await controller.post(`${endpoints.upload}/image`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.success && response.data?.url) {
        return response.data.url;
      } else {
        throw new Error("Upload failed");
      }
    } catch (error: any) {
      console.error("Image upload error:", error);
      if (error.message === "Session expired. Please log in again.") {
        enqueueSnackbar("Your session has expired. You'll be redirected to login.", { variant: "error" });
        return null;
      }
      enqueueSnackbar("Failed to upload image. Please try again.", { variant: "error" });
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onSubmit = async (values: TravelListFormValues) => {
    if (!user.id) {
      console.error("User not authenticated");
      enqueueSnackbar("You must be logged in to create a list", { variant: "error" });
      return;
    }

    if (!uploadedImageUrl && (!values.coverImage || !(values.coverImage instanceof File))) {
      enqueueSnackbar("Cover image is required. Please select an image.", { variant: "error" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let coverImageUrl: string | null = uploadedImageUrl;
      
      // If no uploaded image URL and a file is provided, upload it
      if (!coverImageUrl && values.coverImage && values.coverImage instanceof File) {
        console.log("Uploading cover image...");
        coverImageUrl = await handleImageUpload(values.coverImage);
        if (!coverImageUrl) {
          setIsSubmitting(false);
          enqueueSnackbar("Failed to upload cover image. Please try again.", { variant: "error" });
          return;
        }
      }

      // Ensure we have a cover image (either uploaded or pre-existing)
      if (!coverImageUrl) {
        setIsSubmitting(false);
        enqueueSnackbar("Cover image is required. Please select an image.", { variant: "error" });
        return;
      }

      const collaboratorsArray = values.collaborators
        ? values.collaborators.split(",").map((e) => e.trim()).filter(Boolean)
        : [];

      const payload = {
        title: values.title,
        description: values.description || "",
        tags: values.tags || [],
        isPublic: !values.isPrivate,
        coverImage: coverImageUrl,
      };

      console.log("Creating list with payload:", payload);

      const response = await controller.post(endpoints.lists, payload);

      if (response && response.data) {
        const listId = response.data.id || response.data._id;
        
        dispatch(addList(listId));
        if (collaboratorsArray.length > 0) {
          try {
            for (const email of collaboratorsArray) {
              await controller.post(`${endpoints.lists}/${listId}/collaborators`, {
                collaboratorEmail: email,
              });
            }
          } catch (collaboratorError) {
            enqueueSnackbar("Failed to add some collaborators:", { variant: "error" });
          }
        }

        if (values.destinations && values.destinations.length > 0) {
          const validDestinations = values.destinations.filter(dest => dest.name && dest.country);
          
          if (validDestinations.length > 0) {
            let successCount = 0;
            let failureCount = 0;
            
            for (const destination of validDestinations) {
              try {
                const destinationPayload = {
                  name: destination.name,
                  country: destination.country,
                  datePlanned: destination.datePlanned || null,
                  dateVisited: destination.dateVisited || null,
                  status: destination.status || "wishlist",
                  notes: destination.notes || "",
                  image: destination.image || null,
                  listId: listId,
                };

                console.log("Creating destination with payload:", destinationPayload);
                console.log("Image data being sent:", destination.image);
                const result = await controller.post(`${endpoints.destinations}`, destinationPayload);
                
                if (result && result.data) {
                  successCount++;
                  enqueueSnackbar(`✅ Successfully created destination: ${destination.name}`, { variant: "success" });
                } else {
                  failureCount++;
                  enqueueSnackbar(`❌ Failed to create destination: ${destination.name} - Invalid response`, { variant: "error" });
                }
              } catch (destinationError: any) {
                failureCount++;
                enqueueSnackbar(`❌ Failed to create destination: ${destination.name}`, { variant: "error" });

                if (destinationError.response?.data?.message) {
                  enqueueSnackbar(`Server error: ${destinationError.response.data.message}`, { variant: "error" });
                }
              }
            }

            
            if (failureCount > 0 && successCount === 0) {
              enqueueSnackbar("List created successfully, but destinations couldn't be added. You can add them later.", { variant: "warning" });
            } else if (failureCount > 0) {
              enqueueSnackbar(`List created successfully! ${successCount} destinations added, ${failureCount} failed. You can add the remaining ones later.`, { variant: "info" });
            }
          }
        }

        
        const validDestinations = values.destinations?.filter(d => d.name && d.country) || [];
        if (validDestinations.length > 0) {
          enqueueSnackbar(`Travel list created successfully with ${validDestinations.length} destination(s)!`, { variant: "success" });
        } else {
          enqueueSnackbar("Travel list created successfully!", { variant: "success" });
        }

        navigate(`/lists/${listId}`);
        
      } else {
        throw new Error("Invalid response from server");
      }

    } catch (error: any) {
      console.error("Error creating travel list:", error);
      
      if (error.message === "Session expired. Please log in again.") {
        enqueueSnackbar("Your session has expired. You'll be redirected to login.", { variant: "warning" });
        return;
      } else if (error.response?.data?.message) {
        const errorMsg = error.response.data.message;
        if (errorMsg === "Invalid or expired token" || errorMsg === "Access token required") {
          enqueueSnackbar("Your session has expired. Please log in again.", { variant: "warning" });
          localStorage.removeItem("token");
          navigate("/");
          return;
        }
        enqueueSnackbar(`Failed to create list: ${errorMsg}`, { variant: "error" });
      } else if (error.message) {
        enqueueSnackbar(`Failed to create list: ${error.message}`, { variant: "error" });
      } else {
        enqueueSnackbar("Failed to create list. Please try again.", { variant: "error" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const tags = watch("tags");
  const isPrivate = watch("isPrivate");

  React.useEffect(() => {
    if (!user.isAuthenticated) {
      enqueueSnackbar("You must be logged in to create a travel list");
      navigate("/");
    }
  }, [user.isAuthenticated, navigate]);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24">
      {/* Back link */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <a href="#" className="text-muted-foreground hover:text-foreground">← Back to Dashboard</a>
      </div>

      <h1 className="text-3xl font-semibold tracking-tight">Create New Travel List</h1>
      <p className="mt-1 text-muted-foreground">Start planning your next adventure</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>List Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Cover Image */}
            <div className="space-y-2">
              <Label>Cover Image <span className="text-red-500">*</span></Label>
              <div className="rounded-lg border border-dashed p-6">
                {uploadedImageUrl ? (
                  <div className="space-y-3">
                    <img 
                      src={uploadedImageUrl} 
                      alt="Cover preview" 
                      className="mx-auto h-48 w-full rounded-lg object-cover"
                    />
                    <div className="flex justify-center">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setUploadedImageUrl("");
                          setValue("coverImage", undefined);
                        }}
                      >
                        Remove Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {isUploadingImage ? "Uploading..." : "Upload a cover image"}
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      className="max-w-xs" 
                      disabled={isUploadingImage}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setValue("coverImage", file);
                          const url = await handleImageUpload(file);
                          if (url) {
                            setUploadedImageUrl(url);
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>
              {errors.coverImage && (
                <p className="text-sm text-destructive">
                  {typeof errors.coverImage.message === 'string' 
                    ? errors.coverImage.message 
                    : 'Cover image is required'}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">List Title *</Label>
              <Input id="title" placeholder="e.g., European Adventure 2024" {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe your travel plans and what makes this trip special..." {...register("description")} />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add a tag (e.g., adventure, culture, food)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (tagInput.trim()) {
                        setValue("tags", [...(tags || []), tagInput.trim()]);
                        setTagInput("");
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (tagInput.trim()) {
                      setValue("tags", [...(tags || []), tagInput.trim()]);
                      setTagInput("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              {!!tags?.length && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {tags.map((t, i) => (
                    <Badge
                      key={`${t}-${i}`}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => setValue("tags", (tags || []).filter((_, idx) => idx !== i))}
                    >
                      {t} ✕
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Privacy */}
            <div className="space-y-3">
              <Label className="mb-1 block">Privacy Settings</Label>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium">Private List</p>
                    <p className="text-sm text-muted-foreground">Only you and invited collaborators can view this list</p>
                  </div>
                </div>
                <Controller
                  name="isPrivate"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Toggle private" />
                  )}
                />
              </div>
            </div>

            {/* Collaborators – only when private */}
            {isPrivate && (
              <div className="space-y-2">
                <Label>Invite Collaborators</Label>
                <Input placeholder="Enter email addresses (comma separated)" {...register("collaborators")} />
                <p className="text-xs text-muted-foreground">You can invite more people after creating the list</p>
              </div>
            )}

            <Separator />

            {/* Destinations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Destinations</h3>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    append({
                      name: "",
                      country: "",
                      datePlanned: "",
                      dateVisited: "",
                      status: "wishlist",
                      notes: "",
                      image: undefined,
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Destination
                </Button>
              </div>

              <div className="space-y-6">
                {destinationFields.map((field, index) => (
                  <DestinationCard
                    key={field.id}
                    index={index}
                    control={control}
                    register={register}
                    errors={errors}
                    onRemove={() => remove(index)}
                    setValue={setValue}
                  />
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create List"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}