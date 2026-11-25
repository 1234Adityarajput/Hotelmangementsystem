/**
 * Document Upload Service
 * Supports client-side optimized base64 Data URLs and automatic Cloudinary upload
 * when Cloudinary credentials are provided.
 */

export interface UploadResult {
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  isCloudinary?: boolean;
}

/**
 * Compresses an image file in-browser using HTML5 Canvas to keep base64 payload small (~150-350KB)
 * while preserving high legibility for government identity proofs (Aadhaar, Passport, DL).
 */
export async function compressImage(file: File, maxDimension = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to parse image file"));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Convert to webp or jpeg
        const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Reads a non-image file (e.g. PDF) as base64 Data URL
 */
export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read document file"));
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
}

export const uploadService = {
  /**
   * Main upload handler:
   * 1. Checks if Cloudinary is configured (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME & UPLOAD_PRESET).
   * 2. If Cloudinary is available, uploads directly to Cloudinary and returns the secure HTTPS URL.
   * 3. Otherwise, processes the local file as an optimized Data URL ready for storage.
   */
  async uploadDocument(file: File): Promise<UploadResult> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

    // 1. Cloudinary upload branch (activated when user configures credentials)
    if (cloudName && uploadPreset) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);
        formData.append("folder", "hotel-radha-palace/guests");

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Cloudinary upload returned status ${res.status}`);
        }

        const data = await res.json();
        return {
          url: data.secure_url || data.url,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          isCloudinary: true,
        };
      } catch (err) {
        console.warn("Cloudinary upload failed, falling back to local file processing:", err);
      }
    }

    // 2. Default local file branch
    let url: string;
    if (file.type.startsWith("image/")) {
      url = await compressImage(file);
    } else {
      url = await readFileAsDataUrl(file);
    }

    return {
      url,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      isCloudinary: false,
    };
  },
};
