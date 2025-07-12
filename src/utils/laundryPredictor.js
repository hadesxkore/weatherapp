// Laundry prediction logic based on weather conditions
export const laundryPredictor = {
  // Analyze current weather for laundry suitability
  analyzeCurrentWeather: (weatherData) => {
    const { main, weather, wind, pop, rain, snow } = weatherData;
    const temp = main.temp;
    const humidity = main.humidity;
    const windSpeed = wind.speed;
    const weatherCondition = weather[0].main.toLowerCase();
    const precipitationProb = pop || 0; // Probability of precipitation (0-1)
    const rainAmount = rain?.['3h'] || rain?.['1h'] || 0;
    const snowAmount = snow?.['3h'] || snow?.['1h'] || 0;
    
    let score = 100; // Start with perfect score
    let issues = [];
    let recommendations = [];

    // Check precipitation probability
    if (precipitationProb > 0.7) {
      score -= 50;
      issues.push(`High chance of precipitation (${Math.round(precipitationProb * 100)}%)`);
    } else if (precipitationProb > 0.5) {
      score -= 35;
      issues.push(`Moderate chance of precipitation (${Math.round(precipitationProb * 100)}%)`);
    } else if (precipitationProb > 0.3) {
      score -= 20;
      issues.push(`Some chance of precipitation (${Math.round(precipitationProb * 100)}%)`);
    }

    // Check for actual rain/precipitation amounts
    if (rainAmount > 2) {
      score -= 45;
      issues.push(`Heavy rain expected (${rainAmount.toFixed(1)}mm)`);
    } else if (rainAmount > 0.5) {
      score -= 30;
      issues.push(`Moderate rain expected (${rainAmount.toFixed(1)}mm)`);
    } else if (rainAmount > 0) {
      score -= 15;
      issues.push(`Light rain expected (${rainAmount.toFixed(1)}mm)`);
    }

    // Check for rain/precipitation in weather condition
    if (weatherCondition.includes('rain') || weatherCondition.includes('drizzle')) {
      score -= 25; // Additional penalty for rain in main condition
      if (!issues.some(issue => issue.includes('rain'))) {
        issues.push('Rain expected');
      }
    }
    
    if (weatherCondition.includes('snow') || snowAmount > 0) {
      score -= 50;
      issues.push('Snow expected');
    }
    
    if (weatherCondition.includes('thunderstorm')) {
      score -= 60;
      issues.push('Thunderstorm expected');
    }

    // Check humidity levels
    if (humidity > 80) {
      score -= 25;
      issues.push('Very high humidity');
    } else if (humidity > 65) {
      score -= 15;
      issues.push('High humidity');
    }

    // Check temperature
    if (temp < 5) {
      score -= 20;
      issues.push('Very cold temperature');
    } else if (temp < 10) {
      score -= 10;
      issues.push('Cold temperature');
    }

    // Check wind speed (good for drying)
    if (windSpeed > 5) {
      score += 10;
      recommendations.push('Good wind for drying');
    }

    // Sunny conditions bonus
    if (weatherCondition.includes('clear') || weatherCondition.includes('sun')) {
      score += 15;
      recommendations.push('Sunny weather ideal for drying');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      recommendations,
      suitability: score >= 70 ? 'excellent' : score >= 50 ? 'good' : score >= 30 ? 'fair' : 'poor',
      precipitationProb: precipitationProb,
      rainAmount: rainAmount
    };
  },

  // Find best days for laundry from forecast
  findBestLaundryDays: (forecastData) => {
    const dailyForecasts = {};
    
    // Group forecasts by day
    forecastData.list.forEach(forecast => {
      const date = new Date(forecast.dt * 1000);
      const dayKey = date.toDateString();
      
      if (!dailyForecasts[dayKey]) {
        dailyForecasts[dayKey] = [];
      }
      
      dailyForecasts[dayKey].push(forecast);
    });

    // Analyze each day
    const dayAnalysis = Object.entries(dailyForecasts).map(([day, forecasts]) => {
      let dayScore = 0;
      let hasRain = false;
      let maxRainProb = 0;
      let totalRain = 0;
      let avgHumidity = 0;
      let avgTemp = 0;
      let avgWind = 0;
      let conditions = [];

      forecasts.forEach(forecast => {
        const analysis = this.analyzeCurrentWeather(forecast);
        dayScore += analysis.score;
        
        // Enhanced rain detection
        const rainProb = forecast.pop || 0;
        const rainAmount = forecast.rain?.['3h'] || 0;
        
        if (rainProb > 0.3 || rainAmount > 0) {
          hasRain = true;
        }
        
        maxRainProb = Math.max(maxRainProb, rainProb);
        totalRain += rainAmount;
        
        avgHumidity += forecast.main.humidity;
        avgTemp += forecast.main.temp;
        avgWind += forecast.wind.speed;
        conditions.push(forecast.weather[0].main);
      });

      dayScore = dayScore / forecasts.length;
      avgHumidity = avgHumidity / forecasts.length;
      avgTemp = avgTemp / forecasts.length;
      avgWind = avgWind / forecasts.length;

      // Additional scoring adjustments based on rain probability
      if (maxRainProb > 0.7) {
        dayScore -= 30; // High chance of rain
      } else if (maxRainProb > 0.5) {
        dayScore -= 20; // Moderate chance of rain
      } else if (maxRainProb > 0.3) {
        dayScore -= 10; // Low chance of rain
      }

      // Penalty for total rain amount
      if (totalRain > 5) {
        dayScore -= 25; // Heavy rain expected
      } else if (totalRain > 2) {
        dayScore -= 15; // Moderate rain expected
      } else if (totalRain > 0) {
        dayScore -= 5; // Light rain expected
      }

      return {
        day,
        date: new Date(day),
        score: Math.max(0, dayScore), // Ensure score doesn't go negative
        hasRain,
        maxRainProb,
        totalRain,
        avgHumidity,
        avgTemp,
        avgWind,
        conditions: [...new Set(conditions)],
        suitability: dayScore >= 70 ? 'excellent' : dayScore >= 50 ? 'good' : dayScore >= 30 ? 'fair' : 'poor',
        rainRisk: maxRainProb > 0.7 ? 'high' : maxRainProb > 0.3 ? 'moderate' : 'low'
      };
    });

    // Sort by score (best first)
    return dayAnalysis.sort((a, b) => b.score - a.score);
  },

  // Get recommendation message
  getRecommendationMessage: (analysis) => {
    const { score, suitability, issues, recommendations, precipitationProb, rainAmount } = analysis;
    
    let message = '';
    let alertType = 'default';

    if (suitability === 'excellent') {
      message = '🌟 Perfect day for laundry! Excellent drying conditions.';
      if (precipitationProb && precipitationProb > 0) {
        message += ` Low rain chance (${Math.round(precipitationProb * 100)}%).`;
      }
      alertType = 'default';
    } else if (suitability === 'good') {
      message = '✅ Good day for laundry! Generally favorable conditions.';
      if (precipitationProb && precipitationProb > 0.3) {
        message += ` Watch for possible rain (${Math.round(precipitationProb * 100)}% chance).`;
      }
      alertType = 'default';
    } else if (suitability === 'fair') {
      message = '⚠️ Fair conditions for laundry.';
      if (precipitationProb && precipitationProb > 0.5) {
        message += ` High rain chance (${Math.round(precipitationProb * 100)}%) - consider waiting.`;
      } else {
        message += ' Consider waiting for better weather.';
      }
      alertType = 'default';
    } else {
      message = '❌ Not recommended for laundry today.';
      if (precipitationProb && precipitationProb > 0.7) {
        message += ` Very high rain chance (${Math.round(precipitationProb * 100)}%).`;
      } else if (rainAmount && rainAmount > 0) {
        message += ` Rain expected (${rainAmount.toFixed(1)}mm).`;
      } else {
        message += ' Poor drying conditions.';
      }
      alertType = 'destructive';
    }

    // Add specific rain warnings
    if (rainAmount && rainAmount > 2) {
      message += ' ⛈️ Heavy rain expected - definitely avoid laundry!';
      alertType = 'destructive';
    } else if (rainAmount && rainAmount > 0.5) {
      message += ' 🌧️ Moderate rain expected.';
    }

    return {
      message,
      alertType,
      score,
      issues,
      recommendations
    };
  },

  // Get best time recommendations
  getBestTimeRecommendations: (forecastData) => {
    const recommendations = [];
    const today = new Date();
    
    forecastData.list.slice(0, 8).forEach(forecast => {
      const forecastDate = new Date(forecast.dt * 1000);
      const analysis = this.analyzeCurrentWeather(forecast);
      
      if (analysis.score >= 60) {
        recommendations.push({
          time: forecastDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          day: forecastDate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          }),
          score: analysis.score,
          conditions: forecast.weather[0].description
        });
      }
    });

    return recommendations.slice(0, 3); // Return top 3 recommendations
  }
}; 