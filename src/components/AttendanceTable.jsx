import React from 'react';

const AttendanceTable = ({ 
  schedule, 
  employees, 
  currentYear, 
  currentMonth, 
  getDaysInMonth, 
  getDayOfWeek,
  isWeekendOrHoliday
}) => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">メンバー別勤怠表</h2>
      <div className="overflow-x-auto bg-white border rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left border-r">名前</th>
              {Array.from({ length: getDaysInMonth(currentYear, currentMonth) }, (_, i) => i + 1).map(day => {
                const dayOfWeek = getDayOfWeek(currentYear, currentMonth, day);
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isHoliday = isWeekendOrHoliday(currentYear, currentMonth, day);
                const isRestDay = isWeekend || isHoliday;
                return (
                  <th key={day} className={`p-2 text-center border-r text-xs ${isRestDay ? 'bg-purple-50' : ''}`}>
                    {day}
                  </th>
                );
              })}
              <th className="p-3 text-center">合計</th>
            </tr>
          </thead>
          <tbody>
            {employees.filter(emp => emp.name.trim() !== '').map(employee => {
              const totalDays = Object.values(schedule).filter(daySchedule => 
                daySchedule.includes(employee.id)
              ).length;
              
              return (
                <tr key={employee.id} className="border-b">
                  <td className="p-3 font-medium border-r">{employee.name}</td>
                  {Array.from({ length: getDaysInMonth(currentYear, currentMonth) }, (_, i) => i + 1).map(day => {
                    const dayOfWeek = getDayOfWeek(currentYear, currentMonth, day);
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const isHoliday = isWeekendOrHoliday(currentYear, currentMonth, day);
                    const isRestDay = isWeekend || isHoliday;
                    const isWorking = schedule[day]?.includes(employee.id);
                    const isUnavailable = employee.unavailableDays.includes(day);
                    
                    return (
                      <td key={day} className={`p-2 text-center border-r text-xs ${isRestDay ? 'bg-purple-50' : ''}`}>
                        {isUnavailable ? (
                          <span className="text-red-500">✕</span>
                        ) : isWorking ? (
                          <span className="text-green-600 font-bold">○</span>
                        ) : (
                          ''
                        )}
                      </td>
                    );
                  })}
                  <td className="p-3 text-center font-semibold">
                    {totalDays} / {employee.requiredDays}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;