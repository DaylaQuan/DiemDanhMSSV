import React from 'react';
import { Users, CheckCircle, Clock } from 'lucide-react';
import { AttendanceStats } from '../types/attendance';

interface StatsCardsProps {
  stats: AttendanceStats;
  totalRosterCount: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, totalRosterCount }) => {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {/* Total Present Students */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Users className="w-4 h-4 sm:w-5 h-5" />
        </div>
        <div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
            Đã điểm danh
          </div>
          <div className="text-base sm:text-2xl font-black text-slate-900 mt-0.5 flex items-baseline gap-1">
            <span>{stats.uniqueStudents}</span>
            <span className="text-[10px] sm:text-xs font-normal text-slate-400">/ {totalRosterCount || stats.uniqueStudents}</span>
          </div>
        </div>
      </div>

      {/* On Time */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <CheckCircle className="w-4 h-4 sm:w-5 h-5" />
        </div>
        <div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
            Đúng giờ
          </div>
          <div className="text-base sm:text-2xl font-black text-emerald-600 mt-0.5">
            {stats.onTimeCount}
          </div>
        </div>
      </div>

      {/* Late */}
      <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4 sm:w-5 h-5" />
        </div>
        <div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
            Đi trễ
          </div>
          <div className="text-base sm:text-2xl font-black text-amber-600 mt-0.5">
            {stats.lateCount}
          </div>
        </div>
      </div>
    </div>
  );
};
