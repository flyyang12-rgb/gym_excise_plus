(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ExerciseGuides = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const MEDIA_BASE = "exercise-media/";
  const ATTRIBUTION_URL = "https://gymvisual.com/";

  const aliases = {
    "卷腹 / 平板支撑": "仰卧卷腹",
    "核心收尾": "平板支撑",
    "俯卧撑或器械推胸": "跪姿俯卧撑",
    "二头或三头补强": "哑铃弯举",
    "椭圆机或单车": "单车",
    "单车冲刺": "单车",
    "夹胸 / 飞鸟": "绳索飞鸟",
    "平板支撑交替抬手": "肩部触碰",
  };

  const guides = {
    "登山跑": guide("0630", "0630-RJgzwny.gif", "核心、心肺", ["髋屈肌", "肩部"], ["双手撑稳，肩膀保持在手腕正上方。", "收紧腹部，让头、背和髋尽量保持一条直线。", "一侧膝盖向胸口提，再有节奏地左右交替。"], "提膝时呼气，换腿时短促吸气，保持均匀节奏。", ["臀部越抬越高：放慢速度并持续收腹。", "脚落地太重：前脚掌轻点地面。"], "改为慢速交替提膝，或双手撑高凳完成。"),
    "跪姿俯卧撑": guide("3211", "3211-ZOuKWir.gif", "胸部", ["肱三头肌", "肩前束", "核心"], ["双膝落垫，双手略宽于肩，身体从头到膝成直线。", "肩胛稳定，屈肘让胸口缓慢靠近地面。", "手掌推地回到起点，肘部不要完全锁死。"], "下降时吸气，推起时呼气。", ["塌腰或撅臀：先收紧腹部和臀部。", "手肘向两侧张开：让肘部约朝后外侧。"], "双手撑在稳固高台上做上斜俯卧撑。"),
    "仰卧卷腹": guide("0001", "0001-2gPfomN.gif", "腹直肌", ["髋屈肌"], ["仰卧屈膝，双脚踩稳，双手轻放耳侧或胸前。", "下背贴近垫面，先收紧腹部。", "用腹部带动肩胛离地，停顿后缓慢还原。"], "卷起时呼气，还原时吸气。", ["双手拉脖子：手只轻触头侧。", "整段坐起：只需让肩胛离开垫面。"], "缩小卷起幅度，或改做死虫。"),
    "平板支撑": guide("0464", "0464-CosupLu.gif", "核心", ["臀部", "肩部"], ["前臂撑地，肘部位于肩膀下方。", "脚尖踩地，收紧腹部和臀部。", "保持头、背、髋和脚跟成一条直线。"], "保持自然呼吸，每次呼气都再收紧腹部。", ["塌腰：缩短保持时间。", "耸肩：主动把肩膀远离耳朵。"], "双膝落地保持同样的躯干直线。"),
    "死虫": guide("0276", "0276-iny3m5y.gif", "核心", ["髋屈肌"], ["仰卧，髋膝各约九十度，双臂指向天花板。", "轻收下巴，让下背贴紧垫面。", "对侧手脚缓慢伸远，再回到起点交替完成。"], "伸展时缓慢呼气，回收时吸气。", ["下背离地：缩小手脚伸展范围。", "动作太快：每次伸展至少用两秒。"], "只动腿或只动手，降低协调难度。"),
    "俄罗斯转体": guide("0687", "0687-XVDdcoj.gif", "腹斜肌", ["腹直肌", "髋屈肌"], ["坐在垫上屈膝，胸口打开，身体轻微后倾。", "双手合拢放在胸前，腹部持续收紧。", "胸廓带动身体左右转动，骨盆尽量稳定。"], "转向一侧时呼气，回到中间时吸气。", ["只甩手臂：让胸口一起转动。", "弓背含胸：减小后倾角度。"], "双脚踩地并缩小转动范围。"),
    "臀桥": guide("3561", "3561-GibBPPg.gif", "臀大肌", ["腘绳肌", "核心"], ["仰卧屈膝，双脚与髋同宽踩地。", "收紧腹部，脚跟发力把髋部抬起。", "顶端夹紧臀部，缓慢落回但不要完全放松。"], "抬髋时呼气，下落时吸气。", ["用腰顶起：保持肋骨下沉。", "膝盖内扣：膝盖始终对准脚尖。"], "缩小抬髋幅度，或顶端不做停顿。"),
    "史密斯深蹲": guide("0770", "0770-jFtipLl.gif", "臀腿", ["股四头肌", "腘绳肌", "核心"], ["杠放在上背，双脚站在杠铃前方少许。", "吸气收腹，髋膝同时弯曲向下。", "膝盖对准脚尖，脚掌完整踩地后站起。"], "下蹲吸气，站起通过最难位置时呼气。", ["膝盖内扣：减轻重量并让膝盖跟随脚尖。", "脚跟抬起：调整站距并减小深度。"], "徒手箱式深蹲或哑铃杯式深蹲。"),
    "罗马尼亚硬拉": guide("1459", "1459-rR0LJzx.gif", "臀腿后侧", ["臀大肌", "下背部", "握力"], ["双脚与髋同宽，哑铃贴近大腿。", "膝盖微屈，屁股向后推，背部保持稳定。", "哑铃沿腿下降到后侧有拉伸感，再夹臀站起。"], "下降吸气，站起并伸髋时呼气。", ["弯腰代替屈髋：想象屁股去碰身后的墙。", "哑铃离腿太远：全程贴近腿部。"], "减轻重量，并把下降终点控制在膝盖附近。"),
    "哑铃杯式深蹲": guide("1760", "1760-yn8yg1r.gif", "股四头肌", ["臀大肌", "核心"], ["双手托住哑铃一端，贴近胸前。", "双脚略宽于肩，脚尖自然向外。", "髋膝同时弯曲下蹲，脚掌发力站起。"], "下蹲吸气，站起时呼气。", ["哑铃离身体太远：始终贴近胸口。", "身体前扑：减轻重量并放慢下降。"], "徒手深蹲到凳子。"),
    "高位下拉": guide("2330", "2330-LEprlgG.gif", "背阔肌", ["肱二头肌", "上背部"], ["坐稳并固定双腿，胸口自然打开。", "双手略宽于肩握杆，先让肩膀下沉。", "肘部向下带动横杆靠近上胸，再受控还原。"], "下拉时呼气，还原时吸气。", ["身体大幅后仰：减轻重量。", "用手臂硬拉：先做沉肩动作。"], "改用更轻重量或弹力带下拉。"),
    "坐姿划船": guide("0180", "0180-hvV79Si.gif", "上背部", ["背阔肌", "肱二头肌"], ["双脚踩稳，膝盖微屈，腰背保持自然。", "肩膀先向后下方移动。", "肘部贴近身体，把手拉向肚脐后缓慢送回。"], "拉回时呼气，手臂伸出时吸气。", ["含胸圆背：减轻重量并挺起胸口。", "身体前后摆动：固定躯干。"], "使用弹力带坐姿划船。"),
    "单臂哑铃划船": strengthGuide("0292", "0292-C0MA9bC.gif", "上背部", ["背阔肌", "肱二头肌"], "一手一膝支撑稳，另一手把哑铃拉向腰侧。"),
    "侧平举": strengthGuide("0334", "0334-DsgkuIt.gif", "肩中束", ["斜方肌"], "用轻哑铃向身体两侧抬起，手肘不要超过肩高。"),
    "俯身飞鸟": strengthGuide("0383", "0383-EAs3xL9.gif", "肩后束", ["上背部"], "俯身稳住躯干，双臂向两侧打开，不要耸肩。"),
    "哑铃弯举": strengthGuide("0294", "0294-NbVPDMW.gif", "肱二头肌", ["前臂"], "手肘贴近身体，把哑铃弯举到胸前后慢慢放下。"),
    "哑铃卧推": strengthGuide("0289", "0289-SpYC0Kp.gif", "胸部", ["肱三头肌", "肩前束"], "躺稳并收紧肩胛，把哑铃从胸侧向上推起。"),
    "平板卧推": strengthGuide("0025", "0025-EIeI8Vf.gif", "胸部", ["肱三头肌", "肩前束"], "脚踩稳、肩胛收紧，让杠铃受控落向胸口再推起。"),
    "绳索下压": strengthGuide("0201", "0201-3ZflifB.gif", "肱三头肌", ["前臂"], "手肘夹在身体两侧，将把手压到手臂接近伸直。"),
    "哑铃推肩": strengthGuide("0405", "0405-znQUdHY.gif", "肩部", ["肱三头肌"], "坐稳贴住靠背，把哑铃从肩旁向上推起。"),
    "肩部触碰": strengthGuide("3699", "3699-yRpV5TC.gif", "核心", ["肩部", "臀部"], "保持平板姿势，左右手交替触碰对侧肩膀。"),
    "单车": strengthGuide("2138", "2138-H1PESYI.gif", "心肺", ["股四头肌", "臀部"], "坐稳并踩好踏板，保持上身稳定后逐渐加速。"),
    "弓步蹲": strengthGuide("3470", "3470-kMzUs9Y.gif", "臀腿", ["股四头肌", "核心"], "向前跨步后垂直下蹲，前脚完整踩稳再站回。"),
    "箭步蹲": strengthGuide("0336", "0336-RRWFUcw.gif", "臀腿", ["股四头肌", "核心"], "双手持哑铃前后站稳，身体垂直下降后前脚发力站起。"),
    "绳索飞鸟": strengthGuide("0188", "0188-xLYSdtg.gif", "胸部", ["肩前束"], "站稳并轻屈手肘，让双手沿弧线在胸前靠拢。"),
    "侧卧抬腿": approximateGuide("0710", "0710-7WaDzyL.gif", "臀中肌", ["髋外展肌"], "参考侧向髋外展路线，侧卧时保持骨盆稳定。"),
    "全身拉伸": approximateGuide("0794", "0794-1jXLYEw.gif", "躯干拉伸", ["背部", "肩部"], "参考站姿侧向拉伸，实际训练按页面文字逐个部位放松。"),
    "原地高抬腿": approximateGuide("3636", "3636-ealLwvX.gif", "心肺", ["髋屈肌", "核心"], "参考高抬腿路线，原地完成时保持身体直立。"),
    "呼吸放松": approximateGuide("1363", "1363-JbC2iaV.gif", "脊柱放松", ["核心"], "参考温和脊柱伸展，配合缓慢深呼吸。"),
    "山地爬行": approximateGuide("3360", "3360-0Yz8WdV.gif", "全身心肺", ["核心", "肩部", "臀腿"], "参考熊爬动作路线，保持膝盖离地并控制移动。"),
    "开合跳低冲击版": approximateGuide("3224", "3224-1g5bPpA.gif", "心肺", ["臀腿", "肩部"], "参考开合动作，但低冲击版本改为左右迈步，不做跳跃。"),
    "深蹲到伸展": approximateGuide("1685", "1685-QChZi3x.gif", "臀腿", ["肩部", "核心"], "下蹲后站起并向上伸展，动作连续但不要抢速度。"),
    "深蹲脉冲": approximateGuide("1685", "1685-QChZi3x.gif", "臀腿", ["股四头肌", "核心"], "参考深蹲路线，在底部小幅度上下移动。"),
    "猫牛式": approximateGuide("1363", "1363-JbC2iaV.gif", "脊柱活动", ["核心", "背部"], "参考脊柱屈伸路线，四点跪姿下缓慢拱背和塌背。"),
    "鸟狗式": approximateGuide("1512", "1512-qBcKorM.gif", "核心稳定", ["臀部", "背部"], "参考四点跪姿，实际动作伸出对侧手脚并保持骨盆稳定。"),
    "超人式": approximateGuide("0489", "0489-zhMwOwE.gif", "下背部", ["臀部", "上背部"], "参考背伸路线，俯卧时小幅抬起手脚，不要过度反弓。"),
    "跑步机快走": approximateGuide("3666", "3666-rjiM4L3.gif", "心肺", ["臀腿"], "参考坡度走路姿势，保持自然步幅和稳定呼吸。"),
    "臀腿拉伸": approximateGuide("1511", "1511-99rWm7w.gif", "大腿后侧", ["臀部", "小腿"], "参考腘绳肌拉伸，拉到轻微牵拉感即可。"),
  };

  function guide(id, file, target, secondary, steps, breathing, mistakes, alternative) {
    return { id, file, target, secondary, steps, breathing, mistakes, alternative };
  }

  function strengthGuide(id, file, target, secondary, cue) {
    return guide(id, file, target, secondary, ["先用轻重量摆好稳定的起始姿势。", cue, "受控回到起点，保持每次动作路线一致。"], "发力时呼气，还原时吸气。", ["借力摆动：减轻重量并放慢速度。", "动作幅度失控：只做到能稳定控制的位置。"], "降低重量或改用同部位的徒手动作。" );
  }

  function approximateGuide(id, file, target, secondary, cue) {
    const data = strengthGuide(id, file, target, secondary, cue);
    data.approximate = true;
    return data;
  }

  function normalizeExerciseName(name) {
    return aliases[name] || name || "当前动作";
  }

  function getExerciseGuide(exercise = {}, options = {}) {
    const name = normalizeExerciseName(exercise.name);
    const specific = guides[name];
    const fallback = {
      target: "全身协调",
      secondary: ["核心稳定"],
      steps: [exercise.stance || "先把身体摆到稳定、舒服的起始位置。", exercise.firstMove || "用轻重量或慢速度完成第一下。", "保持动作路线一致，感觉不适就立即停止。"],
      breathing: "发力时呼气，还原时吸气；不要憋气抢次数。",
      mistakes: ["速度太快：放慢动作，优先保持稳定。", "为了次数牺牲姿势：减少次数或降低难度。"],
      alternative: "降低重量、缩小幅度，或选择同部位的徒手动作。",
    };
    const data = specific || fallback;
    return {
      name,
      hasSpecificGuide: Boolean(specific),
      target: data.target,
      secondary: data.secondary,
      steps: data.steps,
      breathing: data.breathing,
      mistakes: data.mistakes,
      alternative: data.alternative,
      media: specific && options.mediaEnabled ? {
        src: MEDIA_BASE + specific.file,
        alt: `${name}动作示范`,
        attribution: "© Gym visual",
        attributionUrl: ATTRIBUTION_URL,
        approximate: Boolean(specific.approximate),
      } : null,
    };
  }

  function getNextExerciseIndex(currentIndex, total) {
    return Math.min(currentIndex + 1, Math.max(total - 1, 0));
  }

  function adjustRestDuration(seconds, delta) {
    return Math.min(180, Math.max(15, seconds + delta));
  }

  function getRemainingRestSeconds(endAt, now = Date.now()) {
    return Math.max(0, Math.ceil((endAt - now) / 1000));
  }

  return {
    adjustRestDuration,
    getExerciseGuide,
    getNextExerciseIndex,
    getRemainingRestSeconds,
    normalizeExerciseName,
  };
});
