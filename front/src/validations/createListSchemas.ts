import z from "zod";

const imageSchema = z.object({
  url: z.string().min(1, "Image URL is required"),
  public_id: z.string().min(1, "Public ID is required"),
});

const destinationSchema = z
  .object({
    name: z.string().min(1, "Required"),
    country: z.string().min(1, "Required"),
    status: z.enum(["wishlist", "planned", "completed"]).default("wishlist"),
    datePlanned: z.string().optional(),
    dateVisited: z.string().optional().nullable(),
    notes: z.string().default(""),
    image: imageSchema.optional(),
    listId: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.status !== "wishlist" && !val.datePlanned) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Planned date is required", path: ["datePlanned"] });
    }
    if (val.status === "completed" && !val.dateVisited) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Visited date is required", path: ["dateVisited"] });
    }
  });

export const listSchema = z.object({
  title: z.string().min(1, "List title is required"),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isPrivate: z.boolean().default(false),
  collaborators: z.string().optional(),
  coverImage: z.any().refine(
    (file) => {
      return file instanceof File && file.type.startsWith('image/');
    },
    {
      message: "Please select a valid image file",
    }
  ),
  destinations: z.array(destinationSchema).default([]),
});