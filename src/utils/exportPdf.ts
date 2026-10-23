import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord, SessionConfig } from '../types/attendance';
import { removeVietnameseTones } from './exportPdfHelper';

export function exportAttendanceToPdf(
  records: AttendanceRecord[],
  sessionConfig: SessionConfig
) {
  if (records.length === 0) {
    alert('Không có dữ liệu điểm danh để xuất file PDF!');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const exportTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} ngay ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

  // Organization header
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const orgText = removeVietnameseTones(sessionConfig.organization || 'TRUONG DAI HOC KHOA HOC TU NHIEN - DHQG-HCM');
  doc.text(orgText.toUpperCase(), 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('HE THONG DIEM DANH MA VACH (STUDENT ID BARCODE ATTENDANCE)', 14, 20);

  // Divider
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.6);
  doc.line(14, 23, 196, 23);

  // Title
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DANH SACH DIEM DANH SINH VIEN', 105, 33, { align: 'center' });

  // Session metadata
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text(`Buoi hoc / Hoat dong: ${removeVietnameseTones(sessionConfig.sessionTitle)}`, 14, 42);
  doc.text(`Phong hoc / Dia diem: ${removeVietnameseTones(sessionConfig.room)}`, 14, 48);
  doc.text(`Nguoi phu trach: ${removeVietnameseTones(sessionConfig.lecturer)}`, 14, 54);

  doc.text(`Ngay: ${sessionConfig.date}`, 120, 42);
  doc.text(`Thoi diem xuat: ${exportTime}`, 120, 48);
  doc.text(`Tong luot diem danh: ${records.length}`, 120, 54);

  // Required Columns: Số thứ tự, Thời gian quét, Mã sinh viên
  const tableData = records.map((r, index) => [
    (index + 1).toString(),
    r.formattedTime,
    r.studentId,
  ]);

  autoTable(doc, {
    startY: 60,
    head: [['So thu tu', 'Thoi gian quet', 'Ma sinh vien']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [30, 41, 59],
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { cellWidth: 35, halign: 'center' }, // Số thứ tự
      1: { cellWidth: 75, halign: 'center' }, // Thời gian quét
      2: { cellWidth: 72, halign: 'center', fontStyle: 'bold' }, // Mã sinh viên
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Trang ${data.pageNumber} / ${pageCount}`,
        105,
        290,
        { align: 'center' }
      );
    },
  });

  const nowStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  doc.save(`DiemDanh_SinhVien_${nowStr}.pdf`);
}
