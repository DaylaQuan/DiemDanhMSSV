import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Search,
  Trash2,
  Edit3,
  Check,
  X,
  UserCheck,
  Clock,
  ArrowUpDown,
  Download,
  CheckCircle,
} from 'lucide-react';
import { AttendanceRecord, SessionConfig } from '../types/attendance';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  sessionConfig: SessionConfig;
  onDeleteRecord: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onClearAll: () => void;
  onOpenExportModal: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onAddSampleData: () => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  onDeleteRecord,
  onUpdateNote,
  onClearAll,
  onOpenExportModal,
  onExportExcel,
  onExportPdf,
  onAddSampleData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'on_time' | 'late'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    return records
      .filter((record) => {
        const matchesSearch =
          record.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.studentName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const timeA = new Date(a.scannedAt).getTime();
        const timeB = new Date(b.scannedAt).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [records, searchTerm, statusFilter, sortOrder]);

  const handleStartEdit = (record: AttendanceRecord) => {
    setEditingId(record.id);
    setEditNoteText(record.note || '');
  };

  const handleSaveEdit = (id: string) => {
    onUpdateNote(id, editNoteText.trim());
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditNoteText('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Header & Export Actions */}
      <div className="p-3.5 sm:p-5 border-b border-slate-200 bg-white space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight">
                Danh Sách Điểm Danh
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold font-mono">
                {records.length} sinh viên
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Cập nhật trực tiếp Mã sinh viên & Thời gian quét
            </p>
          </div>

          {/* Export Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenExportModal}
              disabled={records.length === 0}
              className="flex-1 sm:flex-initial min-h-[40px] px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95"
              title="Lựa chọn xuất danh sách điểm danh file Excel hoặc PDF"
            >
              <Download className="w-4 h-4" />
              <span>Xuất danh sách</span>
            </button>

            <button
              onClick={onExportExcel}
              disabled={records.length === 0}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              title="Tải file Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={onExportPdf}
              disabled={records.length === 0}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              title="Tải file PDF (.pdf)"
            >
              <FileText className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo MSSV hoặc họ tên..."
              className="w-full min-h-[38px] pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-1.5 justify-between sm:justify-start">
            {/* Filter by Status */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                Tất cả ({records.length})
              </button>
              <button
                onClick={() => setStatusFilter('on_time')}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'on_time' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                Đúng giờ
              </button>
              <button
                onClick={() => setStatusFilter('late')}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg font-medium transition ${
                  statusFilter === 'late' ? 'bg-amber-600 text-white shadow-xs font-bold' : 'text-slate-600'
                }`}
              >
                Đi trễ
              </button>
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="min-h-[36px] p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 transition shrink-0"
              title="Đổi thứ tự hiển thị"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{sortOrder === 'desc' ? 'Mới nhất' : 'Cũ nhất'}</span>
            </button>

            {records.length > 0 && (
              <button
                onClick={onClearAll}
                className="min-h-[36px] p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-medium flex items-center gap-1 transition shrink-0"
                title="Xóa toàn bộ"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIEWPORT CONTENT */}
      {filteredRecords.length > 0 ? (
        <>
          {/* MOBILE CARD VIEW (Block on small screens for ultra-clear reading) */}
          <div className="block sm:hidden divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
            {filteredRecords.map((record, index) => {
              const isLatest = index === 0 && sortOrder === 'desc';

              return (
                <div
                  key={record.id}
                  className={`p-3.5 flex items-center justify-between gap-3 transition ${
                    isLatest ? 'bg-emerald-50/80 border-l-4 border-l-emerald-500' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {record.stt}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-base text-slate-900 tracking-tight">
                          {record.studentId}
                        </span>
                        {record.status === 'on_time' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Đúng giờ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Đi trễ
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-semibold text-slate-800 truncate mt-0.5">
                        {record.studentName}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500 mt-1">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{record.formattedTime}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteRecord(record.id)}
                    className="min-h-[36px] min-w-[36px] p-2 text-slate-400 hover:text-rose-600 rounded-lg active:scale-95 transition shrink-0 flex items-center justify-center"
                    title="Xóa sinh viên này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (Visible on sm and up) */}
          <div className="hidden sm:block overflow-x-auto min-h-[340px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-3 px-4 w-16 text-center">STT</th>
                  <th className="py-3 px-4 w-44">Thời Gian Quét</th>
                  <th className="py-3 px-4 w-36">Mã Sinh Viên</th>
                  <th className="py-3 px-4">Họ Và Tên</th>
                  <th className="py-3 px-4 text-center w-28">Trạng Thái</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Ghi Chú</th>
                  <th className="py-3 px-4 w-16 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRecords.map((record, index) => {
                  const isEditing = editingId === record.id;
                  const isLatest = index === 0 && sortOrder === 'desc';

                  return (
                    <tr
                      key={record.id}
                      className={`transition duration-150 ${
                        isLatest
                          ? 'bg-emerald-50/70 border-l-4 border-l-emerald-500'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                        {record.stt}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span>{record.formattedTime}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg font-mono font-extrabold text-sm bg-slate-900 text-white tracking-wider shadow-2xs">
                          {record.studentId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 text-xs sm:text-sm">
                        <div>{record.studentName}</div>
                        <div className="text-[11px] font-normal text-slate-500">{record.faculty}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {record.status === 'on_time' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Đúng giờ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Đi trễ
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 max-w-xs hidden lg:table-cell">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editNoteText}
                              onChange={(e) => setEditNoteText(e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-blue-400 rounded-md focus:outline-none"
                              placeholder="Nhập ghi chú..."
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEdit(record.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleStartEdit(record)}
                            className="group flex items-center justify-between cursor-pointer py-0.5 px-1 rounded hover:bg-slate-100"
                            title="Chỉnh sửa ghi chú"
                          >
                            <span className="truncate text-xs">
                              {record.note || <span className="text-slate-400 italic">Thêm ghi chú...</span>}
                            </span>
                            <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 ml-1 shrink-0" />
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onDeleteRecord(record.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa bản ghi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="py-14 sm:py-20 px-4 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <UserCheck className="w-7 h-7 sm:w-8 h-8" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
            Chưa có sinh viên nào điểm danh
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            Đưa mã vạch thẻ trước camera hoặc nhập mã số sinh viên để điểm danh.
          </p>
          <button
            onClick={onAddSampleData}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs active:scale-95 transition"
          >
            Nạp mẫu 5 sinh viên để kiểm tra
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-slate-600 gap-1.5">
        <div className="font-medium">
          Đang hiển thị <strong>{filteredRecords.length}</strong> / <strong>{records.length}</strong> sinh viên
        </div>
        <div className="font-mono text-slate-500">
          File xuất (Excel/PDF): [Số thứ tự] • [Thời gian quét] • [Mã sinh viên]
        </div>
      </div>
    </div>
  );
};
