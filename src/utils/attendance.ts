import { AttendanceRecord, AttendanceStatus, AttendanceStats, Student, SessionConfig } from '../types/attendance';

/**
 * Cleans and normalizes scanned barcode data.
 * Trims leading/trailing whitespace, invisible control characters,
 * and extracts meaningful alphanumeric student ID.
 */
export function cleanBarcode(raw: string): string {
  if (!raw) return '';
  // Remove control characters (ASCII 0-31, 127)
  const cleaned = raw.replace(/[\x00-\x1F\x7F]/g, '').trim();
  return cleaned;
}

/**
 * Formats a Date object or ISO string to Vietnamese standard format: HH:mm:ss DD/MM/YYYY
 */
export function formatTimestamp(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const pad = (n: number) => n.toString().padStart(2, '0');
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
}

/**
 * Checks if a scan time is considered "late" based on session config.
 */
export function determineAttendanceStatus(
  scanDate: Date,
  sessionConfig: SessionConfig
): AttendanceStatus {
  if (!sessionConfig.startTime) {
    return 'on_time';
  }

  try {
    const [startH, startM] = sessionConfig.startTime.split(':').map(Number);
    if (isNaN(startH) || isNaN(startM)) return 'on_time';

    const deadlineMinutes = startH * 60 + startM + (sessionConfig.lateThresholdMinutes || 0);
    const scanMinutes = scanDate.getHours() * 60 + scanDate.getMinutes();

    return scanMinutes > deadlineMinutes ? 'late' : 'on_time';
  } catch {
    return 'on_time';
  }
}

/**
 * Processes a scanned student ID.
 * IF duplicate: Does NOT record to system or file, returns isDuplicate = true and existing record info.
 * IF new: Creates a new AttendanceRecord.
 */
export function processScan(
  studentId: string,
  roster: Student[],
  existingRecords: AttendanceRecord[],
  sessionConfig: SessionConfig,
  scanDate: Date = new Date()
): {
  record: AttendanceRecord | null;
  isDuplicate: boolean;
  message: string;
  existingRecord?: AttendanceRecord;
} {
  const cleanedId = cleanBarcode(studentId);
  if (!cleanedId) {
    throw new Error('Mã sinh viên không hợp lệ');
  }

  // Find if already scanned in current session
  const existing = existingRecords.find((r) => r.studentId === cleanedId);
  if (existing) {
    return {
      record: null,
      isDuplicate: true,
      existingRecord: existing,
      message: `Mã sinh viên [${cleanedId}] đã được điểm danh lúc ${existing.formattedTime}!`,
    };
  }

  const status = determineAttendanceStatus(scanDate, sessionConfig);
  const matchedStudent = roster.find((s) => s.id === cleanedId);

  const studentName = matchedStudent ? matchedStudent.name : `Sinh viên ${cleanedId}`;
  const faculty = matchedStudent ? (matchedStudent.faculty || matchedStudent.className || 'Chưa cập nhật') : 'Chưa cập nhật';

  const record: AttendanceRecord = {
    id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    stt: existingRecords.length + 1,
    studentId: cleanedId,
    studentName,
    faculty,
    scannedAt: scanDate.toISOString(),
    formattedTime: formatTimestamp(scanDate),
    status,
    note: '',
  };

  const message = `Điểm danh thành công: [${cleanedId}] ${studentName}`;

  return { record, isDuplicate: false, message };
}

/**
 * Calculates summary metrics for unique attendance records.
 */
export function calculateAttendanceStats(records: AttendanceRecord[]): AttendanceStats {
  let onTimeCount = 0;
  let lateCount = 0;

  for (const record of records) {
    if (record.status === 'late') {
      lateCount++;
    } else {
      onTimeCount++;
    }
  }

  return {
    totalScans: records.length,
    uniqueStudents: records.length,
    onTimeCount,
    lateCount,
    duplicateCount: 0,
  };
}

/**
 * Formats data for Excel file export.
 * Includes exactly the required columns: Số thứ tự, Thời gian quét, Mã sinh viên.
 */
export function formatAttendanceForExport(records: AttendanceRecord[]) {
  return records.map((r, index) => {
    return {
      'Số thứ tự': index + 1,
      'Thời gian quét': r.formattedTime,
      'Mã sinh viên': r.studentId,
    };
  });
}
