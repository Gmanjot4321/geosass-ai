import ExifReader from 'exifreader';
import { ExifDataSummary } from '../components/ExifScrubber';

/**
 * Parses raw File or ArrayBuffer to extract EXIF and GPS tags
 */
export async function extractExifMetadata(fileOrBuffer: File | ArrayBuffer): Promise<ExifDataSummary> {
  try {
    const tags = await ExifReader.load(fileOrBuffer as any, { expanded: true });
    const summary: ExifDataSummary = {
      hasGps: false,
    };

    // Check GPS
    if (tags.gps && tags.gps.Latitude && tags.gps.Longitude) {
      summary.hasGps = true;
      summary.latitude = Number(tags.gps.Latitude);
      summary.longitude = Number(tags.gps.Longitude);
    }

    // Camera / Hardware
    if (tags.exif) {
      if (tags.exif.Make) summary.cameraMake = String(tags.exif.Make.description || tags.exif.Make.value);
      if (tags.exif.Model) summary.cameraModel = String(tags.exif.Model.description || tags.exif.Model.value);
      if (tags.exif.DateTimeOriginal) summary.dateTimeOriginal = String(tags.exif.DateTimeOriginal.description || tags.exif.DateTimeOriginal.value);
      if (tags.exif.Software) summary.software = String(tags.exif.Software.description || tags.exif.Software.value);
      if (tags.exif.LensModel) summary.lensModel = String(tags.exif.LensModel.description || tags.exif.LensModel.value);
      if (tags.exif.ISOSpeedRatings) summary.iso = String(tags.exif.ISOSpeedRatings.description || tags.exif.ISOSpeedRatings.value);
    }

    return summary;
  } catch (err) {
    return { hasGps: false };
  }
}

/**
 * Strips all EXIF metadata by re-encoding through HTML5 canvas
 */
export function purgeExifFromDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0);
      // Clean canvas export has zero EXIF headers
      resolve(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
