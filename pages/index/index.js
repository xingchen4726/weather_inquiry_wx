// pages/index/index.js

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
    sunset: '' // 日落时间
  },
  // 城市输入框事件
  onCityInput: function(e) {
    this.setData({
      city: e.detail.value
    });
  },
  // 获取天气数据
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
    // 先获取地理编码
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
          
          // 使用获取的经纬度请求天气数据
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,sunrise,sunset&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&timezone=auto`;
          
          wx.request({
            url: weatherUrl,
            method: 'GET',
            header: {
              'Content-Type': 'application/json'
            },
            success: function(res) {
              if (res.statusCode === 200) {
                // 提取所需数据
                // 改进时间格式化，转换为12小时制(上午/下午)
                const formatTime = (isoTime) => {
                  const timeStr = isoTime.split('T')[1];
                  const [hours, minutes] = timeStr.split(':');
                  const hour = parseInt(hours);
                  const period = hour >= 12 ? '下午' : '上午';
                  const hour12 = hour % 12 || 12;
                  return `${period} ${hour12}:${minutes}`;
                };
                
                // 获取天气代码并转换为文字描述
                const weatherCode = res.data.daily.weather_code[0];
                const weatherCondition = weatherCodeMap[weatherCode] || '未知天气';
                
                // 将风向度数转换为方向文字
                const getWindDirection = (degrees) => {
                  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
                  const index = Math.round((degrees % 360) / 45) % 8;
                  return directions[index] + ` (${degrees}°)`;
                };

                that.setData({
                  temperature: res.data.current.temperature_2m,
                  weatherCondition: weatherCondition,
                  humidity: res.data.current.relative_humidity_2m,
                  windSpeed: res.data.current.wind_speed_10m + ' km/h',
                  windDirection: getWindDirection(res.data.current.wind_direction_10m),
                  windDirectionDegrees: res.data.current.wind_direction_10m,
                  sunrise: formatTime(res.data.daily.sunrise[0]),
                  sunset: formatTime(res.data.daily.sunset[0])
                });
              } else {
                wx.showToast({
                  title: '获取天气失败',
                  icon: 'none'
                });
                console.error('API请求失败:', res);
              }
            },
            fail: function(err) {
              wx.showToast({
                title: '天气请求失败',
                icon: 'none'
              });
              console.error('请求失败:', err);
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
  }
});