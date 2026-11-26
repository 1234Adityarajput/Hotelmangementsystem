/**
 * Document Upload Service
 * Pure client-side optimized base64 Data URLs stored directly in the database.
 * No external Cloudinary dependencies.
 */

export interface UploadResult {
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

/**
 * Compresses an image file in-browser using HTML5 Canvas to keep base64 payload small (~150-350KB)
 * while preserving high legibility for government identity proofs (Aadhaar, Passport, DL).
 */
export async function compressImage(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));
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
   * Compresses images via Canvas or reads documents as base64 Data URLs
   * for direct database storage (no third-party cloud required).
   */
  async uploadDocument(file: File): Promise<UploadResult> {
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
    };
  },
};
