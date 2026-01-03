/**
 * File Compression Utilities
 * Compress images and validate PDFs before uploading to Firebase Storage
 */

interface CompressionResult {
    file: File;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
}

/**
 * Compress an image file using Canvas API
 * @param file - Original image file
 * @param maxWidth - Maximum width in pixels (default: 1920)
 * @param maxHeight - Maximum height in pixels (default: 1920)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Compressed image file
 */
export async function compressImage(
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1920,
    quality: number = 0.8
): Promise<CompressionResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions while maintaining aspect ratio
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    const aspectRatio = width / height;

                    if (width > height) {
                        width = maxWidth;
                        height = width / aspectRatio;
                    } else {
                        height = maxHeight;
                        width = height * aspectRatio;
                    }
                }

                // Create canvas and draw resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Enable image smoothing for better quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Draw image on canvas
                ctx.drawImage(img, 0, 0, width, height);

                // Convert canvas to blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'));
                            return;
                        }

                        // Create new file from blob
                        const compressedFile = new File(
                            [blob],
                            file.name.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '.jpg'),
                            { type: 'image/jpeg' }
                        );

                        const originalSize = file.size;
                        const compressedSize = compressedFile.size;
                        const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

                        resolve({
                            file: compressedFile,
                            originalSize,
                            compressedSize,
                            compressionRatio
                        });
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Validate PDF file size
 * @param file - PDF file
 * @param maxSize - Maximum size in bytes (default: 2MB)
 * @returns Validation result
 */
export function validatePdfSize(file: File, maxSize: number = 2 * 1024 * 1024): {
    valid: boolean;
    size: number;
    maxSize: number;
} {
    return {
        valid: file.size <= maxSize,
        size: file.size,
        maxSize
    };
}

/**
 * Main function to process file before upload
 * - Compresses images
 * - Validates PDF size
 * @param file - Original file
 * @returns Processed file with metadata
 */
export async function processFileForUpload(file: File): Promise<{
    file: File;
    originalSize: number;
    processedSize: number;
    type: 'image' | 'pdf';
    compressionApplied: boolean;
    message?: string;
}> {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validPdfType = 'application/pdf';

    // Process images
    if (validImageTypes.includes(file.type)) {
        // Skip compression for very small files (< 100KB)
        const minCompressionSize = 100 * 1024; // 100KB
        if (file.size < minCompressionSize) {
            return {
                file,
                originalSize: file.size,
                processedSize: file.size,
                type: 'image',
                compressionApplied: false,
                message: `Gambar sudah optimal (${formatBytes(file.size)})`
            };
        }

        try {
            const result = await compressImage(file);

            // If compressed file is larger or similar size, use original
            if (result.compressedSize >= result.originalSize * 0.95) {
                return {
                    file,
                    originalSize: file.size,
                    processedSize: file.size,
                    type: 'image',
                    compressionApplied: false,
                    message: `Gambar sudah optimal (${formatBytes(file.size)})`
                };
            }

            return {
                file: result.file,
                originalSize: result.originalSize,
                processedSize: result.compressedSize,
                type: 'image',
                compressionApplied: true,
                message: `Gambar dikompres ${result.compressionRatio.toFixed(0)}% (${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)})`
            };
        } catch (error) {
            console.error('Image compression failed:', error);
            // If compression fails, return original file
            return {
                file,
                originalSize: file.size,
                processedSize: file.size,
                type: 'image',
                compressionApplied: false,
                message: 'Kompresi gagal, menggunakan file asli'
            };
        }
    }

    // Process PDFs (validation only)
    if (file.type === validPdfType) {
        const validation = validatePdfSize(file);

        if (!validation.valid) {
            throw new Error(`Ukuran PDF terlalu besar (${formatBytes(validation.size)}). Maksimal ${formatBytes(validation.maxSize)}.`);
        }

        return {
            file,
            originalSize: file.size,
            processedSize: file.size,
            type: 'pdf',
            compressionApplied: false,
            message: `PDF valid (${formatBytes(file.size)})`
        };
    }

    throw new Error('Tipe file tidak didukung');
}

/**
 * Format bytes to human-readable string
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
