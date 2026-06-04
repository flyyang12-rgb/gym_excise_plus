const STORAGE_KEY = "fitness_helper_progress_v2";
const AI_COACH_API = (() => {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return `${location.protocol}//${location.hostname}:5501/api/ai-coach`;
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
    stretch: "训练后拉伸 5-10 分钟，今天练了哪块就多放松哪块。",
    recovery: "至少留 2-3 天给肌肉恢复。休息不是偷懒，是为了下一次还能练稳。",
    nutrition: "晚训后 1 小时内补一顿正常饭或加餐，主食和蛋白质都要有。",
  },
  fatLoss: {
    label: "减脂",
    reason: "轻器械少，按瑜伽垫自重课来排更容易坚持",
    durationText: "30-45 分钟",
    stretch: "每次收尾都做 5-8 分钟拉伸，重点放在髋、腿后侧、胸和背。",
    recovery: "减脂也要留恢复日。累的时候就做轻一点的版本，不要硬顶。",
    nutrition: "别极端节食，保证蛋白质和正常进食，课后补水就行。",
  },
};

const equipmentLibrary = {
  treadmill: {
    name: "跑步机",
    image: "images/treadmill.jpg",
    useFor: ["热身快走", "训练后慢走", "恢复日有氧"],
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
    name: "单车",
    image: "images/bike.jpg",
    useFor: ["热身", "腿训练后放松"],
    simple: "阻力放轻到中等，踩 8 到 10 分钟，先把腿转起来。",
    standard: "膝盖不舒服就先调高座椅。",
  },
  cable: {
    name: "综合训练器",
    image: "images/cable.jpg",
    useFor: ["夹胸", "高位下拉", "坐姿划船", "绳索下压"],
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
    simple: "一张防滑瑜伽垫就够了，所有减脂动作都在垫上完成。",
    standard: "铺平、踩稳、不打滑，就是合适。",
  },
};

const tutorialLinks = {
  "平板卧推": "https://www.xiaohongshu.com/explore/684fd5020000000023013244?xsec_token=ABBEifVAJBlkEWQOYth_9ue8penPYDxvIlGg9UYbLfJWQ=&xsec_source=pc_search&source=web_explore_feed",
  "哑铃卧推": "https://www.xiaohongshu.com/discovery/item/679202130000000029036ca1?source=webshare&xhsshare=pc_web&xsec_token=ABaInPD7dtAZJgqAwYDCkbVzqY6QIs1VZuYM36KETGo_k=&xsec_source=pc_share",
  "夹胸 / 飞鸟": "https://www.xiaohongshu.com/discovery/item/692278de000000001e039e0c?source=webshare&xhsshare=pc_web&xsec_token=ABLoBIR9UJvu_29AY0XkgTC-ABzorA63v67AnaKPd4eVc=&xsec_source=pc_share",
  "绳索下压": "https://www.xiaohongshu.com/discovery/item/6946a2c1000000001d03d823?source=webshare&xhsshare=pc_web&xsec_token=ABVIBRKeSeeFgmGjFfPIV8EeyfzlacCzXKlNajs4etG8E=&xsec_source=pc_share",
  "核心收尾": "https://www.xiaohongshu.com/discovery/item/6868fc5b0000000011003d77?source=webshare&xhsshare=pc_web&xsec_token=AB-jxwVW5NMjX44jVM8oSnWHpIS29GV3CyNjpQ74XbQAM=&xsec_source=pc_share",
  "高位下拉": "https://www.xiaohongshu.com/discovery/item/694f169b000000001e023f3a?source=webshare&xhsshare=pc_web&xsec_token=ABVdf03TJ0VOyFfwsXUyLuLjE2Du8hQjoyV2XXl4ciNWw=&xsec_source=pc_share",
  "坐姿划船": "https://www.xiaohongshu.com/discovery/item/6a044f6c000000000803ff53?source=webshare&xhsshare=pc_web&xsec_token=ABup58vH0GjzQgVPV9WKq3qLvzZBEzzq0gt8HsHjyKW_o=&xsec_source=pc_share",
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

const fatLossWorkouts = {
  matFlow1: {
    title: "垫上燃脂 1",
    focus: "全身激活、基础心肺、核心",
    duration: "约 35-40 分钟",
    warmupTitle: "热身先做：原地走 + 开合步 5 分钟",
    warmupText: "全程只用瑜伽垫。先把身体热开，再进入动作循环。",
    tags: ["瑜伽垫", "自重"],
    exercises: [
      { name: "原地高抬腿", sets: "3轮 x 40秒", note: "节奏稳一点，别一上来就冲。", stance: "站在垫子前半段，抬头挺胸。", grip: "双手自然摆动即可。", firstMove: "先慢抬腿，再逐渐提到舒服速度。" },
      { name: "深蹲到伸展", sets: "3轮 x 12次", note: "蹲下去，站起来后顺手把身体伸直。", stance: "双脚踩在垫子上，脚跟别翘。", grip: "双手自然放在胸前或向上伸。", firstMove: "先坐髋，再站起并把手臂举高。" },
      { name: "登山跑", sets: "3轮 x 30秒", note: "核心收紧，动作别散。", stance: "双手撑垫，肩膀在手腕正上方。", grip: "不用器械，手掌撑稳地面。", firstMove: "先把一条腿向前提，再左右交替。" },
      { name: "平板支撑", sets: "3组 x 30-45秒", note: "腰别塌，肚子收住。", stance: "前臂撑垫，身体一条直线。", grip: "不用器械。", firstMove: "先收紧腹部，再保持稳定呼吸。" },
    ],
  },
  matFlow2: {
    title: "垫上燃脂 2",
    focus: "下肢、臀腿、核心",
    duration: "约 35-45 分钟",
    warmupTitle: "热身先做：开合步 + 髋部活动 5 分钟",
    warmupText: "还是只用瑜伽垫，今天重点放在腿和臀。",
    tags: ["瑜伽垫", "自重"],
    exercises: [
      { name: "弓步蹲", sets: "3组 x 10次/侧", note: "身体直着下去，别往前扑。", stance: "前后站开在垫子上。", grip: "双手可叉腰或抱胸。", firstMove: "前腿踩稳，再慢慢下蹲。" },
      { name: "臀桥", sets: "3组 x 15次", note: "顶到臀部发力，不是腰在顶。", stance: "仰躺在垫子上，屈膝踩地。", grip: "手臂放身体两侧。", firstMove: "先收紧臀部，再把髋抬起。" },
      { name: "侧卧抬腿", sets: "3组 x 12次/侧", note: "动作慢一点，别甩腿。", stance: "侧躺在垫子上，身体拉直。", grip: "不用器械。", firstMove: "先抬上侧腿，再慢慢放下。" },
      { name: "死虫", sets: "3组 x 10次/侧", note: "核心稳住，腰别拱。", stance: "仰躺，双腿抬起。", grip: "双手伸向天花板。", firstMove: "对侧手脚慢慢伸出去，再收回。" },
    ],
  },
  matFlow3: {
    title: "垫上燃脂 3",
    focus: "上半身激活、核心耐力",
    duration: "约 30-40 分钟",
    warmupTitle: "热身先做：猫牛式 + 站姿绕肩 5 分钟",
    warmupText: "动作都在垫上或垫边完成，不需要器械。",
    tags: ["瑜伽垫", "自重"],
    exercises: [
      { name: "跪姿俯卧撑", sets: "3组 x 8-12次", note: "先把动作做标准，再谈次数。", stance: "双膝跪在垫子上，身体保持直线。", grip: "双手撑地，略宽于肩。", firstMove: "先稳住躯干，再往下压。", },
      { name: "超人式", sets: "3组 x 12次", note: "背部和臀部一起发力。", stance: "俯卧在垫子上，双臂前伸。", grip: "不用器械。", firstMove: "四肢和胸口轻轻抬起，再放下。" },
      { name: "俄罗斯转体", sets: "3组 x 20次", note: "转腰，不是甩手。", stance: "坐在垫子上，膝盖弯起。", grip: "双手在胸前合拢。", firstMove: "身体微微后仰后左右转动。" },
      { name: "平板支撑交替抬手", sets: "3组 x 20次", note: "肩膀别晃太多。", stance: "高位平板撑在垫子上。", grip: "手掌撑地。", firstMove: "一只手慢慢抬起，再换边。" },
    ],
  },
  matFlow4: {
    title: "垫上燃脂 4",
    focus: "全身循环、出汗节奏",
    duration: "约 35-45 分钟",
    warmupTitle: "热身先做：快走原地踏步 5 分钟",
    warmupText: "今天还是只靠瑜伽垫完成整节课。",
    tags: ["瑜伽垫", "自重"],
    exercises: [
      { name: "开合跳低冲击版", sets: "4轮 x 40秒", note: "不想跳就改成左右踏步。", stance: "站在垫子中央。", grip: "双手自然甩动。", firstMove: "先从慢节奏开始，再加快。" },
      { name: "深蹲脉冲", sets: "3组 x 20次", note: "蹲在半程上下小幅发力。", stance: "脚踩稳垫子。", grip: "双手抱胸。", firstMove: "先下蹲到半程，再小幅起伏。" },
      { name: "山地爬行", sets: "3组 x 30秒", note: "核心收紧，呼吸别乱。", stance: "双手撑地，身体拉平。", grip: "手掌压稳地面。", firstMove: "左右腿交替向前提。" },
      { name: "仰卧卷腹", sets: "3组 x 15次", note: "收腹发力，不是脖子发力。", stance: "仰躺在垫上，屈膝。", grip: "双手轻放耳侧。", firstMove: "先呼气，再把肩膀带起来。" },
    ],
  },
  matFlow5: {
    title: "垫上燃脂 5",
    focus: "拉伸、核心收尾、轻出汗",
    duration: "约 30-35 分钟",
    warmupTitle: "热身先做：关节活动 5 分钟",
    warmupText: "这一练更轻，还是只需要瑜伽垫。",
    tags: ["瑜伽垫", "自重"],
    exercises: [
      { name: "鸟狗式", sets: "3组 x 10次/侧", note: "慢一点，稳住身体。", stance: "四点跪姿撑在垫上。", grip: "手掌压稳地面。", firstMove: "对侧手脚同时伸出去，再收回。" },
      { name: "臀腿拉伸", sets: "3组 x 30秒/侧", note: "今天把腿后侧放松一点。", stance: "坐姿或仰姿都可以。", grip: "不需要器械。", firstMove: "拉到有感觉就停住。" },
      { name: "平板支撑", sets: "3组 x 20-30秒", note: "保持稳定，不追时长。", stance: "前臂撑地。", grip: "不用器械。", firstMove: "先收腹，再保持直线。" },
      { name: "呼吸放松", sets: "2组 x 1分钟", note: "收尾降下来，别急着结束。", stance: "仰躺在垫上。", grip: "双手自然放松。", firstMove: "慢吸气、慢呼气。" },
    ],
  },
  matRecovery: {
    title: "恢复日",
    focus: "轻拉伸、放松",
    duration: "约 20-30 分钟",
    warmupTitle: "恢复日也只用瑜伽垫",
    warmupText: "不加器械，不加跳跃，轻轻松松就行。",
    tags: ["瑜伽垫"],
    exercises: [
      { name: "全身拉伸", sets: "8-10 分钟", note: "胸、背、髋、腿后侧都松一松。", stance: "站姿或坐姿都行。", grip: "不需要器械。", firstMove: "每个部位停留到有拉开感。" },
      { name: "猫牛式", sets: "2组 x 8次", note: "放松背部和脊柱。", stance: "四点跪姿。", grip: "手掌撑稳。", firstMove: "一弓一塌，慢慢呼吸。" },
    ],
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
        name: "夹胸 / 飞鸟",
        sets: "3组 x 12次",
        note: "优先用综合训练器做夹胸；不会钢丝绳，就做卧推凳上的哑铃飞鸟。",
        equipment: "cable",
        extraEquipment: "bench",
        stance: "夹胸时站在综合训练器中间，一脚前一脚后更稳；飞鸟时躺在卧推凳上。",
        grip: "夹胸时双手握住把手；飞鸟时双手各拿轻哑铃，手肘微弯。",
        firstMove: "从两边打开的位置，像抱人一样把手往身体前方合起来。",
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
        note: "上方横杆往胸口方向拉，不要拉到脖子后面。",
        equipment: "cable",
        stance: "坐在器械上，双腿固定住，胸口打开。",
        grip: "双手比肩略宽握住横杆。",
        firstMove: "先沉肩，再把横杆拉向上胸位置，回去时别一下放掉。",
      },
      {
        name: "坐姿划船",
        sets: "3组 x 10次",
        note: "胸挺起来，把把手往肚脐附近拉。",
        equipment: "cable",
        stance: "坐稳，双脚踩住脚踏，腰背挺直。",
        grip: "双手握住把手，手心相对更容易上手。",
        firstMove: "先把肩往后带，再把手拉向肚脐附近。",
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
        note: "继续用综合训练器，背部稳稳发力。",
        equipment: "cable",
        stance: "坐稳，胸口打开。",
        grip: "双手略宽握住横杆。",
        firstMove: "先沉肩，再把横杆拉向上胸。",
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
let activeDayId = "";
let activeExerciseIndex = 0;
let stepMotion = "forward";
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
  warmupTitle: document.querySelector("#warmupTitle"),
  warmupText: document.querySelector("#warmupText"),
  exerciseList: document.querySelector("#exerciseList"),
  checkinButton: document.querySelector("#checkinButton"),
  todayProgress: document.querySelector("#todayProgress"),
  equipmentGrid: document.querySelector("#equipmentGrid"),
  stretchText: document.querySelector("#stretchText"),
  recoveryText: document.querySelector("#recoveryText"),
  nutritionText: document.querySelector("#nutritionText"),
  warmupActions: document.querySelector("#warmupActions"),
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
  return "按瑜伽垫自重课来排，节奏清楚更容易坚持";
}

function getOverviewHint(goal, bmiInfo) {
  if (bmiInfo.label === "偏轻" && goal === "muscleGain") {
    return "你现在更适合走稳一点的增肌路线：先把一周节奏固定，再把吃饭和睡眠跟上。";
  }
  if (goal === "fatLoss") {
    return "减脂阶段就走简单路线：瑜伽垫、自重、规律频次，别把课表搞复杂。";
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
  activeExerciseIndex = 0;
  stepMotion = "forward";
}

function getExerciseProgressMap(workout) {
  const dayStore = progressStore[todayKey()] || {};
  return dayStore[workout.id] || {};
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
  elements.aiContextCard.textContent = `${getAiContextText()}。我会优先给保守、安全、适合新手的处理建议。`;
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
      lead: "说清楚位置、动作和感觉，比如卷腹腰酸；别让教练隔空算命。",
      steps: [],
      warning: "说清问题练得更准",
    };
  }

  if (hasLegSignal || hasKneeSignal) {
    return {
      title: hasKneeSignal ? "可以降级" : "腿部降级",
      lead: `今天可以练，避开「${currentExercise || workoutTitle}」，改慢走、上肢或核心；逞强不算训练。`,
      steps: [],
      warning: "稳住节奏继续变强",
    };
  }

  if (hasBackSignal) {
    return {
      title: "可以换练",
      lead: `今天可以练，避开「${currentExercise || workoutTitle}」这类受力动作，改轻走和温和活动；腰不是承重墙。`,
      steps: [],
      warning: "稳住节奏继续变强",
    };
  }

  if (hasShoulderSignal) {
    return {
      title: "上肢降级",
      lead: "今天可以练，推举卧推先降级，改轻重量活动；关节不负责替你逞能。",
      steps: [],
      warning: "稳住节奏继续变强",
    };
  }

  if (hasSorenessSignal || hasPainSignal) {
    return {
      title: "可以轻练",
      lead: "普通酸就轻活动，刺痛肿麻就绕开疼点；身体报警时别装听不见。",
      steps: [],
      warning: "稳住节奏继续变强",
    };
  }

  if (/吃|饮食|蛋白|饭|热量|减脂|增肌/.test(text)) {
    return {
      title: "先补基础",
      lead: "训练后补蛋白和主食，减脂也别饿傻；饭都不稳还谈线条。",
      steps: [],
      warning: "吃练睡稳继续变强",
    };
  }

  return {
    title: "可以降级",
    lead: "今天可以练，降重量、减次数或改恢复日；计划不是拿来硬扛的。",
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
  const response = await fetch(AI_COACH_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      context: getAiCoachContext(),
    }),
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
  if (!cleanQuestion) return;
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
    lead: "先别急着硬练，我看一下上下文。",
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
    const apiErrorTitle = "AI未接通";
    const fallback = buildAiCoachAnswer(cleanQuestion);
    updateAiMessage(pendingMessage, {
      ...fallback,
      title: apiErrorTitle,
      lead: "线上 API 还在报错，先检查 Vercel 环境变量和函数日志；别急，问题不在你的肌肉。",
      steps: [],
      warning: "修好接口继续变强",
    });
  } finally {
    setAiQuestionBusy(false);
    elements.aiQuestionInput?.focus();
  }
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
    lead: "说位置和感觉，比如膝盖疼、腿酸、腰紧；别让教练猜谜。",
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

function openBmiModal() {
  if (!elements.bmiModal) return;
  if (elements.bmiHeightInput) {
    elements.bmiHeightInput.value = state.heightCm ?? "";
  }
  if (elements.bmiWeightInput) {
    elements.bmiWeightInput.value = state.weightKg ?? "";
  }
  renderBmiModalPreview();
  elements.bmiModal.hidden = false;
  elements.bmiModal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => elements.bmiHeightInput?.focus(), 80);
}

function closeBmiModal() {
  if (!elements.bmiModal) return;
  elements.bmiModal.hidden = true;
  elements.bmiModal.setAttribute("aria-hidden", "true");
}

function openAiModal() {
  if (!elements.aiModal) return;
  renderAiContext();
  resetAiCoachChat();
  elements.aiModal.hidden = false;
  elements.aiModal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => elements.aiQuestionInput?.focus(), 80);
}

function closeAiModal() {
  if (!elements.aiModal) return;
  elements.aiModal.hidden = true;
  elements.aiModal.setAttribute("aria-hidden", "true");
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
  elements.stretchText.textContent = goalInfo.stretch;
  elements.recoveryText.textContent = goalInfo.recovery;
  elements.nutritionText.textContent = goalInfo.nutrition;
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

function renderWarmupActions() {
  if (!elements.warmupActions) return;
  const buttons = state.goal === "fatLoss"
    ? [
        { target: "mat", label: "看瑜伽垫" },
      ]
    : [
        { target: "treadmill", label: "看跑步机" },
        { target: "elliptical", label: "看椭圆机" },
        { target: "bike", label: "看单车" },
      ];

  elements.warmupActions.innerHTML = buttons
    .map(({ target, label }) => `<button type="button" class="soft-button" data-equipment-target="${target}">${label}</button>`)
    .join("");
  bindEquipmentJumpButtons(elements.warmupActions);
}

function renderFrequencyTabs() {
  elements.frequencyTabs.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.frequency) === state.trainDaysPerWeek);
  });
}

function renderWeeklyPlan() {
  const plan = getCurrentPlan();
  if (!plan.find((item) => item.id === activeDayId)) {
    activeDayId = getNearestPlanId(plan);
  }

  elements.weeklyPlan.innerHTML = plan.map((item) => {
    const active = item.id === activeDayId;
    const complete = isWorkoutComplete(item);
    const count = countCompletedExercises(item);
    return `
      <button type="button" class="day-card ${active ? "is-active" : ""} ${complete ? "is-complete" : ""}" data-day-id="${item.id}">
        <div class="day-card-shell">
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
      activeDayId = button.dataset.dayId;
      resetExerciseStepper();
      renderProfileCalendar();
      renderWeeklyPlan();
      renderWorkout();
      button.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
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
  elements.warmupTitle.textContent = workout.warmupTitle;
  elements.warmupText.textContent = workout.warmupText;
  elements.todayProgress.textContent = `今日完成 ${progress.completed}/${progress.total}`;
  elements.checkinButton.textContent = isWorkoutComplete(workout) ? "今天已打卡" : "今日完成打卡";
  elements.checkinButton.disabled = isWorkoutComplete(workout);

  const checkedMap = getExerciseProgressMap(workout);
  const totalExercises = workout.exercises.length;
  activeExerciseIndex = Math.min(Math.max(activeExerciseIndex, 0), Math.max(totalExercises - 1, 0));
  const exercise = workout.exercises[activeExerciseIndex];
  const complete = !!checkedMap[exercise.name];
  const tutorialUrl = state.goal === "muscleGain" ? tutorialLinks[exercise.name] : "";
  const equipmentTarget = state.goal === "fatLoss" ? "mat" : (exercise.equipment || "");
  const equipmentJumpLabel = state.goal === "fatLoss"
    ? "看瑜伽垫"
    : (exercise.equipment ? `看${equipmentLibrary[exercise.equipment].name}` : "");
  const equipmentLabel = state.goal === "fatLoss"
    ? "瑜伽垫"
    : (exercise.equipment ? equipmentLibrary[exercise.equipment].name : "徒手");
  const nextExercise = workout.exercises[activeExerciseIndex + 1];
  const percent = totalExercises ? Math.round(((activeExerciseIndex + 1) / totalExercises) * 100) : 0;
  const completionPercent = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;

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
      <div class="stepper-dots" aria-label="选择动作">
        ${workout.exercises.map((item, index) => `
          <button
            type="button"
            class="${index === activeExerciseIndex ? "is-active" : ""} ${checkedMap[item.name] ? "is-complete" : ""}"
            data-step-index="${index}"
            aria-label="查看动作 ${index + 1}：${item.name}"
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
                <div class="exercise-top-meta">
                  <span>${exercise.sets}</span>
                  ${state.goal === "fatLoss"
                    ? `<span>只需瑜伽垫</span><button type="button" class="tutorial-link tutorial-jump" data-equipment-target="mat">${equipmentJumpLabel}</button>`
                    : (exercise.equipment
                      ? `<span>优先器械：${equipmentLibrary[exercise.equipment].name}</span><button type="button" class="tutorial-link tutorial-jump" data-equipment-target="${equipmentTarget}">${equipmentJumpLabel}</button>`
                      : `<span>徒手动作</span>`)}
                </div>
              </div>
              <div class="exercise-head-actions">
                ${tutorialUrl ? `<a class="tutorial-link" href="${tutorialUrl}" target="_blank" rel="noopener noreferrer">教学详情</a>` : ""}
                <label class="exercise-check exercise-check-card">
                  <input type="checkbox" data-workout-id="${workout.id}" data-exercise-name="${exercise.name}" ${complete ? "checked" : ""}>
                  <span>${complete ? "已完成" : "标记完成"}</span>
                </label>
              </div>
            </div>
            <p class="exercise-note">${exercise.note || ""}</p>
          </div>
        </div>
        <div class="guide-grid">
          <div class="guide-box">
            <span>站位</span>
            <strong>${exercise.stance || "站稳或坐稳，先把身体摆正。"}</strong>
          </div>
          <div class="guide-box">
            <span>握法</span>
            <strong>${exercise.grip || "双手自然放好，先不要追求重。"}</strong>
          </div>
          <div class="guide-box">
            <span>启动</span>
            <strong>${exercise.firstMove || "先做慢一点，先把路线做对。"}</strong>
          </div>
        </div>
        ${state.goal === "fatLoss" ? `<div class="exercise-actions"><span class="pill">只需瑜伽垫</span></div>` : ""}
      </article>

      <div class="stepper-footer">
        <button type="button" class="step-nav-button" data-step-direction="prev" ${activeExerciseIndex === 0 ? "disabled" : ""}>上一条</button>
        <span>${nextExercise ? `下一条 · ${nextExercise.name}` : "全部动作都看完了，可以收尾恢复"}</span>
        <button type="button" class="step-nav-button step-nav-button-primary" data-step-direction="next">
          ${activeExerciseIndex === totalExercises - 1 ? "回到第一条" : "下一条"}
        </button>
      </div>
    </div>
  `;

  bindWorkoutInteractions();
}

function bindWorkoutInteractions() {
  bindEquipmentJumpButtons(elements.exerciseList);

  elements.exerciseList.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const workout = getActiveWorkout();
      const lastIndex = workout ? workout.exercises.length - 1 : 0;
      const shouldAdvance = checkbox.checked && activeExerciseIndex < lastIndex;
      setExerciseCompleted(checkbox.dataset.workoutId, checkbox.dataset.exerciseName, checkbox.checked);
      renderWeeklyPlan();
      if (shouldAdvance) {
        stepMotion = "forward";
        activeExerciseIndex += 1;
        window.setTimeout(renderWorkout, 180);
      } else {
        renderWorkout();
      }
    });
  });

  elements.exerciseList.querySelectorAll("[data-step-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextIndex = Number(button.dataset.stepIndex);
      stepMotion = nextIndex >= activeExerciseIndex ? "forward" : "back";
      activeExerciseIndex = nextIndex;
      renderWorkout();
    });
  });

  elements.exerciseList.querySelectorAll("[data-step-direction]").forEach((button) => {
    button.addEventListener("click", () => {
      const workout = getActiveWorkout();
      if (!workout) return;
      const lastIndex = workout.exercises.length - 1;
      if (button.dataset.stepDirection === "prev") {
        stepMotion = "back";
        activeExerciseIndex = Math.max(0, activeExerciseIndex - 1);
      } else {
        stepMotion = activeExerciseIndex >= lastIndex ? "back" : "forward";
        activeExerciseIndex = activeExerciseIndex >= lastIndex ? 0 : activeExerciseIndex + 1;
      }
      renderWorkout();
    });
  });
}

function renderEquipmentGuide() {
  const order = state.goal === "fatLoss"
    ? ["mat"]
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
  renderWarmupActions();
  renderFrequencyTabs();
  renderWeeklyPlan();
  renderWorkout();
  renderEquipmentGuide();
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
    completeWorkout(workout);
    renderWeeklyPlan();
    renderWorkout();
  });

  if (elements.backToWorkoutButton) {
    elements.backToWorkoutButton.addEventListener("click", () => {
      setActiveModule("training", { scrollToTop: false });
      const fallbackTarget = document.querySelector(".workout-panel") || document.querySelector(".warmup-card");
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

  if (elements.aiQuestionForm) {
    elements.aiQuestionForm.addEventListener("submit", (event) => {
      event.preventDefault();
      askAiCoach(elements.aiQuestionInput?.value || "");
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
    }
  });

  window.addEventListener("scroll", updateBackToTopButton, { passive: true });
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
}

init();
