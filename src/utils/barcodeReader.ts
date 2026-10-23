import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  MultiFormatReader,
} from '@zxing/library';

// Formats commonly used for Student IDs and university cards
const SUPPORTED_FORMATS: BarcodeFormat[] = [
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.QR_CODE,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.ITF,
  BarcodeFormat.CODABAR,
];

const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, SUPPORTED_FORMATS);
hints.set(DecodeHintType.TRY_HARDER, true);

/**
 * Checks if the browser has native BarcodeDetector API.
 */
export function hasNativeBarcodeDetector(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

/**
 * Decodes barcode from an HTMLImageElement or HTMLCanvasElement or ImageBitmap.
 */
export async function decodeBarcodeFromImage(
  imageSource: HTMLImageElement | HTMLCanvasElement | ImageBitmap
): Promise<string | null> {
  // 1. Try native BarcodeDetector first if available
  if (hasNativeBarcodeDetector()) {
    try {
      const barcodeDetector = new (window as unknown as {
        BarcodeDetector: new (options?: { formats: string[] }) => {
          detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
        };
      }).BarcodeDetector({
        formats: ['code_128', 'code_39', 'ean_13', 'qr_code', 'upc_a', 'codabar', 'itf'],
      });

      const barcodes = await barcodeDetector.detect(imageSource as ImageBitmapSource);
      if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
        return barcodes[0].rawValue.trim();
      }
    } catch (e) {
      console.warn('Native BarcodeDetector attempt failed, falling back to ZXing', e);
    }
  }

  // 2. Fall back to ZXing multi-format reader with pixel analysis
  try {
    let canvas: HTMLCanvasElement;
    let width: number;
    let height: number;

    if (imageSource instanceof HTMLCanvasElement) {
      canvas = imageSource;
      width = canvas.width;
      height = canvas.height;
    } else {
      canvas = document.createElement('canvas');
      width = ('naturalWidth' in imageSource ? imageSource.naturalWidth : (imageSource as ImageBitmap).width) || 800;
      height = ('naturalHeight' in imageSource ? imageSource.naturalHeight : (imageSource as ImageBitmap).height) || 600;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageSource as CanvasImageSource, 0, 0, width, height);
      }
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    const imgData = ctx.getImageData(0, 0, width, height);
    const luminances = new Uint8ClampedArray(width * height);
    for (let i = 0; i < luminances.length; i++) {
      // standard greyscale weights
      luminances[i] = (imgData.data[i * 4] * 77 + imgData.data[i * 4 + 1] * 150 + imgData.data[i * 4 + 2] * 29) >> 8;
    }

    const luminanceSource = new RGBLuminanceSource(luminances, width, height);
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

    const reader = new MultiFormatReader();
    reader.setHints(hints);
    const result = reader.decode(binaryBitmap);

    if (result && result.getText()) {
      return result.getText().trim();
    }
  } catch (err) {
    // ZXing throws NotFoundException when no barcode is in frame, which is expected
  }

  return null;
}

export function createZXingReader(): BrowserMultiFormatReader {
  return new BrowserMultiFormatReader(hints, 500);
}
