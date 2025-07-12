import { useState } from 'react';
import LoadingScreen from './components/LoadingScreen';
import WeatherApp from './components/WeatherApp';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <div className="App">
      {isLoading ? (
        <LoadingScreen onComplete={handleLoadingComplete} />
      ) : (
        <WeatherApp />
      )}
    </div>
  );
}

export default App;
