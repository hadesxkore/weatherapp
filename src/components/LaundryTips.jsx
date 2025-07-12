import { useState } from 'react';
import { 
  Shirt, 
  Droplets, 
  Wind, 
  Sun, 
  Thermometer, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Star,
  ChevronRight
} from 'lucide-react';

const LaundryTips = ({ weather, laundryAnalysis }) => {
  const [activeTab, setActiveTab] = useState('general');

  const getWeatherBasedTips = () => {
    const tips = [];
    
    if (weather.main.humidity > 70) {
      tips.push({
        icon: '💧',
        title: 'High Humidity Alert',
        description: 'Use indoor drying with dehumidifier or air conditioning',
        priority: 'high'
      });
    }
    
    if (weather.wind.speed > 5) {
      tips.push({
        icon: '💨',
        title: 'Perfect Wind Conditions',
        description: 'Hang clothes outside for faster drying',
        priority: 'good'
      });
    }
    
    if (weather.main.temp < 10) {
      tips.push({
        icon: '🌡️',
        title: 'Cold Weather Tips',
        description: 'Pre-warm drying area and use heated drying racks',
        priority: 'medium'
      });
    }
    
    if (weather.weather[0].main.toLowerCase().includes('rain')) {
      tips.push({
        icon: '☔',
        title: 'Rainy Day Solution',
        description: 'Use indoor drying methods and ensure good ventilation',
        priority: 'high'
      });
    }
    
    if (weather.weather[0].main.toLowerCase().includes('clear')) {
      tips.push({
        icon: '☀️',
        title: 'Sunny Day Advantage',
        description: 'Perfect for outdoor drying and UV sanitization',
        priority: 'excellent'
      });
    }
    
    return tips;
  };

  const fabricCareTips = [
    {
      icon: '👕',
      title: 'Cotton & Linen',
      description: 'Best dried in direct sunlight, can handle high heat',
      details: 'Hang immediately after washing to prevent wrinkles'
    },
    {
      icon: '🧥',
      title: 'Wool & Cashmere',
      description: 'Dry flat in shade, never in direct sunlight',
      details: 'Reshape while damp and avoid hanging to prevent stretching'
    },
    {
      icon: '👗',
      title: 'Synthetic Fabrics',
      description: 'Quick-dry in moderate heat, avoid over-drying',
      details: 'Remove promptly to prevent static and wrinkles'
    },
    {
      icon: '🩱',
      title: 'Delicates',
      description: 'Air dry in shade, use padded hangers',
      details: 'Never wring or twist, gently squeeze out excess water'
    }
  ];

  const generalTips = [
    {
      icon: '⏰',
      title: 'Timing is Key',
      description: 'Start laundry early morning for full day drying',
      details: 'Avoid evening starts unless using indoor drying'
    },
    {
      icon: '🌪️',
      title: 'Air Circulation',
      description: 'Ensure good airflow around hanging clothes',
      details: 'Space items apart and use fans for better circulation'
    },
    {
      icon: '📏',
      title: 'Proper Spacing',
      description: 'Don\'t overcrowd drying lines or racks',
      details: 'Better airflow means faster and more even drying'
    },
    {
      icon: '🔄',
      title: 'Rotation Method',
      description: 'Turn clothes halfway through drying process',
      details: 'Ensures even drying and prevents damp spots'
    }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'excellent': return 'bg-green-50 border-green-200';
      case 'good': return 'bg-blue-50 border-blue-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'high': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const weatherTips = getWeatherBasedTips();

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Star className="w-5 h-5 text-yellow-500" />
        <h3 className="font-bold text-gray-900">Smart Laundry Tips</h3>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'general'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('fabric')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'fabric'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Fabric Care
        </button>
        <button
          onClick={() => setActiveTab('weather')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'weather'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Weather
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {activeTab === 'general' && (
          <>
            {generalTips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl">
                <div className="text-xl">{tip.icon}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-1">{tip.title}</div>
                  <div className="text-gray-600 text-sm mb-1">{tip.description}</div>
                  <div className="text-gray-500 text-xs">{tip.details}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </>
        )}

        {activeTab === 'fabric' && (
          <>
            {fabricCareTips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl">
                <div className="text-xl">{tip.icon}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 mb-1">{tip.title}</div>
                  <div className="text-gray-600 text-sm mb-1">{tip.description}</div>
                  <div className="text-gray-500 text-xs">{tip.details}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </>
        )}

        {activeTab === 'weather' && (
          <>
            {weatherTips.length > 0 ? (
              weatherTips.map((tip, index) => (
                <div key={index} className={`p-3 rounded-xl border ${getPriorityColor(tip.priority)}`}>
                  <div className="flex items-start space-x-3">
                    <div className="text-xl">{tip.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 mb-1">{tip.title}</div>
                      <div className="text-gray-600 text-sm">{tip.description}</div>
                    </div>
                    {tip.priority === 'excellent' && <Star className="w-4 h-4 text-yellow-500" />}
                    {tip.priority === 'high' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    {tip.priority === 'good' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <div className="text-gray-500">No specific weather tips for current conditions</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <div className="text-xl font-bold text-gray-900">{Math.round(weather.main.temp)}°C</div>
          <div className="text-gray-500 text-xs">Current Temp</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <div className="text-xl font-bold text-gray-900">{laundryAnalysis.score}</div>
          <div className="text-gray-500 text-xs">Laundry Score</div>
        </div>
      </div>
    </div>
  );
};

export default LaundryTips; 