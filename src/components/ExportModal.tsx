import React from 'react';
import { X, FileSpreadsheet, FileText, Download, CheckCircle, ShieldCheck } from 'lucide-react';
import { AttendanceRecord, SessionConfig } from '../types/attendance';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
  sessionConfig: SessionConfig;
  onExportExcel: () => void;
  onExportPdf: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  records,
  sessionConfig,
  onExportExcel,
  onExportPdf,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm sm:text-base">
              Lựa Chọn Định Dạng Xuất Danh Sách
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng cửa sổ xuất danh sách"
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          <div className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Định dạng chuẩn theo yêu cầu:
            </div>
            <p className="text-slate-600">
              Cả hai file xuất (Excel & PDF) đều bao gồm chính xác 3 cột:
            </p>
            <div className="flex flex-wrap gap-2 mt-2 font-mono text-[11px] font-bold text-slate-800">
              <span className="px-2 py-1 bg-white border border-slate-200 rounded-md">1. Số thứ tự (STT)</span>
              <span className="px-2 py-1 bg-white border border-slate-200 rounded-md">2. Thời gian quét</span>
              <span className="px-2 py-1 bg-white border border-slate-200 rounded-md">3. Mã sinh viên</span>
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Chọn một trong hai định dạng tải về:
          </div>

          {/* Option 1: Excel (.xlsx) */}
          <div className="border border-slate-200 hover:border-emerald-500 rounded-xl p-4 transition duration-200 hover:shadow-md bg-white group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-105 transition">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>File Excel (.xlsx)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Khuyên dùng</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mở trên Microsoft Excel, Google Sheets. Dễ dàng lưu trữ và lọc dữ liệu.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onExportExcel();
                onClose();
              }}
              disabled={records.length === 0}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải file Excel</span>
            </button>
          </div>

          {/* Option 2: PDF (.pdf) */}
          <div className="border border-slate-200 hover:border-rose-500 rounded-xl p-4 transition duration-200 hover:shadow-md bg-white group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 group-hover:scale-105 transition">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">
                  File Báo Cáo PDF (.pdf)
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Định dạng chuẩn khổ A4, bố cục bảng ngay ngắn, sẵn sàng in ấn hoặc gửi báo cáo.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onExportPdf();
                onClose();
              }}
              disabled={records.length === 0}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải file PDF</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 text-center pt-1">
            Tổng cộng <strong>{records.length}</strong> sinh viên sẽ được trích xuất vào file.
          </div>
        </div>
      </div>
    </div>
  );
};
