import controller from "@/services/commonRequest";
import endpoints from "@/services/api";

const isImage = (nameOrType: string) =>
  /^(image\/)|\.(png|jpe?g|gif|webp|avif)$/i.test(nameOrType);

export async function uploadImageReturnBody(file: File): Promise<{ imageUrl: string }> {
  if (!isImage(file.type) && !isImage(file.name)) {
    throw new Error("Only images are allowed");
  }

  // optional: size limit (e.g., 8 MB)
  const MAX_MB = 8;
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`Image is too large. Max ${MAX_MB}MB.`);
  }

  const fd = new FormData();
  fd.append("image", file, file.name);

  // Let the browser set multipart boundaries; don't set Content-Type
  const res = await controller.post(`${endpoints.upload}/image`, fd);
  const ok = res?.success !== false;
  const url = res?.data?.url || res?.url;
  if (!ok || !url) throw new Error(res?.message || "Image upload failed");

  return { imageUrl: url };
}
