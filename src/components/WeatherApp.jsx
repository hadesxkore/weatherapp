import { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { weatherService } from '../services/weatherService';
import { laundryPredictor } from '../utils/laundryPredictor';
import LaundryTips from './LaundryTips';
import NotificationSystem from './NotificationSystem';
import PWAInstallButton from './PWAInstallButton';
import { 
  MapPin, 
  Thermometer, 
  Droplets, 
  Wind, 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Bell,
  Settings,
  Eye,
  Shirt,
  Timer,
  Star,
  ChevronRight,
  Download
} from 'lucide-react';

const WeatherApp = () => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [laundryAnalysis, setLaundryAnalysis] = useState(null);
  const [bestDays, setBestDays] = useState([]);
  const [bestTimes, setBestTimes] = useState([]);
  const [notifications, setNotifications] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // PWA Install functionality
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      // If no install prompt available, show manual instructions
      alert('To install this app:\n\n' +
            'Chrome/Edge: Look for the install icon in the address bar\n' +
            'Mobile: Use "Add to Home Screen" from browser menu\n' +
            'iPhone: Use Share button → "Add to Home Screen"');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        alert('App installed successfully! 🎉');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallButton(false);
    } catch (error) {
      console.error('Error installing app:', error);
      alert('Installation failed. Please try using your browser\'s "Add to Home Screen" option.');
    }
  };

  const requestLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const coords = await weatherService.getUserLocation();
      setLocation(coords);
      
      const [currentWeather, forecastData] = await Promise.all([
        weatherService.getCurrentWeather(coords.lat, coords.lon),
        weatherService.getForecast(coords.lat, coords.lon)
      ]);
      
      setWeather(currentWeather);
      setForecast(forecastData);
      
      const analysis = laundryPredictor.analyzeCurrentWeather(currentWeather);
      setLaundryAnalysis(analysis);
      
      const days = laundryPredictor.findBestLaundryDays(forecastData);
      const times = laundryPredictor.getBestTimeRecommendations(forecastData);
      
      setBestDays(days.slice(0, 5));
      setBestTimes(times);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    const icons = {
      'clear': '☀️',
      'clouds': '☁️',
      'rain': '🌧️',
      'drizzle': '🌦️',
      'thunderstorm': '⛈️',
      'snow': '❄️',
      'mist': '🌫️',
      'fog': '🌫️'
    };
    
    return icons[condition.toLowerCase()] || '🌤️';
  };

  const getSuitabilityColor = (suitability) => {
    switch (suitability) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSuitabilityIcon = (suitability) => {
    switch (suitability) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'good': return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'fair': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'poor': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRecommendationEmoji = (score) => {
    if (score >= 80) return '🌟';
    if (score >= 60) return '✅';
    if (score >= 40) return '⚠️';
    return '❌';
  };

  if (!location) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Location Required</h2>
            <p className="text-gray-600 text-sm">
              We need your location to provide accurate weather-based laundry recommendations
            </p>
          </div>
          
          <Button 
            onClick={requestLocation} 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Getting Location...</span>
              </div>
            ) : (
              'Allow Location Access'
            )}
          </Button>
          
          {/* Install App Prompt */}
          {showInstallButton && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
              <div className="flex items-center space-x-3">
                <Download className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900">Install LaundryWeather</h3>
                  <p className="text-blue-700 text-sm">Get the full app experience with offline access</p>
                </div>
              </div>
              <Button 
                onClick={handleInstallApp}
                className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
              >
                Install App
              </Button>
            </div>
          )}
          
          {error && (
            <Alert variant="destructive" className="text-left">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        
        {/* PWA Install Button */}
        <PWAInstallButton />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (!weather || !forecast) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load weather data. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const recommendation = laundryPredictor.getRecommendationMessage(laundryAnalysis);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <div className="bg-white shadow-sm sticky top-0 z-20">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">LaundryWeather</h1>
            <p className="text-gray-500 text-sm">Smart Laundry Assistant</p>
          </div>
          <div className="flex items-center space-x-2">
            <NotificationSystem 
              weather={weather}
              forecast={forecast}
              bestTimes={bestTimes}
              onNotificationToggle={setNotifications}
            />
            {/* Always show install button for testing */}
            <button 
              onClick={handleInstallApp}
              className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
              title="Install App"
            >
              <Download className="w-5 h-5 text-blue-600" />
            </button>
            <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-20">
        {/* Weather Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 font-medium">{weather.name}</span>
            </div>
            <div className="text-4xl">{getWeatherIcon(weather.weather[0].main)}</div>
          </div>
          
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-gray-900 mb-1">{Math.round(weather.main.temp)}°C</div>
            <div className="text-gray-600 capitalize">{weather.weather[0].description}</div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <Droplets className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <div className="text-sm font-semibold text-gray-900">{weather.main.humidity}%</div>
              <div className="text-xs text-gray-500">Humidity</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <Wind className="w-5 h-5 mx-auto mb-1 text-green-600" />
              <div className="text-sm font-semibold text-gray-900">{weather.wind.speed}m/s</div>
              <div className="text-xs text-gray-500">Wind</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <Eye className="w-5 h-5 mx-auto mb-1 text-purple-600" />
              <div className="text-sm font-semibold text-gray-900">{(weather.visibility / 1000).toFixed(1)}km</div>
              <div className="text-xs text-gray-500">Visibility</div>
            </div>
          </div>

          {/* Laundry Score */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getSuitabilityIcon(laundryAnalysis.suitability)}
                <span className="font-semibold text-gray-900">Laundry Score</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{laundryAnalysis.score}</div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${getSuitabilityColor(laundryAnalysis.suitability)}`}
                style={{ width: `${laundryAnalysis.score}%` }}
              ></div>
            </div>
            
            <p className="text-gray-700 text-sm">{recommendation.message}</p>
          </div>
        </div>

        {/* Install App Prompt */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Install LaundryWeather</h3>
                <p className="text-blue-100 text-sm">Get the full app experience with offline access & notifications</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleInstallApp}
            className="w-full mt-4 bg-white text-blue-600 font-semibold py-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Install App Now
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Timer className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Set Timer</div>
                <div className="text-gray-500 text-sm">Laundry reminder</div>
              </div>
            </div>
          </button>
          
          <button className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Shirt className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900">Fabric Care</div>
                <div className="text-gray-500 text-sm">Smart tips</div>
              </div>
            </div>
          </button>
        </div>

        {/* Best Times Today */}
        {bestTimes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-gray-900">Best Times Today</h3>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-3">
              {bestTimes.map((time, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">{getRecommendationEmoji(time.score)}</div>
                    <div>
                      <div className="font-medium text-gray-900">{time.time}</div>
                      <div className="text-gray-500 text-sm">{time.conditions}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{Math.round(time.score)}</div>
                    <div className="text-gray-500 text-xs">Score</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5-Day Forecast */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-gray-900">5-Day Weather Forecast</h3>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {forecast && forecast.list && (() => {
              // Group forecast data by day
              const dailyForecasts = {};
              forecast.list.forEach(item => {
                const date = new Date(item.dt * 1000);
                const dayKey = date.toDateString();
                if (!dailyForecasts[dayKey]) {
                  dailyForecasts[dayKey] = [];
                }
                dailyForecasts[dayKey].push(item);
              });

              // Get first 5 days
              const days = Object.entries(dailyForecasts).slice(0, 5);

              return days.map(([dayKey, dayData], index) => {
                const date = new Date(dayKey);
                const isToday = date.toDateString() === new Date().toDateString();
                
                // Calculate daily stats
                const maxTemp = Math.max(...dayData.map(d => d.main.temp));
                const minTemp = Math.min(...dayData.map(d => d.main.temp));
                const maxRainProb = Math.max(...dayData.map(d => d.pop || 0));
                const totalRain = dayData.reduce((sum, d) => sum + (d.rain?.['3h'] || 0), 0);
                
                // Find dominant weather condition
                const weatherCounts = {};
                dayData.forEach(d => {
                  const condition = d.weather[0].main;
                  weatherCounts[condition] = (weatherCounts[condition] || 0) + 1;
                });
                const dominantWeather = Object.entries(weatherCounts)
                  .sort(([,a], [,b]) => b - a)[0][0];
                
                // Check for rain periods
                const rainPeriods = dayData.filter(d => (d.pop || 0) > 0.3 || (d.rain?.['3h'] || 0) > 0);
                
                return (
                  <div key={dayKey} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                    {/* Day Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-center min-w-[60px]">
                          <div className="font-semibold text-gray-900">
                            {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className="text-gray-500 text-sm">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        
                        <div className="text-3xl">{getWeatherIcon(dominantWeather)}</div>
                        
                        <div>
                          <div className="font-semibold text-gray-900">
                            {Math.round(maxTemp)}°/{Math.round(minTemp)}°
                          </div>
                          <div className="text-gray-600 text-sm capitalize">
                            {dayData[Math.floor(dayData.length/2)].weather[0].description}
                          </div>
                        </div>
                      </div>
                      
                      {/* Rain Info */}
                      <div className="text-right">
                        {maxRainProb > 0 ? (
                          <div className="flex items-center space-x-2">
                            <Droplets className="w-4 h-4 text-blue-500" />
                            <div>
                              <div className="font-semibold text-blue-600">
                                {Math.round(maxRainProb * 100)}%
                              </div>
                              {totalRain > 0 && (
                                <div className="text-xs text-gray-500">
                                  {totalRain.toFixed(1)}mm
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm">No rain</div>
                        )}
                      </div>
                    </div>
                    
                    {/* Rain Timeline */}
                    {rainPeriods.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-600 mb-2">Rain Expected:</div>
                        <div className="flex flex-wrap gap-1">
                          {dayData.map((period, i) => {
                            const time = new Date(period.dt * 1000);
                            const rainProb = period.pop || 0;
                            const hasRain = rainProb > 0.3 || (period.rain?.['3h'] || 0) > 0;
                            
                            return (
                              <div 
                                key={i}
                                className={`px-2 py-1 rounded text-xs ${
                                  hasRain 
                                    ? rainProb > 0.7 
                                      ? 'bg-blue-500 text-white' 
                                      : 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                                title={`${time.getHours()}:00 - ${Math.round(rainProb * 100)}% chance`}
                              >
                                {time.getHours()}:00
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Rain summary */}
                        <div className="mt-2 text-xs text-gray-600">
                          {rainPeriods.length > 0 && (
                            <span>
                              Rain likely {rainPeriods.length === 1 ? 'around' : 'between'} {' '}
                              {new Date(rainPeriods[0].dt * 1000).getHours()}:00
                              {rainPeriods.length > 1 && 
                                ` - ${new Date(rainPeriods[rainPeriods.length - 1].dt * 1000).getHours()}:00`
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Additional Weather Details */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <Wind className="w-4 h-4 mx-auto mb-1 text-gray-500" />
                          <div className="text-xs text-gray-600">Wind</div>
                          <div className="text-sm font-medium">
                            {Math.round(dayData.reduce((sum, d) => sum + d.wind.speed, 0) / dayData.length)}m/s
                          </div>
                        </div>
                        <div>
                          <Droplets className="w-4 h-4 mx-auto mb-1 text-gray-500" />
                          <div className="text-xs text-gray-600">Humidity</div>
                          <div className="text-sm font-medium">
                            {Math.round(dayData.reduce((sum, d) => sum + d.main.humidity, 0) / dayData.length)}%
                          </div>
                        </div>
                        <div>
                          <Eye className="w-4 h-4 mx-auto mb-1 text-gray-500" />
                          <div className="text-xs text-gray-600">Visibility</div>
                          <div className="text-sm font-medium">
                            {Math.round(dayData.reduce((sum, d) => sum + (d.visibility || 10000), 0) / dayData.length / 1000)}km
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Enhanced Laundry Tips */}
        <LaundryTips weather={weather} laundryAnalysis={laundryAnalysis} />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <Button 
          onClick={requestLocation} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* PWA Install Button */}
      <PWAInstallButton />
    </div>
  );
};

export default WeatherApp; 