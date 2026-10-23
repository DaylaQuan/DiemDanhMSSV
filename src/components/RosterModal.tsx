import React, { useState } from 'react';
import { X, Users, UserPlus, Search, Trash2, IdCard, CheckCircle } from 'lucide-react';
import { Student } from '../types/attendance';

interface RosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  roster: Student[];
  onAddStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
}

export const RosterModal: React.FC<RosterModalProps> = ({
  isOpen,
  onClose,
  roster,
  onAddStudent,
  onDeleteStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newFaculty, setNewFaculty] = useState('');
  const [newClass, setNewClass] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const filtered = roster.filter(
    (s) =>
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.faculty && s.faculty.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim()) return;

    onAddStudent({
      id: newId.trim(),
      name: newName.trim(),
      faculty: newFaculty.trim() || 'Khoa Tự nhiên',
      className: newClass.trim() || 'K2025',
    });

    setNewId('');
    setNewName('');
    setNewFaculty('');
    setNewClass('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm sm:text-base">Danh Sách Sinh Viên Đã Đăng Ký (Roster)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo MSSV, tên, khoa..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm sinh viên</span>
          </button>
        </div>

        {/* Add Student Subform */}
        {showAddForm && (
          <form onSubmit={handleAddSubmit} className="p-4 bg-blue-50/60 border-b border-blue-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">MSSV *</label>
              <input
                type="text"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="25130245"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Họ và tên *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Khoa</label>
              <input
                type="text"
                value={newFaculty}
                onChange={(e) => setNewFaculty(e.target.value)}
                placeholder="Vật lý & VLKT"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div className="flex items-end gap-1">
              <button
                type="submit"
                className="w-full py-1.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Lưu
              </button>
            </div>
          </form>
        )}

        {/* Student List */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
          {filtered.map((student) => (
            <div key={student.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  {student.name.split(' ').pop()?.substring(0, 2) || 'SV'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{student.name}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-800">
                      {student.id}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {student.faculty || 'Khoa Tự nhiên'} {student.className ? `• Lớp ${student.className}` : ''}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDeleteStudent(student.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                title="Xóa khỏi danh sách"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-right">
          Tổng cộng: <strong>{roster.length}</strong> sinh viên trong hệ thống
        </div>
      </div>
    </div>
  );
};
