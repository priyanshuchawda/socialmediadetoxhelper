import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface UsageData {
  [domain: string]: number;
}

interface Settings {
  dailyLimit: number;
}

const Popup: React.FC = () => {
  const [usageData, setUsageData] = useState<UsageData>({});
  const [settings, setSettings] = useState<Settings>({ dailyLimit: 120 }); // 2 hours default
  const [totalUsage, setTotalUsage] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const today = new Date().toISOString().split('T')[0];
    chrome.storage.local.get(['usageData', 'settings'], (result) => {
      console.log('Raw storage data:', result);
      const data: UsageData = result.usageData?.[today] || {};
      console.log('Today\'s data:', data);
      setUsageData(data);
      setSettings(result.settings || { dailyLimit: 120 });
      const total = Object.values(data).reduce((sum, duration) => sum + duration, 0);
      console.log('Total usage:', total);
      setTotalUsage(total);
    });
  };

  const resetData = () => {
    chrome.storage.local.set({ usageData: {} }, () => {
      loadData();
    });
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  };

  const getProgressColor = (usage: number) => {
    const percentage = (usage / (settings.dailyLimit * 60000)) * 100;
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-4">Social Media Usage Today</h1>
      {Object.entries(usageData).map(([domain, duration]) => (
        <div key={domain} className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold">{domain}</span>
            <span>{formatDuration(duration)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${getProgressColor(duration)}`}
              style={{ width: `${Math.min((duration / (settings.dailyLimit * 60000)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      ))}
      <div className="mt-4 font-bold">
        Total Usage: {formatDuration(totalUsage)} / {formatDuration(settings.dailyLimit * 60000)}
      </div>
      <button
        onClick={resetData}
        className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Reset Data
      </button>
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
  document.getElementById('root')
);