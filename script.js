const STORAGE_KEY = "fitness_helper_progress_v2";
const TRAINING_NOTES_KEY = "fitness_helper_training_notes_v1";
const AI_REQUEST_TIMEOUT_MS = 10000;
const APP_VERSION = "2026.09.26.14";
const MODAL_EXIT_DURATION_MS = 180;
const modalCloseTimers = new WeakMap();
const modalPreviousFocus = new WeakMap();
const AI_COACH_API = (() => {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return "https://gym-excise-plus.vercel.app/api/ai-coach";
  }
  if (location.hostname === "flyyang12-rgb.github.io") {
    return "https://gym-excise-plus.vercel.app/api/ai-coach";
  }
  return "/api/ai-coach";
})();

const defaultState = {
  heightCm: 185,
  weightKg: 70,
  workStartTime: "08:30",
  workEndTime: "17:30",
  goal: "muscleGain",
  trainDaysPerWeek: 4,
};

const goalConfig = {
  muscleGain: {
    label: "增肌",
    reason: "当前默认以增肌新手节奏安排",
    durationText: "50-70 分钟",
    stretch: "今天别求完美，先把动作做完。\n练 45-90 分钟，重量循序渐进。\n宁愿稳定多练，也别一上来拼废。",
    recovery: "肌肉不是练出来的，是恢复出来的。\n训练后 1 小时内补充蛋白质 + 碳水。\n吃够，比硬撑更重要。",
    nutrition: "睡眠是最便宜的增肌剂。\n每天尽量睡满 7-8 小时。\n恢复跟不上，训练白用功。",
  },
  fatLoss: {
    label: "减脂",
    reason: "每天两个不同的简单动作，最后以跑步或单车有氧为主",
    durationText: "27-43 分钟",
    stretch: "每天先做两个不同的简单动作，配重选轻。\n上器械先慢走或轻踩 5 分钟，再做正式有氧。\n结束前降速 5 分钟。",
    recovery: "训练后正常吃饭，补充蛋白质和主食。\n疲劳时缩短有氧，或改成轻松走路。\n前面的动作轻松做，不练到疲劳。",
    nutrition: "规律吃饭，少喝含糖饮料。\n每天尽量睡满 7-8 小时。\n先保持稳定的训练频率。",
  },
};

const equipmentLibrary = {
  treadmill: {
    name: "跑步机",
    image: "images/treadmill.jpg",
    useFor: ["热身快走", "定时慢跑", "训练后慢走", "恢复日有氧"],
    simple: "站上去先别跑，速度调到 4.5 到 6，先走 8 到 10 分钟，走到微微发热就够了。",
    standard: "能说话但有点喘，就是合适强度。",
  },
  elliptical: {
    name: "椭圆机",
    image: "images/elliptical.jpg",
    useFor: ["热身", "恢复日有氧"],
    simple: "双脚踩稳，双手扶住，先匀速踩 8 到 10 分钟，不要一开始就太快。",
    standard: "全程肩膀放松，不耸肩，不弓背。",
  },
  bike: {
    name: "动感单车",
    image: "images/bike.jpg",
    useFor: ["轻阻力热身", "定时匀速骑行", "轻踩放松"],
    simple: "先调整座椅，让踏板最低时膝盖仍微弯。坐姿轻踩 5 分钟，再按当天计划匀速骑行，结束前轻踩 5 分钟。",
    standard: "上身稳定、膝盖朝前，阻力以能顺畅踩动为准，不站起来冲刺。",
  },
  cable: {
    name: "综合训练器",
    image: "images/cable.jpg",
    useFor: ["坐姿器械推胸", "高位下拉", "坐姿器械伸腿", "绳索直臂下压", "绳索下压"],
    simple: "看到可以拉钢丝绳、可以挂把手的那台大器械，基本就是它。",
    standard: "重量先轻一点，先把动作路线学会。",
  },
  smith: {
    name: "史密斯架",
    image: "images/smith.jpg",
    useFor: ["史密斯深蹲", "史密斯卧推"],
    simple: "它是带固定轨道的杠铃架。新手做深蹲和卧推更稳。",
    standard: "先空杆或轻重量，不要一上来就加片。",
  },
  bench: {
    name: "卧推凳",
    image: "images/bench.jpg",
    useFor: ["哑铃卧推", "哑铃飞鸟", "坐姿推肩"],
    simple: "平的凳子适合卧推和飞鸟，带靠背的适合推肩。",
    standard: "头、背、臀贴住凳子，脚踩稳地面。",
  },
  dumbbell: {
    name: "哑铃区",
    image: "images/dumbbell.jpg",
    useFor: ["卧推", "飞鸟", "划船", "弯举", "侧平举", "推肩"],
    simple: "不会选重量，就拿你能稳稳做 10 次的轻重量。",
    standard: "慢慢举、慢慢放，比乱甩效果更好。",
  },
  mat: {
    name: "瑜伽垫",
    image: "images/yoga-mat.svg",
    useFor: ["垫上训练", "核心练习", "拉伸放松"],
    simple: "用于需要垫子的核心练习和拉伸。站姿热身在平整、防滑的地面上完成即可。",
    standard: "铺平、踩稳、不打滑，就是合适。",
  },
};

const tutorialLinks = {
  "平板卧推": "https://www.xiaohongshu.com/explore/684fd5020000000023013244?xsec_token=ABBEifVAJBlkEWQOYth_9ue8penPYDxvIlGg9UYbLfJWQ=&xsec_source=pc_search&source=web_explore_feed",
  "哑铃卧推": "https://www.xiaohongshu.com/discovery/item/679202130000000029036ca1?source=webshare&xhsshare=pc_web&xsec_token=ABaInPD7dtAZJgqAwYDCkbVzqY6QIs1VZuYM36KETGo_k=&xsec_source=pc_share",
  "绳索下压": "https://www.xiaohongshu.com/discovery/item/6946a2c1000000001d03d823?source=webshare&xhsshare=pc_web&xsec_token=ABVIBRKeSeeFgmGjFfPIV8EeyfzlacCzXKlNajs4etG8E=&xsec_source=pc_share",
  "核心收尾": "https://www.xiaohongshu.com/discovery/item/6868fc5b0000000011003d77?source=webshare&xhsshare=pc_web&xsec_token=AB-jxwVW5NMjX44jVM8oSnWHpIS29GV3CyNjpQ74XbQAM=&xsec_source=pc_share",
  "高位下拉": "https://www.xiaohongshu.com/discovery/item/694f169b000000001e023f3a?source=webshare&xhsshare=pc_web&xsec_token=ABVdf03TJ0VOyFfwsXUyLuLjE2Du8hQjoyV2XXl4ciNWw=&xsec_source=pc_share",
  "单臂哑铃划船": "https://www.xiaohongshu.com/discovery/item/68dd273d0000000007039e65?source=webshare&xhsshare=pc_web&xsec_token=ABDahkb7-hS6y-N-tSJdG-Q3LgQs7HX3Hoyc-Hlx1U4vM=&xsec_source=pc_share",
  "哑铃弯举": "https://www.xiaohongshu.com/discovery/item/68b05bf6000000001d00a317?source=webshare&xhsshare=pc_web&xsec_token=AByE-pqPmbHxJqEYe9ikDyWdlmWgRXYCK1Eu2SywEY0RM=&xsec_source=pc_share",
  "史密斯深蹲": "https://www.xiaohongshu.com/discovery/item/69b7fd9e0000000023015451?source=webshare&xhsshare=pc_web&xsec_token=ABNFQ8AtpwMw5M0RDVNjgmd8okp4kmVG1fxyfhrLltS7c=&xsec_source=pc_share",
  "罗马尼亚硬拉": "https://www.xiaohongshu.com/discovery/item/68ff6461000000000700e4b4?source=webshare&xhsshare=pc_web&xsec_token=ABnv2ymzwIkKlibNru8ESguuKfb6sec0201ZOU2VTlYSI=&xsec_source=pc_share",
  "箭步蹲": "https://www.xiaohongshu.com/discovery/item/687cf1100000000010011f86?source=webshare&xhsshare=pc_web&xsec_token=ABgZnxcMEx0Up474FafHoDZak9FfMRGHE-jIMF1CC0ns4=&xsec_source=pc_share",
  "卷腹 / 平板支撑": "https://www.xiaohongshu.com/discovery/item/698007e0000000000903966f?source=webshare&xhsshare=pc_web&xsec_token=ABVURntpEOPrbFJWAaBNFU9UIPjehUeSPBvyLgqlsDqgg=&xsec_source=pc_share",
  "哑铃推肩": "https://www.xiaohongshu.com/discovery/item/67680d9f00000000130187b1?source=webshare&xhsshare=pc_web&xsec_token=ABB602x13GKfW3HyzVsTxZPvVgRlPPYyZYuJsFh5nasb8=&xsec_source=pc_share",
  "侧平举": "https://www.xiaohongshu.com/discovery/item/6982c06c000000000b011d0a?source=webshare&xhsshare=pc_web&xsec_token=ABuJV8nbc9R2NKYf0dK-s9_F01eN4Cj9ijvTdwYcIGJAY=&xsec_source=pc_share",
  "俯身飞鸟": "https://www.xiaohongshu.com/discovery/item/697831b5000000002103c7d8?source=webshare&xhsshare=pc_web&xsec_token=ABQFHAX7O0_H-ldx3YRpHP6Ipxg7YE998IMhyf8AfAUkk=&xsec_source=pc_share",
  "二头或三头补强": "https://www.xiaohongshu.com/discovery/item/69d36e5100000000230043e8?source=webshare&xhsshare=pc_web&xsec_token=ABMbvFRFQjX6AImgfXH8wXgTJuMzut1trj8SFBNqGVrxM=&xsec_source=pc_share",
  "哑铃杯式深蹲": "https://www.xiaohongshu.com/discovery/item/684ecd9a000000002301ef1a?source=webshare&xhsshare=pc_web&xsec_token=ABmbalpfjo24GQCfIeZPmhHrs1AaAExfTegqP4OffhUYg=&xsec_source=pc_share",
  "俯卧撑或器械推胸": "https://www.xiaohongshu.com/discovery/item/67aacd16000000001701fc59?source=webshare&xhsshare=pc_web&xsec_token=ABSldK9m1C5aHXIpbChHOlhJwvLrOmSa-7vYsxfaZPGsI=&xsec_source=pc_share",
  "单车冲刺": "https://www.xiaohongshu.com/discovery/item/6945fec9000000001e0306e0?source=webshare&xhsshare=pc_web&xsec_token=ABj9-m5O9RFUfCz673bU-5YRJorJhWOsO8To0HPhPbtmc=&xsec_source=pc_share",
};

const planTemplates = {
  3: [
    { day: "周一", type: "train", key: "push" },
    { day: "周三", type: "train", key: "pull" },
    { day: "周五", type: "train", key: "legs" },
    { day: "周日", type: "recovery", key: "recovery" },
  ],
  4: [
    { day: "周一", type: "train", key: "push" },
    { day: "周二", type: "train", key: "pull" },
    { day: "周四", type: "train", key: "legs" },
    { day: "周六", type: "train", key: "shoulder" },
    { day: "周日", type: "recovery", key: "recovery" },
  ],
  5: [
    { day: "周一", type: "train", key: "push" },
    { day: "周二", type: "train", key: "pull" },
    { day: "周三", type: "train", key: "legs" },
    { day: "周五", type: "train", key: "shoulder" },
    { day: "周六", type: "train", key: "fullbody" },
    { day: "周日", type: "recovery", key: "recovery" },
  ],
};

const fatLossPlanTemplates = {
  3: [
    { day: "周一", type: "train", key: "matFlow1" },
    { day: "周三", type: "train", key: "matFlow2" },
    { day: "周五", type: "train", key: "matFlow3" },
    { day: "周日", type: "recovery", key: "matRecovery" },
  ],
  4: [
    { day: "周一", type: "train", key: "matFlow1" },
    { day: "周二", type: "train", key: "matFlow2" },
    { day: "周四", type: "train", key: "matFlow3" },
    { day: "周六", type: "train", key: "matFlow4" },
    { day: "周日", type: "recovery", key: "matRecovery" },
  ],
  5: [
    { day: "周一", type: "train", key: "matFlow1" },
    { day: "周二", type: "train", key: "matFlow2" },
    { day: "周三", type: "train", key: "matFlow3" },
    { day: "周五", type: "train", key: "matFlow4" },
    { day: "周六", type: "train", key: "matFlow5" },
    { day: "周日", type: "recovery", key: "matRecovery" },
  ],
};

// 保留 matFlow* 键和原来的周安排，使已有计划 ID 不变。
const fatLossExercisePairs = [
  [
  { name: "徒手浅蹲", sets: "热身 1 分钟 · 6-8 次", phase: "warmup", durationSeconds: 60, note: "不拿重量，只蹲一点；做完后轻松踏步，不做到腿酸。", stance: "双脚与肩同宽，脚掌完整踩地。", grip: "双手向前伸；需要时轻扶稳固支撑。", firstMove: "臀部稍向后，只做小幅下蹲，再踩稳站直。" },
  { name: "站姿提踵", sets: "热身 1 分钟 · 8-10 次", phase: "warmup", durationSeconds: 60, note: "双手扶稳，双脚一起缓慢踮起、落下，不追求酸胀。", stance: "双脚与髋同宽站在平地，膝盖微弯，不站台阶。", grip: "双手轻扶墙面或稳固扶手，不拿哑铃。", firstMove: "两侧脚跟一起缓慢抬起，停一下，再轻轻落回地面。" },
  ],
  [
    { name: "哑铃弯举", sets: "轻重量 · 2组 × 10次", phase: "strength", durationSeconds: 240, equipment: "dumbbell", note: "先选能稳稳做完的轻哑铃；组间休息 60-90 秒，不甩动身体。", stance: "双脚站稳，手肘贴近身体两侧。", grip: "双手各握一只轻哑铃，手腕保持直。", firstMove: "只弯曲手肘把哑铃举起，再缓慢放下。" },
    { name: "绳索下压", sets: "轻重量 · 2组 × 10次", phase: "strength", durationSeconds: 240, equipment: "cable", note: "用轻配重，手肘固定；组间休息 60-90 秒，不压到手肘锁死。", stance: "面向综合训练器站稳，手肘夹在身体两侧。", grip: "双手握住上方滑轮的下压把手。", firstMove: "把手从胸前向下压，再慢慢回到起点。" },
  ],
  [
    { name: "坐姿器械推胸", sets: "轻重量 · 2组 × 10次", phase: "strength", durationSeconds: 240, equipment: "cable", note: "调整座椅，让把手在胸旁；轻配重，组间休息 60-90 秒。", stance: "坐稳贴住靠垫，双脚踩地。", grip: "握住向前推的把手，不用夹胸臂。", firstMove: "把手向前推，再缓慢收回，身体不离开靠垫。" },
    { name: "坐姿高位下拉", sets: "轻重量 · 2组 × 10次", phase: "strength", durationSeconds: 240, equipment: "cable", note: "面向器材坐稳，横杆拉到胸前；轻配重，组间休息 60-90 秒。", stance: "面向立柱和配重片坐稳，压腿垫固定大腿，双脚踩地。", grip: "双手略宽于肩握住横杆，肩膀放松。", firstMove: "手肘向下带动横杆到锁骨下方，再缓慢送回。" },
  ],
  [
    { name: "坐姿器械伸腿", sets: "轻重量 · 2组 × 10次", phase: "strength", durationSeconds: 240, equipment: "cable", note: "用综合训练器的伸腿位置，配重选轻；组间休息 60-90 秒。", stance: "坐稳贴住靠垫，膝关节与伸腿转轴对齐，滚垫在小腿下端。", grip: "双手扶稳座椅侧边。", firstMove: "缓慢伸直小腿，不锁死膝盖，再慢慢放回。" },
    { name: "站姿屈膝", sets: "轻活动 1 分钟 · 每侧 6-8 次", phase: "warmup", durationSeconds: 60, note: "扶稳，不加重量；脚跟向后抬一点即可，不踢得很高。", stance: "站在稳固支撑旁，身体直立。", grip: "双手轻扶稳固支撑。", firstMove: "一侧脚跟向臀部方向抬起，再放回地面，左右换边。" },
  ],
  [
    { name: "站姿侧屈", sets: "轻活动 1 分钟 · 每侧 4-6 次", phase: "warmup", durationSeconds: 60, note: "不拿哑铃，只轻轻侧弯再回正，不停留在最大幅度。", stance: "双脚与髋同宽，膝盖微弯，骨盆保持稳定。", grip: "一手轻放头侧，另一手自然下垂，不拉扯头部。", firstMove: "上身向一侧小幅侧弯，再回正，左右交替。" },
    { name: "扶稳踝绕环", sets: "轻活动 1 分钟 · 每侧每方向 4-6 圈", phase: "warmup", durationSeconds: 60, note: "扶稳，不加重量；只转脚踝，膝盖和身体不跟着转。", stance: "站在稳固支撑旁，一只脚稍微抬离地面。", grip: "双手扶稳支撑，另一脚踩稳。", firstMove: "脚踝缓慢画小圈，顺、逆时针各做几圈，再换脚。" },
  ],
];

function createFatLossCardio(equipment, minutes, recovery = false, light = false) {
  const isBike = equipment === "bike";
  const name = isBike ? "动感单车匀速骑行" : recovery ? "跑步机快走" : "跑步机慢跑";
  const activity = isBike ? (light ? "轻松骑" : "匀速骑") : recovery ? "轻松走" : "慢跑";
  const warmup = isBike ? "轻踩热身" : "慢走热身";
  const cooldown = isBike ? "轻踩放松" : "慢走放松";
  return {
    name, sets: `${minutes + 10} 分钟`, durationSeconds: (minutes + 10) * 60, phase: "cardio", equipment,
    note: `热身 5 分钟 → ${activity} ${minutes} 分钟 → 放松 5 分钟。`,
    timerSegments: [
      { label: warmup, durationSeconds: 300 },
      { label: activity, durationSeconds: minutes * 60 },
      { label: cooldown, durationSeconds: 300 },
    ],
    stance: isBike ? "坐稳，踏板最低时膝盖仍微弯，膝盖朝前。" : "站上跑步机后夹好安全夹，身体直立，不趴扶手。",
    grip: isBike ? "双手轻扶车把，肩膀放松。" : "双手自然摆动，调速时短暂扶稳。",
    firstMove: isBike ? "从轻阻力慢踩开始，逐渐加快到能说完整句子的强度。" : recovery ? "从慢走开始，保持轻松走路的速度。" : "先慢走 5 分钟，再逐渐调到舒服的慢跑速度；吃力就改快走。",
  };
}

function createFatLossWorkout(pairIndex, equipment, minutes, light = false) {
  const equipmentName = equipmentLibrary[equipment].name;
  const pair = fatLossExercisePairs[pairIndex];
  const totalMinutes = pair.reduce((sum, exercise) => sum + exercise.durationSeconds / 60, minutes + 10);
  return {
    title: light ? "单车轻松骑" : equipment === "bike" ? "动感单车有氧" : "跑步机有氧",
    focus: ["臀腿、心肺", "手臂、心肺", "胸背、心肺", "腿部、心肺", "轻活动、心肺"][pairIndex],
    duration: `约 ${totalMinutes} 分钟`,
    warmupTitle: "两个简单动作 → 最后定时有氧",
    warmupText: "开始前先轻松踏步活动身体。每天两个动作不重复，徒手或用轻配重，不练到疲劳；最后按时间跑步或骑车。",
    tags: [light ? "轻活动" : "两个简单动作", equipmentName],
    exercises: [
      ...pair,
      createFatLossCardio(equipment, minutes, false, light),
    ],
  };
}

const fatLossWorkouts = {
  matFlow1: createFatLossWorkout(0, "treadmill", 20),
  matFlow2: createFatLossWorkout(1, "bike", 20),
  matFlow3: createFatLossWorkout(2, "treadmill", 25),
  matFlow4: createFatLossWorkout(3, "bike", 20),
  matFlow5: createFatLossWorkout(4, "bike", 15, true),
  matRecovery: {
    title: "恢复日",
    focus: "轻活动、放松",
    duration: "约 20 分钟 · 可休息",
    warmupTitle: "慢走 5 分钟 → 轻松走 10 分钟 → 降速 5 分钟",
    warmupText: "轻松走路，疲劳时直接休息。",
    tags: ["跑步机", "可休息"],
    exercises: [createFatLossCardio("treadmill", 10, true)],
  },
};

const workoutLibrary = {
  push: {
    title: "胸 + 三头",
    focus: "胸部、肱三头肌",
    duration: "约 60 分钟",
    warmupTitle: "热身先做：跑步机快走 8-10 分钟",
    warmupText: "胸日先把身体热起来，再活动肩关节和手肘。完全不会热身时，就先走跑步机。",
    tags: ["卧推凳", "综合训练器", "哑铃"],
    exercises: [
      {
        name: "平板卧推",
        sets: "4组 x 8-10次",
        note: "不会自由杠就先用史密斯卧推，更稳。",
        equipment: "bench",
        extraEquipment: "smith",
        stance: "人躺在卧推凳上，眼睛大概在杠铃正下方，双脚踩稳地面。",
        grip: "双手比肩稍宽握住杠或哑铃，手腕别往后折。",
        firstMove: "先把杠从架子上推出，慢慢下放到胸前，再往上推回去。",
      },
      {
        name: "哑铃卧推",
        sets: "3组 x 10次",
        note: "去哑铃区拿一对轻重量哑铃，先把动作做稳。",
        equipment: "dumbbell",
        extraEquipment: "bench",
        stance: "坐在卧推凳前端，哑铃先放大腿上，再顺势躺下。",
        grip: "双手各握一只哑铃，掌心朝脚方向或略微相对。",
        firstMove: "哑铃先放胸旁边，再一起往上推到手快伸直的位置。",
      },
      {
        name: "哑铃飞鸟",
        sets: "3组 x 12次",
        note: "用两只 5 kg 哑铃，在平卧推凳上做飞鸟。手肘微弯，慢慢打开，再合回胸口上方。",
        equipment: "dumbbell",
        extraEquipment: "bench",
        stance: "仰躺在平卧推凳上，双脚踩稳地面，肩胛保持稳定。",
        grip: "双手各握一只 5 kg 哑铃，掌心相对，手肘保持微弯。",
        firstMove: "从胸口上方沿弧线向两侧打开，再沿原路合拢；保持手肘角度，不做成卧推。",
      },
      {
        name: "绳索下压",
        sets: "3组 x 12次",
        note: "主要练手臂后侧，手肘尽量别乱动。",
        equipment: "cable",
        stance: "站在综合训练器前，身体微微前倾，手肘夹在身体两侧。",
        grip: "双手握住下压把手或绳索，手腕保持稳。",
        firstMove: "从胸口附近开始，往下压到手快伸直，再慢慢回到起点。",
      },
      {
        name: "核心收尾",
        sets: "2组",
        note: "做平板支撑或卷腹就行。",
        stance: "平板支撑时前臂撑地，身体成一条线；卷腹时平躺屈膝。",
        grip: "平板支撑不需要握器械；卷腹双手轻放头侧，不要硬拽脖子。",
        firstMove: "平板先收紧肚子再撑起来；卷腹先呼气，再把肩膀带起来。",
      },
    ],
  },
  pull: {
    title: "背 + 二头",
    focus: "背部、肱二头肌",
    duration: "约 60 分钟",
    warmupTitle: "热身先做：椭圆机或跑步机 8-10 分钟",
    warmupText: "背日热身后，再活动肩关节，先让肩膀和背部醒过来。",
    tags: ["综合训练器", "哑铃"],
    exercises: [
      {
        name: "高位下拉",
        sets: "4组 x 8-10次",
        note: "面向综合训练器坐稳，握住上方横杆，拉向锁骨下方，只做胸前下拉。",
        equipment: "cable",
        stance: "面向器材的立柱和配重片坐稳，按器材标识调整座椅和压腿垫，双脚踩地，胸口打开。",
        grip: "双手比肩略宽握住上方横杆，横杆保持在头部前方。",
        firstMove: "先沉肩，再把横杆拉到锁骨下方，回去时慢慢送到手臂接近伸直。",
      },
      {
        name: "绳索直臂下压",
        sets: "3组 x 12次",
        note: "把直杆或绳索接到上方滑轮，站在器械前完成，占地更小。",
        equipment: "cable",
        stance: "面向器械退半步，双脚与肩同宽，膝盖微屈，身体轻微前倾。",
        grip: "双手与肩同宽握直杆或绳索，手臂接近伸直，肘部保留一点弯曲。",
        firstMove: "固定肘部角度，用背部把手柄从胸前沿弧线压到大腿前侧。",
      },
      {
        name: "单臂哑铃划船",
        sets: "3组 x 10次",
        note: "一只手扶凳子，一只手拉哑铃，左右各做。",
        equipment: "dumbbell",
        extraEquipment: "bench",
        stance: "一只手一只膝盖撑凳子，另一只脚踩地保持稳定。",
        grip: "另一只手握住哑铃，手臂自然下垂。",
        firstMove: "从下方把哑铃往腰侧拉，不是往肩膀拉。",
      },
      {
        name: "哑铃弯举",
        sets: "3组 x 12次",
        note: "站着举哑铃，别甩身体借力。",
        equipment: "dumbbell",
        stance: "站直，脚与肩差不多宽，手臂贴近身体两侧。",
        grip: "双手握哑铃，掌心朝前或略朝里。",
        firstMove: "从手臂自然下垂开始，弯曲手肘把哑铃举起来。",
      },
    ],
  },
  legs: {
    title: "腿 + 核心",
    focus: "大腿、臀部、核心",
    duration: "约 65 分钟",
    warmupTitle: "热身先做：单车或跑步机 8-10 分钟",
    warmupText: "腿日先把下肢热起来，再活动髋、膝、踝。",
    tags: ["史密斯架", "哑铃", "卧推凳"],
    exercises: [
      {
        name: "史密斯深蹲",
        sets: "4组 x 8-10次",
        note: "先空杆试动作，感觉稳了再慢慢加。",
        equipment: "smith",
        stance: "站在杠下，双脚比肩略宽，脚尖微微朝外。",
        grip: "双手握住杠，放在肩膀两侧外一点的位置。",
        firstMove: "先把杠解锁，屁股往后坐再往下蹲，起身时脚踩地站起来。",
      },
      {
        name: "罗马尼亚硬拉",
        sets: "3组 x 10次",
        note: "重点感觉大腿后侧被拉伸。",
        equipment: "dumbbell",
        stance: "站直，双脚与胯差不多宽。",
        grip: "双手各握一只哑铃，放在大腿前侧。",
        firstMove: "屁股先往后推，哑铃顺着腿往下滑，再站起来。",
      },
      {
        name: "箭步蹲",
        sets: "3组 x 10次",
        note: "完全不会时先徒手做，再拿轻哑铃。",
        equipment: "dumbbell",
        stance: "一只脚往前跨大一点，前后站开。",
        grip: "进阶时双手各拿一只轻哑铃，初学可先空手。",
        firstMove: "身体直着往下，不是往前扑，前腿踩稳再站回去。",
      },
      {
        name: "卷腹 / 平板支撑",
        sets: "3组",
        note: "找空地就能做。",
        stance: "卷腹平躺屈膝；平板支撑前臂撑地。",
        grip: "不需要握器械，重点是核心收紧。",
        firstMove: "先把肚子收紧，再开始动作。",
      },
    ],
  },
  shoulder: {
    title: "肩 + 全身补强",
    focus: "肩部、上肢补强",
    duration: "约 55 分钟",
    warmupTitle: "热身先做：跑步机或椭圆机 8 分钟 + 肩绕环",
    warmupText: "肩日一定先活动肩关节，不然很容易别扭。",
    tags: ["哑铃", "综合训练器"],
    exercises: [
      {
        name: "哑铃推肩",
        sets: "4组 x 8-10次",
        note: "坐在靠背凳上做更稳。",
        equipment: "bench",
        extraEquipment: "dumbbell",
        stance: "坐在有靠背的凳子上，背贴住靠背，脚踩稳。",
        grip: "双手各握一只哑铃，放在肩膀两侧。",
        firstMove: "从肩旁把哑铃往上推，快伸直时停住，再慢慢放下。",
      },
      {
        name: "侧平举",
        sets: "3组 x 12次",
        note: "拿轻哑铃，不要甩。",
        equipment: "dumbbell",
        stance: "站直，双脚自然打开，身体别晃。",
        grip: "双手各拿轻哑铃，手臂自然下垂。",
        firstMove: "把手臂往身体两侧抬到接近肩高，再慢慢放下。",
      },
      {
        name: "俯身飞鸟",
        sets: "3组 x 12次",
        note: "练肩后束，动作慢些。",
        equipment: "dumbbell",
        stance: "身体前倾，背尽量保持平稳，膝盖微屈。",
        grip: "双手各握轻哑铃，手肘略微弯曲。",
        firstMove: "从下方两侧往外打开，不是耸肩提起来。",
      },
      {
        name: "二头或三头补强",
        sets: "2-3组",
        note: "不会选时优先做哑铃弯举。",
        equipment: "dumbbell",
        stance: "站稳就行，动作不用急。",
        grip: "双手握轻哑铃。",
        firstMove: "先选一个熟悉动作，再稳稳做完。",
      },
    ],
  },
  fullbody: {
    title: "全身循环补强",
    focus: "全身、心肺、动作熟练度",
    duration: "约 50 分钟",
    warmupTitle: "热身先做：单车 8 分钟",
    warmupText: "第五练不追重量，主要让全身都动起来。",
    tags: ["哑铃", "单车", "综合训练器"],
    exercises: [
      {
        name: "哑铃杯式深蹲",
        sets: "3组 x 12次",
        note: "双手抱一个哑铃放胸前。",
        equipment: "dumbbell",
        stance: "双脚比肩略宽站稳。",
        grip: "双手抱住一个哑铃一端，贴近胸前。",
        firstMove: "屁股往后坐再下蹲，站起时脚踩稳地面。",
      },
      {
        name: "俯卧撑或器械推胸",
        sets: "3组 x 10-12次",
        note: "俯卧撑做不了太多就改器械版本。",
        equipment: "cable",
        stance: "俯卧撑时双手撑地；器械推胸时坐稳。",
        grip: "手掌撑地或双手握推胸把手。",
        firstMove: "从起始位稳稳推开，再慢慢回去。",
      },
      {
        name: "高位下拉",
        sets: "3组 x 10次",
        note: "面向综合训练器，继续用上方横杆，只做胸前下拉。",
        equipment: "cable",
        stance: "面向器材坐稳，按器材标识调整座椅和压腿垫，双脚踩地，胸口打开。",
        grip: "双手略宽握住横杆，横杆始终位于头部前方。",
        firstMove: "先沉肩，再把横杆拉到锁骨下方。",
      },
      {
        name: "单车冲刺",
        sets: "6轮 x 30秒",
        note: "30 秒快踩，60 秒慢踩。",
        equipment: "bike",
        stance: "坐稳，脚踩好踏板。",
        grip: "双手扶住把手，身体别晃。",
        firstMove: "先慢踩 1 分钟，再开始第一轮快踩。",
      },
    ],
  },
  recovery: {
    title: "恢复日",
    focus: "轻有氧、拉伸、放松",
    duration: "约 30-40 分钟",
    warmupTitle: "恢复日就不用上强度",
    warmupText: "今天重点是轻松活动，不是把自己练累。",
    tags: ["跑步机", "椭圆机", "单车"],
    exercises: [
      {
        name: "跑步机快走",
        sets: "15-20 分钟",
        note: "速度不用快，重点是让身体发热。",
        equipment: "treadmill",
        stance: "站稳，两脚自然走路就行。",
        grip: "刚开始可轻扶把手，适应后尽量自然摆臂。",
        firstMove: "先从慢速开始，再调到舒服的快走速度。",
      },
      {
        name: "椭圆机或单车",
        sets: "10-15 分钟",
        note: "轻松踩，给腿放松一下。",
        equipment: "elliptical",
        extraEquipment: "bike",
        stance: "站稳或坐稳，整个人保持放松。",
        grip: "轻扶把手就行。",
        firstMove: "先低阻力开始，找到顺畅节奏。",
      },
      {
        name: "全身拉伸",
        sets: "8-10 分钟",
        note: "胸、背、髋、腿后侧都放松一下。",
        stance: "找空地站稳或坐稳。",
        grip: "不需要器械。",
        firstMove: "每个部位拉到有感觉就停住，保持呼吸。",
      },
    ],
  },
};

let state = { ...defaultState };
let progressStore = loadProgressStore();
let trainingNotes = loadTrainingNotes();
let activeDayId = "";
let activeExerciseIndex = 0;
let stepMotion = "forward";
let activeGuideTab = "steps";
let restTimerId = null;
let restState = null;
let exerciseTimerState = null;
let exerciseTimerId = null;
let exerciseTimerSoundEnabled = false;
let exerciseTimerAudioContext = null;
let exerciseTimerSoundMessage = "";
const EXERCISE_MEDIA_ENABLED = [
  "localhost",
  "127.0.0.1",
  "flyyang12-rgb.github.io",
].includes(window.location.hostname);
let activeModule = "training";
let returnScrollY = null;

const elements = {
  heightCm: document.querySelector("#heightCm"),
  weightKg: document.querySelector("#weightKg"),
  workStartTime: document.querySelector("#workStartTime"),
  workEndTime: document.querySelector("#workEndTime"),
  goal: document.querySelector("#goal"),
  goalTabs: document.querySelector("#goalTabs"),
  weeklyPlan: document.querySelector("#weeklyPlan"),
  frequencyTabs: document.querySelector("#frequencyTabs"),
  resetButton: document.querySelector("#resetButton"),
  heroFrequency: document.querySelector("#heroFrequency"),
  heroDuration: document.querySelector("#heroDuration"),
  bmiValue: document.querySelector("#bmiValue"),
  bmiLabel: document.querySelector("#bmiLabel"),
  recommendedStart: document.querySelector("#recommendedStart"),
  recommendedDuration: document.querySelector("#recommendedDuration"),
  goalSummary: document.querySelector("#goalSummary"),
  overviewHint: document.querySelector("#overviewHint"),
  calendarFrequency: document.querySelector("#calendarFrequency"),
  calendarStrip: document.querySelector("#calendarStrip"),
  calendarWorkStart: document.querySelector("#calendarWorkStart"),
  calendarWorkEnd: document.querySelector("#calendarWorkEnd"),
  calendarStartWindow: document.querySelector("#calendarStartWindow"),
  tonightTitle: document.querySelector("#tonightTitle"),
  tonightMeta: document.querySelector("#tonightMeta"),
  exerciseList: document.querySelector("#exerciseList"),
  checkinButton: document.querySelector("#checkinButton"),
  todayProgress: document.querySelector("#todayProgress"),
  equipmentGrid: document.querySelector("#equipmentGrid"),
  dietGuide: document.querySelector("#dietGuide"),
  versionBadge: document.querySelector("#versionBadge"),
  stretchText: document.querySelector("#stretchText"),
  recoveryText: document.querySelector("#recoveryText"),
  nutritionText: document.querySelector("#nutritionText"),
  appModules: document.querySelectorAll("[data-module]"),
  moduleButtons: document.querySelectorAll("[data-module-target]"),
  backToWorkoutButton: document.querySelector("#backToWorkoutButton"),
  backToTopButton: document.querySelector("#backToTopButton"),
  bmiOpenButton: document.querySelector("#bmiOpenButton"),
  aiObserveButton: document.querySelector("#aiObserveButton"),
  bmiModal: document.querySelector("#bmiModal"),
  bmiModalBackdrop: document.querySelector("#bmiModalBackdrop"),
  bmiModalClose: document.querySelector("#bmiModalClose"),
  bmiModalApply: document.querySelector("#bmiModalApply"),
  bmiHeightInput: document.querySelector("#bmiHeightInput"),
  bmiWeightInput: document.querySelector("#bmiWeightInput"),
  bmiModalValue: document.querySelector("#bmiModalValue"),
  bmiModalLabel: document.querySelector("#bmiModalLabel"),
  aiModal: document.querySelector("#aiModal"),
  aiModalBackdrop: document.querySelector("#aiModalBackdrop"),
  aiModalClose: document.querySelector("#aiModalClose"),
  aiContextCard: document.querySelector("#aiContextCard"),
  aiChatLog: document.querySelector("#aiChatLog"),
  aiQuestionForm: document.querySelector("#aiQuestionForm"),
  aiQuestionInput: document.querySelector("#aiQuestionInput"),
  aiAskButton: document.querySelector("#aiAskButton"),
  aiQuickPrompts: document.querySelector(".ai-quick-prompts"),
  tutorialSheet: document.querySelector("#tutorialSheet"),
  tutorialSheetBackdrop: document.querySelector("#tutorialSheetBackdrop"),
  tutorialSheetPanel: document.querySelector(".tutorial-sheet-panel"),
  tutorialSheetHandle: document.querySelector("#tutorialSheetHandle"),
  tutorialSheetClose: document.querySelector("#tutorialSheetClose"),
  tutorialSheetContinue: document.querySelector("#tutorialSheetContinue"),
  tutorialSheetTitle: document.querySelector("#tutorialSheetTitle"),
  tutorialSheetSummary: document.querySelector("#tutorialSheetSummary"),
  tutorialSheetCue: document.querySelector("#tutorialSheetCue"),
  tutorialSheetSteps: document.querySelector("#tutorialSheetSteps"),
  tutorialSheetMistakes: document.querySelector("#tutorialSheetMistakes"),
  tutorialSheetFigure: document.querySelector("#tutorialSheetFigure"),
  tutorialSheetImage: document.querySelector("#tutorialSheetImage"),
  tutorialSheetMediaCredit: document.querySelector("#tutorialSheetMediaCredit"),
  tutorialSheetMediaKind: document.querySelector("#tutorialSheetMediaKind"),
  tutorialSheetMediaFallback: document.querySelector("#tutorialSheetMediaFallback"),
  tutorialSheetExternal: document.querySelector("#tutorialSheetExternal"),
  noteAddButton: document.querySelector("#noteAddButton"),
  noteForm: document.querySelector("#noteForm"),
  noteInput: document.querySelector("#noteInput"),
  noteCancelButton: document.querySelector("#noteCancelButton"),
  noteList: document.querySelector("#noteList"),
};

function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${date}`;
}

function loadProgressStore() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveProgressStore() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progressStore));
}

function loadTrainingNotes() {
  try {
    return JSON.parse(localStorage.getItem(TRAINING_NOTES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTrainingNotes() {
  localStorage.setItem(TRAINING_NOTES_KEY, JSON.stringify(trainingNotes));
}

function getBmiInfo(heightCm, weightKg) {
  if (!heightCm || !weightKg) {
    return { bmi: "--", label: "请补全身高和体重", status: "信息不足" };
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let label = "正常范围";
  let status = "标准体重";

  if (bmi < 18.5) {
    label = "偏轻";
    status = "标准偏轻";
  } else if (bmi >= 24 && bmi < 28) {
    label = "超重";
    status = "体重偏高";
  } else if (bmi >= 28) {
    label = "肥胖";
    status = "建议先控脂";
  }

  return { bmi: bmi.toFixed(1), label, status };
}

function getRecommendedFrequency(goal) {
  return goal === "fatLoss" ? 4 : 4;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getGoalSummary(goal) {
  if (goal === "muscleGain") {
    return "先稳住频率，再逐步加重量";
  }
  return "每天两个不同的简单动作 → 跑步机 / 单车定时有氧";
}

function getOverviewHint(goal, bmiInfo) {
  if (bmiInfo.label === "偏轻" && goal === "muscleGain") {
    return "你现在更适合走稳一点的增肌路线：先把一周节奏固定，再把吃饭和睡眠跟上。";
  }
  if (goal === "fatLoss") {
    return "每天两个不同的简单动作，徒手或用轻配重，不练到疲劳；最后以跑步或单车有氧为主。跑不动就快走，按能坚持的时间完成。";
  }
  return "你现在更适合先把训练节奏固定下来，再慢慢加重量和动作熟练度。";
}

function getStartWindow(workEndTime) {
  if (!workEndTime) return "18:30-20:00";
  const [hour, minute] = workEndTime.split(":").map(Number);
  const startMinutes = hour * 60 + minute + 60;
  const endMinutes = startMinutes + 90;
  const pad = (value) => String(value).padStart(2, "0");
  const start = `${pad(Math.floor(startMinutes / 60) % 24)}:${pad(startMinutes % 60)}`;
  const end = `${pad(Math.floor(endMinutes / 60) % 24)}:${pad(endMinutes % 60)}`;
  return `${start}-${end}`;
}

function cloneWorkout(key, goal) {
  if (goal === "fatLoss") {
    const workout = JSON.parse(JSON.stringify(fatLossWorkouts[key]));
    workout.goal = goal;
    return workout;
  }

  return JSON.parse(JSON.stringify(workoutLibrary[key]));
}

function getPlanByFrequency(frequency, goal) {
  const sourceTemplates = goal === "fatLoss" ? fatLossPlanTemplates : planTemplates;
  return sourceTemplates[frequency].map((item, index) => {
    const workout = cloneWorkout(item.key, goal);
    return {
      id: `${item.day}-${item.key}-${index}`,
      day: item.day,
      type: item.type,
      key: item.key,
      ...workout,
    };
  });
}

function getCurrentPlan() {
  return getPlanByFrequency(state.trainDaysPerWeek, state.goal);
}

function getWeekdayIndex(dayLabel) {
  const weekdayMap = {
    "周日": 0,
    "周一": 1,
    "周二": 2,
    "周三": 3,
    "周四": 4,
    "周五": 5,
    "周六": 6,
  };

  return weekdayMap[dayLabel] ?? 0;
}

function getNearestPlanId(plan) {
  if (!plan.length) return "";

  const today = new Date().getDay();
  let nearestItem = plan[0];
  let nearestGap = 7;

  plan.forEach((item) => {
    const gap = (getWeekdayIndex(item.day) - today + 7) % 7;
    if (gap < nearestGap) {
      nearestGap = gap;
      nearestItem = item;
    }
  });

  return nearestItem?.id || "";
}

function getActiveWorkout() {
  const plan = getCurrentPlan();
  return plan.find((item) => item.id === activeDayId) || plan.find((item) => item.id === getNearestPlanId(plan)) || plan[0];
}

function resetExerciseStepper() {
  cancelRestTimer();
  cancelExerciseTimer();
  activeExerciseIndex = 0;
  stepMotion = "forward";
}

function cancelExerciseTimer() {
  if (exerciseTimerId !== null) window.clearInterval(exerciseTimerId);
  exerciseTimerId = null;
  exerciseTimerState = null;
}

function getExerciseTimerRemaining(exercise) {
  if (!exerciseTimerState) return exercise.durationSeconds;
  return exerciseTimerState.endAt === null
    ? exerciseTimerState.remaining
    : window.ExerciseGuides.getRemainingRestSeconds(exerciseTimerState.endAt);
}

function formatExerciseTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function getExerciseTimerStageInfo(exercise, remaining) {
  const segments = exercise.timerSegments || [];
  if (remaining <= 0) {
    return { index: segments.length, title: "本次有氧结束", label: "已结束", phase: "complete", remaining: 0 };
  }
  let elapsed = exercise.durationSeconds - Math.min(remaining, exercise.durationSeconds);
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (elapsed < segment.durationSeconds) {
      const phase = index === 0 ? "warmup" : index === segments.length - 1 ? "cooldown" : "cardio";
      const title = { warmup: "热身", cardio: "正式有氧", cooldown: "放松" }[phase];
      return { index, title, label: segment.label, phase, remaining: segment.durationSeconds - elapsed };
    }
    elapsed -= segment.durationSeconds;
  }
  return { index: 0, title: "有氧", label: "有氧", phase: "cardio", remaining };
}

function getExerciseTimerStage(exercise, remaining) {
  return getExerciseTimerStageInfo(exercise, remaining).label;
}

function updateExerciseTimerSoundDisplay() {
  const button = elements.exerciseList.querySelector("[data-exercise-timer-sound]");
  const note = elements.exerciseList.querySelector("[data-exercise-timer-sound-note]");
  if (button) {
    button.textContent = `声音提醒：${exerciseTimerSoundEnabled ? "开" : "关"}`;
    button.setAttribute("aria-pressed", String(exerciseTimerSoundEnabled));
  }
  const message = exerciseTimerSoundMessage || (exerciseTimerSoundEnabled
    ? "阶段切换和结束时短响；锁屏后提醒可能延迟。"
    : "开启时会试听，阶段切换和结束时提醒。");
  if (note && note.textContent !== message) note.textContent = message;
}

async function prepareExerciseTimerAudio() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      exerciseTimerSoundMessage = "当前浏览器不支持声音，仍可看阶段提示。";
      exerciseTimerSoundEnabled = false;
      updateExerciseTimerSoundDisplay();
      return false;
    }
    // 只在用户点击声音开关、开始或继续时创建 / 恢复，遵循浏览器播放规则。
    if (!exerciseTimerAudioContext || exerciseTimerAudioContext.state === "closed") {
      exerciseTimerAudioContext = new AudioContextClass();
    }
    if (exerciseTimerAudioContext.state !== "running") await exerciseTimerAudioContext.resume();
    if (exerciseTimerAudioContext.state !== "running") throw new Error("audio_not_running");
    return true;
  } catch {
    exerciseTimerSoundEnabled = false;
    exerciseTimerSoundMessage = "声音未开启，请再点一次。";
    updateExerciseTimerSoundDisplay();
    return false;
  }
}

function playExerciseTimerSound(finished = false) {
  if (!exerciseTimerSoundEnabled || exerciseTimerAudioContext?.state !== "running") return;
  try {
    const context = exerciseTimerAudioContext;
    const frequencies = finished ? [660, 880, 1046] : [660, 880];
    frequencies.forEach((frequency, index) => {
      const startAt = context.currentTime + index * 0.2;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, startAt);
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.06, startAt + 0.015);
      gain.gain.linearRampToValueAtTime(0, startAt + 0.15);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.17);
    });
  } catch {
    exerciseTimerSoundEnabled = false;
    exerciseTimerSoundMessage = "声音暂不可用，仍可看阶段提示。";
    updateExerciseTimerSoundDisplay();
  }
}

async function toggleExerciseTimerSound() {
  exerciseTimerSoundEnabled = !exerciseTimerSoundEnabled;
  exerciseTimerSoundMessage = "";
  updateExerciseTimerSoundDisplay();
  if (exerciseTimerSoundEnabled && await prepareExerciseTimerAudio()) playExerciseTimerSound();
}

function updateExerciseTimerDisplay() {
  const exercise = getActiveWorkout()?.exercises[activeExerciseIndex];
  if (!exercise?.timerSegments) return;
  const remaining = getExerciseTimerRemaining(exercise);
  const stage = getExerciseTimerStageInfo(exercise, remaining);
  const wasRunning = exerciseTimerState?.endAt != null;
  if (wasRunning && exerciseTimerState.stageIndex !== stage.index) {
    exerciseTimerState.stageIndex = stage.index;
    // 后台恢复后只提示当前阶段一次，不补播错过的阶段。
    playExerciseTimerSound(remaining === 0);
  }
  if (exerciseTimerState && remaining === 0) {
    window.clearInterval(exerciseTimerId);
    exerciseTimerId = null;
    exerciseTimerState.remaining = 0;
    exerciseTimerState.endAt = null;
  }
  const running = exerciseTimerState?.endAt != null;
  const number = elements.exerciseList.querySelector("[data-exercise-seconds]");
  const button = elements.exerciseList.querySelector("[data-exercise-timer-toggle]");
  const status = elements.exerciseList.querySelector("[data-exercise-timer-status]");
  const timer = elements.exerciseList.querySelector("[data-exercise-timer]");
  const title = elements.exerciseList.querySelector("[data-exercise-timer-phase]");
  const stateBadge = elements.exerciseList.querySelector("[data-exercise-timer-state]");
  const detail = elements.exerciseList.querySelector("[data-exercise-stage-remaining]");
  if (number) number.textContent = formatExerciseTime(remaining);
  if (button) button.textContent = running ? "暂停" : remaining === 0 ? "重来" : exerciseTimerState ? "继续" : "开始";
  if (timer) timer.dataset.timerPhase = stage.phase;
  if (title) title.textContent = stage.title;
  if (stateBadge) stateBadge.textContent = remaining === 0 ? "已结束" : running ? "进行中" : exerciseTimerState ? "已暂停" : "未开始";
  if (detail) detail.textContent = remaining === 0
    ? "放慢速度，准备收尾；完成后勾选。"
    : `${stage.label} · 本阶段剩余 ${formatExerciseTime(stage.remaining)}`;
  elements.exerciseList.querySelectorAll("[data-exercise-stage]").forEach((item) => {
    const index = Number(item.dataset.exerciseStage);
    item.classList.toggle("is-active", index === stage.index);
    item.classList.toggle("is-done", index < stage.index);
    if (index === stage.index) item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  });
  const statusText = remaining === 0
    ? "时间到，勾选完成"
    : `${running ? "正在" : exerciseTimerState ? "已暂停：" : "准备"}${stage.title} · ${stage.label}`;
  if (status && status.textContent !== statusText) status.textContent = statusText;
  updateExerciseTimerSoundDisplay();
}

function toggleExerciseTimer() {
  const exercise = getActiveWorkout()?.exercises[activeExerciseIndex];
  if (!exercise?.timerSegments) return;
  const wasRunning = exerciseTimerState?.endAt != null;
  updateExerciseTimerDisplay();
  const remaining = getExerciseTimerRemaining(exercise);
  // 若按钮点击前已到时，只更新结束提示，避免旧“暂停”点击意外重开。
  if (wasRunning && remaining === 0) return;
  if (exerciseTimerState?.endAt != null) {
    window.clearInterval(exerciseTimerId);
    exerciseTimerId = null;
    exerciseTimerState = { ...exerciseTimerState, remaining, endAt: null };
  } else {
    const restartRemaining = remaining || exercise.durationSeconds;
    exerciseTimerState = {
      remaining: restartRemaining,
      endAt: Date.now() + restartRemaining * 1000,
      stageIndex: getExerciseTimerStageInfo(exercise, restartRemaining).index,
    };
    if (exerciseTimerSoundEnabled) void prepareExerciseTimerAudio();
    exerciseTimerId = window.setInterval(updateExerciseTimerDisplay, 250);
  }
  updateExerciseTimerDisplay();
}

function cancelRestTimer() {
  if (restTimerId) window.clearInterval(restTimerId);
  restTimerId = null;
  restState = null;
}

function finishRestTimer() {
  if (!restState) return;
  const nextIndex = restState.nextIndex;
  cancelRestTimer();
  activeExerciseIndex = nextIndex;
  activeGuideTab = "steps";
  stepMotion = "forward";
  renderWorkout();
}

function updateRestTimerDisplay() {
  if (!restState) return;
  const remaining = window.ExerciseGuides.getRemainingRestSeconds(restState.endAt);
  restState.remaining = remaining;
  const number = elements.exerciseList.querySelector("[data-rest-seconds]");
  const ring = elements.exerciseList.querySelector("[data-rest-ring]");
  if (number) number.textContent = String(remaining);
  if (ring) ring.style.setProperty("--rest-progress", `${(remaining / restState.duration) * 360}deg`);
  if (remaining <= 0) finishRestTimer();
}

function startRestTimer(nextIndex) {
  cancelRestTimer();
  const duration = 60;
  restState = { duration, remaining: duration, endAt: Date.now() + duration * 1000, nextIndex };
  renderWorkout();
  restTimerId = window.setInterval(updateRestTimerDisplay, 250);
}

function adjustActiveRest(delta) {
  if (!restState) return;
  const remaining = window.ExerciseGuides.getRemainingRestSeconds(restState.endAt);
  const adjusted = window.ExerciseGuides.adjustRestDuration(remaining, delta);
  restState.duration = adjusted;
  restState.remaining = adjusted;
  restState.endAt = Date.now() + adjusted * 1000;
  updateRestTimerDisplay();
}

function getExerciseProgressMap(workout) {
  const dayStore = progressStore[todayKey()] || {};
  const saved = dayStore[workout.id] || {};
  // 改名后沿用旧动作记录；新名称的明确勾选或取消优先。
  if (saved["哑铃飞鸟"] === undefined && saved["夹胸 / 飞鸟"] !== undefined) {
    return { ...saved, "哑铃飞鸟": saved["夹胸 / 飞鸟"] };
  }
  return saved;
}

function countCompletedExercises(workout) {
  const progress = getExerciseProgressMap(workout);
  const total = workout.exercises.length;
  const completed = workout.exercises.filter((exercise) => progress[exercise.name]).length;
  return { completed, total };
}

function isWorkoutComplete(workout) {
  const { completed, total } = countCompletedExercises(workout);
  return total > 0 && completed === total;
}

function setExerciseCompleted(workoutId, exerciseName, checked) {
  const day = todayKey();
  progressStore[day] = progressStore[day] || {};
  progressStore[day][workoutId] = progressStore[day][workoutId] || {};
  progressStore[day][workoutId][exerciseName] = checked;
  saveProgressStore();
}

function completeWorkout(workout) {
  workout.exercises.forEach((exercise) => {
    setExerciseCompleted(workout.id, exercise.name, true);
  });
}

function populateInputs() {
  elements.heightCm.value = state.heightCm ?? "";
  elements.weightKg.value = state.weightKg ?? "";
  elements.workStartTime.value = state.workStartTime;
  elements.workEndTime.value = state.workEndTime;
  elements.goal.value = state.goal;
}

function getAiContextText() {
  const bmiInfo = getBmiInfo(Number(state.heightCm), Number(state.weightKg));
  const workout = getActiveWorkout();
  const goalLabel = goalConfig[state.goal]?.label || "训练";
  const workoutText = workout ? `今天是「${workout.title}」` : "今天还没选训练日";
  return `${goalLabel} · BMI ${bmiInfo.bmi}（${bmiInfo.label}） · ${workoutText}`;
}

function getAiCoachContext() {
  const workout = getActiveWorkout();
  const bmiInfo = getBmiInfo(Number(state.heightCm), Number(state.weightKg));

  return {
    summary: getAiContextText(),
    profile: {
      heightCm: state.heightCm,
      weightKg: state.weightKg,
      bmi: bmiInfo.bmi,
      bmiLabel: bmiInfo.label,
      goal: goalConfig[state.goal]?.label || state.goal,
      trainDaysPerWeek: state.trainDaysPerWeek,
    },
    todayWorkout: workout
      ? {
          title: workout.title,
          focus: workout.focus,
          duration: workout.duration,
          currentExercise: workout.exercises?.[activeExerciseIndex]?.name || "",
          exercises: workout.exercises.map((exercise) => ({
            name: exercise.name,
            sets: exercise.sets,
            note: exercise.note,
          })),
        }
      : null,
  };
}

function renderAiContext() {
  if (!elements.aiContextCard) return;
  elements.aiContextCard.textContent = `${getAiContextText()}。优先给安全、适合新手的建议。`;
}

function buildAiCoachAnswer(question) {
  const text = question.trim();
  const normalized = text.toLowerCase();
  const workout = getActiveWorkout();
  const workoutTitle = workout ? workout.title : "今天的训练";
  const currentExercise = workout?.exercises?.[activeExerciseIndex]?.name;
  const hasLegSignal = /腿|膝|髋|脚|踝|小腿|大腿|臀|深蹲|箭步|硬拉|单车/.test(text);
  const hasKneeSignal = /膝|膝盖|深蹲|箭步/.test(text);
  const hasBackSignal = /腰|背痛|下背|硬拉/.test(text);
  const hasShoulderSignal = /肩|手腕|腕|肘|胳膊|手臂/.test(text);
  const hasSorenessSignal = /酸|酸痛|疲劳|累|恢复|抽筋/.test(text);
  const hasPainSignal = /疼|痛|不舒服|刺|麻|肿|扭|拉伤/.test(text);
  const hasTrainingSignal = /练|训练|动作|组|重量|次数|恢复|拉伸|热身|深蹲|卷腹|卧推|硬拉|划船|推举|跑步|慢走|核心|饮食|蛋白|减脂|增肌|腿|膝|腰|背|肩|腕|肘|酸|疼|痛|麻|肿|抽筋/.test(text);

  if (!hasTrainingSignal) {
    return {
      title: "说具体点",
      lead: "说清楚位置、动作和感觉，比如卷腹腰酸，我才能给你更准确的调整。",
      steps: [],
      warning: "说清问题练得更准",
    };
  }

  if (hasLegSignal || hasKneeSignal) {
    return {
      title: hasKneeSignal ? "可以降级" : "腿部降级",
      lead: `今天可以练，先避开「${currentExercise || workoutTitle}」，改慢走、上肢或核心，让腿部舒服一点。`,
      steps: [],
      warning: "稳住节奏继续变强",
    };
  }

  if (hasBackSignal) {
    return {
      title: "可以换练",
      lead: `今天可以练，先避开「${currentExercise || workoutTitle}」这类受力动作，改轻走和温和活动。`,
      steps: [],
      warning: "稳住节奏继续变强",
    };
  }

  if (hasShoulderSignal) {
    return {
      title: "上肢降级",
      lead: "今天可以练，推举卧推先降级，改轻重量活动，让关节先保持舒服。",
      steps: [],
      warning: "稳住节奏继续变强",
    };
  }

  if (hasSorenessSignal || hasPainSignal) {
    return {
      title: "可以轻练",
      lead: "普通酸就轻活动，刺痛肿麻就绕开疼点，先把安全放在前面。",
      steps: [],
      warning: "稳住节奏继续变强",
    };
  }

  if (/吃|饮食|蛋白|饭|热量|减脂|增肌/.test(text)) {
    return {
      title: "先补基础",
      lead: "训练后补蛋白和主食，减脂也要吃稳一点，身体才有力气恢复。",
      steps: [],
      warning: "吃练睡稳继续变强",
    };
  }

  return {
    title: "可以降级",
    lead: "今天可以练，降重量、减次数或改恢复日，让训练更稳也更容易坚持。",
    steps: [],
    warning: "稳住节奏继续变强",
  };
}

function renderAiMessage(role, content) {
  if (!elements.aiChatLog) return;
  const isUser = role === "user";
  const message = document.createElement("article");
  message.className = `ai-message ${isUser ? "is-user" : "is-assistant"}`;

  if (isUser) {
    message.innerHTML = `<p>${escapeHtml(content)}</p>`;
  } else {
    message.innerHTML = renderAssistantAnswer(content);
  }

  elements.aiChatLog.appendChild(message);
  elements.aiChatLog.scrollTop = elements.aiChatLog.scrollHeight;
  return message;
}

function updateAiMessage(message, content) {
  if (!message) return;
  message.innerHTML = renderAssistantAnswer(content);
  elements.aiChatLog.scrollTop = elements.aiChatLog.scrollHeight;
}

function cleanAnswerText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeTrainingPrinciple(value) {
  const text = String(value || "").replace(/[^\u4e00-\u9fa5]/g, "");
  if (text.length >= 8 && !/[不停疼痛伤病医麻肿]/.test(text)) return text.slice(0, 8);
  return "稳住节奏继续变强";
}

function compactAiAnswer(content) {
  const firstStep = Array.isArray(content.steps) ? content.steps.find(Boolean) : "";
  const leadSource = content.lead || firstStep;

  return {
    title: cleanAnswerText(content.title),
    lead: cleanAnswerText(leadSource),
    warning: normalizeTrainingPrinciple(content.warning),
  };
}

function renderAssistantAnswer(content) {
  const answer = compactAiAnswer(content);
  return `
    <span>${escapeHtml(answer.title)}</span>
    <p>${escapeHtml(answer.lead)}</p>
    <strong>训练原则：${escapeHtml(answer.warning)}</strong>
  `;
}

function normalizeAiAnswer(value, fallbackQuestion) {
  const fallback = buildAiCoachAnswer(fallbackQuestion);
  if (!value || typeof value !== "object") return fallback;

  return {
    title: typeof value.title === "string" && value.title.trim() ? value.title.trim() : fallback.title,
    lead: typeof value.lead === "string" && value.lead.trim() ? value.lead.trim() : fallback.lead,
    steps: Array.isArray(value.steps) && value.steps.length
      ? value.steps.slice(0, 1).map((step) => String(step).trim()).filter(Boolean)
      : fallback.steps,
    warning: typeof value.warning === "string" && value.warning.trim() ? value.warning.trim() : fallback.warning,
  };
}

async function fetchAiCoachAnswer(question) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  const response = await fetch(AI_COACH_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    signal: controller.signal,
    body: JSON.stringify({
      question,
      context: getAiCoachContext(),
    }),
  }).catch((error) => {
    const networkError = new Error(error.name === "AbortError" ? "ai_request_timeout" : "ai_network_unreachable");
    networkError.code = networkError.message;
    throw networkError;
  }).finally(() => {
    window.clearTimeout(timeoutId);
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const error = new Error(errorPayload.code || `AI request failed: ${response.status}`);
    error.code = errorPayload.code || "";
    throw error;
  }

  const data = await response.json();
  return normalizeAiAnswer(data.answer, question);
}

function setAiQuestionBusy(isBusy) {
  if (elements.aiAskButton) {
    elements.aiAskButton.disabled = isBusy;
    elements.aiAskButton.textContent = isBusy ? "思考中..." : "问 AI";
  }
  if (elements.aiQuestionInput) {
    elements.aiQuestionInput.disabled = isBusy;
  }
}

async function askAiCoach(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) {
    elements.aiQuestionInput?.focus();
    return;
  }
  if (!isUsefulAiQuestion(cleanQuestion)) {
    renderAiMessage("user", cleanQuestion);
    renderAiMessage("assistant", buildAiCoachAnswer(cleanQuestion));
    if (elements.aiQuestionInput) {
      elements.aiQuestionInput.value = "";
      elements.aiQuestionInput.focus();
    }
    return;
  }
  renderAiMessage("user", cleanQuestion);
  const pendingMessage = renderAiMessage("assistant", {
    title: "思考中",
    lead: "我先看一下你的训练状态，再给你更稳妥的建议。",
    steps: [],
    warning: "稳住节奏继续变强",
  });
  if (elements.aiQuestionInput) {
    elements.aiQuestionInput.value = "";
  }
  setAiQuestionBusy(true);

  try {
    updateAiMessage(pendingMessage, await fetchAiCoachAnswer(cleanQuestion));
  } catch {
    const fallback = buildAiCoachAnswer(cleanQuestion);
    updateAiMessage(pendingMessage, {
      ...fallback,
      warning: "稳住节奏继续变强",
    });
  } finally {
    setAiQuestionBusy(false);
    elements.aiQuestionInput?.focus();
  }
}

function submitAiCoachQuestion() {
  askAiCoach(elements.aiQuestionInput?.value || "");
}

function isUsefulAiQuestion(question) {
  const text = question.replace(/\s+/g, "");
  if (text.length < 3) return false;
  if (!/[\u4e00-\u9fa5a-zA-Z0-9]/.test(text)) return false;
  return /练|训练|动作|组|重量|次数|恢复|拉伸|热身|深蹲|卷腹|卧推|硬拉|划船|推举|跑步|慢走|核心|饮食|蛋白|减脂|增肌|腿|膝|腰|背|肩|腕|肘|酸|疼|痛|麻|肿|抽筋/.test(text);
}

function resetAiCoachChat() {
  if (!elements.aiChatLog) return;
  elements.aiChatLog.innerHTML = "";
  renderAiMessage("assistant", {
    title: "直接说问题",
    lead: "说位置和感觉，比如膝盖疼、腿酸、腰紧，我会按你的情况给建议。",
    steps: [],
    warning: "稳住节奏继续变强",
  });
}

function renderBmiModalPreview() {
  if (!elements.bmiModalValue || !elements.bmiModalLabel) return;
  const bmiInfo = getBmiInfo(
    Number(elements.bmiHeightInput?.value || 0),
    Number(elements.bmiWeightInput?.value || 0),
  );
  elements.bmiModalValue.textContent = bmiInfo.bmi;
  elements.bmiModalLabel.textContent = bmiInfo.label;
}

function showModal(modal) {
  if (!modal) return;
  const pendingClose = modalCloseTimers.get(modal);
  if (pendingClose) {
    window.clearTimeout(pendingClose);
    modalCloseTimers.delete(modal);
  }
  const focusedElement = document.activeElement;
  if (focusedElement instanceof HTMLElement && !modal.contains(focusedElement)) {
    modalPreviousFocus.set(modal, focusedElement);
  }
  modal.classList.remove("is-closing");
  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-modal-open");
}

function hideModal(modal) {
  if (!modal || modal.hidden || modal.classList.contains("is-closing")) return;
  modal.setAttribute("aria-hidden", "true");
  modal.classList.add("is-closing");
  const timeoutId = window.setTimeout(() => {
    modal.hidden = true;
    modal.classList.remove("is-closing");
    modalCloseTimers.delete(modal);
    const hasOpenModal = [elements.bmiModal, elements.aiModal, elements.tutorialSheet].some((item) => item && !item.hidden);
    document.body.classList.toggle("has-modal-open", hasOpenModal);
    const previousFocus = modalPreviousFocus.get(modal);
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    modalPreviousFocus.delete(modal);
  }, MODAL_EXIT_DURATION_MS);
  modalCloseTimers.set(modal, timeoutId);
}

function openBmiModal() {
  if (!elements.bmiModal) return;
  if (elements.bmiHeightInput) {
    elements.bmiHeightInput.value = state.heightCm ?? "";
  }
  if (elements.bmiWeightInput) {
    elements.bmiWeightInput.value = state.weightKg ?? "";
  }
  renderBmiModalPreview();
  showModal(elements.bmiModal);
  window.setTimeout(() => elements.bmiHeightInput?.focus(), 80);
}

function closeBmiModal() {
  hideModal(elements.bmiModal);
}

function openAiModal() {
  if (!elements.aiModal) return;
  renderAiContext();
  resetAiCoachChat();
  showModal(elements.aiModal);
  window.setTimeout(() => elements.aiQuestionInput?.focus(), 80);
}

function closeAiModal() {
  hideModal(elements.aiModal);
}

function renderTutorialSheet(exercise, guide, tutorialUrl) {
  elements.tutorialSheetTitle.textContent = exercise.name;
  elements.tutorialSheetSummary.textContent = exercise.note || "先看一遍动作路线，再慢慢跟着做。";
  elements.tutorialSheetCue.textContent = guide.memoryCue;
  elements.tutorialSheetSteps.innerHTML = guide.steps.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  elements.tutorialSheetMistakes.innerHTML = guide.mistakes.slice(0, 2).map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  const hasMedia = Boolean(guide.media);
  elements.tutorialSheetFigure.hidden = !hasMedia;
  elements.tutorialSheetMediaFallback.hidden = hasMedia;
  if (hasMedia) {
    elements.tutorialSheetImage.src = guide.media.src;
    elements.tutorialSheetImage.alt = guide.media.alt;
    elements.tutorialSheetMediaCredit.textContent = guide.media.attribution;
    if (guide.media.attributionUrl) {
      elements.tutorialSheetMediaCredit.href = guide.media.attributionUrl;
      elements.tutorialSheetMediaCredit.removeAttribute("aria-disabled");
    } else {
      elements.tutorialSheetMediaCredit.removeAttribute("href");
      elements.tutorialSheetMediaCredit.setAttribute("aria-disabled", "true");
    }
    elements.tutorialSheetMediaKind.hidden = !guide.media.approximate;
  }

  elements.tutorialSheetExternal.hidden = !tutorialUrl;
  elements.tutorialSheetExternal.parentElement.classList.toggle("is-single-action", !tutorialUrl);
  if (tutorialUrl) elements.tutorialSheetExternal.href = tutorialUrl;
}

function openTutorialSheet() {
  const workout = getActiveWorkout();
  const exercise = workout?.exercises[activeExerciseIndex];
  if (!exercise || !elements.tutorialSheet) return;
  const guide = window.ExerciseGuides.getExerciseGuide(exercise, { mediaEnabled: EXERCISE_MEDIA_ENABLED });
  const tutorialUrl = state.goal === "muscleGain" ? tutorialLinks[exercise.name] : "";
  renderTutorialSheet(exercise, guide, tutorialUrl);
  showModal(elements.tutorialSheet);
  window.setTimeout(() => elements.tutorialSheetClose?.focus(), 80);
}

function closeTutorialSheet() {
  hideModal(elements.tutorialSheet);
}

function keepFocusInsideModal(event) {
  if (event.key !== "Tab") return;
  const modal = [elements.tutorialSheet, elements.aiModal, elements.bmiModal]
    .find((item) => item && !item.hidden && !item.classList.contains("is-closing"));
  if (!modal) return;
  const focusable = Array.from(modal.querySelectorAll(
    'button:not([disabled]):not([hidden]), a[href]:not([hidden]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )).filter((item) => item.getClientRects().length > 0);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function bindTutorialSheetDrag() {
  const handle = elements.tutorialSheetHandle;
  const panel = elements.tutorialSheetPanel;
  if (!handle || !panel) return;
  let startY = null;
  let distance = 0;

  const finishDrag = (event) => {
    if (startY === null) return;
    if (handle.hasPointerCapture?.(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    panel.classList.remove("is-dragging");
    startY = null;
    if (distance > 84) {
      panel.style.removeProperty("--tutorial-drag-y");
      closeTutorialSheet();
    } else {
      panel.classList.add("is-snapping-back");
      requestAnimationFrame(() => panel.style.removeProperty("--tutorial-drag-y"));
    }
    window.setTimeout(() => panel.classList.remove("is-snapping-back"), 220);
    distance = 0;
  };

  handle.addEventListener("pointerdown", (event) => {
    startY = event.clientY;
    distance = 0;
    handle.setPointerCapture?.(event.pointerId);
    panel.classList.add("is-dragging");
  });
  handle.addEventListener("pointermove", (event) => {
    if (startY === null) return;
    distance = Math.max(0, event.clientY - startY);
    panel.style.setProperty("--tutorial-drag-y", `${distance}px`);
  });
  handle.addEventListener("pointerup", finishDrag);
  handle.addEventListener("pointercancel", finishDrag);
}

function renderOverview() {
  const goalInfo = goalConfig[state.goal];
  const bmiInfo = getBmiInfo(Number(state.heightCm), Number(state.weightKg));
  const recommendedFrequency = getRecommendedFrequency(state.goal);

  elements.bmiValue.textContent = bmiInfo.bmi;
  elements.bmiLabel.textContent = bmiInfo.label;
  if (elements.goal) {
    elements.goal.value = state.goal;
  }
  if (elements.recommendedStart) {
    elements.recommendedStart.textContent = getStartWindow(state.workEndTime);
  }
  if (elements.recommendedDuration) {
    elements.recommendedDuration.textContent = goalInfo.durationText;
  }
  if (elements.goalSummary) {
    elements.goalSummary.textContent = getGoalSummary(state.goal);
  }
  if (elements.overviewHint) {
    elements.overviewHint.textContent = getOverviewHint(state.goal, bmiInfo);
  }
  if (elements.heroFrequency) {
    elements.heroFrequency.textContent = `每周 ${state.trainDaysPerWeek} 练`;
  }
  if (elements.heroDuration) {
    elements.heroDuration.textContent = `单次 ${goalInfo.durationText}`;
  }
  if (elements.calendarFrequency) {
    elements.calendarFrequency.textContent = `${state.trainDaysPerWeek}练`;
  }
  if (elements.calendarWorkStart) {
    elements.calendarWorkStart.textContent = state.workStartTime || "--:--";
  }
  if (elements.calendarWorkEnd) {
    elements.calendarWorkEnd.textContent = state.workEndTime || "--:--";
  }
  if (elements.calendarStartWindow) {
    elements.calendarStartWindow.textContent = getStartWindow(state.workEndTime);
  }
  renderGoalTabs();
  if (elements.stretchText) elements.stretchText.textContent = goalInfo.stretch;
  if (elements.recoveryText) elements.recoveryText.textContent = goalInfo.recovery;
  if (elements.nutritionText) elements.nutritionText.textContent = goalInfo.nutrition;
}

function renderProfileCalendar() {
  if (!elements.calendarStrip) return;
  const plan = getCurrentPlan();
  const current = getActiveWorkout();

  elements.calendarStrip.innerHTML = plan.map((item, index) => {
    const isCurrent = current && item.id === current.id;
    const classes = [
      "calendar-day",
      item.type === "recovery" ? "is-recovery" : "is-train",
      isCurrent ? "is-current" : "",
    ].filter(Boolean).join(" ");

    return `
      <button type="button" class="${classes}" data-calendar-day-id="${item.id}">
        <span class="calendar-day-label">${item.day.replace("周", "")}</span>
        <span class="calendar-day-dot">${index + 1}</span>
      </button>
    `;
  }).join("");

  elements.calendarStrip.querySelectorAll("[data-calendar-day-id]").forEach((button) => {
    button.addEventListener("click", () => {
      activeDayId = button.dataset.calendarDayId;
      resetExerciseStepper();
      renderProfileCalendar();
      renderWeeklyPlan();
      renderWorkout();
      document.querySelector(`[data-day-id="${activeDayId}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
}

function renderGoalTabs() {
  if (!elements.goalTabs) return;
  elements.goalTabs.querySelectorAll("[data-goal]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.goal === state.goal);
  });
}

function formatNoteDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "今天";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}`;
}

function renderTrainingNotes() {
  if (!elements.noteList) return;
  const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
  const recentNotes = trainingNotes
    .slice()
    .filter((note) => new Date(note.createdAt).getTime() >= fiveDaysAgo)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (!recentNotes.length) {
    elements.noteList.innerHTML = `<p class="note-empty">还没有心得，训练完写一句就够。</p>`;
    return;
  }

  elements.noteList.innerHTML = recentNotes.map((note) => `
    <article class="note-item">
      <span class="note-date">${formatNoteDate(note.createdAt)}</span>
      <p class="note-text">${escapeHtml(note.text)}</p>
    </article>
  `).join("");
}

function setNoteFormOpen(isOpen) {
  if (!elements.noteForm || !elements.noteAddButton) return;
  elements.noteForm.hidden = !isOpen;
  elements.noteAddButton.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) {
    window.setTimeout(() => elements.noteInput?.focus(), 60);
  }
}

function saveTrainingNote() {
  const text = String(elements.noteInput?.value || "").replace(/\s+/g, " ").trim();
  if (!text) {
    elements.noteInput?.focus();
    return;
  }

  trainingNotes.unshift({
    id: `${Date.now()}`,
    text: text.slice(0, 120),
    createdAt: new Date().toISOString(),
  });
  trainingNotes = trainingNotes.slice(0, 20);
  saveTrainingNotes();
  if (elements.noteInput) elements.noteInput.value = "";
  setNoteFormOpen(false);
  renderTrainingNotes();
}

function renderFrequencyTabs() {
  elements.frequencyTabs.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.frequency) === state.trainDaysPerWeek);
  });
}

function getPlanDate(item) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  const todayIndex = date.getDay() || 7;
  const targetIndex = getWeekdayIndex(item.day) || 7;
  date.setDate(date.getDate() - todayIndex + targetIndex);
  return date;
}

function formatPlanDate(item) {
  const date = getPlanDate(item);
  return `${date.getMonth() + 1}月${date.getDate()}日 · ${item.day}`;
}

function updatePlanCarouselUi(plan, previewIndex = null) {
  const selectedIndex = Math.max(0, plan.findIndex((item) => item.id === activeDayId));
  const activeIndex = previewIndex ?? selectedIndex;
  const activeItem = plan[activeIndex];
  if (!activeItem) return;

  elements.weeklyPlan.querySelectorAll("[data-day-id]").forEach((card, index) => {
    const active = index === activeIndex;
    card.classList.toggle("is-active", active);
    card.classList.toggle("is-before", index < activeIndex);
    card.classList.toggle("is-after", index > activeIndex);
    card.classList.toggle("is-near", Math.abs(index - activeIndex) === 1);
    card.setAttribute("aria-current", active ? "true" : "false");
  });
}

function getNearestPlanCardIndex() {
  const cards = Array.from(elements.weeklyPlan.querySelectorAll("[data-day-id]"));
  if (!cards.length) return -1;
  const railRect = elements.weeklyPlan.getBoundingClientRect();
  const railCenter = railRect.left + railRect.width / 2;
  return cards.reduce((nearest, card, index) => {
    const rect = card.getBoundingClientRect();
    const distance = Math.abs(rect.left + rect.width / 2 - railCenter);
    return distance < nearest.distance ? { index, distance } : nearest;
  }, { index: 0, distance: Number.POSITIVE_INFINITY }).index;
}

function scrollPlanCardIntoView(index, behavior = "smooth") {
  const card = elements.weeklyPlan.querySelectorAll("[data-day-id]")[index];
  if (!card) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  elements.weeklyPlan.scrollTo({
    left: card.offsetLeft - ((elements.weeklyPlan.clientWidth - card.offsetWidth) / 2),
    behavior: reduceMotion ? "auto" : behavior,
  });
}

function selectPlanDay(dayId, options = {}) {
  const plan = getCurrentPlan();
  const index = plan.findIndex((item) => item.id === dayId);
  if (index < 0) return;
  const changed = activeDayId !== dayId;
  activeDayId = dayId;
  if (changed) resetExerciseStepper();
  updatePlanCarouselUi(plan);
  renderProfileCalendar();
  renderWorkout();
  if (options.scroll !== false) scrollPlanCardIntoView(index, options.behavior || "smooth");
  if (options.focus) {
    elements.weeklyPlan.querySelector(`[data-day-id="${dayId}"]`)?.focus({ preventScroll: true });
  }
}

function movePlanCarousel(offset) {
  const plan = getCurrentPlan();
  const activeIndex = Math.max(0, plan.findIndex((item) => item.id === activeDayId));
  const nextIndex = Math.min(plan.length - 1, Math.max(0, activeIndex + offset));
  if (nextIndex === activeIndex) return;
  selectPlanDay(plan[nextIndex].id, { focus: true });
}

function renderWeeklyPlan() {
  const plan = getCurrentPlan();
  if (!plan.find((item) => item.id === activeDayId)) {
    activeDayId = getNearestPlanId(plan);
  }

  elements.weeklyPlan.innerHTML = plan.map((item, index) => {
    const active = item.id === activeDayId;
    const complete = isWorkoutComplete(item);
    const count = countCompletedExercises(item);
    return `
      <button type="button" class="day-card ${active ? "is-active" : ""} ${complete ? "is-complete" : ""}" data-day-id="${item.id}" aria-label="${formatPlanDate(item)}，${item.title}" aria-current="${active ? "true" : "false"}">
        <div class="day-card-shell">
          <div class="day-card-date-row">
            <span>${formatPlanDate(item)}</span>
            <small>${String(index + 1).padStart(2, "0")}</small>
          </div>
          <div class="day-top">
            <div>
              <strong>${item.day} · ${item.title}</strong>
              <p>${item.focus} · ${item.duration}</p>
            </div>
            <span class="pill ${complete ? "done" : ""}">${complete ? "已练完" : `${count.completed}/${count.total}`}</span>
          </div>
          <div class="pill-row">
            ${item.tags.map((tag) => `<span class="pill">${tag}</span>`).join("")}
          </div>
        </div>
      </button>
    `;
  }).join("");

  elements.weeklyPlan.querySelectorAll("[data-day-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectPlanDay(button.dataset.dayId);
    });
  });

  let scrollTimer = null;
  let scrollFrame = null;
  elements.weeklyPlan.onscroll = () => {
    if (scrollFrame === null) {
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = null;
        const previewIndex = getNearestPlanCardIndex();
        if (previewIndex >= 0) updatePlanCarouselUi(plan, previewIndex);
      });
    }
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      const nearestIndex = getNearestPlanCardIndex();
      const nearestCard = elements.weeklyPlan.querySelectorAll("[data-day-id]")[nearestIndex];
      if (nearestCard && nearestCard.dataset.dayId !== activeDayId) {
        selectPlanDay(nearestCard.dataset.dayId, { scroll: false });
      } else {
        updatePlanCarouselUi(plan);
      }
    }, 110);
  };

  updatePlanCarouselUi(plan);
  requestAnimationFrame(() => {
    const activeIndex = Math.max(0, plan.findIndex((item) => item.id === activeDayId));
    scrollPlanCardIntoView(activeIndex, "auto");
  });
}

function renderWorkout() {
  const workout = getActiveWorkout();
  if (!workout) {
    elements.exerciseList.innerHTML = `<p class="empty-text">先选择一个训练日。</p>`;
    return;
  }

  const goalInfo = goalConfig[state.goal];
  const progress = countCompletedExercises(workout);

  elements.tonightTitle.textContent = `${workout.day} · ${workout.title}`;
  elements.tonightMeta.innerHTML = `
    <span class="pill">目标：${goalInfo.label}</span>
    <span class="pill">部位：${workout.focus}</span>
    <span class="pill">${workout.duration}</span>
  `;
  elements.todayProgress.textContent = `今日完成 ${progress.completed}/${progress.total}`;
  elements.checkinButton.textContent = isWorkoutComplete(workout) ? "今天已打卡" : "今日完成打卡";
  elements.checkinButton.disabled = isWorkoutComplete(workout);

  const checkedMap = getExerciseProgressMap(workout);
  const totalExercises = workout.exercises.length;
  activeExerciseIndex = Math.min(Math.max(activeExerciseIndex, 0), Math.max(totalExercises - 1, 0));
  const exercise = workout.exercises[activeExerciseIndex];
  const guide = window.ExerciseGuides.getExerciseGuide(exercise, { mediaEnabled: EXERCISE_MEDIA_ENABLED });
  const complete = !!checkedMap[exercise.name];
  const equipmentTarget = exercise.equipment || "";
  const equipmentJumpLabel = exercise.equipment ? `看${equipmentLibrary[exercise.equipment].name}` : "";
  const equipmentLabel = exercise.equipment ? equipmentLibrary[exercise.equipment].name : "徒手";
  const nextExercise = workout.exercises[activeExerciseIndex + 1];
  const percent = totalExercises ? Math.round(((activeExerciseIndex + 1) / totalExercises) * 100) : 0;
  const completionPercent = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;

  if (restState) {
    const nextExercise = workout.exercises[restState.nextIndex];
    const remaining = window.ExerciseGuides.getRemainingRestSeconds(restState.endAt);
    elements.exerciseList.innerHTML = `
      <section class="rest-player" aria-live="polite" aria-label="组间休息">
        <div class="rest-copy">
          <span class="stepper-kicker">动作完成 · 休息一下</span>
          <h3>下一项：${nextExercise.name}</h3>
          <p>喝一小口水，放松刚才发力的部位。呼吸稳下来后再继续。</p>
        </div>
        <div class="rest-ring" data-rest-ring style="--rest-progress: ${(remaining / restState.duration) * 360}deg">
          <div><strong data-rest-seconds>${remaining}</strong><span>秒</span></div>
        </div>
        <div class="rest-controls">
          <button type="button" data-rest-adjust="-15">-15 秒</button>
          <button type="button" class="step-nav-button step-nav-button-primary" data-rest-skip>跳过休息</button>
          <button type="button" data-rest-adjust="15">+15 秒</button>
        </div>
      </section>
    `;
    bindRestInteractions();
    return;
  }

  elements.exerciseList.innerHTML = `
    <div class="exercise-stepper is-${stepMotion}" aria-label="动作分步训练" aria-live="polite">
      <div class="stepper-head">
        <div>
          <span class="stepper-kicker">动作 ${activeExerciseIndex + 1}/${totalExercises}</span>
          <strong>${exercise.name}</strong>
          <p>${exercise.sets} · ${equipmentLabel}</p>
        </div>
        <div class="stepper-count">
          <span>完成度</span>
          <strong>${completionPercent}%</strong>
          <small>${progress.completed}/${progress.total}</small>
        </div>
      </div>
      <div class="stepper-progress-row">
        <span>当前进度</span>
        <div class="stepper-track" aria-hidden="true">
          <span style="width: ${percent}%"></span>
        </div>
      </div>
      <div class="stepper-dots" aria-label="选择动作" style="--exercise-count: ${totalExercises}">
        ${workout.exercises.map((item, index) => `
          <button
            type="button"
            class="${index === activeExerciseIndex ? "is-active" : ""} ${checkedMap[item.name] ? "is-complete" : ""}"
            data-step-index="${index}"
            aria-label="查看动作 ${index + 1}：${item.name}"
            ${index === activeExerciseIndex ? 'aria-current="step"' : ""}
          >
            ${index + 1}
          </button>
        `).join("")}
      </div>

      <article class="exercise-card exercise-card-focus ${complete ? "is-complete" : ""}">
        <div class="exercise-stage">
          <div class="exercise-stage-number">
            <span>${String(activeExerciseIndex + 1).padStart(2, "0")}</span>
          </div>
          <div class="exercise-stage-main">
            <div class="exercise-head">
              <div class="exercise-title">
                <span>${complete ? "已完成" : "当前动作"}</span>
                <strong>${exercise.name}</strong>
              </div>
              <div class="exercise-head-actions">
                ${guide.hasSpecificGuide ? `<button type="button" class="tutorial-link" data-open-tutorial>看教学</button>` : ""}
                <label class="exercise-check exercise-check-card">
                  <input type="checkbox" data-workout-id="${workout.id}" data-exercise-name="${exercise.name}" ${complete ? "checked" : ""}>
                  <span>${complete ? "已完成" : "完成"}</span>
                </label>
              </div>
            </div>
            <p class="exercise-note">${exercise.note || ""}</p>
          </div>
        </div>
        <div class="exercise-player-body">
          <div class="exercise-demo ${guide.media ? "has-media" : "is-text-only"}" data-exercise-demo>
            ${guide.media ? `
              <img src="${guide.media.src}" alt="${guide.media.alt}" width="180" height="180" loading="lazy" data-exercise-media>
              ${guide.media.attributionUrl
                ? `<a href="${guide.media.attributionUrl}" target="_blank" rel="noopener noreferrer">${guide.media.attribution}</a>`
                : `<span class="exercise-media-credit">${guide.media.attribution}</span>`}
              ${guide.media.approximate ? `<span class="exercise-media-kind">相似动作示范</span>` : ""}
            ` : `
              <div class="exercise-demo-placeholder" aria-label="当前为文字指导模式">
                <span>${String(activeExerciseIndex + 1).padStart(2, "0")}</span>
                <strong>${guide.name}</strong>
                <small>跟随文字提示练习</small>
              </div>
            `}
            <div class="exercise-demo-meta">
              <span>${exercise.sets}</span>
              ${(exercise.equipment
                  ? `<span>优先器械：${equipmentLibrary[exercise.equipment].name}</span><button type="button" class="tutorial-link tutorial-jump" data-equipment-target="${equipmentTarget}">${equipmentJumpLabel}</button>`
                  : `<span>徒手动作</span>`)}
            </div>
          </div>
          <div class="exercise-guide-panel">
            <div class="muscle-summary">
              <div><span>主要练这里</span><strong>${guide.target}</strong></div>
              <div><span>顺便练到</span><strong>${guide.secondary.join(" · ")}</strong></div>
            </div>
            <div class="exercise-memory-cue"><span>看图记</span><strong>${guide.memoryCue}</strong></div>
            <div class="guide-tabs" role="tablist" aria-label="动作指导分类">
              ${[
                ["steps", "怎么做"],
                ["breathing", "怎么呼吸"],
                ["mistakes", "别这样"],
                ["alternative", "轻松版"],
              ].map(([key, label]) => `<button type="button" role="tab" aria-selected="${activeGuideTab === key}" tabindex="${activeGuideTab === key ? "0" : "-1"}" class="${activeGuideTab === key ? "is-active" : ""}" data-guide-tab="${key}">${label}</button>`).join("")}
            </div>
            <div class="guide-tab-content" role="tabpanel" tabindex="0">
              ${activeGuideTab === "steps" ? `<ol>${guide.steps.map((item) => `<li>${item}</li>`).join("")}</ol>` : ""}
              ${activeGuideTab === "breathing" ? `<div class="guide-callout"><span>跟着节奏来</span><strong>${guide.breathing}</strong></div>` : ""}
              ${activeGuideTab === "mistakes" ? `<ul>${guide.mistakes.map((item) => `<li>${item}</li>`).join("")}</ul>` : ""}
              ${activeGuideTab === "alternative" ? `<div class="guide-callout guide-callout-soft"><span>今天轻松一点</span><strong>${guide.alternative}</strong></div>` : ""}
            </div>
          </div>
        </div>
        ${exercise.timerSegments ? `
          <div class="exercise-timer" data-exercise-timer aria-live="off" aria-label="有氧倒计时，含低速热身和放松">
            <div class="exercise-timer-summary">
              <div class="exercise-timer-phase">
                <div class="exercise-timer-heading"><strong data-exercise-timer-phase>热身</strong><span data-exercise-timer-state>未开始</span></div>
                <p data-exercise-stage-remaining></p>
              </div>
              <div class="exercise-timer-time"><span>总剩余</span><strong data-exercise-seconds>${formatExerciseTime(getExerciseTimerRemaining(exercise))}</strong></div>
            </div>
            <ol class="exercise-timer-stages" aria-label="有氧三个阶段">
              ${exercise.timerSegments.map((segment, index) => `<li data-exercise-stage="${index}"><span>${["热身", "正式有氧", "放松"][index]}</span><small>${segment.durationSeconds / 60} 分钟</small></li>`).join("")}
            </ol>
            <div class="exercise-timer-controls">
              <button type="button" class="step-nav-button step-nav-button-primary" data-exercise-timer-toggle>开始</button>
              <button type="button" class="step-nav-button" data-exercise-timer-reset>重置</button>
              <button type="button" class="exercise-timer-sound" data-exercise-timer-sound aria-pressed="false">声音提醒：关</button>
            </div>
            <p class="exercise-timer-sound-note" data-exercise-timer-sound-note role="status"></p>
            <span class="exercise-timer-announcement" data-exercise-timer-status role="status" aria-live="polite" aria-atomic="true"></span>
          </div>
        ` : ""}
      </article>

      <div class="stepper-footer">
        <button type="button" class="step-nav-button" data-step-direction="prev" ${activeExerciseIndex === 0 ? "disabled" : ""}>上一条</button>
        <span>${nextExercise ? `下一条 · ${nextExercise.name}` : "全部动作都看完了，可以收尾恢复"}</span>
        <button type="button" class="step-nav-button step-nav-button-primary" data-step-direction="next" ${activeExerciseIndex === totalExercises - 1 ? "disabled" : ""}>下一条</button>
      </div>
    </div>
  `;

  bindWorkoutInteractions();
  updateExerciseTimerDisplay();
}

function bindWorkoutInteractions() {
  bindEquipmentJumpButtons(elements.exerciseList);
  elements.exerciseList.querySelector("[data-exercise-timer-toggle]")?.addEventListener("click", toggleExerciseTimer);
  elements.exerciseList.querySelector("[data-exercise-timer-sound]")?.addEventListener("click", toggleExerciseTimerSound);
  elements.exerciseList.querySelector("[data-exercise-timer-reset]")?.addEventListener("click", () => {
    cancelExerciseTimer();
    updateExerciseTimerDisplay();
  });

  elements.exerciseList.querySelector("[data-open-tutorial]")?.addEventListener("click", openTutorialSheet);

  elements.exerciseList.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const workout = getActiveWorkout();
      const lastIndex = workout ? workout.exercises.length - 1 : 0;
      const shouldAdvance = checkbox.checked && activeExerciseIndex < lastIndex;
      cancelExerciseTimer();
      setExerciseCompleted(checkbox.dataset.workoutId, checkbox.dataset.exerciseName, checkbox.checked);
      renderWeeklyPlan();
      if (shouldAdvance && state.goal === "fatLoss") {
        activeExerciseIndex += 1;
        activeGuideTab = "steps";
        stepMotion = "forward";
        renderWorkout();
      }
      else if (shouldAdvance) startRestTimer(activeExerciseIndex + 1);
      else renderWorkout();
    });
  });

  elements.exerciseList.querySelectorAll("[data-step-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextIndex = Number(button.dataset.stepIndex);
      if (nextIndex !== activeExerciseIndex) cancelExerciseTimer();
      stepMotion = nextIndex >= activeExerciseIndex ? "forward" : "back";
      activeExerciseIndex = nextIndex;
      activeGuideTab = "steps";
      renderWorkout();
      scrollActiveExerciseIntoView();
    });
  });

  elements.exerciseList.querySelectorAll("[data-step-direction]").forEach((button) => {
    button.addEventListener("click", () => {
      const workout = getActiveWorkout();
      if (!workout) return;
      cancelExerciseTimer();
      const lastIndex = workout.exercises.length - 1;
      if (button.dataset.stepDirection === "prev") {
        stepMotion = "back";
        activeExerciseIndex = Math.max(0, activeExerciseIndex - 1);
      } else {
        stepMotion = "forward";
        activeExerciseIndex = window.ExerciseGuides.getNextExerciseIndex(activeExerciseIndex, workout.exercises.length);
      }
      activeGuideTab = "steps";
      renderWorkout();
      scrollActiveExerciseIntoView();
    });
  });

  const guideTabs = Array.from(elements.exerciseList.querySelectorAll("[data-guide-tab]"));
  guideTabs.forEach((button, index) => {
    button.addEventListener("click", () => {
      activeGuideTab = button.dataset.guideTab;
      renderWorkout();
    });
    button.addEventListener("keydown", (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const offset = event.key === 'ArrowRight' ? 1 : -1;
      const nextTab = guideTabs[(index + offset + guideTabs.length) % guideTabs.length];
      activeGuideTab = nextTab.dataset.guideTab;
      renderWorkout();
      elements.exerciseList.querySelector(`[data-guide-tab="${activeGuideTab}"]`)?.focus();
    });
  });

  const media = elements.exerciseList.querySelector("[data-exercise-media]");
  media?.addEventListener("error", () => {
    const demo = elements.exerciseList.querySelector("[data-exercise-demo]");
    if (demo) demo.innerHTML = '<div class="exercise-demo-placeholder"><strong>示范加载失败</strong><small>请继续按文字步骤完成动作</small></div>';
  }, { once: true });

}

function scrollActiveExerciseIntoView() {
  requestAnimationFrame(() => {
    const stage = elements.exerciseList.querySelector(".exercise-stage");
    if (!stage || window.innerWidth > 480) return;
    stage.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  });
}

function bindRestInteractions() {
  elements.exerciseList.querySelectorAll("[data-rest-adjust]").forEach((button) => {
    button.addEventListener("click", () => adjustActiveRest(Number(button.dataset.restAdjust)));
  });
  elements.exerciseList.querySelector("[data-rest-skip]")?.addEventListener("click", finishRestTimer);
}

function renderEquipmentGuide() {
  const order = state.goal === "fatLoss"
    ? ["treadmill", "bike", "cable", "dumbbell"]
    : ["treadmill", "elliptical", "bike", "cable", "smith", "bench", "dumbbell"];
  elements.equipmentGrid.innerHTML = order.map((key) => {
    const item = equipmentLibrary[key];
    return `
      <article class="equipment-card" id="equipment-${key}">
        <img class="equipment-image" src="${item.image}" alt="${item.name}">
        <div class="equipment-content">
          <div class="equipment-head">
            <h3>${item.name}</h3>
            <span class="pill">${item.useFor[0]}</span>
          </div>
          <p>${item.simple}</p>
          <div class="equipment-meta">
            <span>这台器械常用来做</span>
            <div class="equipment-tags">
              ${item.useFor.map((entry) => `<span class="pill">${entry}</span>`).join("")}
            </div>
          </div>
          <div class="equipment-meta">
            <span>大白话标准</span>
            <strong>${item.standard}</strong>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderDietGuide() {
  if (!elements.dietGuide) return;
  const guide = window.DietGuide.getDietGuide(state.goal);
  elements.dietGuide.innerHTML = `
    <header class="diet-hero">
      <div>
        <p class="panel-tag">${guide.label}饮食</p>
        <h2>${guide.headline}</h2>
        <p>${guide.intro}</p>
      </div>
      <span class="diet-goal-badge">当前目标 · ${guide.label}</span>
    </header>
    <div class="diet-principles" aria-label="饮食核心原则">
      ${guide.principles.map((item, index) => `<div><span>0${index + 1}</span><strong>${item}</strong></div>`).join("")}
    </div>
    <section class="diet-schedule" aria-labelledby="dietScheduleTitle">
      <div class="section-head diet-section-head">
        <div><p class="panel-tag">一天怎么吃</p><h3 id="dietScheduleTitle">按时间滑着选就行</h3></div>
        <div class="diet-carousel-controls" aria-label="切换饮食建议">
          <button type="button" data-diet-direction="prev" aria-label="上一张饮食卡">←</button>
          <span><strong data-diet-current>1</strong> / ${guide.periods.length}</span>
          <button type="button" data-diet-direction="next" aria-label="下一张饮食卡">→</button>
        </div>
      </div>
      <div class="diet-period-grid" data-diet-carousel tabindex="0" aria-label="分时段饮食建议">
        ${guide.periods.map((period, index) => `
          <article class="diet-period-card" data-diet-card data-diet-index="${index}">
            <div class="diet-period-head"><div><strong>${period.title}</strong><span>${period.timing}</span></div><span class="diet-period-dot" aria-hidden="true"></span></div>
            <ul>${period.options.map((option) => `<li>${option}</li>`).join("")}</ul>
          </article>
        `).join("")}
      </div>
    </section>
    <p class="diet-disclaimer">以上为健康成年人的通用入门建议。如有疾病、食物过敏、孕期或特殊饮食要求，请咨询医生或营养师。</p>
  `;
  bindDietCarousel();
}

function bindDietCarousel() {
  const carousel = elements.dietGuide?.querySelector("[data-diet-carousel]");
  if (!carousel) return;
  const cards = Array.from(carousel.querySelectorAll("[data-diet-card]"));
  const currentLabel = elements.dietGuide.querySelector("[data-diet-current]");

  function getCurrentIndex() {
    if (!cards.length) return 0;
    return cards.reduce((nearest, card, index) => (
      Math.abs(card.offsetLeft - carousel.scrollLeft) < Math.abs(cards[nearest].offsetLeft - carousel.scrollLeft) ? index : nearest
    ), 0);
  }

  function updateCurrentLabel() {
    if (currentLabel) currentLabel.textContent = String(getCurrentIndex() + 1);
  }

  function scrollToIndex(index) {
    const target = cards[Math.min(cards.length - 1, Math.max(0, index))];
    target?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }

  elements.dietGuide.querySelectorAll("[data-diet-direction]").forEach((button) => {
    button.addEventListener("click", () => {
      const offset = button.dataset.dietDirection === "next" ? 1 : -1;
      scrollToIndex(getCurrentIndex() + offset);
    });
  });
  carousel.addEventListener("scroll", updateCurrentLabel, { passive: true });
  carousel.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    scrollToIndex(getCurrentIndex() + (event.key === "ArrowRight" ? 1 : -1));
  });
}

function bindEquipmentJumpButtons(scope = document) {
  scope.querySelectorAll("[data-equipment-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(`#equipment-${button.dataset.equipmentTarget}`);
      if (!target) return;
      returnScrollY = window.scrollY;
      setActiveModule("equipment", { scrollToTop: false });
      updateBackToWorkoutButton();
      document.querySelectorAll(".equipment-card").forEach((card) => card.classList.remove("is-highlighted"));
      target.classList.add("is-highlighted");
      window.setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
      setTimeout(() => target.classList.remove("is-highlighted"), 2200);
    });
  });
}

function setActiveModule(moduleName, options = {}) {
  if (!moduleName || activeModule === moduleName) {
    if (options.scrollToTop) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    return;
  }

  activeModule = moduleName;
  elements.appModules.forEach((module) => {
    const isActive = module.dataset.module === moduleName;
    module.classList.toggle("is-active", isActive);
    module.hidden = !isActive;
  });

  elements.moduleButtons.forEach((button) => {
    const isActive = button.dataset.moduleTarget === moduleName;
    button.classList.toggle("is-active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  updateBackToTopButton();
  if (options.scrollToTop !== false) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function bindScrollTargetButtons(scope = document) {
  scope.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.scrollTarget);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function updateBackToWorkoutButton() {
  if (!elements.backToWorkoutButton) return;
  elements.backToWorkoutButton.classList.toggle("is-visible", returnScrollY !== null);
}

function updateBackToTopButton() {
  if (!elements.backToTopButton) return;
  elements.backToTopButton.classList.toggle("is-visible", window.scrollY > 360);
}

function syncStateFromInputs() {
  state.heightCm = elements.heightCm.value ? Number(elements.heightCm.value) : null;
  state.weightKg = elements.weightKg.value ? Number(elements.weightKg.value) : null;
  state.workStartTime = elements.workStartTime.value;
  state.workEndTime = elements.workEndTime.value;
  state.goal = elements.goal.value;
}

function rerenderAll() {
  if (![3, 4, 5].includes(state.trainDaysPerWeek)) {
    state.trainDaysPerWeek = getRecommendedFrequency(state.goal);
  }
  renderOverview();
  renderProfileCalendar();
  renderFrequencyTabs();
  renderWeeklyPlan();
  renderWorkout();
  renderEquipmentGuide();
  renderDietGuide();
  renderTrainingNotes();
}

function attachEvents() {
  [
    elements.heightCm,
    elements.weightKg,
    elements.workStartTime,
    elements.workEndTime,
    elements.goal,
  ].forEach((element) => {
    element.addEventListener("input", () => {
      syncStateFromInputs();
      rerenderAll();
    });
    element.addEventListener("change", () => {
      syncStateFromInputs();
      rerenderAll();
    });
  });

  elements.frequencyTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.trainDaysPerWeek = Number(button.dataset.frequency);
      activeDayId = "";
      resetExerciseStepper();
      rerenderAll();
    });
  });

  if (elements.goalTabs) {
    elements.goalTabs.querySelectorAll("[data-goal]").forEach((button) => {
      button.addEventListener("click", () => {
        state.goal = button.dataset.goal;
        activeDayId = "";
        resetExerciseStepper();
        rerenderAll();
      });
    });
  }

  if (elements.resetButton) {
    elements.resetButton.addEventListener("click", () => {
      state = { ...defaultState };
      activeDayId = "";
      resetExerciseStepper();
      populateInputs();
      rerenderAll();
    });
  }

  elements.moduleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      returnScrollY = null;
      setActiveModule(button.dataset.moduleTarget);
      updateBackToWorkoutButton();
    });
  });

  bindEquipmentJumpButtons(document);
  bindScrollTargetButtons(document);

  elements.checkinButton.addEventListener("click", () => {
    const workout = getActiveWorkout();
    if (!workout) return;
    cancelExerciseTimer();
    completeWorkout(workout);
    renderWeeklyPlan();
    renderWorkout();
  });

  if (elements.backToWorkoutButton) {
    elements.backToWorkoutButton.addEventListener("click", () => {
      setActiveModule("training", { scrollToTop: false });
      const fallbackTarget = document.querySelector(".workout-panel");
      const top = returnScrollY ?? (fallbackTarget ? fallbackTarget.offsetTop - 18 : 0);
      returnScrollY = null;
      updateBackToWorkoutButton();
      window.setTimeout(() => {
        window.scrollTo({ top, behavior: "smooth" });
      }, 60);
    });
  }

  if (elements.backToTopButton) {
    elements.backToTopButton.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (elements.bmiOpenButton) {
    elements.bmiOpenButton.addEventListener("click", openBmiModal);
  }

  if (elements.aiObserveButton) {
    elements.aiObserveButton.addEventListener("click", openAiModal);
  }

  if (elements.noteAddButton) {
    elements.noteAddButton.addEventListener("click", () => {
      setNoteFormOpen(elements.noteForm?.hidden !== false);
    });
  }

  if (elements.noteCancelButton) {
    elements.noteCancelButton.addEventListener("click", () => {
      if (elements.noteInput) elements.noteInput.value = "";
      setNoteFormOpen(false);
    });
  }

  if (elements.noteForm) {
    elements.noteForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveTrainingNote();
    });
  }

  if (elements.aiQuestionForm) {
    elements.aiQuestionForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitAiCoachQuestion();
    });
  }

  if (elements.aiAskButton) {
    elements.aiAskButton.addEventListener("click", (event) => {
      event.preventDefault();
      submitAiCoachQuestion();
    });
  }

  if (elements.aiQuickPrompts) {
    elements.aiQuickPrompts.querySelectorAll("[data-ai-prompt]").forEach((button) => {
      button.addEventListener("click", () => {
        askAiCoach(button.dataset.aiPrompt || button.textContent || "");
      });
    });
  }

  if (elements.bmiModalBackdrop) {
    elements.bmiModalBackdrop.addEventListener("click", closeBmiModal);
  }

  if (elements.bmiModalClose) {
    elements.bmiModalClose.addEventListener("click", closeBmiModal);
  }

  if (elements.aiModalBackdrop) {
    elements.aiModalBackdrop.addEventListener("click", closeAiModal);
  }

  if (elements.aiModalClose) {
    elements.aiModalClose.addEventListener("click", closeAiModal);
  }

  if (elements.tutorialSheetBackdrop) {
    elements.tutorialSheetBackdrop.addEventListener("click", closeTutorialSheet);
  }

  if (elements.tutorialSheetClose) {
    elements.tutorialSheetClose.addEventListener("click", closeTutorialSheet);
  }

  if (elements.tutorialSheetContinue) {
    elements.tutorialSheetContinue.addEventListener("click", closeTutorialSheet);
  }

  if (elements.tutorialSheetImage) {
    elements.tutorialSheetImage.addEventListener("error", () => {
      elements.tutorialSheetFigure.hidden = true;
      elements.tutorialSheetMediaFallback.hidden = false;
    });
  }

  bindTutorialSheetDrag();

  [elements.bmiHeightInput, elements.bmiWeightInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", renderBmiModalPreview);
  });

  if (elements.bmiModalApply) {
    elements.bmiModalApply.addEventListener("click", () => {
      state.heightCm = elements.bmiHeightInput.value ? Number(elements.bmiHeightInput.value) : null;
      state.weightKg = elements.bmiWeightInput.value ? Number(elements.bmiWeightInput.value) : null;
      populateInputs();
      rerenderAll();
      closeBmiModal();
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeBmiModal();
      closeAiModal();
      closeTutorialSheet();
    }
    keepFocusInsideModal(event);
  });

  elements.weeklyPlan?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      movePlanCarousel(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      movePlanCarousel(1);
    }
  });

  window.addEventListener("scroll", updateBackToTopButton, { passive: true });
  window.addEventListener("beforeunload", cancelRestTimer);
}

function init() {
  if (!["muscleGain", "fatLoss"].includes(state.goal)) {
    state.goal = "muscleGain";
  }
  populateInputs();
  syncStateFromInputs();
  attachEvents();
  rerenderAll();
  updateBackToWorkoutButton();
  updateBackToTopButton();
  updateVersionBadge();
}

async function updateVersionBadge() {
  if (!elements.versionBadge) return;
  elements.versionBadge.textContent = `v${APP_VERSION}`;
  elements.versionBadge.title = `当前版本 v${APP_VERSION}`;
  try {
    const response = await fetch("https://api.github.com/repos/flyyang12-rgb/gym_excise_plus/commits/main", {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) return;
    const payload = await response.json();
    const committedAt = payload?.commit?.committer?.date;
    if (!committedAt) return;
    const parts = new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(committedAt));
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const commitTime = `${value.year}.${value.month}.${value.day} ${value.hour}:${value.minute}`;
    const commitSha = payload.sha?.slice(0, 7) || "";
    elements.versionBadge.title = `当前版本 v${APP_VERSION} · 最后提交 ${commitTime} ${commitSha}`.trim();
  } catch {
    // The release version remains visible when GitHub is unavailable or rate-limited.
  }
}

init();
