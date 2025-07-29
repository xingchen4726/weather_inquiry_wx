// pages/index/index.js

// 天气代码映射
const weatherCodeMap = {
  0: '晴天 ☀️',
  1: '多云 🌤️',
  2: '局部多云 ⛅',
  3: '阴天 ☁️',
  45: '雾 🌫️',
  48: '雾凇 🌫️',
  51: '轻微毛毛雨 🌦️',
  53: '中等毛毛雨 🌦️',
  55: '浓毛毛雨 🌦️',
  56: '轻微冻毛毛雨 🌧️❄️',
  57: '浓冻毛毛雨 🌧️❄️',
  61: '小雨 🌧️',
  63: '中雨 🌧️',
  65: '大雨 🌧️',
  66: '轻微冻雨 🌧️❄️',
  67: '严重冻雨 🌧️❄️',
  71: '小雪 ❄️',
  73: '中雪 ❄️',
  75: '大雪 ❄️',
  77: '雪粒 ❄️',
  80: '轻微阵雨 🌦️',
  81: '中等阵雨 🌦️',
  82: '强烈阵雨 🌧️',
  85: '轻微阵雪 🌨️',
  86: '强烈阵雪 🌨️',
  95: '雷暴 ⛈️',
  96: '雷暴伴有轻微冰雹 ⛈️🧊',
  99: '雷暴伴有严重冰雹 ⛈️🧊'
};

// 公共天气数据获取函数
const fetchWeatherData = function(latitude, longitude, callback) {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,sunrise,sunset&hourly=temperature_2m,rain,precipitation_probability&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&timezone=auto&forecast_days=1`;
  
  wx.request({
    url: weatherUrl,
    method: 'GET',
    header: {
      'Content-Type': 'application/json'
    },
    success: function(res) {
      if (res.statusCode === 200) {
        const formatTime = (isoTime) => {
          const timeStr = isoTime.split('T')[1];
          const [hours, minutes] = timeStr.split(':');
          const hour = parseInt(hours);
          const period = hour >= 12 ? '下午' : '上午';
          const hour12 = hour % 12 || 12;
          return `${period} ${hour12}:${minutes}`;
        };
        
        const weatherCode = res.data.daily.weather_code[0];
        const weatherCondition = weatherCodeMap[weatherCode] || '未知天气';
        
        const getWindDirection = (degrees) => {
          const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
          const index = Math.round((degrees % 360) / 45) % 8;
          return directions[index] + ` (${degrees}°)`;
        };

        // 处理分时数据系列
        const hourlyTimes = res.data.hourly.time.map(time => {
          const timeStr = time.split('T')[1];
          const [hour] = timeStr.split(':');
          return `${hour}:00`;
        });
        
        const hourlyTemps = res.data.hourly.temperature_2m.map((temp, index) => ({
          time: hourlyTimes[index],
          value: temp
        }));
        
        const hourlyRain = res.data.hourly.rain.map((rain, index) => ({
          time: hourlyTimes[index],
          value: rain
        }));
        
        const hourlyPrecip = res.data.hourly.precipitation_probability.map((precip, index) => ({
          time: hourlyTimes[index],
          value: precip
        }));

        // 组装回调数据
        const callbackData = {
          temperature: res.data.current.temperature_2m,
          weatherCondition: weatherCondition,
          humidity: res.data.current.relative_humidity_2m,
          windSpeed: res.data.current.wind_speed_10m + ' km/h',
          windDirection: getWindDirection(res.data.current.wind_direction_10m),
          windDirectionDegrees: res.data.current.wind_direction_10m,
          sunrise: formatTime(res.data.daily.sunrise[0]),
          sunset: formatTime(res.data.daily.sunset[0]),
          hourlyTemperatures: hourlyTemps,
          hourlyRain: hourlyRain,
          hourlyPrecip: hourlyPrecip
        };
        
        callback(callbackData);
      } else {
        callback(null, {
          title: '获取天气失败',
          message: 'API请求失败'
        });
      }
    },
    fail: function(err) {
      callback(null, {
        title: '天气请求失败',
        message: '请求失败'
      });
    }
  });
};
Page({
  data: {
    city: 'London', // 默认城市
    temperature: '', // 温度
    weatherCondition: '', // 天气状况
    humidity: '', // 湿度
    windSpeed: '', // 风速
    windDirection: '', // 风向
    windDirectionDegrees: 0, // 风向度数(用于箭头旋转)
    sunrise: '', // 日出时间
    sunset: '', // 日落时间
    latitude: '', // 纬度
    longitude: '', // 经度
    hourlyTemperatures: [] // 分时温度数据
  },
  // 页面加载时获取位置
  onLoad: function() {
    this.getLocation();
  },
  
  // 获取设备位置
  getLocation: function() {
    const that = this;
    wx.getLocation({
      type: 'wgs84',
      success: function(res) {
        that.setData({
          latitude: res.latitude.toFixed(4),
          longitude: res.longitude.toFixed(4)
        });
      },
      fail: function(err) {
        console.error('获取位置失败:', err);
        wx.showToast({
          title: '获取位置失败',
          icon: 'none'
        });
      }
    });
  },
  
  // 城市输入框事件
  onCityInput: function(e) {
    this.setData({
      city: e.detail.value
    });
  },
  // 获取天气数据
  // 根据城市名称获取天气
  getWeather: function() {
    const that = this;
    const city = this.data.city;
    
    if (!city) {
      wx.showToast({
        title: '请输入城市名称',
        icon: 'none'
      });
      return;
    }
    
    wx.request({
      url: `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`,
      method: 'GET',
      header: {
        'Content-Type': 'application/json'
      },
      success: function(geoRes) {
        if (geoRes.statusCode === 200 && geoRes.data.results && geoRes.data.results.length > 0) {
          const location = geoRes.data.results[0];
          const latitude = location.latitude;
          const longitude = location.longitude;
          
          fetchWeatherData(latitude, longitude, function(weatherData, error) {
            if (weatherData) {
              that.setData(weatherData);
            } else {
              wx.showToast({
                title: error.title,
                icon: 'none'
              });
              console.error(error.message);
            }
          });
        } else {
          wx.showToast({
            title: '城市名称无效',
            icon: 'none'
          });
          console.error('地理编码失败:', geoRes);
        }
      },
      fail: function(err) {
        wx.showToast({
          title: '地理编码请求失败',
          icon: 'none'
        });
        console.error('请求失败:', err);
      }
    });
  },
  
  // 根据当前位置经纬度获取天气
  getLocationWeather: function() {
    const that = this;
    const { latitude, longitude } = this.data;
    
    if (!latitude || !longitude) {
      wx.showToast({
        title: '无法获取当前位置',
        icon: 'none'
      });
      return;
    }
    
    fetchWeatherData(latitude, longitude, function(weatherData, error) {
      if (weatherData) {
        weatherData.city = '当前位置';
        that.setData(weatherData);
      } else {
        wx.showToast({
          title: error.title,
          icon: 'none'
        });
        console.error(error.message);
      }
    });
  },
  
  // 跳转到weather页面
  navigateToWeather: function() {
    const { hourlyTemperatures, hourlyRain, hourlyPrecip } = this.data;
    if (hourlyTemperatures.length > 0) {
      wx.navigateTo({
        url: `/pages/weather/weather?tempData=${encodeURIComponent(JSON.stringify({
          temperatures: hourlyTemperatures,
          rain: hourlyRain,
          precipitation: hourlyPrecip
        }))}`
      });
    } else {
      wx.showToast({
        title: '请先获取天气数据',
        icon: 'none'
      });
    }
  }
});