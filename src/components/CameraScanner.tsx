import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  SwitchCamera,
  UploadCloud,
  Flashlight,
  Barcode,
  Keyboard,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  ZoomIn,
} from 'lucide-react';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';

interface CameraScannerProps {
  onScanSuccess: (studentId: string) => void;
  lastScannedId: string | null;
  lastScannedTime: string | null;
  isScanningActive: boolean;
  setIsScanningActive: (active: boolean) => void;
}

const HINTS = new Map<DecodeHintType, unknown>();
HINTS.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.QR_CODE,
  BarcodeFormat.UPC_A,
  BarcodeFormat.CODABAR,
  BarcodeFormat.ITF,
]);
HINTS.set(DecodeHintType.TRY_HARDER, true);

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScanSuccess,
  isScanningActive,
  setIsScanningActive,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isDecodingRef = useRef<boolean>(false);
  const lastScanTimestampRef = useRef<number>(0);
  const lastDetectedCodeRef = useRef<string>('');

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [supportsZoom, setSupportsZoom] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [scanFeedback, setScanFeedback] = useState<boolean>(false);

  // Trigger barcode callback with cooldown
  const handleBarcodeDetected = useCallback(
    (rawCode: string) => {
      const code = rawCode.replace(/[\x00-\x1F\x7F]/g, '').trim();
      if (!code || code.length < 3) return;

      const now = Date.now();
      // If same code detected within 2 seconds, ignore to avoid multi-firing
      if (code === lastDetectedCodeRef.current && now - lastScanTimestampRef.current < 2000) {
        return;
      }
      if (now - lastScanTimestampRef.current < 900) {
        return;
      }

      lastScanTimestampRef.current = now;
      lastDetectedCodeRef.current = code;

      setScanFeedback(true);
      setTimeout(() => setScanFeedback(false), 1200);

      onScanSuccess(code);
    },
    [onScanSuccess]
  );

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, min: 15 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as unknown as { torch?: boolean; zoom?: { min: number; max: number } }) : null;

      setHasTorch(Boolean(capabilities && capabilities.torch));
      setSupportsZoom(Boolean(capabilities && capabilities.zoom));

      try {
        if ('applyConstraints' in track) {
          await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
            advanced: [{ focusMode: 'continuous' }],
          });
        }
      } catch {}

      setIsScanningActive(true);
    } catch (err: unknown) {
      const errorMsg = (err as Error).name === 'NotAllowedError'
        ? 'Vui lòng cấp quyền truy cập Camera trên điện thoại để quét mã vạch!'
        : 'Không thể mở Camera. Bạn có thể nhập mã số bên dưới hoặc tải ảnh thẻ lên.';
      setCameraError(errorMsg);
      setIsScanningActive(false);
    }
  }, [facingMode, setIsScanningActive]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (zxingReaderRef.current) {
      try {
        zxingReaderRef.current.reset();
      } catch {}
    }
    setIsScanningActive(false);
  }, [setIsScanningActive]);

  // Fast Hardware Barcode Scanner Engine
  useEffect(() => {
    if (!isScanningActive || !videoRef.current) {
      return;
    }

    let isRunning = true;
    const hasNative = typeof window !== 'undefined' && 'BarcodeDetector' in window;

    if (hasNative) {
      let nativeDetector: unknown = null;
      try {
        nativeDetector = new (window as unknown as {
          BarcodeDetector: new (opts?: { formats: string[] }) => {
            detect: (src: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
          };
        }).BarcodeDetector({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'upc_a', 'itf', 'codabar'],
        });
      } catch (e) {
        console.warn('BarcodeDetector error', e);
      }

      if (nativeDetector) {
        const detectLoop = async () => {
          if (!isRunning) return;

          const video = videoRef.current;
          if (video && video.readyState === video.HAVE_ENOUGH_DATA && !isDecodingRef.current) {
            isDecodingRef.current = true;
            try {
              const barcodes = await (nativeDetector as {
                detect: (src: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
              }).detect(video);

              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                handleBarcodeDetected(barcodes[0].rawValue);
              }
            } catch {
              // Frame skip
            } finally {
              isDecodingRef.current = false;
            }
          }

          if (isRunning) {
            animationFrameRef.current = requestAnimationFrame(detectLoop);
          }
        };

        animationFrameRef.current = requestAnimationFrame(detectLoop);

        return () => {
          isRunning = false;
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
        };
      }
    }

    // ZXing fallback
    if (!zxingReaderRef.current) {
      zxingReaderRef.current = new BrowserMultiFormatReader(HINTS, 160);
    }

    const reader = zxingReaderRef.current;
    const videoElem = videoRef.current;

    const timer = setInterval(async () => {
      if (!isRunning || !videoElem || videoElem.readyState !== videoElem.HAVE_ENOUGH_DATA) {
        return;
      }

      if (isDecodingRef.current) return;
      isDecodingRef.current = true;

      try {
        const result = await reader.decodeOnce(videoElem);
        if (result && result.getText()) {
          handleBarcodeDetected(result.getText());
        }
      } catch {
        // Expected
      } finally {
        isDecodingRef.current = false;
      }
    }, 160);

    intervalRef.current = timer as unknown as number;

    return () => {
      isRunning = false;
      if (timer) clearInterval(timer);
    };
  }, [isScanningActive, handleBarcodeDetected]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !isTorchOn;
        await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
      } catch (e) {
        console.warn('Torch failed', e);
      }
    }
  };

  const toggleZoom = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && supportsZoom) {
      try {
        const nextZoom = zoomLevel === 1 ? 2 : 1;
        await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
          advanced: [{ zoom: nextZoom }],
        });
        setZoomLevel(nextZoom);
      } catch (e) {
        console.warn('Zoom failed', e);
      }
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = async () => {
      try {
        let detected = false;
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          try {
            const detector = new (window as unknown as {
              BarcodeDetector: new (opts?: { formats: string[] }) => {
                detect: (src: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
              };
            }).BarcodeDetector({
              formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code'],
            });
            const barcodes = await detector.detect(img);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              handleBarcodeDetected(barcodes[0].rawValue);
              detected = true;
            }
          } catch {}
        }

        if (!detected) {
          const reader = new BrowserMultiFormatReader(HINTS);
          const result = await reader.decodeFromImageElement(img);
          if (result && result.getText()) {
            handleBarcodeDetected(result.getText());
            detected = true;
          }
        }

        URL.revokeObjectURL(objectUrl);
        setIsProcessingImage(false);

        if (!detected) {
          alert('Không phát hiện thấy mã vạch trong ảnh. Vui lòng chụp rõ mã vạch!');
        }
      } catch {
        URL.revokeObjectURL(objectUrl);
        setIsProcessingImage(false);
        alert('Không tìm thấy mã vạch trong ảnh này.');
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setIsProcessingImage(false);
      alert('Không thể mở ảnh.');
    };
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleBarcodeDetected(manualInput.trim());
      setManualInput('');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Viewport Top Bar (Touch-optimized) */}
      <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-xs sm:text-sm tracking-wide">
            Camera Quét Barcode
          </span>
        </div>

        <div className="flex items-center gap-1">
          {supportsZoom && (
            <button
              onClick={toggleZoom}
              aria-label="Thu phóng 2x"
              title="Phóng to 2x để quét dễ hơn"
              className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 active:scale-95 ${
                zoomLevel > 1 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>{zoomLevel}x</span>
            </button>
          )}

          {hasTorch && (
            <button
              onClick={toggleTorch}
              aria-label="Bật đèn Flash"
              title="Đèn Flash"
              className={`min-h-[36px] min-w-[36px] p-2 rounded-lg transition flex items-center justify-center active:scale-95 ${
                isTorchOn ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-300'
              }`}
            >
              <Flashlight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={toggleFacingMode}
            aria-label="Đổi Camera trước hoặc sau"
            title="Đổi Camera"
            className="min-h-[36px] min-w-[36px] p-2 rounded-lg bg-slate-800 text-slate-300 active:scale-95 transition flex items-center justify-center"
          >
            <SwitchCamera className="w-4 h-4" />
          </button>

          {isScanningActive ? (
            <button
              onClick={stopCamera}
              aria-label="Dừng camera"
              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold flex items-center gap-1 active:scale-95 transition"
            >
              <CameraOff className="w-4 h-4" />
              <span className="hidden sm:inline">Dừng</span>
            </button>
          ) : (
            <button
              onClick={startCamera}
              aria-label="Bật lại camera"
              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold flex items-center gap-1 active:scale-95 transition"
            >
              <Camera className="w-4 h-4" />
              <span>Bật lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Video Viewport Area (Optimized height for mobile screen) */}
      <div className="relative h-56 sm:h-72 bg-slate-950 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            cameraError ? 'opacity-20' : 'opacity-100'
          }`}
        />

        {/* Scan Reticle Frame */}
        {isScanningActive && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-3">
            <div
              className={`relative w-11/12 max-w-xs sm:max-w-sm h-28 sm:h-36 border-2 rounded-xl backdrop-blur-[1px] transition-colors duration-200 flex items-center justify-center shadow-2xl ${
                scanFeedback
                  ? 'border-emerald-400 bg-emerald-500/20 ring-4 ring-emerald-400/40'
                  : 'border-blue-400/80 bg-blue-500/5'
              }`}
            >
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-blue-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-blue-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-blue-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-blue-400 rounded-br-lg" />

              {/* Laser animation */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_rgba(244,63,94,1)] animate-scan-line" />

              <div className="text-center px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-md">
                <Barcode className="w-3.5 h-3.5 text-blue-400" />
                <span>Đặt mã vạch vào khung</span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center gap-1 text-[10px] sm:text-xs text-slate-300 font-medium bg-slate-900/70 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Tự động nhận diện tức thì</span>
            </div>
          </div>
        )}

        {/* Camera Error Message */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/95 text-slate-200">
            <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
            <p className="text-xs sm:text-sm font-bold text-white mb-1">Camera chưa mở</p>
            <p className="text-[11px] text-slate-400 max-w-xs mb-3">{cameraError}</p>
            <button
              onClick={startCamera}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Thử lại camera
            </button>
          </div>
        )}

        {/* Scan Instant Badge */}
        {scanFeedback && (
          <div className="absolute top-2 left-2 right-2 bg-emerald-600 text-white px-3 py-2 rounded-xl shadow-2xl flex items-center gap-2 z-20 animate-in fade-in zoom-in-95">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <div className="text-xs font-semibold truncate">
              Đã bắt mã: <span className="font-mono font-bold">{lastDetectedCodeRef.current}</span>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input & File Upload on Mobile */}
      <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 space-y-2.5">
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Nhập MSSV hoặc quét súng USB..."
              className="w-full min-h-[44px] pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono font-semibold placeholder:text-slate-400 placeholder:font-sans"
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shrink-0 shadow-xs active:scale-95"
          >
            Điểm danh
          </button>
        </form>

        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="min-h-[32px] text-slate-600 hover:text-blue-600 font-medium flex items-center gap-1.5 cursor-pointer transition text-[11px] sm:text-xs">
            <UploadCloud className="w-4 h-4 text-blue-600" />
            <span>{isProcessingImage ? 'Đang đọc ảnh...' : 'Tải ảnh thẻ từ máy'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isProcessingImage}
            />
          </label>

          <span className="text-[10px] sm:text-[11px] text-slate-400">
            Hỗ trợ súng quét USB
          </span>
        </div>
      </div>
    </div>
  );
};
