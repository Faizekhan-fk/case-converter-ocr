import Tesseract from 'tesseract.js';
import { OCRResult, OCRProgress } from '../types';

export class OCRService {
  async extractText(
    imageFile: File,
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResult> {
    try {
      const result = await Tesseract.recognize(imageFile, 'eng', {
        logger: (m: any) => {
          if (onProgress) {
            onProgress({
              status: m.status || 'processing',
              progress: m.progress || 0
            });
          }
        }
      });

      return {
        text: result.data.text || '',
        confidence: result.data.confidence || 0,
        words: undefined
      };
    } catch (error) {
      throw new Error('Failed to extract text from image');
    }
  }

  async terminate(): Promise<void> {
    // No cleanup needed for direct recognition
  }
}

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please select a valid image file (JPEG, PNG, GIF, BMP, WebP)'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 10MB'
    };
  }

  return { valid: true };
};

export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};
