import { useState, useEffect } from 'react';
import { Progress } from './ui/progress';
import { CloudSun } from 'lucide-react';

const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);

  const tips = [
    "Analyzing weather patterns...",
    "Finding optimal drying conditions...",
    "Preparing laundry recommendations...",
    "Optimizing for your location...",
    "Almost ready!"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => onComplete(), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    const tipTimer = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(tipTimer);
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center space-y-8 max-w-sm w-full">
        {/* Simple Logo */}
        <div className="relative">
          <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center">
            <CloudSun className="w-10 h-10 text-gray-700" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full"></div>
        </div>
        
        {/* App Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">LaundryWeather</h1>
          <p className="text-gray-600">Smart Laundry Assistant</p>
        </div>
        
        {/* Progress */}
        <div className="space-y-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-500">
            <span>Loading...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          
          {/* Dynamic Tips */}
          <div className="h-6 flex items-center justify-center">
            <p className="text-gray-600 text-sm transition-all duration-300">
              {tips[currentTip]}
            </p>
          </div>
        </div>
        
        {/* Simple Feature Icons */}
        <div className="flex justify-center space-x-6 pt-4">
          <div className="text-center">
            <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center mb-2">
              <span className="text-lg">🌤️</span>
            </div>
            <span className="text-xs text-gray-500">Weather</span>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center mb-2">
              <span className="text-lg">🧺</span>
            </div>
            <span className="text-xs text-gray-500">Laundry</span>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center mb-2">
              <span className="text-lg">📱</span>
            </div>
            <span className="text-xs text-gray-500">Smart</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 