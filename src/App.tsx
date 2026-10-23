/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Settings,
  Users,
  Printer,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Download,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

import { AttendanceRecord, SessionConfig, Student } from './types/attendance';
import { DEFAULT_ROSTER } from './data/defaultRoster';
import {
  processScan,
  calculateAttendanceStats,
} from './utils/attendance';
import { playSuccessSound, playWarningSound } from './utils/sound';
import { exportAttendanceToExcel } from './utils/exportExcel';
import { exportAttendanceToPdf } from './utils/exportPdf';

import { CameraScanner } from './components/CameraScanner';
import { StatsCards } from './components/StatsCards';
import { AttendanceTable } from './components/AttendanceTable';
import { SessionConfigModal } from './components/SessionConfigModal';
import { RosterModal } from './components/RosterModal';
import { PrintReportModal } from './components/PrintReportModal';
import { ExportModal } from './components/ExportModal';

const STORAGE_KEY_RECORDS = 'hcmus_barcode_attendance_records_v3';
const STORAGE_KEY_CONFIG = 'hcmus_barcode_attendance_config_v3';
const STORAGE_KEY_ROSTER = 'hcmus_barcode_attendance_roster_v3';

export default function App() {
  const [sessionConfig, setSessionConfig] = useState<SessionConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) return JSON.parse(saved);
    } catch {}
    const today = new Date().toISOString().split('T')[0];
    return {
      sessionTitle: 'Lớp Học Phần Điểm Danh Sinh Viên',
      room: 'Phòng B.302',
      lecturer: 'Người Quản Lý Điểm Danh',
      startTime: '08:00',
      lateThresholdMinutes: 15,
      organization: 'HỆ THỐNG ĐIỂM DANH SINH VIÊN',
      date: today,
    };
  });

  const [roster, setRoster] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROSTER);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ROSTER;
  });

  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [isScanningActive, setIsScanningActive] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
    studentId?: string;
  } | null>(null);

  // Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Last scanned student details for HUD
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const [lastScannedTime, setLastScannedTime] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(sessionConfig));
  }, [sessionConfig]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROSTER, JSON.stringify(roster));
  }, [roster]);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 3800);
    return () => clearTimeout(timer);
  }, [notification]);

  // Handle barcode scan with strict duplicate rejection
  const handleScanSuccess = useCallback(
    (studentId: string) => {
      try {
        const now = new Date();
        const result = processScan(
          studentId,
          roster,
          records,
          sessionConfig,
          now
        );

        // WHEN DUPLICATE: Notify user only, DO NOT record to system or file
        if (result.isDuplicate) {
          if (soundEnabled) playWarningSound();
          setNotification({
            type: 'warning',
            message: `⚠️ Mã sinh viên [${studentId}] đã được điểm danh rồi (lúc ${result.existingRecord?.formattedTime})!`,
            studentId,
          });
          return; // Stop here! Not recorded.
        }

        // WHEN NEW: Record attendance
        if (result.record) {
          if (soundEnabled) playSuccessSound();

          setLastScannedId(result.record.studentId);
          setLastScannedTime(result.record.formattedTime);

          // Prepend so manager sees it on top
          setRecords((prev) => [result.record!, ...prev]);

          try {
            confetti({
              particleCount: 30,
              spread: 45,
              origin: { y: 0.8 },
              colors: ['#2563eb', '#10b981', '#f59e0b'],
            });
          } catch {}

          setNotification({
            type: 'success',
            message: `✅ Đã điểm danh: [${result.record.studentId}] lúc ${result.record.formattedTime}`,
            studentId: result.record.studentId,
          });
        }
      } catch (err: unknown) {
        setNotification({
          type: 'warning',
          message: (err as Error).message || 'Mã sinh viên không hợp lệ',
        });
      }
    },
    [records, roster, sessionConfig, soundEnabled]
  );

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateNote = (id: string, note: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, note } : r))
    );
  };

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ danh sách điểm danh này không?')) {
      setRecords([]);
      setLastScannedId(null);
      setLastScannedTime(null);
      setNotification({
        type: 'info',
        message: 'Đã xóa toàn bộ danh sách điểm danh.',
      });
    }
  };

  const handleAddSampleData = () => {
    const sampleIds = ['25130245', '25130246', '25130247', '25130248', '25130249'];
    const baseTime = new Date();
    baseTime.setMinutes(baseTime.getMinutes() - 15);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const newBatch: AttendanceRecord[] = sampleIds.map((id, idx) => {
      const scanDate = new Date(baseTime.getTime() + idx * 3 * 60 * 1000);
      const matched = roster.find((s) => s.id === id);
      const timeStr = `${pad(scanDate.getHours())}:${pad(scanDate.getMinutes())}:${pad(scanDate.getSeconds())} ${pad(scanDate.getDate())}/${pad(scanDate.getMonth() + 1)}/${scanDate.getFullYear()}`;

      return {
        id: `sample_${Date.now()}_${idx}`,
        stt: idx + 1,
        studentId: id,
        studentName: matched ? matched.name : `Sinh viên ${id}`,
        faculty: matched?.faculty || 'Khoa Tự nhiên',
        scannedAt: scanDate.toISOString(),
        formattedTime: timeStr,
        status: idx > 3 ? 'late' : 'on_time',
        note: '',
      };
    });

    setRecords(newBatch);
    setNotification({
      type: 'info',
      message: 'Đã nạp 5 sinh viên mẫu vào danh sách.',
    });
  };

  const handleAddStudentToRoster = (student: Student) => {
    setRoster((prev) => {
      const exists = prev.some((s) => s.id === student.id);
      return exists ? prev.map((s) => (s.id === student.id ? student : s)) : [...prev, student];
    });
  };

  const handleDeleteStudentFromRoster = (id: string) => {
    setRoster((prev) => prev.filter((s) => s.id !== id));
  };

  const stats = calculateAttendanceStats(records);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans pb-16 sm:pb-0">
      {/* Top Header - Mobile friendly */}
      <header className="no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Logo & School Header */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <QrCode className="w-4 h-4 sm:w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
                  Điểm Danh Thẻ Sinh Viên
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <ShieldCheck className="w-3 h-3" />
                  Mã Vạch
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-md">
                {sessionConfig.room} • {sessionConfig.organization}
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`min-h-[36px] min-w-[36px] p-2 rounded-xl border text-xs font-medium transition active:scale-95 flex items-center justify-center ${
                soundEnabled
                  ? 'bg-slate-50 text-slate-700 border-slate-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}
              title={soundEnabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Quick Export on Header */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              disabled={records.length === 0}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition active:scale-95"
              title="Xuất danh sách (Excel hoặc PDF)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất file</span>
            </button>

            <button
              onClick={() => setIsRosterModalOpen(true)}
              className="min-h-[36px] p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1 transition active:scale-95"
              title="Danh sách sinh viên"
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">SV ({roster.length})</span>
            </button>

            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="min-h-[36px] min-w-[36px] p-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold shadow-2xs flex items-center justify-center active:scale-95 transition"
              title="Cài đặt buổi học"
            >
              <Settings className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 space-y-3.5 sm:space-y-6 flex-1">
        {/* Mobile Toast Alert Banner */}
        {notification && (
          <div
            className={`no-print p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-lg border flex items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150 ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : notification.type === 'warning'
                ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-400/30'
                : 'bg-blue-50 text-blue-900 border-blue-300'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-bold truncate">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100 p-1 shrink-0"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Manager Real-time Stats Chips */}
        <StatsCards stats={stats} totalRosterCount={roster.length} />

        {/* Main Grid: Scanner on Mobile Top, Attendance List below */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-6 items-start">
          {/* Scanner Viewport (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5">
            <CameraScanner
              onScanSuccess={handleScanSuccess}
              lastScannedId={lastScannedId}
              lastScannedTime={lastScannedTime}
              isScanningActive={isScanningActive}
              setIsScanningActive={setIsScanningActive}
            />

            {/* Quick Session Details Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-800 text-xs sm:text-sm">Phiên Điểm Danh Hiện Tại</span>
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="text-blue-600 hover:text-blue-700 font-bold text-xs"
                >
                  Thay đổi
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] sm:text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Buổi học</span>
                  <span className="font-bold text-slate-900 truncate block">{sessionConfig.sessionTitle}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Phòng / Giờ</span>
                  <span className="font-bold text-slate-900 block truncate">{sessionConfig.room} • {sessionConfig.startTime}</span>
                </div>
              </div>

              {lastScannedId && (
                <div className="p-2 sm:p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Vừa quét gần nhất</span>
                    <span className="font-mono font-extrabold text-slate-900 text-xs sm:text-sm">{lastScannedId}</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 shrink-0">{lastScannedTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Attendance Table & Mobile Cards (7 cols) */}
          <div className="lg:col-span-7">
            <AttendanceTable
              records={records}
              sessionConfig={sessionConfig}
              onDeleteRecord={handleDeleteRecord}
              onUpdateNote={handleUpdateNote}
              onClearAll={handleClearAll}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onExportExcel={() => exportAttendanceToExcel(records, sessionConfig)}
              onExportPdf={() => exportAttendanceToPdf(records, sessionConfig)}
              onAddSampleData={handleAddSampleData}
            />
          </div>
        </div>
      </main>

      {/* Floating Bottom Bar for Mobile (Always accessible export) */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2.5 z-30 shadow-lg flex items-center justify-between gap-2">
        <button
          onClick={() => setIsExportModalOpen(true)}
          disabled={records.length === 0}
          className="flex-1 min-h-[42px] bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Xuất File ({records.length})</span>
        </button>

        <button
          onClick={() => exportAttendanceToExcel(records, sessionConfig)}
          disabled={records.length === 0}
          className="min-h-[42px] px-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-sm active:scale-95"
          title="Tải Excel (.xlsx)"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Excel</span>
        </button>

        <button
          onClick={() => exportAttendanceToPdf(records, sessionConfig)}
          disabled={records.length === 0}
          className="min-h-[42px] px-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-sm active:scale-95"
          title="Tải PDF (.pdf)"
        >
          <FileText className="w-4 h-4" />
          <span>PDF</span>
        </button>
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        records={records}
        sessionConfig={sessionConfig}
        onExportExcel={() => exportAttendanceToExcel(records, sessionConfig)}
        onExportPdf={() => exportAttendanceToPdf(records, sessionConfig)}
      />

      <SessionConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={sessionConfig}
        onSave={(newCfg) => setSessionConfig(newCfg)}
      />

      <RosterModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        roster={roster}
        onAddStudent={handleAddStudentToRoster}
        onDeleteStudent={handleDeleteStudentFromRoster}
      />

      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        records={records}
        sessionConfig={sessionConfig}
        onExportExcel={() => exportAttendanceToExcel(records, sessionConfig)}
        onExportPdf={() => exportAttendanceToPdf(records, sessionConfig)}
      />
    </div>
  );
}
