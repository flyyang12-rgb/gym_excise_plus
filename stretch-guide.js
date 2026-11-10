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
      id: "quads", title: "毛巾辅助腿前侧拉伸", area: "大腿前侧、髋前侧", seconds: 30, sides: 2,
      memoryCue: "扶稳套脚，膝朝下，腰不顶。",
      safetyNote: "支撑要固定，毛巾套在脚背上；站不稳或膝痛就跳过。",
      cue: "用毛巾辅助拉住脚背，膝盖朝下，不硬拽、不顶腰。",
      steps: ["站在稳固椅背或墙面旁，一手扶稳，把毛巾套在另一侧脚背上，双手轻握毛巾两端。", "屈膝让脚跟缓慢靠近臀部，双膝尽量靠近、朝向地面，身体保持直立。", "大腿前侧有轻微牵拉感即可，保持约 30 秒，慢慢放松毛巾后换边。"],
      avoid: "支撑不能滑动或折叠；不要把毛巾套在脚踝关节上硬拉，不要反弓腰，站不稳或膝痛时跳过。",
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
    {
      id: "lats", title: "站姿侧腰拉伸", area: "背阔肌、侧腰", seconds: 30, sides: 2,
      memoryCue: "双臂侧举，慢慢侧倒，骨盆不顶。",
      safetyNote: "不甩腰、不追求大幅度；肩或腰不适就停。",
      cue: "双臂向两侧展开，上身缓慢侧屈，侧腰轻微牵拉即可。",
      steps: ["双脚与肩同宽站稳，膝盖微弯，双臂向两侧伸到舒服的高度。", "骨盆尽量朝前，上身缓慢向一侧侧屈，不向前折腰或向后挺。", "侧腰和背阔肌有轻微牵拉感即可，保持约 30 秒，回正后换边。"],
      avoid: "不要快速甩腰、扭转骨盆或硬压手臂；肩部或腰部疼痛时停止。",
    },
    {
      id: "chestFront", title: "胸前交臂拉伸", area: "胸部、肩前侧", seconds: 30, sides: 1,
      memoryCue: "双臂交叠，肩胛轻夹，肩放松。",
      safetyNote: "不耸肩、不挺腰，不用力硬夹肩胛。",
      cue: "双臂在胸前交叠，轻轻收紧肩胛，胸前有轻微牵拉感。",
      steps: ["双脚与肩同宽站稳，双臂向前伸到肩部下方舒服的高度。", "双臂在胸前交叠，手指自然相扣，肩膀放松，不耸肩。", "轻轻收紧肩胛，同时双手向前送，胸前有轻微牵拉感即可，保持约 30 秒。"],
      avoid: "不要挺腰、耸肩或用力硬夹肩胛；肩前侧疼痛或卡住时停止。",
    },
    {
      id: "forearm", title: "侧向屈腕拉伸", area: "前臂、手腕", seconds: 30, sides: 2,
      memoryCue: "手臂伸稳，手腕轻屈，不猛拉。",
      safetyNote: "只轻拉到轻微牵拉感；手腕痛或麻木就停。",
      cue: "一只手臂伸稳，另一只手轻带手腕，不甩、不猛压。",
      steps: ["双脚站稳，一只手臂向侧前方伸到舒服的高度，掌心自然朝下。", "另一只手轻握这只手，缓慢带动手腕向舒服方向屈曲，手肘保持稳定。", "前臂有轻微牵拉感即可，保持约 30 秒，放松后换另一侧。"],
      avoid: "不要猛拉手指或压手肘；出现手腕疼痛、麻木或刺痛时停止。",
    },
    {
      id: "hipFlexor", title: "站姿弓步髋前拉伸", area: "髋前侧、大腿前侧", seconds: 30, sides: 2,
      memoryCue: "前膝微弯，骨盆正，后侧髋轻沉。",
      safetyNote: "只做站姿浅弓步，不跪地、不压腰；膝或腰痛就停。",
      cue: "前后脚站稳，前膝微弯，后侧髋前方有轻微牵拉感。",
      steps: ["双脚与髋同宽站稳，一只脚向前迈一步，后脚踩稳，双手扶在前腿大腿上。", "前膝缓慢弯曲并朝脚尖方向移动，后腿自然伸直，骨盆保持朝前，不塌腰。", "后侧髋前方有轻微牵拉感即可，保持约 30 秒，站直后换边。"],
      avoid: "不要跪地、弓步过深或向前顶腰；膝盖、髋部或腰部疼痛时停止。",
    },
  ];

  const mediaFiles = {
    chest: "1405-chfnQnM",
    back: "1365-GSDioYu",
    shoulder: "0669-xifhB5W",
    triceps: "0643-Z5YStHW",
    quads: "1564-tFGKm99",
    hamstrings: "1548-xGgAGPm",
    glutes: "2567-QY39eBr",
    calves: "1377-m0tCHqc",
    lats: "0794-1jXLYEw",
    chestFront: "1271-Uto7l43",
    forearm: "0721-UtmIqcI",
    hipFlexor: "1585-0mB6wHO",
  };

  function copyStretch(item, options) {
    const file = mediaFiles[item.id];
    const media = {
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
      tempo: "开合各约 2 秒", breathing: "打开吸气，合拢呼气",
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
      id: "shoulder-rotation", title: "轻哑铃肩外旋", area: "肩袖、肩关节活动", suitableFor: ["练胸前", "练背前", "练肩前"], repetitions: "8–10 次",
      tempo: "上转、回落各约 2 秒", breathing: "自然呼吸，不憋气",
      memoryCue: "大臂稳，前臂转，重量轻一点。",
      safetyNote: "只用轻哑铃或水瓶，不耸肩、不顶腰；不硬转到最大幅度。",
      cue: "手肘弯曲约 90 度，轻握哑铃，前臂缓慢向上转再回落。",
      steps: ["双脚站稳、腹部轻收，双手各握一个轻哑铃或水瓶，双臂向两侧抬到舒服的高度。", "手肘弯曲约 90 度并尽量保持位置，前臂缓慢向上旋转，幅度以肩部舒适为准。", "再慢慢回落，重复 8–10 次；感觉吃力就减轻重量或停下，不追求发热酸胀。"],
      avoid: "不用大重量，不耸肩、不反弓腰；不要硬转到最大幅度，疼痛或卡住时停止。",
      media: {
        src: "exercise-media/0864-x306lCW.gif", poster: "exercise-media/0864-x306lCW.jpg",
        alt: "轻哑铃肩外旋动作示范", attribution: "© Gym visual · ExerciseDB", attributionUrl: "https://gymvisual.com/",
        sourceUrl: "https://github.com/MrZaKaRiA/exercises-dataset/blob/main/videos/0864-x306lCW.gif",
      },
    },
    {
      id: "leg-squat", title: "徒手小幅蹲起", area: "髋、膝、臀腿活动", suitableFor: ["练腿前"], repetitions: "6–8 次",
      tempo: "下蹲、站起各约 2 秒", breathing: "下蹲吸气，站起呼气",
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
      tempo: "抬起、落下各约 2 秒", breathing: "自然呼吸，不憋气",
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
      tempo: "每圈约 2–3 秒", breathing: "自然呼吸，不憋气",
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
      id: "standing-archer", title: "站姿弓箭转体", area: "上背、肩部活动", suitableFor: ["练背前", "练肩前", "全身训练前"], repetitions: "每侧 6–8 次",
      tempo: "转体、回正各约 2 秒", breathing: "自然呼吸，不憋气",
      memoryCue: "手臂前伸，躯干慢转，骨盆朝前。",
      safetyNote: "不甩臂、不扭腰；肩背疼痛或卡住就停。",
      cue: "双臂前伸，躯干缓慢左右转动，像轻轻拉开弓。",
      steps: ["双脚与肩同宽站稳，膝盖微弯，双臂向前伸到肩部下方舒服的高度。", "保持骨盆尽量朝前，躯干缓慢向一侧转动，双臂像拉弓一样一前一后打开。", "缓慢回正后换另一侧，各做 6–8 次，不追求转动幅度。"],
      avoid: "不要甩臂、扭腰或屏住呼吸；肩部、背部疼痛或卡住时停止。",
      media: {
        src: "exercise-media/3669-JF8AkMX.gif", poster: "exercise-media/3669-JF8AkMX.jpg",
        alt: "站姿弓箭转体动作示范", attribution: "© Gym visual · ExerciseDB", attributionUrl: "https://gymvisual.com/",
        sourceUrl: "https://github.com/MrZaKaRiA/exercises-dataset/blob/main/videos/3669-JF8AkMX.gif",
      },
    },
    {
      id: "wrist-circles", title: "手腕绕环", area: "手腕、前臂活动", suitableFor: ["练胸前", "练背前"], repetitions: "顺逆各 8 圈",
      tempo: "每圈约 2 秒", breathing: "自然呼吸，不憋气",
      memoryCue: "手臂伸稳，手腕慢转，手指轻握。",
      safetyNote: "不甩手腕、不握死拳；手腕痛或麻木就停。",
      cue: "双臂向前伸稳，只让手腕缓慢画圈。",
      steps: ["双脚站稳，双臂向前伸到舒服的高度，双手轻轻握拳。", "保持前臂稳定，双手手腕同时缓慢顺时针画圈，不甩动。", "做 8 圈后换逆时针再做 8 圈，手指不要握得过紧。"],
      avoid: "不要快速甩腕或握死拳；手腕疼痛、麻木或刺痛时停止。",
      media: {
        src: "exercise-media/1428-2zNKRUB.gif", poster: "exercise-media/1428-2zNKRUB.jpg",
        alt: "手腕绕环动作示范", attribution: "© Gym visual · ExerciseDB", attributionUrl: "https://gymvisual.com/",
        sourceUrl: "https://github.com/MrZaKaRiA/exercises-dataset/blob/main/videos/1428-2zNKRUB.gif",
      },
    },
    {
      id: "leg-curl", title: "站姿单腿屈膝", area: "大腿后侧、膝关节活动", suitableFor: ["练腿前", "跑步前", "全身训练前"], repetitions: "每侧 8 次",
      tempo: "屈膝、放下各约 2 秒", breathing: "自然呼吸，不憋气",
      memoryCue: "扶稳站直，脚跟轻抬，慢慢放下。",
      safetyNote: "可扶墙保持平衡，不踢高、不甩腿；膝痛就停。",
      cue: "站稳后让一侧脚跟缓慢靠近臀部，再轻轻放回地面。",
      steps: ["双脚与髋同宽站稳，可轻扶墙面或稳固支撑，身体保持直立。", "一侧脚跟缓慢向臀部方向抬起，膝盖自然朝下，不追求抬得很高。", "慢慢放回地面后换边，各做 8 次；站不稳时减小动作幅度。"],
      avoid: "不要甩腿、踢高或支撑腿膝盖锁死；膝部疼痛或站不稳时停止。",
      media: {
        src: "exercise-media/0795-C5jncD2.gif", poster: "exercise-media/0795-C5jncD2.jpg",
        alt: "站姿单腿屈膝动作示范", attribution: "© Gym visual · ExerciseDB", attributionUrl: "https://gymvisual.com/",
        sourceUrl: "https://github.com/MrZaKaRiA/exercises-dataset/blob/main/videos/0795-C5jncD2.gif",
      },
    },
    {
      id: "alternating-lunge", title: "交替浅弓步", area: "髋部、臀腿活动", suitableFor: ["练腿前", "全身训练前"], repetitions: "每侧 6 次",
      tempo: "迈步、收回各约 2 秒", breathing: "自然呼吸，不憋气",
      memoryCue: "小步前迈，膝盖同向，踩稳收回。",
      safetyNote: "只迈小步、浅屈膝，不追求动图深度；膝或髋痛就停。",
      cue: "左右交替向前迈小步，前膝微弯，再踩稳收回。",
      steps: ["双脚与肩同宽站稳，双手轻放髋部，身体保持直立。", "一只脚向前迈一小步，前膝朝脚尖方向轻微弯曲，后脚保持稳定。", "前脚蹬地收回，换另一侧，各做 6 次，不追求弓步深度。"],
      avoid: "不要弓步过深、膝盖内扣或快速跳动；膝部或髋部疼痛时停止。",
      media: {
        src: "exercise-media/3672-fNGumX0.gif", poster: "exercise-media/3672-fNGumX0.jpg",
        alt: "交替弓步动作路线示范", attribution: "© Gym visual · ExerciseDB", attributionUrl: "https://gymvisual.com/",
        sourceUrl: "https://github.com/MrZaKaRiA/exercises-dataset/blob/main/videos/3672-fNGumX0.gif",
        approximate: true, note: "动图弓步较深，热身只迈小步、浅屈膝。",
      },
    },
    {
      id: "pelvic-tilt", title: "站姿骨盆前后倾", area: "骨盆、下背部活动", suitableFor: ["练腿前", "全身训练前"], repetitions: "8–10 次",
      tempo: "前倾、回正各约 2 秒", breathing: "自然呼吸，不憋气",
      memoryCue: "膝盖微弯，骨盆轻动，腰部不塌。",
      safetyNote: "动作小幅缓慢，不甩腰、不追求幅度；腰痛就停。",
      cue: "双手扶髋，腹部轻收，骨盆小幅前后转动。",
      steps: ["双脚与肩同宽站稳，膝盖微弯，双手轻放髋部。", "腹部轻收，让骨盆小幅向前、向后转动，感受下背部自然活动。", "缓慢回到中立位置，重复 8–10 次，不甩腰、不做到疲劳。"],
      avoid: "不要快速甩腰、塌腰或追求最大幅度；腰部疼痛或不适时停止。",
      media: {
        src: "exercise-media/1364-cuKYxhu.gif", poster: "exercise-media/1364-cuKYxhu.jpg",
        alt: "站姿骨盆前后倾动作示范", attribution: "© Gym visual · ExerciseDB", attributionUrl: "https://gymvisual.com/",
        sourceUrl: "https://github.com/MrZaKaRiA/exercises-dataset/blob/main/videos/1364-cuKYxhu.gif",
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
    push: ["chest-opening", "shoulder-rotation", "wrist-circles"],
    pull: ["standing-archer", "shoulder-rotation", "wrist-circles"],
    legs: ["leg-squat", "leg-curl", "ankle-circles"],
    shoulder: ["chest-opening", "shoulder-rotation", "standing-archer"],
    fullbody: ["alternating-lunge", "chest-opening", "standing-archer"],
    matFlow1: ["alternating-lunge", "leg-curl", "ankle-circles"],
    matFlow2: ["standing-archer", "leg-squat", "pelvic-tilt"],
    matFlow3: ["chest-opening", "shoulder-rotation", "ankle-circles"],
    matFlow4: ["alternating-lunge", "leg-curl", "calf-raise"],
    matFlow5: ["leg-curl", "pelvic-tilt"],
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
    push: ["chest", "triceps", "forearm"],
    pull: ["back", "lats", "forearm"],
    legs: ["quads", "hamstrings", "hipFlexor"],
    shoulder: ["shoulder", "triceps", "chestFront"],
    fullbody: ["chestFront", "lats", "quads"],
    matFlow1: ["quads", "hamstrings", "calves"],
    matFlow2: ["triceps", "forearm", "calves"],
    matFlow3: ["chestFront", "back", "calves"],
    matFlow4: ["quads", "hipFlexor", "calves"],
    matFlow5: ["quads", "calves"],
  };

  // 未配置的计划按整套动作兜底匹配，最多三项；不会给未知动作凑数。
  const rules = [
    { match: /俯卧撑|卧推|推胸|哑铃飞鸟|夹胸|绳索飞鸟/, ids: ["chest", "shoulder"] },
    { match: /下拉|划船|直臂下压/, ids: ["back", "lats"] },
    { match: /推肩|侧平举|俯身飞鸟|肩部触碰|平板支撑交替抬手/, ids: ["shoulder"] },
    { match: /绳索下压|三头/, ids: ["triceps"] },
    { match: /弯举|屈腕|握力/, ids: ["forearm"] },
    { match: /深蹲|箭步蹲|弓步蹲|伸腿|屈膝/, ids: ["quads", "hamstrings", "hipFlexor"] },
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
