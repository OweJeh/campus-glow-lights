/**
 * Compresses an image from a base64 string using a Canvas.
 * @param base64Str The original base64 string of the image.
 * @param maxWidth The maximum width for the compressed image.
 * @param maxHeight The maximum height for the compressed image.
 * @param quality The quality of the compressed image (0 to 1).
 * @returns A promise that resolves to the compressed base64 string.
 */
export const compressImage = (
    base64Str: string,
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.7
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions while maintaining aspect ratio
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Convert canvas to base64 string with specified quality
            const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
            resolve(compressedBase64);
        };
        img.onerror = (error) => reject(error);
    });
};
