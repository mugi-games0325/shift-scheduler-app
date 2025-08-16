import React from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';

const EmployeeForm = ({ 
  employees, 
  setEmployees, 
  currentYear, 
  currentMonth, 
  getDaysInMonth, 
  getDayOfWeek,
  isWeekendOrHoliday
}) => {
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  // 従業員追加
  const addEmployee = () => {
    setEmployees([...employees, {
      id: Date.now(),
      name: '',
      unavailableDays: [],
      requiredDays: 0
    }]);
  };

  // 従業員削除
  const removeEmployee = (id) => {
    setEmployees(employees.filter(emp => emp.id !== id));
  };

  // 従業員情報更新
  const updateEmployee = (id, field, value) => {
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, [field]: value } : emp
    ));
  };

  // 働けない日の追加/削除
  const toggleUnavailableDay = (employeeId, day) => {
    setEmployees(employees.map(emp => {
      if (emp.id === employeeId) {
        const unavailableDays = emp.unavailableDays.includes(day)
          ? emp.unavailableDays.filter(d => d !== day)
          : [...emp.unavailableDays, day];
        return { ...emp, unavailableDays };
      }
      return emp;
    }));
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users size={20} />
          従業員情報
        </h2>
        <button
          onClick={addEmployee}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={16} />
          従業員追加
        </button>
      </div>

      <div className="space-y-4">
        {employees.map((employee, index) => (
          <div key={employee.id} className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center gap-4 mb-3">
              <input
                type="text"
                placeholder={`従業員${index + 1}の名前`}
                value={employee.name}
                onChange={(e) => updateEmployee(employee.id, 'name', e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <input
                type="number"
                placeholder="必要勤務日数"
                value={employee.requiredDays}
                onChange={(e) => updateEmployee(employee.id, 'requiredDays', parseInt(e.target.value) || 0)}
                className="w-32 px-3 py-2 border rounded-md"
                min="0"
              />
              <button
                onClick={() => removeEmployee(employee.id)}
                className="p-2 text-red-600 hover:bg-red-100 rounded-md"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">働けない日:</p>
              <div className="space-y-1">
                {/* 曜日ヘッダー */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(day => (
                    <div key={day} className="text-xs text-center font-semibold text-gray-600 py-1">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* 日付グリッド（7日ごとに改行） */}
                {(() => {
                  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
                  const firstDayOfWeek = getDayOfWeek(currentYear, currentMonth, 1);
                  const weeks = [];
                  let currentWeek = [];
                  
                  // 最初の週の空白日を追加
                  for (let i = 0; i < firstDayOfWeek; i++) {
                    currentWeek.push(null);
                  }
                  
                  // 日付を追加
                  for (let day = 1; day <= daysInMonth; day++) {
                    currentWeek.push(day);
                    
                    // 週が完成したら次の週へ
                    if (currentWeek.length === 7) {
                      weeks.push(currentWeek);
                      currentWeek = [];
                    }
                  }
                  
                  // 最後の週が未完成の場合は追加
                  if (currentWeek.length > 0) {
                    weeks.push(currentWeek);
                  }
                  
                  return weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-1">
                      {week.map((day, dayIndex) => {
                        const dayOfWeek = dayIndex;
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        
                        return (
                          <div key={dayIndex} className="aspect-square">
                            {day ? (
                              <button
                                onClick={() => toggleUnavailableDay(employee.id, day)}
                                className={`w-full h-full text-xs rounded border transition-colors ${
                                  employee.unavailableDays.includes(day)
                                    ? 'bg-red-500 text-white border-red-500'
                                    : isWeekend
                                    ? 'bg-blue-50 hover:bg-blue-100 border-blue-200'
                                    : 'bg-white hover:bg-gray-100 border-gray-300'
                                }`}
                              >
                                {day}
                              </button>
                            ) : (
                              <div className="w-full h-full"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeForm;