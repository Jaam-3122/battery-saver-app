import React, { useState, useEffect, useRef } from 'react';
import { Battery, BatteryCharging, Bell, Sparkles, Clock, Zap, Shield } from 'lucide-react';

export default function BatteryAlertTool() {
  const [battery, setBattery] = useState(null);
  const [targetPercentage, setTargetPercentage] = useState(90);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alertTriggered, setAlertTriggered] = useState(false);
  const [chargingData, setChargingData] = useState([]);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [notification, setNotification] = useState('');
  const audioRef = useRef(null);
  const batteryRef = useRef(null);
  const monitoringRef = useRef(false);

  // Initialize battery API
  useEffect(() => {
    const initBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const bat = await navigator.getBattery();
          batteryRef.current = bat;
          setBattery({
            level: bat.level * 100,
            charging: bat.charging
          });

          bat.addEventListener('levelchange', updateBattery);
          bat.addEventListener('chargingchange', updateBattery);

          return () => {
            bat.removeEventListener('levelchange', updateBattery);
            bat.removeEventListener('chargingchange', updateBattery);
          };
        } catch (error) {
          setNotification('Battery API not supported on this device');
        }
      } else {
        setNotification('Battery API not supported on this browser');
      }
    };

    const updateBattery = () => {
      if (batteryRef.current) {
        setBattery({
          level: batteryRef.current.level * 100,
          charging: batteryRef.current.charging
        });
      }
    };

    initBattery();
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Monitoring logic
  useEffect(() => {
    if (!isMonitoring || !battery) return;

    const interval = setInterval(() => {
      const currentLevel = battery.level;
      const currentTime = Date.now();

      if (battery.charging && currentLevel < targetPercentage) {
        setChargingData(prev => {
          const newData = [...prev, { level: currentLevel, time: currentTime }];
          if (newData.length > 50) newData.shift();
          return newData;
        });

        if (chargingData.length > 5) {
          const recentData = chargingData.slice(-10);
          const timeDiff = (currentTime - recentData[0].time) / 1000 / 60;
          const levelDiff = currentLevel - recentData[0].level;
          const chargeRate = levelDiff / timeDiff;

          if (chargeRate > 0) {
            const remainingPercent = targetPercentage - currentLevel;
            const estimatedMinutes = Math.ceil(remainingPercent / chargeRate);
            setEstimatedTime(estimatedMinutes);
          }
        }
      }

      if (currentLevel >= targetPercentage && battery.charging && !alertTriggered) {
        triggerAlert();
      }

      if (!battery.charging) {
        setAlertTriggered(false);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isMonitoring, battery, targetPercentage, chargingData, alertTriggered]);

  const triggerAlert = () => {
    setAlertTriggered(true);
    
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⚡ Time to Unplug!', {
        body: `Battery at ${targetPercentage}%! Unplug now to save your phone from faster battery death.`,
        icon: '🔋',
        vibrate: [200, 100, 200, 100, 200]
      });
    }

    setNotification(`It's time to unplug your charger! This helps save your phone from faster battery death. 🔋💚`);

    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200, 100, 200]);
    }
  };

  const startMonitoring = () => {
    if (!battery) {
      setNotification('Battery API not available');
      return;
    }
    setIsMonitoring(true);
    monitoringRef.current = true;
    setAlertTriggered(false);
    setChargingData([]);
    setNotification(`Monitoring active! I'll alert you at ${targetPercentage}% ⚡`);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    monitoringRef.current = false;
    setNotification('Monitoring stopped');
    setEstimatedTime(null);
  };

  const formatTime = (minutes) => {
    if (!minutes) return 'Calculating...';
    if (minutes < 1) return 'Less than 1 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4">
      <div className="max-w-md mx-auto">
        
        {/* Header with Hero Section */}
        <div className="text-center mb-6 pt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl mb-3 shadow-lg">
            <Zap className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
            BatterySaver
          </h1>
          <p className="text-gray-600 text-sm">Protect your battery, extend phone life</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-4 border border-gray-100">
          
          {/* Battery Display - Minimalist */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-3">
              {battery?.charging ? (
                <BatteryCharging size={48} className="text-green-500 animate-pulse" />
              ) : (
                <Battery size={48} className="text-gray-400" />
              )}
            </div>
            
            <div className="text-6xl font-bold bg-gradient-to-br from-green-500 to-blue-600 bg-clip-text text-transparent mb-2">
              {battery ? Math.round(battery.level) : '--'}%
            </div>
            
            <div className="text-sm text-gray-500 mb-4">
              {battery?.charging ? '⚡ Charging' : '🔌 Not Charging'}
            </div>
            
            {/* Simple Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-500 rounded-full"
                style={{ width: `${battery?.level || 0}%` }}
              ></div>
            </div>
          </div>

          {/* Target Slider - Clean Design */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">
                Alert at
              </label>
              <span className="text-2xl font-bold text-green-600">
                {targetPercentage}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={targetPercentage}
              onChange={(e) => setTargetPercentage(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
              disabled={isMonitoring}
            />
          </div>

          {/* Estimated Time - Compact */}
          {isMonitoring && battery?.charging && estimatedTime !== null && (
            <div className="bg-blue-50 rounded-2xl p-3 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-blue-600" />
              <span className="text-sm text-blue-800 font-medium">
                ~{formatTime(estimatedTime)} to reach {targetPercentage}%
              </span>
            </div>
          )}

          {/* Control Button - Single, Prominent */}
          {!isMonitoring ? (
            <button
              onClick={startMonitoring}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Bell size={20} />
              Start Protection
            </button>
          ) : (
            <button
              onClick={stopMonitoring}
              className="w-full bg-gray-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Stop Monitoring
            </button>
          )}

          {/* Alert Message */}
          {alertTriggered && (
            <div className="mt-4 bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-orange-300 rounded-2xl p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <Shield className="text-orange-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <p className="text-orange-900 font-bold mb-1">
                    ⚡ It's time to unplug your charger!
                  </p>
                  <p className="text-orange-800 text-sm">
                    In such a way you may save your phone from faster battery death 🔋💚
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Regular Notification */}
          {notification && !alertTriggered && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-3">
              <p className="text-sm text-green-800 text-center">
                {notification}
              </p>
            </div>
          )}
        </div>

        {/* Benefits Section - Engaging */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl shadow-lg p-6 border border-purple-100">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-purple-600" size={24} />
            <h2 className="text-lg font-bold text-gray-800">
              Why Use BatterySaver?
            </h2>
          </div>
          
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                1
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Extends Battery Lifespan</p>
                <p className="text-gray-600 text-xs">Keeping battery at 80-90% increases its longevity by up to 2x</p>
              </div>
            </div>
            
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Smart & Adaptive</p>
                <p className="text-gray-600 text-xs">Learns your phone's charging speed automatically</p>
              </div>
            </div>
            
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Never Miss the Alert</p>
                <p className="text-gray-600 text-xs">Sound + vibration + notification = You won't forget!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Tagline */}
        <div className="text-center mt-6 pb-4">
          <p className="text-xs text-gray-500">
            Small habit, big impact on your phone's life
          </p>
        </div>

        {/* Audio element */}
        <audio ref={audioRef}>
          <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZizcIGWi77eefTRAMUKfj8LZjHAY4ktfzzHksBSR3yPDekEAKFF+07OunVRQKRZ/g8r1sIQUsgs/z2Io3CBloue3nn00QDFC" type="audio/wav" />
        </audio>
      </div>
    </div>
  );
}
