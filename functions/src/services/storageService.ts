/**
 * Storage Service
 * Handles uploading receipt images to Firebase Storage with compression
 */

import * as admin from 'firebase-admin';
import sharp from 'sharp';

const BUCKET_NAME = 'expensetracker-test-1.firebasestorage.app';

/**
 * Attachment metadata structure (matching web app schema)
 */
export interface AttachmentData {
    url: string;
    path: string;
    type: 'image';
    name: string;
    size: number;
}

/**
 * Compress image using sharp
 * @param buffer - Original image buffer
 * @returns Compressed image buffer
 */
async function compressImage(buffer: Buffer): Promise<Buffer> {
    try {
        // Resize and compress - max 1200px width, 80% quality JPEG
        const compressed = await sharp(buffer)
            .resize(1200, null, {
                withoutEnlargement: true,
                fit: 'inside'
            })
            .jpeg({ quality: 80, progressive: true })
            .toBuffer();

        console.log(`[STORAGE] Compressed image: ${buffer.length} -> ${compressed.length} bytes`);
        return compressed;
    } catch (error) {
        console.error('[STORAGE] Compression failed, using original:', error);
        return buffer;
    }
}

/**
 * Upload receipt image to Firebase Storage
 * @param userId - Firebase user ID
 * @param imageBuffer - Image data as Buffer
 * @param originalName - Original filename
 * @returns Attachment data with URL and metadata
 */
export async function uploadReceiptImage(
    userId: string,
    imageBuffer: Buffer,
    originalName: string
): Promise<AttachmentData> {
    const bucket = admin.storage().bucket(BUCKET_NAME);

    // Compress image
    const compressedBuffer = await compressImage(imageBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `receipt_${timestamp}.jpg`;
    const filePath = `users/${userId}/attachments/${fileName}`;

    // Upload to Firebase Storage
    const file = bucket.file(filePath);

    await file.save(compressedBuffer, {
        metadata: {
            contentType: 'image/jpeg',
            metadata: {
                originalName,
                uploadedBy: 'telegram',
                uploadedAt: new Date().toISOString()
            }
        }
    });

    // Make file publicly accessible
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`;

    console.log(`[STORAGE] Uploaded receipt to: ${publicUrl}`);

    return {
        url: publicUrl,
        path: filePath,
        type: 'image',
        name: fileName,
        size: compressedBuffer.length
    };
}

/**
 * Validate image type
 * @param mimeType - MIME type of the file
 * @returns true if valid image type (JPEG or PNG)
 */
export function isValidImageType(mimeType: string | undefined): boolean {
    if (!mimeType) return false;
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    return validTypes.includes(mimeType.toLowerCase());
}
