import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanBarcode,
  formatTimestamp,
  determineAttendanceStatus,
  processScan,
  calculateAttendanceStats,
  formatAttendanceForExport,
} from './attendance';
import { SessionConfig, Student, AttendanceRecord } from '../types/attendance';

test('cleanBarcode trims whitespace and non-printable control characters', () => {
  assert.equal(cleanBarcode('  25130245 \r\n'), '25130245');
  assert.equal(cleanBarcode('\x0225130245\x03'), '25130245');
  assert.equal(cleanBarcode(''), '');
});

test('formatTimestamp produces Vietnamese format HH:mm:ss DD/MM/YYYY', () => {
  const date = new Date(2026, 9, 23, 14, 30, 45); // Oct 23, 2026 14:30:45
  const formatted = formatTimestamp(date);
  assert.equal(formatted, '14:30:45 23/10/2026');
});

test('determineAttendanceStatus distinguishes on_time and late', () => {
  const sessionConfig: SessionConfig = {
    sessionTitle: 'Lớp Vật Lý',
    room: 'B302',
    lecturer: 'Người quản lý',
    startTime: '08:00',
    lateThresholdMinutes: 15,
    organization: 'HCMUS',
    date: '2026-10-23',
  };

  // 08:10 is on time (deadline is 08:15)
  const onTimeDate = new Date(2026, 9, 23, 8, 10, 0);
  assert.equal(determineAttendanceStatus(onTimeDate, sessionConfig), 'on_time');

  // 08:20 is late
  const lateDate = new Date(2026, 9, 23, 8, 20, 0);
  assert.equal(determineAttendanceStatus(lateDate, sessionConfig), 'late');
});

test('processScan creates record for new student and rejects duplicate without recording', () => {
  const roster: Student[] = [
    {
      id: '25130245',
      name: 'Lê Quang Anh Quân',
      faculty: 'Vật lý & Vật lý Kỹ thuật',
    },
  ];

  const sessionConfig: SessionConfig = {
    sessionTitle: 'Lớp Vật Lý',
    room: 'B302',
    lecturer: 'Người quản lý',
    startTime: '08:00',
    lateThresholdMinutes: 15,
    organization: 'HCMUS',
    date: '2026-10-23',
  };

  const existingRecords: AttendanceRecord[] = [];

  // First scan: successful and creates record
  const result1 = processScan('25130245', roster, existingRecords, sessionConfig);
  assert.equal(result1.isDuplicate, false);
  assert.notEqual(result1.record, null);
  assert.equal(result1.record?.studentName, 'Lê Quang Anh Quân');
  assert.equal(result1.record?.stt, 1);

  // Add to existingRecords list
  existingRecords.push(result1.record!);

  // Second scan with same student ID: flagged duplicate, record is NULL (not recorded!)
  const result2 = processScan('25130245', roster, existingRecords, sessionConfig);
  assert.equal(result2.isDuplicate, true);
  assert.equal(result2.record, null); // NOT RECORDED
  assert.match(result2.message, /đã được điểm danh/);
  // Records list remains length 1
  assert.equal(existingRecords.length, 1);
});

test('calculateAttendanceStats computes accurate counts without duplicate bloat', () => {
  const records: AttendanceRecord[] = [
    {
      id: '1',
      stt: 1,
      studentId: '25130245',
      studentName: 'Lê Quang Anh Quân',
      faculty: 'Vật lý',
      scannedAt: new Date().toISOString(),
      formattedTime: '08:05:00 23/10/2026',
      status: 'on_time',
    },
    {
      id: '2',
      stt: 2,
      studentId: '25130246',
      studentName: 'Nguyễn Văn A',
      faculty: 'CNTT',
      scannedAt: new Date().toISOString(),
      formattedTime: '08:25:00 23/10/2026',
      status: 'late',
    },
  ];

  const stats = calculateAttendanceStats(records);
  assert.equal(stats.totalScans, 2);
  assert.equal(stats.uniqueStudents, 2);
  assert.equal(stats.onTimeCount, 1);
  assert.equal(stats.lateCount, 1);
});

test('formatAttendanceForExport generates exactly required 3 columns', () => {
  const records: AttendanceRecord[] = [
    {
      id: '1',
      stt: 1,
      studentId: '25130245',
      studentName: 'Lê Quang Anh Quân',
      faculty: 'Khoa Vật lý',
      scannedAt: new Date().toISOString(),
      formattedTime: '08:05:00 23/10/2026',
      status: 'on_time',
      note: 'Mang đầy đủ thẻ',
    },
  ];

  const exportRows = formatAttendanceForExport(records);
  assert.equal(exportRows.length, 1);
  assert.equal(exportRows[0]['Số thứ tự'], 1);
  assert.equal(exportRows[0]['Thời gian quét'], '08:05:00 23/10/2026');
  assert.equal(exportRows[0]['Mã sinh viên'], '25130245');
});
