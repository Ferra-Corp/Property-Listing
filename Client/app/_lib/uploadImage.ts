export type UploadedImage = {
  url: string
  publicId: string
  width: number | null
  height: number | null
  bytes: number
  /** Cloudinary's own classification of what got uploaded — lets callers
   * that accept more than photos (e.g. the listing form) store it as the
   * right media type instead of assuming everything is an image. */
  resourceType: "image" | "video" | "raw"
  /** Only set for videos. */
  durationSeconds: number | null
}

/**
 * Uploads straight to Cloudinary from the browser. This server only ever
 * hands out a short-lived signature (see `/system/api/v1/uploads`) — the
 * file bytes themselves never pass through our own backend.
 *
 * Posts to Cloudinary's `auto` endpoint rather than `image`, so the same
 * signed upload also accepts video — Cloudinary detects which from the
 * file itself, no separate code path needed per type.
 */
export async function uploadImage(
  file: File,
  context: "insight" | "service" | "listing" | "agent" | "testimonial" = "insight"
): Promise<UploadedImage> {
  const signRequest = await fetch("/system/api/v1/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ context }),
    }),
    signResponse = await signRequest.json()

  if (!signRequest.ok)
    throw new Error(signResponse.error ?? "Couldn't authorize the upload")

  const { timestamp, signature, folder, apiKey, cloudName } = signResponse as {
    timestamp: number
    signature: string
    folder: string
    apiKey: string
    cloudName: string
  }

  const form = new FormData()
  form.append("file", file)
  form.append("api_key", apiKey)
  form.append("timestamp", String(timestamp))
  form.append("signature", signature)
  form.append("folder", folder)

  const uploadRequest = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      { method: "POST", body: form }
    ),
    uploadResponse = await uploadRequest.json()

  if (!uploadRequest.ok)
    throw new Error(uploadResponse.error?.message ?? "Upload failed")

  return {
    url: uploadResponse.secure_url,
    publicId: uploadResponse.public_id,
    width: uploadResponse.width ?? null,
    height: uploadResponse.height ?? null,
    bytes: uploadResponse.bytes,
    resourceType: uploadResponse.resource_type,
    durationSeconds: uploadResponse.duration ?? null,
  }
}
