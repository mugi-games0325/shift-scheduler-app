import React from 'react';

const ShiftCalendar = ({ 
  schedule, 
  currentYear, 
  currentMonth, 
  employees, 
  getDaysInMonth, 
  getDayOfWeek 
}) => {
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  // 従業員名を取得
  const getEmployeeName = (id) => {
    const emp = employees.find(e => e.id === id);
    return emp ? emp.name : '';
  };

  // カレンダー表示用の日付配列作成
  const createCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfWeek = getDayOfWeek(currentYear, currentMonth, 1);
    const days = [];

    // 前月の空白日
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // 当月の日
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const calendarDays = createCalendarDays();

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        {currentYear}年 {monthNames[currentMonth]} シフトカレンダー
      </h2>
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-100">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center font-semibold text-gray-700 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayOfWeek = index % 7;
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            return (
              <div 
                key={index} 
                className={`min-h-24 p-2 border-r border-b last:border-r-0 ${
                  !day ? 'bg-gray-50' : isWeekend ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                {day && (
                  <>
                    <div className={`font-semibold mb-1 ${isWeekend ? 'text-blue-700' : 'text-gray-800'}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {schedule[day]
                        ?.sort((a, b) => a - b)
                        ?.map(empId => (
                          <div key={empId} className="text-xs bg-yellow-200 px-1 py-0.5 rounded">
                            {getEmployeeName(empId)}
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShiftCalendar;