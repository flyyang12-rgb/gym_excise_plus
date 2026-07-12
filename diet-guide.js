(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.DietGuide = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const configs = {
    muscleGain: {
      label: "增肌",
      headline: "吃够，训练才有材料",
      intro: "不用追求复杂食谱，先保证每餐有蛋白质、主食和蔬菜。",
      principles: ["每餐安排蛋白质", "主食别省，保持训练状态", "训练后补蛋白质和碳水"],
      periods: [
        period("breakfast", "早餐", "起床后", ["鸡蛋 + 牛奶 + 全麦面包", "燕麦 + 酸奶 + 香蕉", "豆浆 + 鸡蛋 + 包子"]),
        period("lunch", "午餐", "吃扎实", ["米饭 + 鸡胸/牛肉 + 两份蔬菜", "面条 + 瘦肉 + 鸡蛋", "杂粮饭 + 鱼 + 时蔬"]),
        period("preWorkout", "训练前", "提前 1-2 小时", ["香蕉 + 酸奶", "全麦面包 + 牛奶", "小碗米饭 + 瘦肉"]),
        period("postWorkout", "训练后 / 晚餐", "训练后 1 小时内", ["米饭 + 鸡胸肉 + 蔬菜", "面条 + 牛肉 + 鸡蛋", "牛奶 + 香蕉，随后正常晚餐"]),
        period("snack", "可选加餐", "当天没吃够时", ["无糖酸奶 + 坚果", "牛奶 + 全麦面包", "水果 + 鸡蛋"]),
      ],
    },
    fatLoss: {
      label: "减脂",
      headline: "吃得清楚，比饿着更稳",
      intro: "优先蛋白质和蔬菜，主食适量保留，减少高糖饮料和随手零食。",
      principles: ["蛋白质优先，增加饱腹感", "控制总量，不完全戒主食", "多喝水，多吃蔬菜"],
      periods: [
        period("breakfast", "早餐", "简单但别跳过", ["鸡蛋 + 无糖豆浆 + 玉米", "无糖酸奶 + 燕麦 + 蓝莓", "全麦面包 + 鸡蛋 + 牛奶"]),
        period("lunch", "午餐", "一拳主食", ["小份米饭 + 鸡胸肉 + 两份蔬菜", "杂粮饭 + 鱼虾 + 时蔬", "清汤面 + 牛肉 + 青菜"]),
        period("preWorkout", "训练前", "饿时再吃", ["半根香蕉 + 无糖酸奶", "一片全麦面包 + 牛奶", "小份水果 + 鸡蛋"]),
        period("postWorkout", "训练后 / 晚餐", "清淡且吃饱", ["小份米饭 + 鱼虾 + 蔬菜", "豆腐 + 瘦肉 + 大份时蔬", "鸡蛋蔬菜面，少油少汤"]),
        period("snack", "可选加餐", "只在真饿时", ["无糖酸奶", "一小份水果", "黄瓜 / 小番茄 + 鸡蛋"]),
      ],
    },
  };

  function period(key, title, timing, options) {
    return { key, title, timing, options };
  }

  function getDietGuide(goal) {
    return configs[goal] || configs.muscleGain;
  }

  return { getDietGuide };
});
