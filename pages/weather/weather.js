Page({
  data: {
    temperatureData: [],
    rainData: [],
    precipitationData: []
  },
  onLoad(options) {
    try {
      if (options.tempData) {
        // 先解码URI组件，再解析JSON
        const decodedData = decodeURIComponent(options.tempData);
        const parsedData = JSON.parse(decodedData);
        this.setData({
          temperatureData: parsedData.temperatures,
          rainData: parsedData.rain,
          precipitationData: parsedData.precipitation
        });
      }
    } catch (error) {
      console.error('数据解析失败:', error);
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    }
  }
})
