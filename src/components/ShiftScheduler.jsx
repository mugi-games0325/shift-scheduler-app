import React, { useState, useCallback } from 'react';
import { Calendar, Settings } from 'lucide-react';
import EmployeeForm from './EmployeeForm';
import ShiftCalendar from './ShiftCalendar';
import AttendanceTable from './AttendanceTable';
import FileUpload from './FileUpload';

const ShiftScheduler = () => {
  // 初期データは空に変更
  const [employees, setEmployees] = useState([
    { id: 1, name: '', unavailableDays: [], requiredDays: 0 }
  ]);
  const [currentMonth, setCurrentMonth] = useState(7); // 8月 (0-indexed)
  const [currentYear, setCurrentYear] = useState(2025);
  const [schedule, setSchedule] = useState({});
  const [isScheduleGenerated, setIsScheduleGenerated] = useState(false);

  // テストデータ（後方互換用）
  const testData = [
    { id: 1, name: 'test1', unavailableDays: [], requiredDays: 19 },
    { id: 2, name: 'テスト1', unavailableDays: [1, 3, 5, 11, 17], requiredDays: 22 }
  ];

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  // 月の日数を取得
  const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

  // 曜日を取得（0=日曜日）
  const getDayOfWeek = (year, month, day) => new Date(year, month, day).getDay();

  // シフト自動生成（改良版）
  const generateSchedule = useCallback(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const newSchedule = {};

    // 各日を初期化
    for (let day = 1; day <= daysInMonth; day++) {
      newSchedule[day] = [];
    }

    // 有効な従業員のみフィルタ
    const validEmployees = employees.filter(emp => emp.name.trim() !== '');

    if (validEmployees.length === 0) {
      alert('従業員を追加してください');
      return;
    }

    // 各従業員の勤務日数カウンタ
    const workDaysCount = {};
    validEmployees.forEach(emp => {
      workDaysCount[emp.id] = 0;
    });

    // 連続勤務日数を追跡
    const consecutiveDays = {};
    validEmployees.forEach(emp => {
      consecutiveDays[emp.id] = 0;
    });

    // フェーズ1: 基本的なシフト割り当て（必要人数確保）
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = getDayOfWeek(currentYear, currentMonth, day);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const minRequiredStaff = isWeekend ? 2 : 4;
      const maxStaff = isWeekend ? 3 : Infinity;

      // 利用可能な従業員をフィルタ
      let availableEmployees = validEmployees.filter(emp => {
        if (emp.unavailableDays.includes(day)) return false;
        if (consecutiveDays[emp.id] >= 7) return false;
        return true;
      });

      // 必要勤務日数の達成度が低い順にソート
      availableEmployees.sort((a, b) => {
        const aProgress = workDaysCount[a.id] / Math.max(a.requiredDays, 1);
        const bProgress = workDaysCount[b.id] / Math.max(b.requiredDays, 1);
        return aProgress - bProgress;
      });

      // 最低必要人数を確保
      let assignedCount = 0;
      for (const emp of availableEmployees) {
        if (assignedCount >= Math.min(minRequiredStaff, maxStaff)) break;

        newSchedule[day].push(emp.id);
        workDaysCount[emp.id]++;
        assignedCount++;
      }

      // 平日で人数に余裕がある場合、追加でアサイン
      if (!isWeekend && assignedCount < availableEmployees.length) {
        const remainingEmployees = availableEmployees.slice(assignedCount);

        // まだ勤務日数が足りない従業員を優先
        const needMoreWork = remainingEmployees.filter(emp =>
          workDaysCount[emp.id] < emp.requiredDays
        );

        // 必要勤務日数の達成度が低い順にソート
        needMoreWork.sort((a, b) => {
          const aProgress = workDaysCount[a.id] / Math.max(a.requiredDays, 1);
          const bProgress = workDaysCount[b.id] / Math.max(b.requiredDays, 1);
          return aProgress - bProgress;
        });

        // 平日は最大6人まで追加可能
        const maxAdditional = Math.min(needMoreWork.length, 6 - assignedCount);
        for (let i = 0; i < maxAdditional; i++) {
          const emp = needMoreWork[i];
          if (!newSchedule[day].includes(emp.id)) {
            newSchedule[day].push(emp.id);
            workDaysCount[emp.id]++;
          }
        }
      }

      // 連続勤務日数を更新
      validEmployees.forEach(emp => {
        if (newSchedule[day].includes(emp.id)) {
          consecutiveDays[emp.id]++;
        } else {
          consecutiveDays[emp.id] = 0;
        }
      });
    }

    // フェーズ2: 必要勤務日数の調整
    validEmployees.forEach(emp => {
      let currentWorkDays = workDaysCount[emp.id];
      const targetDays = emp.requiredDays;

      // 勤務日数が足りない場合の追加処理
      while (currentWorkDays < targetDays) {
        let bestDay = null;
        let minCurrentStaff = Infinity;

        // 追加可能な日を探す
        for (let day = 1; day <= daysInMonth; day++) {
          // すでに働いている日はスキップ
          if (newSchedule[day].includes(emp.id)) continue;

          // 働けない日はスキップ
          if (emp.unavailableDays.includes(day)) continue;

          // 連続勤務制限チェック
          let consecutive = 0;
          let canWork = true;

          // 前後の日をチェックして連続勤務日数を計算
          for (let checkDay = day - 6; checkDay <= day + 6; checkDay++) {
            if (checkDay < 1 || checkDay > daysInMonth) continue;
            if (checkDay === day) {
              consecutive++;
              if (consecutive > 7) {
                canWork = false;
                break;
              }
            } else if (newSchedule[checkDay] && newSchedule[checkDay].includes(emp.id)) {
              consecutive++;
              if (consecutive > 7) {
                canWork = false;
                break;
              }
            } else {
              consecutive = 0;
            }
          }

          if (!canWork) continue;

          const dayOfWeek = getDayOfWeek(currentYear, currentMonth, day);
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const currentStaff = newSchedule[day].length;
          const maxAllowed = isWeekend ? 3 : Infinity;

          // 土日は最大3人、平日は制限なし
          if (currentStaff < maxAllowed) {
            // より人数の少ない日を優先
            if (currentStaff < minCurrentStaff) {
              minCurrentStaff = currentStaff;
              bestDay = day;
            }
          }
        }

        if (bestDay !== null) {
          newSchedule[bestDay].push(emp.id);
          currentWorkDays++;
        } else {
          // 追加できる日が見つからない場合は終了
          console.warn(`${emp.name}の必要勤務日数を満たせませんでした。現在: ${currentWorkDays}日 / 必要: ${targetDays}日`);
          break;
        }
      }

      // 勤務日数が多すぎる場合の削減処理
      while (currentWorkDays > targetDays) {
        let bestDay = null;
        let maxCurrentStaff = -1;

        // 削除可能な日を探す
        for (let day = 1; day <= daysInMonth; day++) {
          if (!newSchedule[day].includes(emp.id)) continue;

          const dayOfWeek = getDayOfWeek(currentYear, currentMonth, day);
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const minRequired = isWeekend ? 2 : 4;
          const currentStaff = newSchedule[day].length;

          // 最低必要人数を下回らない場合のみ削除可能
          if (currentStaff > minRequired) {
            // より人数の多い日を優先して削除
            if (currentStaff > maxCurrentStaff) {
              maxCurrentStaff = currentStaff;
              bestDay = day;
            }
          }
        }

        if (bestDay !== null) {
          newSchedule[bestDay] = newSchedule[bestDay].filter(id => id !== emp.id);
          currentWorkDays--;
        } else {
          break;
        }
      }
    });

    setSchedule(newSchedule);
    setIsScheduleGenerated(true);
  }, [employees, currentMonth, currentYear]);

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="text-blue-600" size={28} />
          <h1 className="text-2xl font-bold text-gray-800">シフト表自動作成アプリ</h1>
        </div>

        {/* データ管理エリア */}
        <FileUpload
          employees={employees}
          setEmployees={setEmployees}
          setCurrentMonth={setCurrentMonth}
          setCurrentYear={setCurrentYear}
          setIsScheduleGenerated={setIsScheduleGenerated}
        />

        {/* テストデータリセットボタン */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings size={20} />
              テストデータ（2025年8月）
            </h2>
            <button
              onClick={() => {
                setEmployees(testData);
                setCurrentMonth(7); // 8月
                setCurrentYear(2025);
                setIsScheduleGenerated(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              テストデータを読み込み
            </button>
          </div>
          <p className="text-sm text-gray-600">
            サンプル用のテストデータを読み込みます
          </p>
        </div>

        {/* 年月選択 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Settings size={20} />
            対象年月
          </h2>
          <div className="flex gap-4">
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-md"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-md"
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 従業員入力エリア */}
        <EmployeeForm
          employees={employees}
          setEmployees={setEmployees}
          currentYear={currentYear}
          currentMonth={currentMonth}
          getDaysInMonth={getDaysInMonth}
          getDayOfWeek={getDayOfWeek}
        />

        {/* シフト生成ボタン */}
        <div className="text-center mb-6">
          <button
            onClick={generateSchedule}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700"
          >
            シフト自動生成
          </button>
        </div>

        {/* シフト表示エリア */}
        {isScheduleGenerated && (
          <div className="space-y-6">
            {/* カレンダー表示 */}
            <ShiftCalendar
              schedule={schedule}
              currentYear={currentYear}
              currentMonth={currentMonth}
              employees={employees}
              getDaysInMonth={getDaysInMonth}
              getDayOfWeek={getDayOfWeek}
            />

            {/* メンバー別勤怠表 */}
            <AttendanceTable
              schedule={schedule}
              employees={employees}
              currentYear={currentYear}
              currentMonth={currentMonth}
              getDaysInMonth={getDaysInMonth}
              getDayOfWeek={getDayOfWeek}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftScheduler;
