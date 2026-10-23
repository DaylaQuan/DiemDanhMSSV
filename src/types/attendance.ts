export type AttendanceStatus = 'on_time' | 'late' | 'duplicate';

export interface Student {
  id: string; // Student ID e.g. "25130245"
  name: string; // Full name e.g. "Lê Quang Anh Quân"
  faculty?: string; // e.g. "Vật lý & Vật lý Kỹ thuật"
  className?: string; // e.g. "25VLKT"
  email?: string;
  avatarUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  stt: number;
  studentId: string;
  studentName: string;
  faculty: string;
  scannedAt: string; // ISO string
  formattedTime: string; // "14:30:15 23/10/2026"
  status: AttendanceStatus;
  note?: string;
}

export interface SessionConfig {
  sessionTitle: string; // e.g. "Điểm danh Lớp Vật Lý Đại Cương"
  room: string; // e.g. "Phòng B302"
  lecturer: string; // e.g. "Lê Quang Anh Quân"
  startTime: string; // "08:00"
  lateThresholdMinutes: number; // e.g. 15
  organization: string; // e.g. "Trường ĐH Khoa học Tự nhiên - ĐHQG-HCM"
  date: string; // YYYY-MM-DD
}

export interface AttendanceStats {
  totalScans: number;
  uniqueStudents: number;
  onTimeCount: number;
  lateCount: number;
  duplicateCount: number;
}
