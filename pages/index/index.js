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
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,sunrise,sunset&current=temperature_2m,relative_humidity_2m&timezone=auto`;
          
          wx.request({
            url: weatherUrl,
            method: 'GET',
            header: {
              'Content-Type': 'application/json'
            },
            success: function(res) {
              if (res.statusCode === 200) {
                // 提取所需数据
                // 格式化时间，只保留时间部分
                const formatTime = (isoTime) => {
                  return isoTime.split('T')[1];
                };
                
                // 获取天气代码并转换为文字描述
                const weatherCode = res.data.daily.weather_code[0];
                const weatherCondition = weatherCodeMap[weatherCode] || '未知天气';

                that.setData({
                  temperature: res.data.current.temperature_2m,
                  weatherCondition: weatherCondition,
                  humidity: res.data.current.relative_humidity_2m,
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