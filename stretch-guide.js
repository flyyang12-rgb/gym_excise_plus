(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.StretchGuide = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const stretches = [
    {
      id: "chest", title: "扶凳开胸拉伸", area: "胸部", seconds: 30, sides: 1,
      memoryCue: "双手扶稳，臀后移，胸下沉。",
      safetyNote: "支撑要固定；不压腰、不耸肩，肩前侧痛就停。",
      cue: "双手扶稳，臀部向后，胸前轻微牵拉即可。",
      steps: ["双手扶住固定凳背或稳固支撑，双脚踩稳，膝盖保留一点弯曲。", "臀部缓慢向后送，让手臂向前伸、胸口轻轻下沉，背部保持自然。", "到胸前有轻微牵拉感就停，保持约 30 秒，再缓慢站直。"],
      avoid: "支撑不能滑动或折叠；不要压腰、耸肩，肩前侧疼痛时停止。",
    },
    {
      id: "back", title: "站姿前伸拉背", area: "上背部", seconds: 30, sides: 1,
      memoryCue: "双手前伸，背展开，肩放松。",
      safetyNote: "不低头硬拉，不用腰后顶；肩、颈、腰痛就停。",
      cue: "双手向前伸，肩胛轻轻打开，肩膀放松。",
      steps: ["双脚与髋同宽站稳，膝盖微弯，双手在胸前相扣。", "双手缓慢向前伸，让上背部自然舒展，到肩胛之间有轻微牵拉感就停。", "头颈保持自然，正常呼吸约 30 秒，再缓慢松开双手。"],
      avoid: "不要耸肩、低头硬拉或用腰向后顶；肩、颈或腰疼痛时停止。",
    },
    {
      id: "shoulder", title: "横抱臂拉伸", area: "肩后侧", seconds: 30, sides: 2,
      memoryCue: "横抱手臂，肩放低，轻拉近。",
      safetyNote: "扶上臂，不压肘；不耸肩、不扭身。",
      cue: "另一只手扶上臂，轻轻拉近身体。",
      steps: ["站稳或坐稳，肩膀放松，一只手臂横放在胸前。", "另一只手扶住上臂，轻轻拉近身体，不直接压肘关节。", "肩后侧有牵拉感即可，保持约 30 秒后换边。"],
      avoid: "不要耸肩、扭身或把手臂拉到疼。",
    },
    {
      id: "triceps", title: "头顶屈肘拉伸", area: "上臂后侧、三头肌", seconds: 30, sides: 2,
      memoryCue: "手伸脑后，轻扶肘，腰不顶。",
      safetyNote: "不拉脖子，不硬压肘；肩部不适就跳过。",
      cue: "一手伸到脑后，另一手轻扶手肘，不压头、不顶腰。",
      steps: ["站稳或坐稳，一只手臂向上抬起，再弯曲手肘，让手伸向上背部。", "另一只手轻扶抬起的手肘，让上臂后侧有轻微牵拉感，不用力下压。", "保持自然呼吸约 30 秒，缓慢松开，再换另一侧。"],
      avoid: "不要拉脖子、反弓腰部或硬压手肘；肩部不适时跳过。",
    },
    {
      id: "quads", title: "扶椅腿前侧拉伸", area: "大腿前侧", seconds: 30, sides: 2,
      memoryCue: "扶椅握踝，膝朝下，腰不顶。",
      safetyNote: "椅子要固定；够不到、站不稳或膝痛就跳过。",
      cue: "一手扶椅，另一手握脚踝，膝盖朝下，不向前顶腰。",
      steps: ["站在稳固椅子旁，一手扶住椅背，支撑脚踩稳，身体保持直立。", "另一侧膝盖弯曲，用同侧手轻握脚踝，让脚跟缓慢靠近臀部，双膝靠近、朝下。", "大腿前侧有轻微牵拉感即可，保持约 30 秒，慢慢放下脚后换边。"],
      avoid: "椅子不能滑动、转动或折叠；不要硬拽脚踝或反弓腰，够不到、站不稳或膝痛时跳过。",
    },
    {
      id: "hamstrings", title: "坐姿腿后侧拉伸", area: "大腿后侧", seconds: 30, sides: 2,
      memoryCue: "脚跟着地，髋前折，背不弓。",
      safetyNote: "膝微弯，不追求摸脚；麻木或放射痛就停。",
      cue: "从髋部轻轻前倾，不弓背去摸脚。",
      steps: ["坐在稳固凳子的前沿，一条腿向前伸，脚跟着地，膝盖保留一点弯曲。", "背部保持自然，从髋部轻轻前倾，到腿后侧有牵拉感就停。", "不追求碰到脚尖，正常呼吸，保持约 30 秒后换边。"],
      avoid: "不要把膝盖压死、弓背或弹震；出现麻木或放射痛时停止。",
    },
    {
      id: "glutes", title: "坐姿搭腿拉臀", area: "臀部", seconds: 30, sides: 2,
      memoryCue: "脚踝搭腿，髋前折，不压膝。",
      safetyNote: "膝、髋、腰痛时跳过；髋关节置换术后不做。",
      cue: "脚踝搭在对侧大腿上，从髋部轻轻前倾，不压膝盖。",
      steps: ["坐在稳固椅子上，一只脚踩地，另一侧脚踝搭在支撑腿的大腿上，避开膝盖。", "双手轻扶腿部，背部保持自然，从髋部稍向前倾，到臀部有轻微牵拉感就停。", "正常呼吸，保持约 30 秒，再慢慢坐直、放下腿并换边。"],
      avoid: "不要压膝或追求弯腰幅度；膝、髋、腰痛时跳过，髋关节置换术后不做。",
    },
    {
      id: "calves", title: "扶墙弓步拉伸", area: "小腿", seconds: 30, sides: 2,
      memoryCue: "前膝微弯，后跟踩地，慢前移。",
      safetyNote: "后脚跟不抬起，脚尖朝前，不弹动。",
      cue: "后脚跟踩地，身体缓慢向前。",
      steps: ["双手扶墙，双脚前后站立，脚尖朝前，后脚跟踩实地面。", "前膝慢慢弯曲，后腿保持自然伸直，身体向前移动一点。", "小腿后侧有轻微牵拉感即可，保持约 30 秒后换边。"],
      avoid: "不要弹动、扭转脚掌或把后脚跟抬起。",
    },
  ];

  const mediaFiles = {
    chest: "1405-chfnQnM",
    back: "1365-GSDioYu",
    shoulder: "0669-xifhB5W",
    triceps: "0643-Z5YStHW",
    hamstrings: "1548-xGgAGPm",
    glutes: "2567-QY39eBr",
    calves: "1377-m0tCHqc",
  };

  function copyStretch(item, options) {
    const file = mediaFiles[item.id];
    const media = item.id === "quads" ? {
      type: "video", src: "https://static1.keepcdn.com/chaos/0816/B020C005_s.mp4",
      poster: "https://static1.gotokeep.com/picture/frame/1502966868332.jpg",
      alt: "扶椅站姿大腿前侧拉伸示范，做完后换边",
      attribution: "© Keep · 扶椅大腿前侧拉伸",
      attributionUrl: "https://www.calorietech.com/exercises/55cc42d20f11ec78824999d9?gender=f",
      sourceUrl: "https://www.calorietech.com/exercises/55cc42d20f11ec78824999d9?gender=f",
    } : {
      src: `exercise-media/${file}.gif`, poster: `exercise-media/${file}.jpg`,
      alt: `${item.title}动作示范`, attribution: "© Gym visual · ExerciseDB",
      attributionUrl: "https://gymvisual.com/",
      sourceUrl: `https://github.com/MrZaKaRiA/exercises-dataset/blob/main/videos/${file}.gif`,
    };
    return {
      ...item,
      steps: [...item.steps],
      media: options.mediaEnabled ? media : null,
    };
  }

  function getAllStretches(options = {}) {
    return stretches.map((item) => copyStretch(item, options));
  }

  const warmups = [
    {
      id: "chest-opening", title: "动态扩胸", area: "胸部、肩部", suitableFor: ["练胸前", "练肩前"], repetitions: "10–15 次",
      memoryCue: "手臂慢开合，肩放松，腰不顶。",
      safetyNote: "不甩臂；肩痛或卡住就停。",
      cue: "手臂缓慢打开再合拢，不甩动、不憋气。",
      steps: ["双脚站稳，膝盖微弯，双臂向前伸到舒服的高度。", "手臂向两侧缓慢打开，胸口自然展开，不挺腰硬撑。", "双臂再向前合拢，轻松重复 10–15 次，不长时间停住。"],
      avoid: "不追求手臂往身后甩的幅度；肩部疼痛或卡住时停止。",
      media: {
        src: "exercise-media/1167-3uj0Ozg.gif", poster: "exercise-media/1167-3uj0Ozg.jpg",
        alt: "动态扩胸动作示范", attribution: "© Gym visual · ExerciseDB", attributionUrl: "https://gymvisual.com/",
        sourceUrl: "https://github.com/MrZaKaRiA/exercises-dataset/blob/main/videos/1167-3uj0Ozg.gif",
      },
    },
    {
      id: "shoulder-rotation", title: "招财猫（空手）", area: "肩关节活动", suitableFor: ["练胸前", "练背前", "练肩前"], repetitions: "8–10 次",
      memoryCue: "大臂稳，前臂转，空手慢慢做。",
      safetyNote: "不用哑铃，不耸肩、不顶腰；不硬转到最大幅度。",
      cue: "大臂稳住，手肘弯曲，前臂慢慢向上转，再放回。",
      steps: ["双脚站稳、腹部轻收，双臂向两侧抬到舒服的高度，手肘弯曲约 90 度。", "大臂尽量不动，让前臂缓慢向上旋转，幅度以肩部舒适为准。", "再慢慢转回，空手重复 8–10 次，全程自然呼吸。"],
      avoid: "不用哑铃，不耸肩、不反弓腰；不要硬转到最大幅度，疼痛或卡住时停止。",
      media: {
        type: "video", src: "https://static1.keepcdn.com/chaos/0728/B011C013_main_s.mp4",
        poster: "https://static1.keepcdn.com/picture/frame/1501050622143.jpg", alt: "空手招财猫动作示范",
        attribution: "© Keep · 招财猫", attributionUrl: "https://www.calorietech.com/exercises/57e34ab909a2d8a73b79070a",
        sourceUrl: "https://www.calorietech.com/exercises/57e34ab909a2d8a73b79070a",
      },
    },
    {
      id: "leg-squat", title: "徒手小幅蹲起", area: "髋、膝、臀腿活动", suitableFor: ["练腿前"], repetitions: "6–8 次",
      memoryCue: "臀后移，浅浅蹲，踩稳再站直。",
      safetyNote: "膝盖跟着脚尖走，疼痛就停。",
      cue: "臀部稍向后，只蹲一点，再踩稳站直。",
      steps: ["双脚与肩同宽，脚掌踩实地面，双手向前伸，必要时轻扶稳固支撑。", "臀部稍向后送，膝盖与脚尖同向，只做小幅下蹲，不追求动图里的深度。", "脚跟踩稳后缓慢站直，轻松做 6–8 次，不加重量、不蹲到腿酸。"],
      avoid: "不要弹震、跳起或膝盖内扣；不适时减小幅度，疼痛时停止。",
      media: {
        src: "exercise-media/3119-75Bgtjy.gif", poster: "exercise-media/3119-75Bgtjy.jpg", alt: "徒手蹲起动作路线示范",
        attribution: "© Gym visual · ExerciseDB", attributionUrl: "https://gymvisual.com/",
        sourceUrl: "https://github.com/MrZaKaRiA/exercises-dataset/blob/main/videos/3119-75Bgtjy.gif",
        approximate: true, note: "动图演示蹲起路线，热身只做小幅，不追求蹲深。",
      },
    },
    {
      id: "calf-raise", title: "站姿提踵", area: "小腿、踝关节活动", suitableFor: ["练腿前", "跑步前"], repetitions: "8–10 次",
      memoryCue: "扶稳一起踮，慢慢落回地。",
      safetyNote: "不加重、不弹跳；踝部或跟腱痛就停。",
      cue: "扶稳、双脚一起踮起，再缓慢落下。",
      steps: ["站在平地上，双脚与髋同宽，轻扶墙面或稳固扶手保持平衡。", "两侧脚跟缓慢抬起，把重心移到前脚掌，膝盖不锁死。", "脚跟再轻轻落回地面，轻松重复 8–10 次，不加重量、不站台阶。"],
      avoid: "不要快速弹跳或只用一条腿硬撑；踝部或跟腱疼痛时停止。",
      media: {
        src: "exercise-media/1373-bJYHBIN.gif", poster: "exercise-media/1373-bJYHBIN.jpg", alt: "站姿提踵动作示范",
        attribution: "© Gym visual · ExerciseDB", attributionUrl: "https://gymvisual.com/",
        sourceUrl: "https://github.com/MrZaKaRiA/exercises-dataset/blob/main/videos/1373-bJYHBIN.gif",
      },
    },
    {
      id: "ankle-circles", title: "扶稳踝绕环", area: "踝关节活动", suitableFor: ["练腿前", "跑步前"], repetitions: "每侧顺逆各 5 圈",
      memoryCue: "扶稳身，转脚踝，小圈慢慢画。",
      safetyNote: "膝盖不跟着扭；站不稳就坐着做。",
      cue: "扶稳身体，只让脚踝缓慢画小圈。",
      steps: ["站在稳固支撑旁，双手扶稳，一只脚轻轻抬离地面，上身保持稳定。", "只转动脚踝，顺时针、逆时针各慢慢画 5 个小圈，不用力甩脚。", "脚放回地面后换另一侧；单脚站不稳时，可以坐在稳固椅子上做。"],
      avoid: "不要让膝盖和身体跟着扭转；踝部疼痛时停止。",
      media: {
        src: "exercise-media/1368-uL9CsKm.gif", poster: "exercise-media/1368-uL9CsKm.jpg", alt: "踝关节绕环动作示范",
        attribution: "© Gym visual · ExerciseDB", attributionUrl: "https://gymvisual.com/",
        sourceUrl: "https://github.com/MrZaKaRiA/exercises-dataset/blob/main/videos/1368-uL9CsKm.gif",
      },
    },
    {
      id: "shoulder-circles", title: "屈臂肩部绕环", area: "肩胛、肩关节活动", suitableFor: ["练背前", "练肩前"], repetitions: "8–10 圈",
      memoryCue: "手搭肩，肘带圈，身体稳。",
      safetyNote: "不耸肩、不甩肘；疼痛或卡住就停。",
      cue: "双手轻搭肩部，手肘带着肩膀慢慢向前绕圈。",
      steps: ["双脚与肩同宽站稳，腹部轻收，手肘弯曲，手指轻搭在肩部。", "肩部向前缓慢画圈，手肘随肩膀移动，身体保持稳定。", "在舒适范围内做 8–10 圈，自然呼吸，不追求大幅度。"],
      avoid: "不要耸肩硬转、晃动身体或快速甩肘；疼痛或卡住时停止。",
      media: {
        type: "video", src: "https://static1.keepcdn.com/chaos/0728/B008C037_main_s.mp4",
        poster: "https://static1.keepcdn.com/picture/frame/1501239002141.jpg", alt: "屈臂向前肩部绕环示范",
        attribution: "© Keep · 肩部绕环", attributionUrl: "https://www.calorietech.com/exercises/595f4cbfff247f33e297ea19?gender=f",
        sourceUrl: "https://www.calorietech.com/exercises/595f4cbfff247f33e297ea19?gender=f",
      },
    },
  ];

  function getWarmups(options = {}) {
    return warmups.map((item) => ({
      ...item, steps: [...item.steps], suitableFor: [...item.suitableFor],
      media: options.mediaEnabled ? { ...item.media } : null,
    }));
  }

  const workoutWarmupPlans = {
    push: ["chest-opening", "shoulder-rotation"],
    pull: ["shoulder-circles", "shoulder-rotation"],
    legs: ["leg-squat", "calf-raise", "ankle-circles"],
    shoulder: ["shoulder-circles", "shoulder-rotation"],
    fullbody: ["chest-opening", "leg-squat", "calf-raise"],
    matFlow1: ["leg-squat", "calf-raise", "ankle-circles"],
    matFlow2: ["shoulder-circles", "leg-squat", "ankle-circles"],
    matFlow3: ["chest-opening", "shoulder-circles", "ankle-circles"],
    matFlow4: ["leg-squat", "calf-raise", "ankle-circles"],
    matFlow5: ["leg-squat", "ankle-circles"],
  };

  function getWorkoutWarmups(workout = {}, options = {}) {
    if (workout.type === "recovery") return [];
    const ids = workoutWarmupPlans[workout.key];
    if (!Array.isArray(ids)) return [];
    const items = getWarmups(options);
    return ids.map((id) => items.find((item) => item.id === id));
  }

  // 每套计划挑选当天重点部位的 2–3 项，避免有氧叠加后展开整套动作库。
  const workoutStretchPlans = {
    push: ["chest", "shoulder", "triceps"],
    pull: ["back", "shoulder"],
    legs: ["quads", "hamstrings", "glutes"],
    shoulder: ["shoulder", "triceps"],
    fullbody: ["chest", "back", "quads"],
    matFlow1: ["quads", "hamstrings", "calves"],
    matFlow2: ["triceps", "quads", "calves"],
    matFlow3: ["chest", "back", "calves"],
    matFlow4: ["quads", "hamstrings", "calves"],
    matFlow5: ["quads", "calves"],
  };

  // 未配置的计划按整套动作兜底匹配，最多三项；不会给未知动作凑数。
  const rules = [
    { match: /俯卧撑|卧推|推胸|哑铃飞鸟|夹胸|绳索飞鸟/, ids: ["chest", "shoulder"] },
    { match: /下拉|划船|直臂下压/, ids: ["back"] },
    { match: /推肩|侧平举|俯身飞鸟|肩部触碰|平板支撑交替抬手/, ids: ["shoulder"] },
    { match: /绳索下压|三头/, ids: ["triceps"] },
    { match: /深蹲|箭步蹲|弓步蹲|伸腿|屈膝/, ids: ["quads", "hamstrings"] },
    { match: /硬拉|臀桥|臀腿拉伸/, ids: ["hamstrings"] },
    { match: /跑步|慢跑|快走|慢走|椭圆机|提踵|踝绕环/, ids: ["hamstrings", "calves"] },
    { match: /单车|骑行|骑车|轻松骑/, ids: ["quads", "calves"] },
    { match: /^全身拉伸$/, ids: stretches.map((item) => item.id) },
  ];

  function getWorkoutStretches(workout = {}, options = {}) {
    if (workout.type === "recovery") return [];
    const plannedIds = workoutStretchPlans[workout.key];
    if (Array.isArray(plannedIds)) return plannedIds.map((id) => copyStretch(stretches.find((item) => item.id === id), options));
    const ids = new Set();
    const names = (workout.exercises || []).map((exercise) => String(exercise.name || ""));
    names.forEach((name) => rules.forEach((rule) => {
      if (rule.match.test(name)) rule.ids.forEach((id) => ids.add(id));
    }));
    return stretches.filter((item) => ids.has(item.id)).slice(0, 3).map((item) => copyStretch(item, options));
  }

  function getHoldSeconds(items = []) {
    return items.reduce((total, item) => total + item.seconds * item.sides, 0);
  }

  return { getWorkoutStretches, getAllStretches, getWarmups, getWorkoutWarmups, getHoldSeconds };
});
