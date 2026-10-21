const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ExerciseGuides = require("../exercise-guides.js");
const StretchGuide = require("../stretch-guide.js");

function loadPageLogic(windowOverrides = {}) {
  let now = 1_000_000;
  let nextIntervalId = 0;
  const intervals = new Map();
  const nodes = new Map();
  const checkboxes = [];
  function createNode() {
    const attributes = new Map();
    const classes = new Set();
    return {
      textContent: "", dataset: {}, style: { setProperty() {} }, addEventListener() {},
      setAttribute(key, value) { attributes.set(key, value); },
      removeAttribute(key) { attributes.delete(key); },
      getAttribute(key) { return attributes.get(key); },
      classList: { toggle(key, enabled) { if (enabled) classes.add(key); else classes.delete(key); }, contains: (key) => classes.has(key) },
    };
  }
  const stages = Array.from({ length: 3 }, (_, index) => ({ ...createNode(), dataset: { exerciseStage: String(index) } }));
  const root = {
    querySelector(selector) {
      if (!nodes.has(selector)) nodes.set(selector, createNode());
      return nodes.get(selector);
    },
    querySelectorAll(selector) {
      if (selector === "input[type='checkbox']") return checkboxes;
      if (selector === "[data-exercise-stage]") return stages;
      return [];
    },
  };
  class Clock extends Date { static now() { return now; } }
  const context = vm.createContext({
    Date: Clock,
    location: { hostname: "localhost" },
    document: { querySelector: () => root, querySelectorAll: () => [] },
    localStorage: { getItem: () => null, setItem() {} },
    window: {
      location: { hostname: "localhost" },
      ExerciseGuides: { ...ExerciseGuides, getRemainingRestSeconds: (endAt) => ExerciseGuides.getRemainingRestSeconds(endAt, now) },
      setInterval(callback) { const id = ++nextIntervalId; intervals.set(id, callback); return id; },
      clearInterval(id) { intervals.delete(id); },
      ...windowOverrides,
    },
  });
  const source = fs.readFileSync(path.join(__dirname, "../script.js"), "utf8");
  vm.runInContext(source.replace(/\binit\(\);\s*$/, ""), context);
  const run = (code) => vm.runInContext(code, context);
  return { run, advance: (ms) => { now += ms; }, intervals, nodes, checkboxes, stages };
}

function createAudioMock({ rejectResume = false, throwOnPlayback = false } = {}) {
  const stats = { contexts: 0, resumes: 0, tones: [] };
  class AudioContext {
    constructor() { stats.contexts += 1; this.state = "suspended"; this.currentTime = 0; this.destination = {}; }
    resume() {
      stats.resumes += 1;
      if (rejectResume) return Promise.reject(new Error("blocked"));
      this.state = "running";
      return Promise.resolve();
    }
    createOscillator() {
      if (throwOnPlayback) throw new Error("audio unavailable");
      const tone = {};
      stats.tones.push(tone);
      return { frequency: { setValueAtTime(value) { tone.frequency = value; } }, connect() {}, disconnect() {}, start() {}, stop() {} };
    }
    createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  }
  return { AudioContext, stats };
}

test("warmups and post-workout stretches cover every training day with two or three items without changing plans", () => {
  const { run } = loadPageLogic();
  for (const goal of ["muscleGain", "fatLoss"]) {
    for (const frequency of [3, 4, 5]) {
      const plan = JSON.parse(run(`JSON.stringify(getPlanByFrequency(${frequency}, "${goal}"))`));
      for (const day of plan) {
        const original = JSON.stringify(day);
        const items = StretchGuide.getWorkoutStretches(day, { mediaEnabled: true });
        const warmups = StretchGuide.getWorkoutWarmups(day, { mediaEnabled: true });
        if (day.type === "recovery") assert.equal(warmups.length, 0);
        else {
          assert.ok(warmups.length >= 2 && warmups.length <= 3, `${goal}/${frequency}/${day.title} warmup: ${warmups.length}`);
          assert.ok(warmups.every(item => item.media?.src && item.media.poster));
          assert.equal(warmups.length, new Set(warmups.map(item => item.id)).size);
        }
        if (day.type === "recovery") assert.equal(items.length, 0, `${goal}/${frequency}/recovery`);
        else {
          assert.ok(items.length >= 2 && items.length <= 3, `${goal}/${frequency}/${day.title}: ${items.length}`);
          assert.ok(items.every(item => item.media?.src.endsWith(item.media.type === "video" ? ".mp4" : ".gif") && item.media.poster.endsWith(".jpg")));
        }
        assert.equal(items.length, new Set(items.map((item) => item.id)).size);
        assert.equal(JSON.stringify(day), original);
      }
    }
  }
});

test("stretch module replaces the removed diet route and renders the selected workout guides", () => {
  const { run } = loadPageLogic({ StretchGuide });
  run(`activeDayId = "周一-push-0"; updateBackToTopButton = () => {};
    elements.stretchPageList = { innerHTML: "", querySelectorAll: () => [] };
    elements.stretchPageContext = {}; elements.stretchPageSummary = {};`);
  run('setActiveModule("stretch", { scrollToTop: false })');
  assert.equal(run("activeModule"), "stretch");
  assert.equal(run('(elements.stretchPageList.innerHTML.match(/data-stretch-media/g) || []).length'), 3);
  assert.match(run("elements.stretchPageContext.textContent"), /周一/);
  assert.match(run("elements.stretchPageList.innerHTML"), /prefers-reduced-motion/);
  run('setActiveModule("diet", { scrollToTop: false })');
  assert.equal(run("activeModule"), "stretch", "a removed route cannot hide every module");
});

test("warmup and post-workout blocks show together and both follow the selected training day", () => {
  const { run } = loadPageLogic({ StretchGuide });
  run(`elements.warmupList = { innerHTML: "", querySelectorAll: () => [] };
    elements.stretchPageList = { innerHTML: "", querySelectorAll: () => [] };
    elements.warmupSection = {}; elements.warmupSummary = {}; elements.stretchDayDivider = {}; elements.postWorkoutStretchHead = {};
    elements.stretchPageContext = {}; elements.stretchPageSummary = {}; elements.stretchPageSafety = {};`);
  for (const [id, expected] of [
    ["周一-push-0", ["动态扩胸", "招财猫（空手）"]],
    ["周二-pull-1", ["屈臂肩部绕环", "招财猫（空手）"]],
    ["周四-legs-2", ["徒手小幅蹲起", "站姿提踵", "扶稳踝绕环"]],
  ]) {
    run(`activeDayId = "${id}"; renderStretchPage()`);
    const titles = JSON.parse(run('JSON.stringify([...elements.warmupList.innerHTML.matchAll(/<h3>([^<]+)/g)].map(match => match[1]))'));
    assert.deepEqual(titles, expected);
    assert.equal(run("elements.warmupSection.hidden"), false);
    assert.equal(run("elements.postWorkoutStretchHead.hidden"), false);
    assert.equal(run("elements.stretchDayDivider.hidden"), false);
    assert.match(run("elements.warmupSummary.textContent"), /^[23] 项/);
    const html = run("elements.warmupList.innerHTML");
    assert.doesNotMatch(html, /保持约|<video[^>]*\ssrc=/);
    assert.equal((html.match(/<details[^>]*\sopen/g) || []).length, 0);
    assert.equal((html.match(/data-carousel-slide/g) || []).length, expected.length);
    assert.doesNotMatch(run("elements.stretchPageList.innerHTML"), /动态扩胸|招财猫|徒手小幅蹲起|站姿提踵|扶稳踝绕环|屈臂肩部绕环/);
  }
  assert.match(run("elements.warmupList.innerHTML"), /每侧顺逆各 5 圈/);
  assert.match(run("elements.warmupList.innerHTML"), /近似示范：动图演示蹲起路线/);
});

test("warmup video waits for an open card and pauses on reduced motion, hidden page or module changes", () => {
  const { run } = loadPageLogic();
  run(`let warmupCardOpen = false; let warmupReduceMotion = false;
    window.matchMedia = () => ({ matches: warmupReduceMotion }); updateBackToTopButton = () => {};
    const warmupVideo = { src: "", paused: true, dataset: { src: "https://example.invalid/demo.mp4" },
      closest: selector => selector === "details" ? { open: warmupCardOpen } : null, getAttribute: () => warmupVideo.src || null,
      play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; } };
    elements.warmupList = { querySelectorAll: () => [warmupVideo] };
    setActiveModule("stretch", { scrollToTop: false });`);
  assert.equal(run("warmupVideo.src"), "");
  assert.equal(run("warmupVideo.paused"), true);
  run("warmupCardOpen = true; syncStretchVideoPlayback()");
  assert.equal(run("warmupVideo.paused"), false);
  run("warmupReduceMotion = true; syncStretchVideoPlayback()");
  assert.equal(run("warmupVideo.paused"), true);
  run("warmupReduceMotion = false; document.hidden = true; syncStretchVideoPlayback()");
  assert.equal(run("warmupVideo.paused"), true);
  run('document.hidden = false; syncStretchVideoPlayback(); setActiveModule("equipment", { scrollToTop: false })');
  assert.equal(run("warmupVideo.paused"), true);
});

test("post-stretch video plays only in the visible open page or popup and preserves a reduced-motion poster", () => {
  const { run } = loadPageLogic();
  run(`let stretchCardOpen = true; let stretchReduceMotion = false; let stretchModalClosing = false;
    window.matchMedia = () => ({ matches: stretchReduceMotion });
    function makeStretchVideo() {
      return { src: "", poster: "", paused: true, dataset: { src: "https://example.invalid/demo.mp4", poster: "https://example.invalid/poster.jpg" },
        closest: selector => selector === "details" ? { open: stretchCardOpen } : null, getAttribute(key) { return this[key] || null; },
        play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; } };
    }
    const pageStretchVideo = makeStretchVideo(); const popupStretchVideo = makeStretchVideo();
    elements.stretchPageList = { querySelectorAll: () => [pageStretchVideo] };
    elements.stretchList = { querySelectorAll: () => [popupStretchVideo] };
    elements.stretchModal = { hidden: true, classList: { contains: () => stretchModalClosing } };
    syncStretchVideoPlayback();`);
  assert.equal(run("pageStretchVideo.src"), "");
  assert.equal(run("popupStretchVideo.src"), "");
  run('activeModule = "stretch"; stretchReduceMotion = true; syncStretchVideoPlayback()');
  assert.equal(run("pageStretchVideo.src"), "");
  assert.match(run("pageStretchVideo.poster"), /poster.jpg$/);
  run("stretchReduceMotion = false; syncStretchVideoPlayback()");
  assert.equal(run("pageStretchVideo.paused"), false);
  run("elements.stretchModal.hidden = false; syncStretchVideoPlayback()");
  assert.equal(run("pageStretchVideo.paused"), true);
  assert.equal(run("popupStretchVideo.paused"), false);
  run("stretchModalClosing = true; syncStretchVideoPlayback()");
  assert.equal(run("popupStretchVideo.paused"), true, "pause immediately during the exit animation");
  assert.equal(run("pageStretchVideo.paused"), true, "keep the underlying page paused until the popup is hidden");
  run("stretchModalClosing = false; syncStretchVideoPlayback()");
  run("stretchCardOpen = false; syncStretchVideoPlayback()");
  assert.equal(run("popupStretchVideo.paused"), true);
  run('stretchCardOpen = true; activeModule = "training"; syncStretchVideoPlayback()');
  assert.equal(run("popupStretchVideo.paused"), false);
  run("document.hidden = true; syncStretchVideoPlayback()");
  assert.equal(run("popupStretchVideo.paused"), true);
  run("document.hidden = false; elements.stretchModal.hidden = true; syncStretchVideoPlayback()");
  assert.equal(run("popupStretchVideo.paused"), true);
});

test("recovery days show only the rest message and training days restore guides and safety text", () => {
  for (const goal of ["muscleGain", "fatLoss"]) {
    for (const frequency of [3, 4, 5]) {
      const { run } = loadPageLogic({ StretchGuide });
      run(`state.goal = "${goal}"; state.trainDaysPerWeek = ${frequency};
        elements.stretchPageList = { innerHTML: "", querySelectorAll: () => [] };
        elements.stretchList = { innerHTML: "", querySelectorAll: () => [] };
        elements.stretchPageContext = {}; elements.stretchPageSummary = {}; elements.stretchSummary = {};
        elements.stretchPageSafety = {}; elements.stretchSafety = {};
        elements.warmupList = { innerHTML: "", querySelectorAll: () => [] }; elements.warmupSection = {}; elements.warmupSummary = {};
        elements.stretchDayDivider = {}; elements.postWorkoutStretchHead = {};
        activeDayId = getCurrentPlan().find(day => day.type === "recovery").id;
        renderStretchPage(); stretchWorkout = getActiveWorkout(); renderStretchList();`);
      assert.equal(run("elements.warmupList.innerHTML"), "");
      assert.equal(run("elements.warmupSection.hidden"), true);
      assert.equal(run("elements.stretchDayDivider.hidden"), true);
      assert.equal(run("elements.postWorkoutStretchHead.hidden"), true);
      for (const prefix of ["stretchPage", "stretch"]) {
        assert.match(run(`elements.${prefix}List.innerHTML`), /休息是为了更好的下一次全神贯注/);
        assert.doesNotMatch(run(`elements.${prefix}List.innerHTML`), /stretch-item|data-stretch-media/);
        assert.equal(run(`elements.${prefix}Summary.hidden`), true);
        assert.equal(run(`elements.${prefix}Summary.textContent`), "");
        assert.equal(run(`elements.${prefix}Safety.hidden`), true);
      }
      run('activeDayId = getCurrentPlan().find(day => day.type === "train").id; renderStretchPage(); stretchWorkout = getActiveWorkout(); renderStretchList();');
      assert.equal(run("elements.warmupSection.hidden"), false);
      assert.equal(run("elements.stretchDayDivider.hidden"), false);
      assert.equal(run("elements.postWorkoutStretchHead.hidden"), false);
      assert.match(run("elements.warmupList.innerHTML"), /stretch-slide/);
      for (const prefix of ["stretchPage", "stretch"]) {
        assert.match(run(`elements.${prefix}List.innerHTML`), /data-stretch-media/);
        assert.doesNotMatch(run(`elements.${prefix}List.innerHTML`), /stretch-rest-message/);
        assert.equal(run(`elements.${prefix}Summary.hidden`), false);
        assert.equal(run(`elements.${prefix}Safety.hidden`), false);
      }
    }
  }
});

test("page and popup show the same two or three stretches for the selected training day", () => {
  const { run } = loadPageLogic({ StretchGuide });
  run(`elements.stretchPageList = { innerHTML: "", querySelectorAll: () => [] };
    elements.stretchList = { innerHTML: "", querySelectorAll: () => [] };
    elements.stretchPageContext = {}; elements.stretchPageSummary = {}; elements.stretchSummary = {};`);
  for (const [dayId, expected] of [
    ["周一-push-0", ["扶凳开胸拉伸", "横抱臂拉伸", "头顶屈肘拉伸"]],
    ["周二-pull-1", ["站姿前伸拉背", "横抱臂拉伸"]],
    ["周四-legs-2", ["扶椅腿前侧拉伸", "坐姿腿后侧拉伸", "坐姿搭腿拉臀"]],
    ["周六-shoulder-3", ["横抱臂拉伸", "头顶屈肘拉伸"]],
  ]) {
    run(`activeDayId = "${dayId}"; renderStretchPage(); stretchWorkout = getActiveWorkout(); renderStretchList();`);
    const titles = JSON.parse(run('JSON.stringify([...elements.stretchList.innerHTML.matchAll(/<h3>([^<]+)/g)].map(match => match[1]))'));
    assert.deepEqual(titles, expected, dayId);
    const pageTitles = JSON.parse(run('JSON.stringify([...elements.stretchPageList.innerHTML.matchAll(/<h3>([^<]+)/g)].map(match => match[1]))'));
    assert.deepEqual(titles, pageTitles, dayId);
    const popupMedia = JSON.parse(run('JSON.stringify([...elements.stretchList.innerHTML.matchAll(/(?:data-src|src)="([^"]+)"/g)].map(match => match[1]))'));
    const pageMedia = JSON.parse(run('JSON.stringify([...elements.stretchPageList.innerHTML.matchAll(/(?:data-src|src)="([^"]+)"/g)].map(match => match[1]))'));
    assert.deepEqual(popupMedia, pageMedia, dayId);
  }
});

test("stretch carousel follows native scrolling, bounds navigation and moves focus off hidden content", () => {
  const { run } = loadPageLogic();
  run(`const carouselFocus = {};
    const slideDetails = [{ open: true }, { open: true }, { open: false }];
    const carouselSlides = slideDetails.map((details, index) => ({
      offsetLeft: index * 416, attributes: {}, inert: index > 0,
      setAttribute(key, value) { this.attributes[key] = value; },
      querySelectorAll: () => [details], contains: node => index === 0 && node === carouselFocus,
    }));
    function carouselControl() { return { focus() { document.activeElement = this; } }; }
    elements.stretchPrevious = carouselControl(); elements.stretchNext = carouselControl();
    elements.stretchModalDone = carouselControl(); elements.stretchNavigation = {}; elements.stretchPosition = {};
    elements.stretchDots = { querySelectorAll: () => [] };
    elements.warmupList = elements.stretchPageList = { querySelectorAll: () => [] };
    elements.stretchList = { scrollLeft: 0, querySelectorAll: selector => selector === "[data-stretch-slide]" ? carouselSlides : [],
      scrollTo(options) { this.scrollOptions = options; this.scrollLeft = options.left; },
      focus() { document.activeElement = this; } };
    const modalScroll = { scrollTop: 200 };
    elements.stretchModal = { hidden: false, classList: { contains: () => false }, querySelector: () => modalScroll };
    stretchSlideCount = 3; updateStretchNavigation();`);
  assert.equal(run("elements.stretchPrevious.disabled"), true);
  assert.equal(run("elements.stretchModalDone.hidden"), true);
  run("document.activeElement = carouselFocus; goToStretchSlide(1); syncStretchSlideFromScroll()");
  assert.equal(run("stretchSlideIndex"), 1);
  assert.equal(run("elements.stretchList.scrollOptions.left"), 416);
  assert.equal(run("elements.stretchList.scrollOptions.behavior"), "smooth");
  assert.equal(run("document.activeElement === elements.stretchList"), true);
  assert.equal(run("carouselSlides[0].inert"), true);
  assert.equal(run("carouselSlides[1].inert"), false);
  assert.equal(run("slideDetails[0].open"), false);
  assert.equal(run("modalScroll.scrollTop"), 0);
  run("document.activeElement = elements.stretchNext; goToStretchSlide(99); syncStretchSlideFromScroll()");
  assert.equal(run("stretchSlideIndex"), 2);
  assert.equal(run("elements.stretchPosition.textContent"), "3 / 3");
  assert.equal(run("elements.stretchNext.hidden"), true);
  assert.equal(run("elements.stretchModalDone.hidden"), false);
  assert.equal(run("document.activeElement === elements.stretchModalDone"), true);
  run("window.matchMedia = () => ({ matches: true }); goToStretchSlide(-99); syncStretchSlideFromScroll()");
  assert.equal(run("stretchSlideIndex"), 0);
  assert.equal(run("elements.stretchList.scrollOptions.behavior"), "instant");
  run("elements.stretchList.scrollLeft = 620; syncStretchSlideFromScroll()");
  assert.equal(run("stretchSlideIndex"), 1, "a gesture updates the index at the nearest card");
});

test("stretch carousel pauses inactive videos and only loads the selected visible slide", () => {
  const { run } = loadPageLogic();
  run(`let reduceCarouselMotion = false;
    window.matchMedia = () => ({ matches: reduceCarouselMotion });
    function carouselVideo(index) {
      return { hidden: false, paused: true, dataset: { src: "demo.mp4", poster: "poster.jpg" },
        closest: selector => selector === "[data-stretch-slide]" ? { dataset: { stretchSlide: String(index) } } : null,
        getAttribute(key) { return this[key] || null; },
        play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; } };
    }
    const firstCarouselVideo = carouselVideo(0); const lastCarouselVideo = carouselVideo(2);
    elements.warmupList = elements.stretchPageList = { querySelectorAll: () => [] };
    elements.stretchList = { querySelectorAll: () => [firstCarouselVideo, lastCarouselVideo] };
    elements.stretchModal = { hidden: true, classList: { contains: () => false } };
    syncStretchVideoPlayback();`);
  assert.equal(run("firstCarouselVideo.src"), undefined);
  run("elements.stretchModal.hidden = false; syncStretchVideoPlayback()");
  assert.equal(run("firstCarouselVideo.paused"), false);
  assert.equal(run("lastCarouselVideo.src"), undefined);
  run("stretchSlideIndex = 2; syncStretchVideoPlayback()");
  assert.equal(run("firstCarouselVideo.paused"), true);
  assert.equal(run("lastCarouselVideo.paused"), false);
  run("reduceCarouselMotion = true; syncStretchVideoPlayback()");
  assert.equal(run("lastCarouselVideo.paused"), true);
  assert.equal(run("lastCarouselVideo.poster"), "poster.jpg");
  run("reduceCarouselMotion = false; document.hidden = true; syncStretchVideoPlayback()");
  assert.equal(run("lastCarouselVideo.paused"), true);
});

test("stretch carousel keeps text and mnemonics with media disabled and details initially collapsed", () => {
  const { run } = loadPageLogic({ StretchGuide });
  const html = run('renderStretchCards(window.StretchGuide.getWorkoutStretches({ key: "legs" }), { carousel: true })');
  assert.match(html, /扶椅握踝，膝朝下，腰不顶/);
  assert.match(html, /髋关节置换术后不做/);
  assert.equal((html.match(/class="stretch-slide"/g) || []).length, 3);
  assert.equal((html.match(/每侧 30 秒/g) || []).length, 3);
  assert.doesNotMatch(html, /<video|<img|<details[^>]*\sopen/);
  assert.match(html, /inert aria-hidden="true"/);
});

test("page carousels keep independent positions, keyboard bounds, focus and expanded heights", () => {
  const { run } = loadPageLogic();
  run(`function makePageCarousel(count) {
      const details = Array.from({ length: count }, () => ({ open: false }));
      const slides = details.map((detail, index) => ({ offsetLeft: index * 416, offsetHeight: 300 + index * 20,
        attributes: {}, setAttribute(key, value) { this.attributes[key] = value; },
        contains: node => node === detail, querySelectorAll: () => [detail] }));
      const previous = {}; const next = {}; const position = {};
      const navigation = { querySelector: selector => selector === "[data-carousel-previous]" ? previous : selector === "[data-carousel-next]" ? next : position };
      const list = { scrollLeft: 0, clientWidth: 400, style: {},
        querySelectorAll: selector => selector === "[data-carousel-slide]" ? slides : [],
        focus() { document.activeElement = this; },
        scrollTo(options) { this.scrollOptions = options; this.scrollLeft = options.left; this.onscroll?.(); } };
      setupGuideCarousel(list, navigation);
      return { list, slides, details, navigation, previous, next, position };
    }
    const warmupCarousel = makePageCarousel(2); const postCarousel = makePageCarousel(3);`);
  assert.equal(run("warmupCarousel.previous.disabled"), true);
  assert.equal(run("warmupCarousel.list.style.height"), "300px");
  run("document.activeElement = warmupCarousel.details[0]; warmupCarousel.details[0].open = true; warmupCarousel.next.onclick()");
  assert.equal(run("warmupCarousel.position.textContent"), "2 / 2");
  assert.equal(run("warmupCarousel.next.disabled"), true);
  assert.equal(run("warmupCarousel.details[0].open"), false);
  assert.equal(run("warmupCarousel.slides[0].inert"), true);
  assert.equal(run("document.activeElement === warmupCarousel.list"), true);
  assert.equal(run("postCarousel.position.textContent"), "1 / 3");
  assert.equal(run("warmupCarousel.list.style.height"), "320px");
  run('postCarousel.list.onkeydown({ key: "End", preventDefault() {} })');
  assert.equal(run("postCarousel.position.textContent"), "3 / 3");
  run('postCarousel.list.onkeydown({ key: "ArrowRight", preventDefault() {} })');
  assert.equal(run("postCarousel.position.textContent"), "3 / 3");
  run('postCarousel.list.onkeydown({ key: "Home", preventDefault() {} })');
  assert.equal(run("postCarousel.position.textContent"), "1 / 3");
  run("window.matchMedia = () => ({ matches: true }); goToGuideSlide(postCarousel.list, 1)");
  assert.equal(run("postCarousel.list.scrollOptions.behavior"), "instant");
  run("postCarousel.slides[1].offsetHeight = 600; syncGuideCarouselHeight(guideCarousels.get(postCarousel.list))");
  assert.equal(run("postCarousel.list.style.height"), "600px");
  run("syncGuideCarouselLayouts()");
  assert.equal(run("warmupCarousel.position.textContent"), "2 / 2");
  assert.equal(run("postCarousel.position.textContent"), "2 / 3");
  run("postCarousel.list.querySelectorAll = () => []; setupGuideCarousel(postCarousel.list, postCarousel.navigation)");
  assert.equal(run("postCarousel.navigation.hidden"), true);
  assert.equal(run("postCarousel.list.onkeydown"), null);
  assert.equal(run("postCarousel.list.onscroll"), null);
});

test("warmup and post-workout page videos use their own carousel position and pause under the popup", () => {
  const { run } = loadPageLogic();
  run(`function pageVideo(index) {
      return { dataset: { src: "demo.mp4" }, paused: true,
        closest: selector => selector === "[data-stretch-slide]" ? { dataset: { stretchSlide: String(index) } } : null,
        getAttribute(key) { return this[key] || null; },
        play() { this.paused = false; return Promise.resolve(); }, pause() { this.paused = true; } };
    }
    const warmupFirstVideo = pageVideo(0); const warmupSecondVideo = pageVideo(1);
    const postFirstVideo = pageVideo(0); const postSecondVideo = pageVideo(1);
    elements.warmupList = { querySelectorAll: () => [warmupFirstVideo, warmupSecondVideo] };
    elements.stretchPageList = { querySelectorAll: () => [postFirstVideo, postSecondVideo] };
    elements.stretchList = { querySelectorAll: () => [] };
    elements.stretchModal = { hidden: true, classList: { contains: () => false } };
    guideCarousels.set(elements.warmupList, { index: 1 }); guideCarousels.set(elements.stretchPageList, { index: 0 });
    activeModule = "stretch"; syncStretchVideoPlayback();`);
  assert.equal(run("warmupFirstVideo.src"), undefined);
  assert.equal(run("warmupSecondVideo.paused"), false);
  assert.equal(run("postFirstVideo.paused"), false);
  assert.equal(run("postSecondVideo.src"), undefined);
  run("elements.stretchModal.hidden = false; syncStretchVideoPlayback()");
  assert.equal(run("warmupSecondVideo.paused"), true);
  assert.equal(run("postFirstVideo.paused"), true);
  run('elements.stretchModal.hidden = true; activeModule = "equipment"; syncStretchVideoPlayback()');
  assert.equal(run("warmupSecondVideo.paused"), true);
  assert.equal(run("postFirstVideo.paused"), true);
});

test("failed stretch GIF hides only the picture and retains text instruction fallback", () => {
  const { run } = loadPageLogic();
  run(`let onStretchMediaError;
    const failedPicture = { hidden: false };
    const stretchFallback = { hidden: true };
    const failedFigure = { querySelector: selector => selector === "picture" ? failedPicture : stretchFallback };
    const failedImage = { addEventListener: (event, callback) => { onStretchMediaError = callback; }, closest: () => failedFigure };
    bindStretchMedia({ querySelectorAll: selector => selector === "[data-stretch-media]" ? [failedImage] : [] }); onStretchMediaError();`);
  assert.equal(run("failedPicture.hidden"), true);
  assert.equal(run("stretchFallback.hidden"), false);
});

test("failed stretch video retains text fallback and cannot resume after later playback updates", () => {
  const { run } = loadPageLogic();
  run(`let onStretchVideoError; const videoFallback = { hidden: true };
    const failedVideo = { hidden: false, pause() {}, play() { throw new Error("failed video resumed"); },
      addEventListener: (event, callback) => { onStretchVideoError = callback; },
      closest: selector => selector === "[data-stretch-slide]" ? null : { querySelector: () => videoFallback, open: true } };
    const failedVideoScope = { querySelectorAll: selector => selector === "[data-stretch-video]" ? [failedVideo] : [] };
    bindStretchMedia(failedVideoScope); onStretchVideoError();
    elements.stretchPageList = failedVideoScope; activeModule = "stretch"; syncStretchVideoPlayback();`);
  assert.equal(run("failedVideo.hidden"), true);
  assert.equal(run("videoFallback.hidden"), false);
});

test("stretch popup waits for the whole workout, supports out-of-order completion and prompts once", () => {
  for (const goal of ["muscleGain", "fatLoss"]) {
    for (const frequency of [3, 4, 5]) {
      const { run, checkboxes, intervals } = loadPageLogic();
      let onChange;
      const checkbox = { checked: true, dataset: {}, addEventListener(type, callback) { if (type === "change") onChange = callback; } };
      checkboxes.push(checkbox);
      run(`state.goal = "${goal}"; state.trainDaysPerWeek = ${frequency}; activeDayId = getPlanByFrequency(${frequency}, state.goal).find(day => day.type === "train").id;
        renderWorkout = () => {}; renderWeeklyPlan = () => {};
        let prompts = []; openStretchModal = (workout, options) => { prompts.push({ id: workout.id, automatic: options.automatic }); return true; };
        activeExerciseIndex = getActiveWorkout().exercises.length - 1; bindWorkoutInteractions();`);
      checkbox.dataset = { workoutId: run("activeDayId"), exerciseName: run("getActiveWorkout().exercises.at(-1).name") };
      onChange();
      assert.equal(run("prompts.length"), 0, "checking the last card alone is not a completed workout");
      run("getActiveWorkout().exercises.slice(1, -1).forEach(exercise => setExerciseCompleted(activeDayId, exercise.name, true)); activeExerciseIndex = 0;");
      checkbox.dataset.exerciseName = run("getActiveWorkout().exercises[0].name");
      onChange();
      assert.equal(run("prompts.length"), 1);
      assert.equal(run("prompts[0].automatic"), true);
      assert.equal(run("prompts[0].id === activeDayId"), true);
      assert.equal(run("restState"), null);
      assert.equal(intervals.size, 0);
      assert.equal(run("activeExerciseIndex"), 0, "the final remaining card does not start another rest or advance");
      checkbox.checked = false; onChange();
      checkbox.checked = true; onChange();
      assert.equal(run("prompts.length"), 1, "unchecking and rechecking does not interrupt the user again");
    }
  }
});

test("whole-workout check-in clears rest, opens stretches once and leaves legacy history intact", () => {
  const { run, intervals } = loadPageLogic();
  run(`activeDayId = "周一-push-0"; renderWorkout = () => {}; renderWeeklyPlan = () => {};
    let prompts = 0; openStretchModal = () => { prompts += 1; return true; };
    progressStore[todayKey()] = { "周一-cutA-0": { "标准俯卧撑": true } };
    startRestTimer(1);`);
  assert.equal(intervals.size, 1);
  run("finishActiveWorkout()");
  assert.equal(run("prompts"), 1);
  assert.equal(run("isWorkoutComplete(getActiveWorkout())"), true);
  assert.equal(run("restState"), null);
  assert.equal(intervals.size, 0);
  assert.equal(run('progressStore[todayKey()]["周一-cutA-0"]["标准俯卧撑"]'), true);
  run("finishActiveWorkout()");
  assert.equal(run("prompts"), 1);
});

test("cardio expiry never opens stretches until the last unchecked exercise is marked complete", () => {
  const { run, checkboxes, advance } = loadPageLogic();
  let onChange;
  const checkbox = { checked: true, dataset: {}, addEventListener(type, callback) { if (type === "change") onChange = callback; } };
  checkboxes.push(checkbox);
  run(`state.goal = "fatLoss"; activeDayId = getPlanByFrequency(3, state.goal).find(day => day.type === "train").id;
    renderWorkout = () => {}; renderWeeklyPlan = () => {};
    let prompts = 0; openStretchModal = () => { prompts += 1; return true; };
    getActiveWorkout().exercises.slice(0, -1).forEach(exercise => setExerciseCompleted(activeDayId, exercise.name, true));
    activeExerciseIndex = getActiveWorkout().exercises.length - 1; toggleExerciseTimer(); bindWorkoutInteractions();`);
  advance(4_000_000);
  run("updateExerciseTimerDisplay()");
  assert.equal(run("prompts"), 0);
  assert.equal(run("isWorkoutComplete(getActiveWorkout())"), false);
  checkbox.dataset = { workoutId: run("activeDayId"), exerciseName: run("getActiveWorkout().exercises.at(-1).name") };
  onChange();
  assert.equal(run("prompts"), 1);
  assert.equal(run("exerciseTimerState"), null);
});

test("only the original two goals are available and older goal records remain untouched", () => {
  const { run } = loadPageLogic();
  assert.equal(run("defaultState.goal"), "muscleGain");
  assert.equal(run("defaultState.trainDaysPerWeek"), 4);
  assert.equal(run('JSON.stringify(Object.keys(goalConfig))'), '["muscleGain","fatLoss"]');
  run('activeDayId = "周一-push-0"; progressStore[todayKey()] = { "周一-cutA-0": { "标准俯卧撑": true }, "周一-matFlow1-0": { "徒手浅蹲": true } };');
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 0);
  run('setExerciseCompleted(activeDayId, "平板卧推", true)');
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 1);
  assert.equal(run('progressStore[todayKey()]["周一-cutA-0"]["标准俯卧撑"]'), true);
  assert.equal(run('progressStore[todayKey()]["周一-matFlow1-0"]["徒手浅蹲"]'), true);
  assert.match(run("getAiCoachContext().profile.goal"), /增肌/);
  assert.equal(run("getAiCoachContext().todayWorkout.currentExercise"), "平板卧推");
});

test("muscle-gain completion keeps its 60-second rest and switching clears timers", () => {
  const { run, checkboxes, advance, intervals } = loadPageLogic();
  let onChange;
  checkboxes.push({ checked: true, dataset: { workoutId: "周一-push-0", exerciseName: "平板卧推" }, addEventListener(type, callback) { if (type === "change") onChange = callback; } });
  run('activeDayId = "周一-push-0"; renderWorkout = () => {}; renderWeeklyPlan = () => {}; bindWorkoutInteractions();');
  onChange();
  assert.equal(run("restState.duration"), 60);
  assert.equal(run("activeExerciseIndex"), 0);
  advance(60_000);
  run("updateRestTimerDisplay()");
  assert.equal(run("activeExerciseIndex"), 1);
  assert.equal(run("restState"), null);
  run("startRestTimer(2); resetExerciseStepper()");
  assert.equal(run("activeExerciseIndex"), 0);
  assert.equal(intervals.size, 0);
  run('state.goal = "fatLoss"; activeDayId = getPlanByFrequency(4, state.goal)[0].id; activeExerciseIndex = 2; toggleExerciseTimer(); resetExerciseStepper();');
  assert.equal(run("exerciseTimerState"), null);
  assert.equal(intervals.size, 0);
});

test("fat-loss plans have two different simple exercises each day before final cardio and keep legacy IDs", () => {
  const { run } = loadPageLogic();
  const expectedCardio = [["treadmill", 20], ["bike", 20], ["treadmill", 25], ["bike", 20], ["bike", 15]];
  for (const frequency of [3, 4, 5]) {
    const plan = JSON.parse(run(`JSON.stringify(getPlanByFrequency(${frequency}, "fatLoss"))`));
    assert.equal(plan.filter((day) => day.type === "train").length, frequency);
    const prepNames = plan.filter((day) => day.type === "train").flatMap((day) => day.exercises.slice(0, -1).map((exercise) => exercise.name));
    assert.equal(prepNames.length, frequency * 2);
    assert.equal(new Set(prepNames).size, frequency * 2, "no preparatory exercise repeats during the week");
    plan.forEach((day, index) => {
      assert.equal(day.id, `${day.day}-${day.key}-${index}`);
      assert.ok(!/瑜伽垫|垫上|开合跳|原地高抬腿|深蹲到伸展|罗马尼亚硬拉|绳索直臂下压|哑铃推肩|哑铃杯式深蹲|侧平举/.test(JSON.stringify(day)));
      const exercises = day.exercises;
      exercises.forEach((exercise) => {
        assert.ok(exercise.durationSeconds > 0);
        const guide = ExerciseGuides.getExerciseGuide(exercise, { mediaEnabled: true });
        assert.equal(guide.hasSpecificGuide, true);
        assert.ok(!/仰躺|仰卧|侧躺|侧卧|俯卧|撑地|跪姿|垫子/.test(JSON.stringify(guide.steps)));
        assert.ok(guide.media, `${exercise.name} needs a demonstration`);
        assert.ok(fs.existsSync(path.join(__dirname, "..", guide.media.src)));
        assert.match(guide.media.src, /\.gif$/);
      });
      const totalMinutes = exercises.reduce((sum, exercise) => sum + exercise.durationSeconds / 60, 0);
      assert.match(day.duration, new RegExp(`约 ${totalMinutes} 分钟`));
      if (day.type === "train") {
        assert.equal(exercises.length, 3);
        exercises.slice(0, -1).forEach((exercise) => {
          assert.ok(!exercise.timerSegments);
          if (exercise.phase === "strength") {
            assert.equal(exercise.durationSeconds, 240);
            assert.match(exercise.sets, /轻重量.*2组 × 10次/);
            assert.ok(["cable", "dumbbell"].includes(exercise.equipment));
          } else {
            assert.equal(exercise.phase, "warmup");
            assert.equal(exercise.durationSeconds, 60);
            assert.equal(exercise.equipment, undefined);
          }
        });
        const [equipment, minutes] = expectedCardio[index];
        const cardio = exercises.at(-1);
        assert.equal(cardio.phase, "cardio");
        assert.equal(cardio.equipment, equipment);
        assert.equal(cardio.durationSeconds, (minutes + 10) * 60);
        assert.deepEqual(cardio.timerSegments.map((segment) => segment.durationSeconds), [300, minutes * 60, 300]);
        assert.ok(minutes * 60 > exercises.slice(0, -1).reduce((sum, exercise) => sum + exercise.durationSeconds, 0), "formal cardio must be the main activity");
      } else {
        assert.equal(exercises.length, 1);
        assert.equal(totalMinutes, 20);
        assert.equal(exercises[0].name, "跑步机快走");
      }
    });
  }
});

test("cardio demonstrations use real local media and respect the media switch", () => {
  const { run } = loadPageLogic();
  const workouts = JSON.parse(run("JSON.stringify(fatLossWorkouts)"));
  Object.values(workouts).forEach((workout) => {
    workout.exercises.filter((exercise) => exercise.timerSegments).forEach((exercise) => {
      const guide = ExerciseGuides.getExerciseGuide(exercise, { mediaEnabled: true });
      const expectedFile = exercise.equipment === "bike" ? "2138-H1PESYI.gif"
        : exercise.name === "跑步机慢跑" ? "0684-y5p0H8a.gif" : "3666-rjiM4L3.gif";
      assert.equal(guide.media.src, `exercise-media/${expectedFile}`);
      assert.ok(fs.existsSync(path.join(__dirname, "..", guide.media.src)));
      assert.equal(guide.media.attribution, "© Gym visual");
      assert.equal(guide.media.approximate, exercise.name === "跑步机快走");
      assert.equal(ExerciseGuides.getExerciseGuide(exercise, { mediaEnabled: false }).media, null);
      assert.ok(guide.steps.length >= 3);
      assert.ok(guide.breathing && guide.alternative);
    });
  });
});

test("timer supports pause/resume, catches up after background time and never auto-completes", () => {
  const { run, advance, intervals, nodes } = loadPageLogic();
  run('state.goal = "fatLoss"; activeDayId = "周一-matFlow1-0"; activeExerciseIndex = 2; toggleExerciseTimer();');
  assert.equal(run("getExerciseTimerRemaining(getActiveWorkout().exercises[2])"), 1800);
  advance(12_500);
  run("toggleExerciseTimer()");
  assert.equal(run("exerciseTimerState.remaining"), 1788);
  assert.equal(intervals.size, 0);
  advance(60_000);
  assert.equal(run("getExerciseTimerRemaining(getActiveWorkout().exercises[2])"), 1788);
  run("toggleExerciseTimer()");
  assert.equal(intervals.size, 1);
  advance(1_800_000);
  run("updateExerciseTimerDisplay()");
  assert.equal(run("exerciseTimerState.remaining"), 0);
  assert.equal(intervals.size, 0);
  assert.equal(nodes.get("[data-exercise-seconds]").textContent, "00:00");
  assert.match(nodes.get("[data-exercise-timer-status]").textContent, /时间到/);
  assert.equal(run("activeExerciseIndex"), 2);
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 0);
  run("toggleExerciseTimer()");
  assert.equal(run("getExerciseTimerRemaining(getActiveWorkout().exercises[2])"), 1800);
  run("resetExerciseStepper()");
  assert.equal(run("exerciseTimerState"), null);
  assert.equal(intervals.size, 0);
  assert.equal(run("activeExerciseIndex"), 0);
});

test("final cardio timer moves from low-speed warmup to main cardio and then cooldown", () => {
  const { run } = loadPageLogic();
  run('const cardioExercise = fatLossWorkouts.matFlow1.exercises[2];');
  assert.equal(run("getExerciseTimerStage(cardioExercise, 1800)"), "慢走热身");
  assert.equal(run("getExerciseTimerStage(cardioExercise, 1501)"), "慢走热身");
  assert.equal(run("getExerciseTimerStage(cardioExercise, 1500)"), "慢跑");
  assert.equal(run("getExerciseTimerStage(cardioExercise, 301)"), "慢跑");
  assert.equal(run("getExerciseTimerStage(cardioExercise, 300)"), "慢走放松");
  assert.equal(run("getExerciseTimerStage(cardioExercise, 0)"), "已结束");
});

test("stage display tracks exact boundaries, phase time, pause and restart", () => {
  const { run, advance, nodes, stages } = loadPageLogic();
  run('state.goal = "fatLoss"; activeDayId = "周一-matFlow1-0"; activeExerciseIndex = 2; updateExerciseTimerDisplay();');
  assert.equal(nodes.get("[data-exercise-timer-phase]").textContent, "热身");
  assert.equal(nodes.get("[data-exercise-timer-state]").textContent, "未开始");
  assert.match(nodes.get("[data-exercise-stage-remaining]").textContent, /05:00/);
  assert.equal(stages[0].getAttribute("aria-current"), "step");
  run("toggleExerciseTimer()");
  advance(300_000);
  run("updateExerciseTimerDisplay()");
  assert.equal(nodes.get("[data-exercise-timer-phase]").textContent, "正式有氧");
  assert.match(nodes.get("[data-exercise-stage-remaining]").textContent, /20:00/);
  assert.equal(nodes.get("[data-exercise-seconds]").textContent, "25:00");
  assert.equal(stages[0].classList.contains("is-done"), true);
  assert.equal(stages[0].getAttribute("aria-current"), undefined);
  assert.equal(stages[1].getAttribute("aria-current"), "step");
  run("toggleExerciseTimer()");
  advance(600_000);
  run("updateExerciseTimerDisplay()");
  assert.equal(nodes.get("[data-exercise-timer-state]").textContent, "已暂停");
  assert.match(nodes.get("[data-exercise-stage-remaining]").textContent, /20:00/);
  run("toggleExerciseTimer()");
  advance(1_200_000);
  run("updateExerciseTimerDisplay()");
  assert.equal(nodes.get("[data-exercise-timer-phase]").textContent, "放松");
  assert.match(nodes.get("[data-exercise-stage-remaining]").textContent, /05:00/);
  advance(300_000);
  run("updateExerciseTimerDisplay()");
  assert.equal(nodes.get("[data-exercise-timer-phase]").textContent, "本次有氧结束");
  assert.ok(stages.every((stage) => stage.classList.contains("is-done")));
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 0);
  run("toggleExerciseTimer()");
  assert.equal(nodes.get("[data-exercise-timer-phase]").textContent, "热身");
  assert.equal(nodes.get("[data-exercise-seconds]").textContent, "30:00");
  assert.ok(stages.every((stage) => !stage.classList.contains("is-done")));
  run("cancelExerciseTimer(); updateExerciseTimerDisplay();");
  assert.equal(nodes.get("[data-exercise-timer-state]").textContent, "未开始");
});

test("sound is opt-in and phase transitions alert once across pause, rerender and completion", async () => {
  const { AudioContext, stats } = createAudioMock();
  const { run, advance, nodes } = loadPageLogic({ AudioContext });
  run('state.goal = "fatLoss"; activeDayId = "周一-matFlow1-0"; activeExerciseIndex = 2; toggleExerciseTimer();');
  assert.equal(stats.contexts, 0, "silent timers never initialize audio");
  await run("toggleExerciseTimerSound()");
  assert.equal(stats.contexts, 1);
  assert.equal(stats.resumes, 1);
  assert.equal(stats.tones.length, 2, "enabling previews the alert");
  assert.equal(nodes.get("[data-exercise-timer-sound]").getAttribute("aria-pressed"), "true");
  advance(300_000);
  run("updateExerciseTimerDisplay(); updateExerciseTimerDisplay(); toggleExerciseTimer();");
  assert.equal(stats.tones.length, 4, "phase change alerts once; pause is silent");
  advance(300_000);
  run("toggleExerciseTimer(); updateExerciseTimerDisplay();");
  assert.equal(stats.tones.length, 4, "resume does not repeat the phase alert");
  advance(1_200_000);
  run("updateExerciseTimerDisplay()");
  assert.equal(stats.tones.length, 6);
  advance(300_000);
  run("updateExerciseTimerDisplay(); updateExerciseTimerDisplay();");
  assert.equal(stats.tones.length, 9, "completion has three tones and never repeats");
  run("toggleExerciseTimer()");
  assert.equal(stats.tones.length, 9, "restart is silent");
  await run("toggleExerciseTimerSound()");
  advance(300_000);
  run("updateExerciseTimerDisplay()");
  assert.equal(stats.tones.length, 9, "muted phase transitions stay silent");
  assert.equal(nodes.get("[data-exercise-timer-sound]").getAttribute("aria-pressed"), "false");
});

test("background catch-up emits one current alert and cancelling prevents later alerts", async () => {
  const { AudioContext, stats } = createAudioMock();
  const { run, advance, intervals } = loadPageLogic({ AudioContext });
  run('state.goal = "fatLoss"; activeDayId = "周一-matFlow1-0"; activeExerciseIndex = 2;');
  await run("toggleExerciseTimerSound()");
  run("toggleExerciseTimer()");
  advance(1_550_000);
  run("updateExerciseTimerDisplay()");
  assert.equal(stats.tones.length, 4, "skip missed warmup/main alerts and only alert the current cooldown");
  run("resetExerciseStepper()");
  advance(600_000);
  assert.equal(intervals.size, 0);
  assert.equal(stats.tones.length, 4);
  run("activeExerciseIndex = 2; toggleExerciseTimer();");
  advance(1_800_000);
  run("toggleExerciseTimer()");
  assert.equal(run("exerciseTimerState.remaining"), 0, "a delayed pause click must not restart an expired timer");
  assert.equal(intervals.size, 0);
  assert.equal(stats.tones.length, 7, "expired timer only emits one completion alert");
});

test("unsupported or blocked audio cannot break the timer and playback failure falls back to visual cues", async () => {
  for (const audioMode of ["unsupported", "blocked", "playbackFailure"]) {
    const audio = createAudioMock({ rejectResume: audioMode === "blocked", throwOnPlayback: audioMode === "playbackFailure" });
    const { run, advance, nodes } = loadPageLogic(audioMode === "unsupported" ? {} : { AudioContext: audio.AudioContext });
    run('state.goal = "fatLoss"; activeDayId = "周一-matFlow1-0"; activeExerciseIndex = 2;');
    await run("toggleExerciseTimerSound()");
    assert.equal(run("exerciseTimerSoundEnabled"), false, audioMode);
    assert.match(nodes.get("[data-exercise-timer-sound-note]").textContent, /不支持|未开启|暂不可用/);
    run("toggleExerciseTimer()");
    advance(300_000);
    run("updateExerciseTimerDisplay()");
    assert.equal(nodes.get("[data-exercise-timer-phase]").textContent, "正式有氧");
    assert.equal(run("getExerciseTimerRemaining(getActiveWorkout().exercises[2])"), 1500);
  }
});

test("old removed exercise records stay stored and do not complete new cardio", () => {
  const { run } = loadPageLogic();
  run('state.goal = "fatLoss"; activeDayId = "周一-matFlow1-0"; progressStore[todayKey()] = { "周一-matFlow1-0": { "原地高抬腿": true, "登山跑": true, "平板支撑": true } };');
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 0);
  assert.equal(run('progressStore[todayKey()][activeDayId]["登山跑"]'), true);
  assert.equal(run('getExerciseProgressMap(getActiveWorkout())["跑步机快走"]'), undefined);
});

test("renamed dumbbell fly keeps old completion and explicit cancellation takes priority", () => {
  const { run } = loadPageLogic();
  for (const frequency of [3, 4, 5]) {
    const plan = JSON.parse(run(`JSON.stringify(getPlanByFrequency(${frequency}, "muscleGain"))`));
    const fly = plan[0].exercises[2];
    assert.equal(fly.name, "哑铃飞鸟");
    assert.equal(fly.equipment, "dumbbell");
    assert.equal(fly.extraEquipment, "bench");
    const guide = ExerciseGuides.getExerciseGuide(fly, { mediaEnabled: true });
    assert.equal(guide.media.src, "exercise-media/0308-yz9nUhF.gif");
  }
  run('state.goal = "muscleGain"; activeDayId = "周一-push-0"; progressStore[todayKey()] = { [activeDayId]: { "夹胸 / 飞鸟": true } };');
  assert.equal(run('getExerciseProgressMap(getActiveWorkout())["哑铃飞鸟"]'), true);
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 1);
  run('setExerciseCompleted(activeDayId, "哑铃飞鸟", false)');
  assert.equal(run('getExerciseProgressMap(getActiveWorkout())["哑铃飞鸟"]'), false);
  assert.equal(run('progressStore[todayKey()][activeDayId]["夹胸 / 飞鸟"]'), true);
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 0);
  run('setExerciseCompleted(activeDayId, "哑铃飞鸟", true)');
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 1);
  run('activeDayId = "周二-pull-1";');
  assert.equal(run('getExerciseProgressMap(getActiveWorkout())["哑铃飞鸟"]'), undefined);
});

test("checking both warmups advances straight to cardio without rest and final completion never wraps", () => {
  const { run, checkboxes, intervals } = loadPageLogic();
  let onChange;
  const checkbox = { checked: true, dataset: {}, addEventListener(type, callback) { if (type === "change") onChange = callback; } };
  checkboxes.push(checkbox);
  run('state.goal = "fatLoss"; activeDayId = "周一-matFlow1-0"; renderWorkout = () => {}; renderWeeklyPlan = () => {};');
  checkbox.dataset = { workoutId: run("activeDayId"), exerciseName: run("getActiveWorkout().exercises[0].name") };
  run("bindWorkoutInteractions()");
  onChange();
  assert.equal(run("activeExerciseIndex"), 1);
  assert.equal(run("restState"), null);
  checkbox.dataset.exerciseName = run("getActiveWorkout().exercises[1].name");
  onChange();
  assert.equal(run("activeExerciseIndex"), 2);
  assert.equal(run("restState"), null);
  assert.equal(intervals.size, 0);
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 2);
  checkbox.dataset.exerciseName = run("getActiveWorkout().exercises[2].name");
  onChange();
  assert.equal(run("activeExerciseIndex"), 2);
  assert.equal(run("countCompletedExercises(getActiveWorkout()).completed"), 3);
});
