import React from 'react';
import { X, Printer, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { AttendanceRecord, SessionConfig } from '../types/attendance';
import { calculateAttendanceStats } from '../utils/attendance';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
  sessionConfig: SessionConfig;
  onExportExcel: () => void;
  onExportPdf: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  records,
  sessionConfig,
  onExportExcel,
  onExportPdf,
}) => {
  if (!isOpen) return null;

  const stats = calculateAttendanceStats(records);
  const now = new Date();
  const dateFormatted = `${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Controls Header */}
        <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm sm:text-base">
              Báo Cáo Điểm Danh Chuẩn A4
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In trực tiếp</span>
            </button>
            <button
              onClick={onExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel (.xlsx)</span>
            </button>
            <button
              onClick={onExportPdf}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>PDF (.pdf)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable View */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-slate-100 flex-1">
          <div className="max-w-[210mm] mx-auto bg-white p-8 sm:p-12 shadow-md rounded-lg text-slate-900 font-sans print:shadow-none print:p-0 print:m-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {sessionConfig.organization || 'TRƯỜNG ĐẠI HỌC KHOA HỌC TỰ NHIÊN'}
                </div>
                <div className="text-sm font-extrabold uppercase text-blue-900">
                  HỆ THỐNG ĐIỂM DANH SINH VIÊN BẰNG MÃ VẠCH (BARCODE)
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="italic text-slate-600">Độc lập - Tự do - Hạnh phúc</div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center my-6">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                DANH SÁCH ĐIỂM DANH SINH VIÊN
              </h1>
              <p className="text-xs text-slate-500 mt-1 italic">
                Xuất lúc: {new Date().toLocaleTimeString('vi-VN')} ngày {dateFormatted}
              </p>
            </div>

            {/* Session Info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs grid grid-cols-2 gap-y-2 gap-x-4">
              <div>
                <span className="font-bold text-slate-700">Buổi học / Hoạt động: </span>
                <span className="text-slate-900 font-medium">{sessionConfig.sessionTitle}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Ngày điểm danh: </span>
                <span className="text-slate-900 font-medium">{sessionConfig.date}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Phòng học / Địa điểm: </span>
                <span className="text-slate-900 font-medium">{sessionConfig.room}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Người phụ trách: </span>
                <span className="text-slate-900 font-medium">{sessionConfig.lecturer}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Tổng sinh viên có mặt: </span>
                <span className="text-blue-700 font-bold">{records.length} sinh viên</span>
              </div>
            </div>

            {/* Required 3-Column Table: Số thứ tự, Thời gian quét, Mã sinh viên */}
            <table className="w-full text-left border-collapse border border-slate-300 text-xs mb-8">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                  <th className="py-2.5 px-4 border-r border-slate-300 text-center w-20">Số thứ tự</th>
                  <th className="py-2.5 px-4 border-r border-slate-300 text-center">Thời gian quét</th>
                  <th className="py-2.5 px-4 text-center font-mono font-bold">Mã sinh viên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {records.map((r, index) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 border-r border-slate-200 text-center font-semibold text-slate-600">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-4 border-r border-slate-200 text-center font-mono font-medium text-slate-800">
                      {r.formattedTime}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-extrabold text-sm text-slate-900">
                      {r.studentId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Signature Block */}
            <div className="grid grid-cols-2 gap-8 text-center text-xs mt-12 pt-6">
              <div>
                <div className="font-bold uppercase text-slate-700">Người Lập Bảng</div>
                <div className="text-[11px] italic text-slate-500 mb-16">(Ký và ghi rõ họ tên)</div>
              </div>
              <div>
                <div className="italic text-slate-500 text-[11px] mb-1">
                  TP. Hồ Chí Minh, ngày {dateFormatted}
                </div>
                <div className="font-bold uppercase text-slate-700">Người Quản Lý / Giảng Viên</div>
                <div className="text-[11px] italic text-slate-500 mb-16">(Ký và ghi rõ họ tên)</div>
                <div className="font-bold text-sm text-slate-900">{sessionConfig.lecturer}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
