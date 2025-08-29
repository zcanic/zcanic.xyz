const mongoose = require('mongoose');

const DailyFortuneSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // 参考 User 模型
    required: true,
    unique: true, // 每个用户每天应该只有一条记录，通过更新来管理
    index: true, // 为 userId 创建索引，提高查询效率
  },
  content: {
    type: String,
    required: true, // 喵语内容不能为空
  },
  generatedAt: {
    type: Date,
    required: true, // 记录生成这条喵语的时间戳
    index: true, // 为生成时间创建索引，便于按周期查询
  },
}, {
  timestamps: true, // 自动添加 createdAt 和 updatedAt 字段
});

// 添加复合索引可能更有用，如果经常同时查询 userId 和 generatedAt
// DailyFortuneSchema.index({ userId: 1, generatedAt: -1 }); 

module.exports = mongoose.model('DailyFortune', DailyFortuneSchema); 