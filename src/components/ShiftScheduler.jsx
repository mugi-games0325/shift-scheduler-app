import React, { useState, useCallback } from 'react';
import { Calendar, Settings } from 'lucide-react';
import EmployeeForm from './EmployeeForm';
import ShiftCalendar from './ShiftCalendar';
import AttendanceTable from './AttendanceTable';
import FileUpload from './FileUpload';
import HolidayStatus from './HolidayStatus';
import { JapaneseHolidays } from './JapaneseHolidays';

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
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

  // 曜日を取得（0=日曜日）
  const getDayOfWeek = (year, month, day) => new Date(year, month, day).getDay();

  // 土日祝日かどうかを判定
  const isWeekendOrHoliday = (year, month, day) => {
    // デバッグ用ログ
    console.log(`📋 シフト生成での休日判定: ${year}年${month + 1}月${day}日をチェック`);

    // 同期版を使用（パフォーマンス重視）
    const result = JapaneseHolidays.isWeekendOrHolidaySync(year, month + 1, day);

    console.log(`🔄 判定結果: ${result ? '休業日として扱う' : '平日として扱う'}`);
    return result;
  };

  // コンポーネント初期化時に祝日データを取得
  React.useEffect(() => {
    const initHolidays = async () => {
      try {
        console.log('🚀 シフトスケジューラー: 祝日データ初期化開始');
        const holidayData = await JapaneseHolidays.getHolidays();

        if (JapaneseHolidays.isUsingFallbackData()) {
          console.warn('⚠️ 祝日APIが利用できないため、ハードコーディングデータを使用しています');
        } else {
          console.log('✅ 祝日APIデータを正常に取得しました');
        }

        // テスト用：2025年8月11日（山の日）をチェック
        console.log('🧪 テスト: 2025年8月11日の判定');
        const testResult = await JapaneseHolidays.isHoliday(2025, 8, 11);
        console.log(`🏔️ 2025年8月11日は祝日か?: ${testResult}`);

        // シフト生成で使用される関数もテスト
        console.log('🧪 テスト: シフト生成関数での判定');
        const shiftTestResult = isWeekendOrHoliday(2025, 7, 11); // month は 0-indexed
        console.log(`🔄 シフト関数での2025年8月11日判定: ${shiftTestResult}`);

      } catch (error) {
        console.error('祝日データの初期化に失敗しました:', error);
      }
    };
    initHolidays();
  }, []);

  // シフト自動生成（改良版 - 6連勤回避機能付き）
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
      const isRestDay = isWeekendOrHoliday(currentYear, currentMonth, day);
      const idealStaff = isRestDay ? 2 : 5;  // 理想的な人数
      const minRequiredStaff = isRestDay ? 2 : 4;  // 最低限必要な人数
      const maxStaff = isRestDay ? 3 : Infinity;

      // 利用可能な従業員をフィルタ
      let availableEmployees = validEmployees.filter(emp => {
        if (emp.unavailableDays.includes(day)) return false;
        if (consecutiveDays[emp.id] >= 7) return false;
        return true;
      });

      // 6連勤回避を考慮した優先順位付け
      availableEmployees.sort((a, b) => {
        // 6連勤に近い人は優先度を下げる
        const aConsecutive = consecutiveDays[a.id];
        const bConsecutive = consecutiveDays[b.id];

        if (aConsecutive >= 6 && bConsecutive < 6) return 1;
        if (aConsecutive < 6 && bConsecutive >= 6) return -1;

        // 通常の優先度計算
        const aProgress = workDaysCount[a.id] / Math.max(a.requiredDays, 1);
        const bProgress = workDaysCount[b.id] / Math.max(b.requiredDays, 1);
        return aProgress - bProgress;
      });

      // まず理想的な人数を目指す
      let assignedCount = 0;
      for (const emp of availableEmployees) {
        if (assignedCount >= Math.min(idealStaff, maxStaff)) break;

        newSchedule[day].push(emp.id);
        workDaysCount[emp.id]++;
        assignedCount++;
      }

      // 平日で理想人数に満たない場合の処理
      if (!isRestDay) {
        if (assignedCount < idealStaff && assignedCount >= minRequiredStaff) {
          console.warn(`${currentYear}年${currentMonth + 1}月${day}日（平日）: 推奨${idealStaff}人に対し${assignedCount}人のみ配置`);
        } else if (assignedCount < minRequiredStaff) {
          console.error(`${currentYear}年${currentMonth + 1}月${day}日（平日）: 最低必要${minRequiredStaff}人に対し${assignedCount}人のみ配置`);
        }
      }

      // 平日で人数に余裕がある場合、追加でアサイン
      if (!isRestDay && assignedCount < availableEmployees.length) {
        const remainingEmployees = availableEmployees.slice(assignedCount);

        // まだ勤務日数が足りない従業員を優先
        const needMoreWork = remainingEmployees.filter(emp =>
          workDaysCount[emp.id] < emp.requiredDays
        );

        // 6連勤回避を考慮した優先順位付け
        needMoreWork.sort((a, b) => {
          const aConsecutive = consecutiveDays[a.id];
          const bConsecutive = consecutiveDays[b.id];

          if (aConsecutive >= 6 && bConsecutive < 6) return 1;
          if (aConsecutive < 6 && bConsecutive >= 6) return -1;

          const aProgress = workDaysCount[a.id] / Math.max(a.requiredDays, 1);
          const bProgress = workDaysCount[b.id] / Math.max(b.requiredDays, 1);
          return aProgress - bProgress;
        });

        // まず理想人数まで追加
        if (assignedCount < idealStaff) {
          const toIdeal = Math.min(needMoreWork.length, idealStaff - assignedCount);
          for (let i = 0; i < toIdeal; i++) {
            const emp = needMoreWork[i];
            if (!newSchedule[day].includes(emp.id)) {
              newSchedule[day].push(emp.id);
              workDaysCount[emp.id]++;
              assignedCount++;
            }
          }
        }

        // さらに必要に応じて6人まで追加可能
        const maxAdditional = Math.min(needMoreWork.length, 6 - assignedCount);
        for (let i = idealStaff - (assignedCount - (idealStaff - assignedCount)); i < maxAdditional; i++) {
          if (i >= 0 && i < needMoreWork.length) {
            const emp = needMoreWork[i];
            if (!newSchedule[day].includes(emp.id)) {
              newSchedule[day].push(emp.id);
              workDaysCount[emp.id]++;
            }
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
        let bestDayConsecutive = Infinity;

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

          // 6連勤チェックを追加
          if (canWork && consecutive >= 6) {
            // 6連勤になる場合は、他に選択肢がない場合のみ許可
            const otherOptions = [];
            for (let otherDay = 1; otherDay <= daysInMonth; otherDay++) {
              if (otherDay === day) continue;
              if (newSchedule[otherDay].includes(emp.id)) continue;
              if (emp.unavailableDays.includes(otherDay)) continue;

              // この日の連続勤務日数をチェック
              let otherConsecutive = 0;
              for (let cd = otherDay - 6; cd <= otherDay + 6; cd++) {
                if (cd < 1 || cd > daysInMonth) continue;
                if (cd === otherDay) {
                  otherConsecutive++;
                } else if (newSchedule[cd] && newSchedule[cd].includes(emp.id)) {
                  otherConsecutive++;
                } else {
                  otherConsecutive = 0;
                }
              }

              if (otherConsecutive < 6) {
                const dayOfWeek2 = getDayOfWeek(currentYear, currentMonth, otherDay);
                const isRestDay2 = isWeekendOrHoliday(currentYear, currentMonth, otherDay);
                const maxAllowed2 = isRestDay2 ? 3 : Infinity;

                if (newSchedule[otherDay].length < maxAllowed2) {
                  otherOptions.push(otherDay);
                }
              }
            }

            if (otherOptions.length > 0) {
              canWork = false; // 他の選択肢があるので6連勤は避ける
            }
          }

          if (!canWork) continue;

          const dayOfWeek = getDayOfWeek(currentYear, currentMonth, day);
          const isRestDay = isWeekendOrHoliday(currentYear, currentMonth, day);
          const currentStaff = newSchedule[day].length;
          const maxAllowed = isRestDay ? 3 : Infinity;

          // 土日祝日は最大3人、平日は制限なし
          if (currentStaff < maxAllowed) {
            // 連続勤務日数が少ない日を優先、同じなら人数の少ない日を優先
            if (consecutive < bestDayConsecutive ||
              (consecutive === bestDayConsecutive && currentStaff < minCurrentStaff)) {
              minCurrentStaff = currentStaff;
              bestDayConsecutive = consecutive;
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
          const isRestDay = isWeekendOrHoliday(currentYear, currentMonth, day);
          const idealRequired = isRestDay ? 2 : 5;  // 理想的な人数
          const minRequired = isRestDay ? 2 : 4;    // 最低限必要な人数
          const currentStaff = newSchedule[day].length;

          // 削除可能な条件：理想人数を下回らない、または最低人数を下回らない
          if (currentStaff > idealRequired ||
            (!isRestDay && currentStaff > minRequired && currentStaff <= idealRequired)) {
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

        {/* 祝日データステータス */}
        <HolidayStatus />

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
          isWeekendOrHoliday={isWeekendOrHoliday}
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
              isWeekendOrHoliday={isWeekendOrHoliday}
            />

            {/* メンバー別勤怠表 */}
            <AttendanceTable
              schedule={schedule}
              employees={employees}
              currentYear={currentYear}
              currentMonth={currentMonth}
              getDaysInMonth={getDaysInMonth}
              getDayOfWeek={getDayOfWeek}
              isWeekendOrHoliday={isWeekendOrHoliday}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftScheduler;