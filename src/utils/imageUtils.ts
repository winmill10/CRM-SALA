/**
 * Utility for resizing and compressing images to exactly 600x600 pixels using HTML5 Canvas
 */

export interface CompressedImageResult {
  base64: string;
  originalSizeKB: number;
  compressedSizeKB: number;
  width: number;
  height: number;
}

export function compressImageTo600x600(
  file: File,
  targetWidth = 600,
  targetHeight = 600,
  quality = 0.85
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const originalSizeKB = Math.round(file.size / 1024);

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        reject(new Error('ไม่พบข้อมูลรูปภาพ'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพเพื่อประมวลผลได้'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Enable high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Fill background with white in case of transparent png
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Center Crop (Cover) to 600x600 without stretching or distorting
        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;

        let srcX = 0;
        let srcY = 0;
        let srcW = img.width;
        let srcH = img.height;

        if (imgRatio > targetRatio) {
          // Source is wider than square: crop left and right
          srcW = img.height * targetRatio;
          srcX = (img.width - srcW) / 2;
        } else {
          // Source is taller than square: crop top and bottom
          srcH = img.width / targetRatio;
          srcY = (img.height - srcH) / 2;
        }

        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetWidth, targetHeight);

        // Export as JPEG with chosen quality
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);

        // Calculate compressed size in KB (approx from base64 string length)
        const base64Length = compressedBase64.length - (compressedBase64.indexOf(',') + 1);
        const compressedSizeKB = Math.round((base64Length * 3) / 4 / 1024);

        resolve({
          base64: compressedBase64,
          originalSizeKB,
          compressedSizeKB,
          width: targetWidth,
          height: targetHeight,
        });
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}
