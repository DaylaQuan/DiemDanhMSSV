import * as XLSX from 'xlsx';
import { AttendanceRecord, SessionConfig } from '../types/attendance';
import { formatAttendanceForExport } from './attendance';

export function exportAttendanceToExcel(
  records: AttendanceRecord[],
  sessionConfig: SessionConfig
) {
  if (records.length === 0) {
    alert('Không có dữ liệu điểm danh để xuất file Excel!');
    return;
  }

  // Format records to only the required columns: Số thứ tự, Thời gian quét, Mã sinh viên
  const dataRows = formatAttendanceForExport(records);

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();

  // Session information header
  const headerInfo = [
    [sessionConfig.organization || 'TRƯỜNG ĐẠI HỌC KHOA HỌC TỰ NHIÊN - ĐHQG TP.HCM'],
    ['DANH SÁCH ĐIỂM DANH SINH VIÊN'],
    [''],
    ['Buổi học / Hoạt động:', sessionConfig.sessionTitle, 'Ngày:', sessionConfig.date],
    ['Phòng học / Địa điểm:', sessionConfig.room, 'Người phụ trách:', sessionConfig.lecturer],
    ['Thời gian xuất file:', new Date().toLocaleString('vi-VN'), 'Tổng số lượt quét:', records.length],
    [''], // blank row
  ];

  const ws = XLSX.utils.aoa_to_sheet(headerInfo);

  // Append data table starting at row 8 (A8) with exact columns: Số thứ tự, Thời gian quét, Mã sinh viên
  XLSX.utils.sheet_add_json(ws, dataRows, {
    origin: 'A8',
    skipHeader: false,
  });

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // Số thứ tự
    { wch: 25 }, // Thời gian quét
    { wch: 20 }, // Mã sinh viên
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'DiemDanh');

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const fileName = `DiemDanh_SinhVien_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
