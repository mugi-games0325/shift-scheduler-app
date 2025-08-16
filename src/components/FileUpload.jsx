import React, { useRef } from 'react';
import { Upload, Download, FileText } from 'lucide-react';

const FileUpload = ({ employees, setEmployees, setCurrentMonth, setCurrentYear, setIsScheduleGenerated }) => {
  const fileInputRef = useRef(null);

  // JSONファイルアップロード処理
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // ファイル形式チェック
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      alert('JSONファイルを選択してください');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);

        // データ形式チェック
        if (!jsonData.employees || !Array.isArray(jsonData.employees)) {
          alert('正しいJSON形式ではありません。employees配列が必要です。');
          return;
        }

        // 各従業員データのバリデーション
        const isValidData = jsonData.employees.every(emp =>
          emp.hasOwnProperty('name') &&
          emp.hasOwnProperty('requiredDays') &&
          emp.hasOwnProperty('unavailableDays') &&
          Array.isArray(emp.unavailableDays)
        );

        if (!isValidData) {
          alert('従業員データの形式が正しくありません。name, requiredDays, unavailableDaysが必要です。');
          return;
        }

        // IDを追加（既存のIDと重複しないように）
        const employeesWithId = jsonData.employees.map((emp, index) => ({
          id: Date.now() + index,
          ...emp
        }));

        // データを適用
        setEmployees(employeesWithId);

        // 年月設定があれば適用
        if (jsonData.year) {
          setCurrentYear(jsonData.year);
        }
        if (jsonData.month !== undefined) {
          setCurrentMonth(jsonData.month);
        }

        // シフト生成状態をリセット
        setIsScheduleGenerated(false);

        alert(`${employeesWithId.length}人の従業員データを読み込みました`);

      } catch (error) {
        alert('JSONファイルの解析に失敗しました: ' + error.message);
      }
    };

    reader.readAsText(file);
    // ファイル入力をリセット
    event.target.value = '';
  };

  // 現在のデータをJSONでダウンロード
  const handleDownload = () => {
    const downloadData = {
      year: new Date().getFullYear(),
      month: new Date().getMonth(),
      employees: employees.map(emp => ({
        name: emp.name,
        requiredDays: emp.requiredDays,
        unavailableDays: emp.unavailableDays
      }))
    };

    const dataStr = JSON.stringify(downloadData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `shift-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mb-6 p-4 bg-green-50 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText size={20} />
          データ管理
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Upload size={16} />
            JSONアップロード
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download size={16} />
            JSONダウンロード
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileUpload}
        className="hidden"
      />

      <p className="text-sm text-gray-600">
        従業員データをJSONファイルから読み込み、または現在のデータをJSONファイルとしてダウンロードできます
      </p>
    </div>
  );
};

export default FileUpload;
