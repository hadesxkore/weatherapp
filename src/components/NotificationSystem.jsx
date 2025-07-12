import { useState, useEffect } from 'react';
import { Bell, X, Clock, AlertTriangle, CheckCircle, Sun, CloudRain, Wind, Droplets } from 'lucide-react';

const NotificationSystem = ({ weather, forecast, bestTimes, onNotificationToggle }) => {
  const [notifications, setNotifications] = useState([]);
  const [permission, setPermission] = useState('default');
  const [showPanel, setShowPanel] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      onNotificationToggle(permission === 'granted');
    }
  };

  const addNotification = (type, title, message, priority = 'medium', data = {}) => {
    const newNotification = {
      id: Date.now(),
      type,
      title,
      message,
      priority,
      timestamp: new Date(),
      read: false,
      data
    };
    
    setNotifications(prev => {
      // Avoid duplicate notifications
      const isDuplicate = prev.some(n => 
        n.type === type && n.title === title && 
        Date.now() - n.timestamp.getTime() < 300000 // 5 minutes
      );
      
      if (isDuplicate) return prev;
      
      return [newNotification, ...prev.slice(0, 9)]; // Keep max 10 notifications
    });
    
    // Send browser notification if permission granted
    if (permission === 'granted' && priority === 'high') {
      new Notification(title, {
        body: message,
        icon: '/vite.svg',
        tag: type
      });
    }
    
    // Auto-remove low priority notifications
    if (priority === 'low') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 8000);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'rain-alert': return <CloudRain className="w-4 h-4" />;
      case 'rain-coming': return <Droplets className="w-4 h-4" />;
      case 'good-time': return <CheckCircle className="w-4 h-4" />;
      case 'urgent-laundry': return <AlertTriangle className="w-4 h-4" />;
      case 'perfect-conditions': return <Sun className="w-4 h-4" />;
      case 'wind-advantage': return <Wind className="w-4 h-4" />;
      case 'laundry-reminder': return <Clock className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'bg-red-50 border-red-200';
    if (priority === 'medium') return 'bg-yellow-50 border-yellow-200';
    if (priority === 'low') return 'bg-blue-50 border-blue-200';
    
    switch (type) {
      case 'rain-alert': return 'bg-red-50 border-red-200';
      case 'rain-coming': return 'bg-orange-50 border-orange-200';
      case 'good-time': return 'bg-green-50 border-green-200';
      case 'perfect-conditions': return 'bg-green-50 border-green-200';
      case 'urgent-laundry': return 'bg-red-50 border-red-200';
      case 'wind-advantage': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  // Analyze weather patterns and generate intelligent notifications
  const analyzeWeatherAndNotify = () => {
    if (!weather || !forecast) return;

    const now = new Date();
    const analysisKey = `${now.getDate()}-${now.getHours()}`;
    
    // Prevent duplicate analysis within the same hour
    if (lastAnalysis === analysisKey) return;
    setLastAnalysis(analysisKey);

    try {
      // Analyze current conditions
      const currentTemp = weather.main.temp;
      const currentHumidity = weather.main.humidity;
      const currentWind = weather.wind.speed;
      const currentCondition = weather.weather[0].main.toLowerCase();
      const currentPop = weather.pop || 0;

      // Analyze forecast data
      const next24Hours = forecast.list.slice(0, 8); // Next 24 hours (8 * 3-hour periods)
      const next48Hours = forecast.list.slice(0, 16); // Next 48 hours
      
      // Rain analysis
      const rainComingSoon = next24Hours.some(f => (f.pop || 0) > 0.6);
      const heavyRainSoon = next24Hours.some(f => (f.pop || 0) > 0.8);
      const rainTomorrow = forecast.list.slice(8, 16).some(f => (f.pop || 0) > 0.5);
      
      // Find rain-free windows
      const rainFreeWindows = [];
      let currentWindow = { start: 0, duration: 0, conditions: [] };
      
      next48Hours.forEach((f, index) => {
        const rainChance = f.pop || 0;
        const temp = f.main.temp;
        const humidity = f.main.humidity;
        const wind = f.wind.speed;
        
        if (rainChance < 0.3 && humidity < 75) {
          if (currentWindow.duration === 0) {
            currentWindow.start = index;
          }
          currentWindow.duration += 3;
          currentWindow.conditions.push({ temp, humidity, wind, time: new Date(f.dt * 1000) });
        } else {
          if (currentWindow.duration >= 6) { // At least 6 hours
            rainFreeWindows.push({ ...currentWindow });
          }
          currentWindow = { start: 0, duration: 0, conditions: [] };
        }
      });
      
      // Add final window if it exists
      if (currentWindow.duration >= 6) {
        rainFreeWindows.push(currentWindow);
      }

      // Generate notifications based on analysis
      
      // 1. Urgent: Heavy rain coming soon
      if (heavyRainSoon && !currentCondition.includes('rain')) {
        const nextRainTime = next24Hours.find(f => (f.pop || 0) > 0.8);
        const hoursUntilRain = Math.ceil((nextRainTime.dt * 1000 - now.getTime()) / (1000 * 60 * 60));
        
        addNotification(
          'urgent-laundry',
          '🚨 Heavy Rain Alert!',
          `Heavy rain expected in ${hoursUntilRain} hours. Bring laundry inside or start indoor drying now!`,
          'high',
          { hoursUntilRain, rainProbability: Math.round(nextRainTime.pop * 100) }
        );
      }
      
      // 2. Rain coming in next 12 hours
      else if (rainComingSoon && !currentCondition.includes('rain')) {
        const nextRainTime = next24Hours.find(f => (f.pop || 0) > 0.6);
        const hoursUntilRain = Math.ceil((nextRainTime.dt * 1000 - now.getTime()) / (1000 * 60 * 60));
        
        addNotification(
          'rain-coming',
          '🌧️ Rain Expected Soon',
          `Rain likely in ${hoursUntilRain} hours (${Math.round(nextRainTime.pop * 100)}% chance). Plan accordingly for drying.`,
          'medium',
          { hoursUntilRain, rainProbability: Math.round(nextRainTime.pop * 100) }
        );
      }
      
      // 3. Perfect conditions right now
      if (currentWind > 3 && currentHumidity < 60 && currentTemp > 15 && currentTemp < 30 && currentPop < 0.2) {
        addNotification(
          'perfect-conditions',
          '☀️ Perfect Laundry Weather!',
          `Ideal conditions now: ${Math.round(currentTemp)}°C, ${currentHumidity}% humidity, ${currentWind.toFixed(1)} m/s wind. Great time to start laundry!`,
          'low',
          { temp: currentTemp, humidity: currentHumidity, wind: currentWind }
        );
      }
      
      // 4. Good drying window available
      if (rainFreeWindows.length > 0) {
        const bestWindow = rainFreeWindows.reduce((best, current) => {
          const avgTemp = current.conditions.reduce((sum, c) => sum + c.temp, 0) / current.conditions.length;
          const avgHumidity = current.conditions.reduce((sum, c) => sum + c.humidity, 0) / current.conditions.length;
          const avgWind = current.conditions.reduce((sum, c) => sum + c.wind, 0) / current.conditions.length;
          
          const score = avgWind * 2 + (100 - avgHumidity) + (avgTemp > 20 ? 20 : avgTemp);
          const bestScore = best.score || 0;
          
          return score > bestScore ? { ...current, score } : best;
        }, {});
        
        if (bestWindow.duration) {
          const startTime = bestWindow.conditions[0].time;
          const isToday = startTime.toDateString() === now.toDateString();
          const timeStr = startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          
          addNotification(
            'good-time',
            '⏰ Optimal Drying Window',
            `${bestWindow.duration}h rain-free period ${isToday ? 'today' : 'tomorrow'} starting ${timeStr}. Perfect for outdoor drying!`,
            'medium',
            { 
              duration: bestWindow.duration, 
              startTime: startTime,
              avgConditions: {
                temp: Math.round(bestWindow.conditions.reduce((sum, c) => sum + c.temp, 0) / bestWindow.conditions.length),
                humidity: Math.round(bestWindow.conditions.reduce((sum, c) => sum + c.humidity, 0) / bestWindow.conditions.length)
              }
            }
          );
        }
      }
      
      // 5. Tomorrow's weather warning
      if (rainTomorrow) {
        const tomorrowRain = forecast.list.slice(8, 16).filter(f => (f.pop || 0) > 0.5);
        const maxRainChance = Math.max(...tomorrowRain.map(f => f.pop || 0));
        
        addNotification(
          'rain-alert',
          '🌦️ Tomorrow\'s Weather',
          `Rain expected tomorrow (${Math.round(maxRainChance * 100)}% chance). Consider doing laundry today or plan for indoor drying.`,
          'medium',
          { tomorrowRainChance: Math.round(maxRainChance * 100) }
        );
      }
      
      // 6. Wind advantage
      if (currentWind > 5 && currentHumidity < 70 && currentPop < 0.3) {
        addNotification(
          'wind-advantage',
          '💨 Great Wind Conditions',
          `Strong wind (${currentWind.toFixed(1)} m/s) and low humidity. Clothes will dry quickly outdoors!`,
          'low',
          { windSpeed: currentWind, humidity: currentHumidity }
        );
      }
      
      // 7. High humidity warning
      if (currentHumidity > 85 && currentWind < 2) {
        addNotification(
          'rain-alert',
          '💧 High Humidity Alert',
          `Very high humidity (${currentHumidity}%) and low wind. Consider indoor drying or wait for better conditions.`,
          'medium',
          { humidity: currentHumidity, wind: currentWind }
        );
      }

    } catch (error) {
      console.error('Error analyzing weather for notifications:', error);
    }
  };

  // Run analysis when weather data changes
  useEffect(() => {
    if (weather && forecast) {
      // Initial analysis
      analyzeWeatherAndNotify();
      
      // Set up periodic analysis every 30 minutes
      const interval = setInterval(analyzeWeatherAndNotify, 30 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [weather, forecast]);

  // Legacy support for bestTimes
  useEffect(() => {
    if (bestTimes && bestTimes.length > 0) {
      const nextBestTime = bestTimes[0];
      addNotification(
        'laundry-reminder',
        '⏰ Optimal Laundry Time',
        `Best time to start laundry: ${nextBestTime.time}`,
        'medium',
        { bestTime: nextBestTime }
      );
    }
  }, [bestTimes]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <Bell className={`w-5 h-5 ${permission === 'granted' ? 'text-blue-600' : 'text-gray-600'}`} />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </div>
        )}
      </button>

      {showPanel && (
        <div className="absolute top-12 right-0 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl border border-gray-200 shadow-xl z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Smart Laundry Alerts</h3>
              <button
                onClick={() => setNotifications([])}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Clear All
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">AI-powered weather analysis for optimal laundry timing</p>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 ${!notification.read ? 'bg-blue-50' : ''} hover:bg-gray-50 cursor-pointer`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getNotificationColor(notification.type, notification.priority)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-gray-600 text-xs mt-1">{notification.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-gray-500 text-xs">
                          {notification.timestamp.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                          notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {notification.priority}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <div className="text-gray-500 text-sm">No alerts yet</div>
                <div className="text-gray-400 text-xs mt-2">Smart notifications will appear here based on weather conditions</div>
              </div>
            )}
          </div>
          
          {permission !== 'granted' && (
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={requestNotificationPermission}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Enable Push Notifications
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">Get instant alerts when weather changes</p>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Toast Notification */}
      {notifications.length > 0 && !notifications[0].read && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <div className={`bg-white rounded-2xl p-4 shadow-xl border ${getNotificationColor(notifications[0].type, notifications[0].priority)} max-w-sm`}>
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${getNotificationColor(notifications[0].type, notifications[0].priority)}`}>
                {getNotificationIcon(notifications[0].type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900 text-sm">{notifications[0].title}</h4>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    notifications[0].priority === 'high' ? 'bg-red-100 text-red-800' :
                    notifications[0].priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {notifications[0].priority}
                  </div>
                </div>
                <p className="text-gray-600 text-xs">{notifications[0].message}</p>
              </div>
              <button
                onClick={() => removeNotification(notifications[0].id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NotificationSystem; 