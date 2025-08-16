import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { JapaneseHolidays } from './JapaneseHolidays';

const HolidayStatus = () => {
  const [status, setStatus] = useState({
    isLoading: true,
    isUsingFallback: false,
    lastUpdated: null,
    error: null
  });

  const checkHolidayStatus = async () => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await JapaneseHolidays.getHolidays();
      setStatus({
        isLoading: false,
        isUsingFallback: JapaneseHolidays.isUsingFallbackData(),
        lastUpdated: new Date(),
        error: null
      });
    } catch (error) {
      setStatus({
        isLoading: false,
        isUsingFallback: true,
        lastUpdated: null,
        error: error.message
      });
    }
  };

  useEffect(() => {
    checkHolidayStatus();
  }, []);

  const getStatusColor = () => {
    if (status.isLoading) return 'bg-gray-50 border-gray-200';
    if (status.isUsingFallback) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  const getStatusIcon = () => {
    if (status.isLoading) return <RefreshCw className="animate-spin" size={16} />;
    if (status.isUsingFallback) return <AlertTriangle className="text-yellow-600" size={16} />;
    return <CheckCircle className="text-green-600" size={16} />;
  };

  const getStatusText = () => {
    if (status.isLoading) return '祝日データを読み込み中...';
    if (status.isUsingFallback) return '祝日API接続失敗 - ハードコードデータ使用中';
    return '祝日データをAPIから正常取得';
  };

  return (
    <div className={`mb-4 p-3 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
        {!status.isLoading && (
          <button
            onClick={checkHolidayStatus}
            className="ml-auto text-xs text-blue-600 hover:text-blue-800"
          >
            更新
          </button>
        )}
      </div>
      
      {status.lastUpdated && (
        <div className="text-xs text-gray-500 mt-1">
          最終更新: {status.lastUpdated.toLocaleTimeString()}
        </div>
      )}
      
      {status.error && (
        <div className="text-xs text-red-600 mt-1">
          エラー: {status.error}
        </div>
      )}
    </div>
  );
};

export default HolidayStatus;