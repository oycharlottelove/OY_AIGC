/* =========================================================
   高中化学智慧教学平台 · 公共脚本 common.js
   纯原生 JavaScript；数据保存在 localStorage。
   主要能力：登录鉴权、角色导航、演示数据、DeepSeek 多模态批改、
   作业档案更新、共性分析、优秀答案、图表绘制。
   ========================================================= */
(function (global) {
  'use strict';

  /* ---------------- 常量与数据字典 ---------------- */
  var KEYS = {
    users: 'chemhub_users_v1',
    session: 'chemhub_session_v1',
    settings: 'chemhub_settings_v1',
    submissions: 'chemhub_submissions_v1',
    students: 'chemhub_students_v1',
    excellent: 'chemhub_excellent_v1',
    reports: 'chemhub_reports_v1',
    seeded: 'chemhub_seeded_v1'
  };

  var DEMO_CLASS = '高一（3）班';
  var DEMO_SCHOOL = '启明中学';
  var GRADES = ['A+', 'A', 'B+', 'B', 'C+', 'C'];
  var VERDICTS = ['正确', '部分正确', '错误', '存疑'];
  var DEFAULT_SETTINGS = {
    apiKey: '',
    model: 'deepseek-flash',
    apiBase: 'https://api.deepseek.com/chat/completions',
    forceDemo: false
  };

  var BATCHES = [
    {
      id: 'batch_ionic',
      name: '离子反应 课后巩固',
      unit: '第三章 水溶液中的离子反应',
      due: '2026-11-12',
      task: '离子方程式书写、离子共存判断与物质的量计算'
    },
    {
      id: 'batch_redox',
      name: '氧化还原反应 单元测评',
      unit: '第四章 氧化还原反应',
      due: '2026-11-17',
      task: '概念辨析、双线桥、配平与电子守恒计算'
    },
    {
      id: 'batch_experiment',
      name: '化学实验基础 专题练习',
      unit: '实验基础与科学探究',
      due: '2026-11-24',
      task: '仪器识别、装置连接、现象描述与误差分析'
    }
  ];

  var TAG_GUIDES = {
    '离子方程式配平': {
      title: '离子方程式配平与电荷守恒',
      desc: '学生能写出反应物和生成物，但系数、原子个数或电荷不守恒，说明“写完即查”的习惯尚未形成。',
      suggestion: '用“拆—删—查”三步法做板书示范，要求每题完成后分别核对原子守恒和电荷守恒；安排 2 道同类型题即时复测。'
    },
    '酸式盐电离': {
      title: '酸式盐在水溶液中的拆分',
      desc: '对 NaHSO₄、NaHCO₃ 等酸式盐在水溶液中的存在形式判断不稳定，容易把 HSO₄⁻ 当作不再电离的整体。',
      suggestion: '用“水溶液中是否完全电离”作为判断主线，对比 NaHSO₄ 在水溶液与熔融状态下的差异，建立条件意识。'
    },
    '离子共存隐含条件': {
      title: '离子共存题中的隐含条件',
      desc: '只关注离子之间是否反应，忽略“无色”“透明”“酸性/碱性”等题干条件，导致选项判断偏差。',
      suggestion: '课堂归纳“颜色、酸碱性、氧化还原、沉淀气体弱电解质”四类隐含条件，并训练先圈画条件再审题。'
    },
    '离子共存条件': {
      title: '离子共存条件判断',
      desc: '对离子间生成沉淀、气体或弱电解质的条件掌握不完整，审题时容易遗漏溶液颜色与酸碱性。',
      suggestion: '建立常见离子组合反应清单，配合“逐项排除法”进行限时训练，强调先看题干隐含条件。'
    },
    '定量计算规范': {
      title: '计算题步骤与单位规范',
      desc: '计算思路基本正确，但缺少“设—列—算—答”的完整过程，或体积、质量、物质的量单位书写不完整。',
      suggestion: '展示一份满分计算题样板，要求学生按步骤给分点自查；课堂用 1 道变式题训练单位换算和有效数字。'
    },
    '计算题步骤': {
      title: '计算题步骤与守恒关系',
      desc: '未能先建立物质的量关系或电子守恒关系，直接代入数字，步骤跳跃导致结果不稳定。',
      suggestion: '先画“已知—所求—桥梁”关系图，再列比例式；讲评时保留原始步骤，标出每一步得分点。'
    },
    '电子转移方向': {
      title: '电子转移方向与双线桥',
      desc: '能判断氧化剂、还原剂，但双线桥箭头方向、得失电子标注或电子总数配平不准确。',
      suggestion: '用“升失氧、降得还”口诀配合双线桥模板训练，要求先标化合价变化，再写电子转移数目。'
    },
    '氧化还原配平': {
      title: '氧化还原方程式配平',
      desc: '化合价变化判断不稳定，配平时顾此失彼，电子守恒与原子守恒没有同步检查。',
      suggestion: '采用“标价态—列升降—求最小公倍数—配系数—查守恒”五步法，安排 MnO₄⁻、Cr₂O₇²⁻ 等典型体系专项练习。'
    },
    '实验现象描述': {
      title: '实验现象描述的完整性',
      desc: '现象描述缺少颜色、状态、气味、沉淀或气体等关键要素，容易把结论当作现象。',
      suggestion: '强调“现象是看到/听到/闻到的，结论是推断出来的”；用“颜色+状态+变化过程”句式进行口头复述训练。'
    },
    '装置连接顺序': {
      title: '实验装置连接与操作顺序',
      desc: '对除杂、干燥、收集、尾气处理等装置的先后顺序理解不牢，忽略防倒吸和安全原则。',
      suggestion: '用流程箭头梳理“发生—净化—干燥—收集—尾气”顺序，结合错误装置图让学生找茬并说明安全理由。'
    },
    '误差分析': {
      title: '实验误差分析',
      desc: '能完成基本计算，但难以把操作偏差转化为对最终结果“偏高/偏低”的判断。',
      suggestion: '建立“操作变化—所测量变化—计算结果变化”的因果链，配 2 道容量瓶配制误差分析题当堂辨析。'
    },
    '化学用语规范': {
      title: '化学用语书写规范',
      desc: '化学式、离子符号、箭头、条件、沉淀与气体符号存在漏写或混用，影响答案的规范性。',
      suggestion: '整理“化学用语规范清单”，把常见扣分点贴在作业本首页；每次批改后用 1 分钟做符号专项纠错。'
    },
    '其他高频问题': {
      title: '其他高频问题',
      desc: '该题的错误分散在审题、表达和计算等多个环节，需要通过面批进一步定位。',
      suggestion: '选取 2—3 份典型作业进行面批，追问学生的思考过程，再决定是否需要全班集中讲评。'
    }
  };

  /* ---------------- 通用小工具 ---------------- */
  function nowISO() {
    return new Date().toISOString();
  }

  function daysAgo(days, hour, minute) {
    var date = new Date();
    date.setDate(date.getDate() - Number(days || 0));
    date.setHours(typeof hour === 'number' ? hour : 18, typeof minute === 'number' ? minute : 20, 0, 0);
    return date.toISOString();
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function formatDate(value, withTime) {
    if (!value) return '—';
    var date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    var base = date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    if (withTime) base += ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    return base;
  }

  function formatDateShort(value) {
    if (!value) return '—';
    var date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return pad(date.getMonth() + 1) + '/' + pad(date.getDate());
  }

  function escapeHTML(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function truncate(value, max) {
    var text = String(value === null || value === undefined ? '' : value).replace(/\s+/g, ' ').trim();
    if (text.length <= max) return text;
    return text.slice(0, Math.max(1, max - 1)) + '…';
  }

  function unique(list) {
    var seen = {};
    return list.filter(function (item) {
      var key = String(item);
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function safeRead(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      console.warn('读取本地数据失败：' + key, error);
      return fallback;
    }
  }

  function safeWrite(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('保存本地数据失败：' + key, error);
      return false;
    }
  }

  function getUsers() {
    var data = safeRead(KEYS.users, []);
    return Array.isArray(data) ? data : [];
  }

  function saveUsers(users) {
    return safeWrite(KEYS.users, users);
  }

  function getStudents() {
    var data = safeRead(KEYS.students, []);
    return Array.isArray(data) ? data : [];
  }

  function saveStudents(students) {
    return safeWrite(KEYS.students, students);
  }

  function getSubmissions() {
    var data = safeRead(KEYS.submissions, []);
    return Array.isArray(data) ? data : [];
  }

  function saveSubmissions(submissions) {
    return safeWrite(KEYS.submissions, submissions);
  }

  function getExcellent() {
    var data = safeRead(KEYS.excellent, []);
    return Array.isArray(data) ? data : [];
  }

  function saveExcellent(items) {
    return safeWrite(KEYS.excellent, items);
  }

  function getReports() {
    var data = safeRead(KEYS.reports, []);
    return Array.isArray(data) ? data : [];
  }

  function saveReports(reports) {
    return safeWrite(KEYS.reports, reports);
  }

  function getSettings() {
    var raw = safeRead(KEYS.settings, {});
    if (!raw || typeof raw !== 'object') raw = {};
    return {
      apiKey: typeof raw.apiKey === 'string' ? raw.apiKey : '',
      model: raw.model && String(raw.model).trim() ? String(raw.model).trim() : DEFAULT_SETTINGS.model,
      apiBase: raw.apiBase && String(raw.apiBase).trim() ? String(raw.apiBase).trim() : DEFAULT_SETTINGS.apiBase,
      forceDemo: Boolean(raw.forceDemo)
    };
  }

  function saveSettings(patch) {
    var current = getSettings();
    var next = {
      apiKey: patch && typeof patch.apiKey === 'string' ? patch.apiKey.trim() : current.apiKey,
      model: patch && patch.model !== undefined ? (String(patch.model).trim() || DEFAULT_SETTINGS.model) : current.model,
      apiBase: patch && patch.apiBase !== undefined ? (String(patch.apiBase).trim() || DEFAULT_SETTINGS.apiBase) : current.apiBase,
      forceDemo: patch && patch.forceDemo !== undefined ? Boolean(patch.forceDemo) : current.forceDemo
    };
    safeWrite(KEYS.settings, next);
    return next;
  }

  function getBatch(batchId) {
    for (var i = 0; i < BATCHES.length; i += 1) {
      if (BATCHES[i].id === batchId) return BATCHES[i];
    }
    return null;
  }

  function getStudentById(studentId) {
    var list = getStudents();
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].studentId === studentId) return list[i];
    }
    return null;
  }

  function getStudentByUserId(userId) {
    var list = getStudents();
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].userId === userId) return list[i];
    }
    return null;
  }

  function getSubmissionById(id) {
    var list = getSubmissions();
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function gradeClass(grade) {
    return 'grade-' + String(grade || '').toLowerCase().replace('+', '-plus');
  }

  function verdictClass(verdict) {
    if (verdict === '正确') return 'verdict-correct';
    if (verdict === '部分正确') return 'verdict-partial';
    if (verdict === '错误') return 'verdict-wrong';
    return 'verdict-review';
  }

  function normalizeGrade(value) {
    var text = String(value || '').trim().toUpperCase().replace('＋', '+');
    if (GRADES.indexOf(text) >= 0) return text;
    if (text === 'A-' || text === 'A0') return 'A';
    if (text === 'B-' || text === 'B0') return 'B';
    if (text === 'C-' || text === 'C0') return 'C';
    return '';
  }

  function scoreFromGrade(grade) {
    var map = { 'A+': 96, 'A': 91, 'B+': 86, 'B': 81, 'C+': 73, 'C': 63 };
    return map[grade] || 75;
  }

  function gradeFromScore(score) {
    var n = Number(score);
    if (!isFinite(n)) return 'B';
    if (n >= 95) return 'A+';
    if (n >= 90) return 'A';
    if (n >= 85) return 'B+';
    if (n >= 80) return 'B';
    if (n >= 70) return 'C+';
    return 'C';
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /* ---------------- 演示数据 ---------------- */
  var MOCK_RESULTS = {
    batch_ionic: [
      {
        grade: 'A',
        score: 91,
        dimensions: {
          accuracy: { score: 94, comment: '离子反应本质与拆分规则掌握扎实，方程式书写准确。' },
          logic: { score: 90, comment: '能按“判断反应—拆分—删减—检查”的顺序推进，思路完整。' },
          normativity: { score: 88, comment: '箭头、沉淀符号基本规范，个别步骤说明可以更完整。' }
        },
        overall: '本次作业整体完成质量较高，能够从离子反应的本质出发分析问题，书写与计算步骤清楚。第2题出现配平疏漏，说明完成后还缺少守恒复核。建议养成“原子守恒＋电荷守恒”双检习惯，让表达更严谨。',
        questions: [
          {
            no: '1',
            question: '写出 NaHSO₄ 在水溶液中的电离方程式。',
            studentAnswer: 'NaHSO₄ → Na⁺ + H⁺ + SO₄²⁻',
            verdict: '正确',
            errorType: '',
            reason: '酸式盐在水溶液中完全电离，拆分正确，电荷守恒。',
            correctApproach: '先判断物质类别，再按水溶液中的实际存在形式拆分；写完检查原子与电荷。',
            tag: '酸式盐电离'
          },
          {
            no: '2',
            question: '写出 Ba(OH)₂ 溶液与稀 H₂SO₄ 反应的离子方程式。',
            studentAnswer: 'Ba²⁺ + OH⁻ + H⁺ + SO₄²⁻ → BaSO₄↓ + H₂O',
            verdict: '部分正确',
            errorType: '配平错误',
            reason: '化学式判断正确，但 OH⁻ 与 H⁺ 前的系数应为 2，反应前后 H、O 原子个数及电荷不守恒。',
            correctApproach: 'Ba²⁺ + 2OH⁻ + 2H⁺ + SO₄²⁻ → BaSO₄↓ + 2H₂O。先配平原子，再检查两边电荷。',
            tag: '离子方程式配平'
          },
          {
            no: '3',
            question: '在无色透明溶液中，下列离子能大量共存的是（ ）。A. Cu²⁺、Cl⁻、SO₄²⁻、NO₃⁻；B. K⁺、Na⁺、NO₃⁻、Cl⁻；C. Ba²⁺、Na⁺、SO₄²⁻、Cl⁻；D. H⁺、CO₃²⁻、Na⁺、Cl⁻',
            studentAnswer: 'B。B 组离子之间不生成沉淀、气体或弱电解质，且溶液无色。',
            verdict: '正确',
            errorType: '',
            reason: '能同时检查离子反应和“无色”隐含条件，排除 A；C 生成 BaSO₄ 沉淀，D 生成 CO₂ 和 H₂O。',
            correctApproach: '逐项检查生成沉淀、气体、弱电解质的情况，再核对颜色、酸碱性等隐含条件。',
            tag: '离子共存条件'
          },
          {
            no: '4',
            question: '向含 0.02 mol Na₂CO₃ 的溶液中逐滴加入稀盐酸，计算完全反应生成 CO₂ 的体积（标准状况）。',
            studentAnswer: 'n(CO₂) = n(Na₂CO₃) = 0.02 mol，V = 0.02 mol × 22.4 L/mol = 0.448 L。',
            verdict: '正确',
            errorType: '',
            reason: '按物质的量关系计算，步骤完整，单位规范。',
            correctApproach: '先写反应关系式，确定 1∶1 的物质的量关系，再代入标准状况气体摩尔体积。',
            tag: '定量计算规范'
          }
        ],
        weakTags: ['离子方程式配平', '守恒检查习惯']
      },
      {
        grade: 'B+',
        score: 84,
        dimensions: {
          accuracy: { score: 82, comment: '基础知识有掌握，但酸式盐拆分和离子共存条件仍有漏洞。' },
          logic: { score: 86, comment: '整体推理路径清楚，能够逐项排除明显错误选项。' },
          normativity: { score: 81, comment: '计算步骤基本完整，个别单位与条件书写不够规范。' }
        },
        overall: '本次作业展现出较好的分析意识，能够主动寻找离子之间的反应关系。主要失分集中在酸式盐在水溶液中的拆分以及“无色”条件的忽略，说明审题时对题干限制关注不足。建议每道题先圈出条件，再按“拆分—删减—检查”的顺序完成。',
        questions: [
          {
            no: '1',
            question: '写出 NaHSO₄ 在水溶液中的电离方程式。',
            studentAnswer: 'NaHSO₄ → Na⁺ + HSO₄⁻',
            verdict: '部分正确',
            errorType: '拆分错误',
            reason: 'NaHSO₄ 在水溶液中完全电离，HSO₄⁻ 不能作为最终存在形式保留。',
            correctApproach: 'NaHSO₄ → Na⁺ + H⁺ + SO₄²⁻。注意“水溶液”与“熔融状态”的条件差异。',
            tag: '酸式盐电离'
          },
          {
            no: '2',
            question: '写出 Ba(OH)₂ 溶液与稀 H₂SO₄ 反应的离子方程式。',
            studentAnswer: 'Ba²⁺ + 2OH⁻ + 2H⁺ + SO₄²⁻ → BaSO₄↓ + 2H₂O',
            verdict: '正确',
            errorType: '',
            reason: '系数、原子个数与电荷均守恒，沉淀符号规范。',
            correctApproach: '先拆分强电解质，再删去不参与反应的离子，最后检查守恒。',
            tag: '离子方程式配平'
          },
          {
            no: '3',
            question: '在无色透明溶液中，下列离子能大量共存的是（ ）。A. Cu²⁺、Cl⁻、SO₄²⁻、NO₃⁻；B. K⁺、Na⁺、NO₃⁻、Cl⁻；C. Ba²⁺、Na⁺、SO₄²⁻、Cl⁻；D. H⁺、CO₃²⁻、Na⁺、Cl⁻',
            studentAnswer: 'A。A 组离子之间不反应，可以大量共存。',
            verdict: '错误',
            errorType: '忽略隐含条件',
            reason: 'A 中 Cu²⁺ 在水溶液中呈蓝色，不符合“无色透明溶液”的条件。',
            correctApproach: 'B 为正确答案。先排除有颜色的 Cu²⁺，再检查沉淀、气体和弱电解质。',
            tag: '离子共存隐含条件'
          },
          {
            no: '4',
            question: '向含 0.02 mol Na₂CO₃ 的溶液中逐滴加入稀盐酸，计算完全反应生成 CO₂ 的体积（标准状况）。',
            studentAnswer: '0.02 × 22.4 = 0.448',
            verdict: '部分正确',
            errorType: '规范性不足',
            reason: '数值正确，但缺少物质的量关系和体积单位，过程不完整。',
            correctApproach: '写出 n(CO₂)=0.02 mol，再列 V=0.02 mol×22.4 L/mol=0.448 L，最后作答。',
            tag: '定量计算规范'
          }
        ],
        weakTags: ['酸式盐电离', '离子共存隐含条件', '定量计算规范']
      }
    ],
    batch_redox: [
      {
        grade: 'A',
        score: 90,
        dimensions: {
          accuracy: { score: 91, comment: '氧化还原核心概念清楚，常见氧化剂还原剂判断准确。' },
          logic: { score: 92, comment: '能够用化合价变化和电子守恒建立解题主线。' },
          normativity: { score: 86, comment: '双线桥标注基本完整，电子转移方向还可更严谨。' }
        },
        overall: '本次测评对氧化还原反应的概念理解和计算应用较为扎实，能主动用化合价变化分析问题。第3题双线桥中电子转移方向标注不完整，反映出对“失电子、化合价升高”的对应关系还需强化。建议用错题重画一遍双线桥，并口述每一步含义。',
        questions: [
          {
            no: '1',
            question: '在反应 2Na + Cl₂ → 2NaCl 中，氧化剂是______，还原剂是______。',
            studentAnswer: '氧化剂是 Cl₂，还原剂是 Na。',
            verdict: '正确',
            errorType: '',
            reason: 'Cl₂ 中氯元素化合价由 0 降到 -1，被还原；Na 由 0 升到 +1，被氧化。',
            correctApproach: '先标化合价，再找化合价降低（得电子）和升高（失电子）的元素。',
            tag: '氧化还原概念'
          },
          {
            no: '2',
            question: '配平：KMnO₄ + HCl → KCl + MnCl₂ + Cl₂↑ + H₂O',
            studentAnswer: '2KMnO₄ + 16HCl → 2KCl + 2MnCl₂ + 5Cl₂↑ + 8H₂O',
            verdict: '正确',
            errorType: '',
            reason: '锰由 +7 降到 +2，氯由 -1 升到 0，电子守恒，原子守恒。',
            correctApproach: '标价态、列升降、求最小公倍数、配系数，最后检查 K、Mn、Cl、H、O 与电荷。',
            tag: '氧化还原配平'
          },
          {
            no: '3',
            question: '用双线桥表示上述反应中的电子转移方向和数目。',
            studentAnswer: 'Mn：+7 → +2，得 5e⁻；Cl：-1 → 0，失 1e⁻。',
            verdict: '部分正确',
            errorType: '电子转移方向错误',
            reason: '得失电子的总数未配平，双线桥未体现 2 个 Mn 与 10 个 Cl 的电子转移关系。',
            correctApproach: '2 个 Mn 共得 10e⁻，10 个 Cl 共失 10e⁻；双线桥从反应物指向生成物，并标明“得到/失去”。',
            tag: '电子转移方向'
          },
          {
            no: '4',
            question: '足量 KMnO₄ 与 0.1 mol HCl 充分反应，计算生成 Cl₂ 的物质的量。',
            studentAnswer: '由方程式可知 16 mol HCl 生成 5 mol Cl₂，所以 n(Cl₂)=0.1×5/16=0.03125 mol。',
            verdict: '正确',
            errorType: '',
            reason: '比例关系正确，步骤清晰，单位完整。',
            correctApproach: '先确定已知量与未知量在方程式中的系数比，再列比例式，最后写单位和答句。',
            tag: '氧化还原计算'
          }
        ],
        weakTags: ['电子转移方向', '氧化还原计算']
      },
      {
        grade: 'B',
        score: 79,
        dimensions: {
          accuracy: { score: 78, comment: '能记住常见概念，但氧化剂还原剂判断存在混淆。' },
          logic: { score: 80, comment: '计算时能想到电子守恒，但配平步骤不完整。' },
          normativity: { score: 79, comment: '方程式系数与双线桥标注需要进一步规范。' }
        },
        overall: '本次作业反映出对氧化还原反应的学习还停留在记忆层面，遇到配平和电子转移时缺少稳定的分析程序。第1题概念判断、第2题配平均出现基础性失误，但计算题能够尝试使用守恒关系。建议从“标化合价”开始重建步骤，并每天完成一道配平小练习。',
        questions: [
          {
            no: '1',
            question: '在反应 2Na + Cl₂ → 2NaCl 中，氧化剂是______，还原剂是______。',
            studentAnswer: '氧化剂是 Na，还原剂是 Cl₂。',
            verdict: '错误',
            errorType: '概念混淆',
            reason: '氧化剂本身被还原、所含元素化合价降低；Cl₂ 中氯元素化合价降低，因此 Cl₂ 是氧化剂。',
            correctApproach: '记住“升失氧、降得还”：化合价升高、失电子、被氧化的是还原剂。',
            tag: '氧化还原概念'
          },
          {
            no: '2',
            question: '配平：KMnO₄ + HCl → KCl + MnCl₂ + Cl₂↑ + H₂O',
            studentAnswer: 'KMnO₄ + 8HCl → KCl + MnCl₂ + 2Cl₂↑ + 4H₂O',
            verdict: '部分正确',
            errorType: '配平错误',
            reason: '化学式均正确，但 Mn 与 Cl 的电子转移数目不相等，方程式未配平。',
            correctApproach: 'Mn 得 5e⁻，每个 Cl 失 1e⁻，最小公倍数为 10，因此系数为 2、16、2、2、5、8。',
            tag: '氧化还原配平'
          },
          {
            no: '3',
            question: '用双线桥表示上述反应中的电子转移方向和数目。',
            studentAnswer: 'Cl 失去电子，Mn 得到电子。',
            verdict: '错误',
            errorType: '电子转移方向错误',
            reason: '只写出文字方向，没有用双线桥标明具体元素、电子数目和总数关系。',
            correctApproach: '分别从反应物中的 Mn、Cl 指向生成物中的对应元素，标出“得 10e⁻”与“失 10e⁻”。',
            tag: '电子转移方向'
          },
          {
            no: '4',
            question: '足量 KMnO₄ 与 0.1 mol HCl 充分反应，计算生成 Cl₂ 的物质的量。',
            studentAnswer: 'n(Cl₂)=0.1 mol',
            verdict: '错误',
            errorType: '计算步骤缺失',
            reason: '未使用方程式中的系数比，直接认为 HCl 全部转化为 Cl₂。',
            correctApproach: '16 mol HCl 对应 5 mol Cl₂，列比例 n(Cl₂)=0.1×5/16=0.03125 mol。',
            tag: '计算题步骤'
          }
        ],
        weakTags: ['氧化还原概念', '氧化还原配平', '电子转移方向', '计算题步骤']
      }
    ],
    batch_experiment: [
      {
        grade: 'B+',
        score: 86,
        dimensions: {
          accuracy: { score: 87, comment: '常见仪器和基本操作识别准确，实验安全意识较好。' },
          logic: { score: 86, comment: '能按实验目的分析装置顺序，但误差分析链条不完整。' },
          normativity: { score: 84, comment: '现象描述偶有遗漏，个别操作表述不够规范。' }
        },
        overall: '本次实验专题练习整体表现良好，能够识别常见仪器并说明基本用途。失分主要出现在实验现象描述和误差分析，部分答案把结论当成了现象。建议复习“颜色、状态、气味、温度”等观察维度，并用因果链训练误差判断。',
        questions: [
          {
            no: '1',
            question: '写出图中仪器 A 的名称，并说明其在过滤操作中的作用。',
            studentAnswer: '仪器 A 是玻璃棒，作用是引流，防止液体溅出。',
            verdict: '正确',
            errorType: '',
            reason: '仪器名称与作用均正确，表达简洁。',
            correctApproach: '过滤时玻璃棒下端轻靠三层滤纸处，起到引流作用，不能搅拌。',
            tag: '实验仪器'
          },
          {
            no: '2',
            question: '配制一定物质的量浓度的 NaCl 溶液时，定容操作应注意什么？',
            studentAnswer: '加水到刻度线，摇匀。',
            verdict: '部分正确',
            errorType: '操作表述不完整',
            reason: '缺少“胶头滴管滴加至凹液面最低处与刻度线相切”和“平视刻度线”等关键操作。',
            correctApproach: '当液面接近刻度线 1—2 cm 时改用胶头滴管，平视凹液面最低处与刻度线相切，最后摇匀。',
            tag: '实验操作规范'
          },
          {
            no: '3',
            question: '向 Na₂CO₃ 溶液中滴加稀盐酸，描述可观察到的实验现象。',
            studentAnswer: '有白色沉淀生成。',
            verdict: '错误',
            errorType: '现象与结论混淆',
            reason: 'Na₂CO₃ 与盐酸反应生成 CO₂ 气体，不应描述为白色沉淀；现象描述缺少气泡、气体使澄清石灰水变浑浊等要素。',
            correctApproach: '观察到有气泡产生，将气体通入澄清石灰水，石灰水变浑浊，说明生成 CO₂。',
            tag: '实验现象描述'
          },
          {
            no: '4',
            question: '某同学在量取液体时俯视刻度线，分析所配溶液浓度偏高还是偏低。',
            studentAnswer: '可能会偏高，因为看到的体积和实际体积不一样。',
            verdict: '存疑',
            errorType: '识别存疑',
            reason: '【识别存疑：手写“俯视”与“仰视”笔画接近，暂按“俯视”判读】推理方向正确，但未说明“实际体积偏小”这一中间环节。',
            correctApproach: '俯视刻度线时实际加入的溶剂体积偏小，溶液浓度偏高；答题时应写出“操作—实际体积—浓度”的因果链。',
            tag: '误差分析'
          }
        ],
        weakTags: ['实验现象描述', '实验操作规范', '误差分析']
      }
    ]
  };

  function getMockResult(batchId, variant) {
    var list = MOCK_RESULTS[batchId] || MOCK_RESULTS.batch_ionic;
    var index = Math.abs(Number(variant) || 0) % list.length;
    var result = JSON.parse(JSON.stringify(list[index]));
    result.isMock = true;
    result.engine = 'demo';
    result.gradedAt = nowISO();
    return result;
  }

  function makeSeedSubmission(id, studentId, batchId, variant, days, extra) {
    var student = getStudentById(studentId);
    var batch = getBatch(batchId);
    var result = getMockResult(batchId, variant);
    var gradedAt = daysAgo(days, 19, 15);
    result.gradedAt = gradedAt;
    return Object.assign({
      id: id,
      studentId: studentId,
      studentName: student ? student.name : '',
      className: student ? student.className : DEMO_CLASS,
      batchId: batchId,
      batchName: batch ? batch.name : '化学作业',
      unit: batch ? batch.unit : '',
      assignmentTitle: batch ? batch.name : '化学作业',
      submittedAt: daysAgo(days + 1, 20, 5),
      status: 'graded',
      selfReport: '',
      fileName: '学生作业照片.jpg',
      source: 'demo',
      result: result,
      gradedAt: gradedAt,
      gradedBy: 'DeepSeek 多模态（演示）'
    }, extra || {});
  }

  function seedDemoData(force) {
    var seeded = localStorage.getItem(KEYS.seeded);
    if (!force) {
      if (seeded === '1' || seeded === '0') return false;
      if (getUsers().length || getStudents().length || getSubmissions().length) {
        localStorage.setItem(KEYS.seeded, '1');
        return false;
      }
    }

    var teacher = {
      id: 'u_teacher_li',
      username: 'teacher',
      password: '123456',
      role: 'teacher',
      name: '李静',
      title: '化学教研组长',
      school: DEMO_SCHOOL,
      className: DEMO_CLASS,
      subject: '化学',
      createdAt: daysAgo(120, 9, 0)
    };
    var studentUsers = [
      {
        id: 'u_student_chen',
        username: 'student',
        password: '123456',
        role: 'student',
        name: '陈雨桐',
        school: DEMO_SCHOOL,
        className: DEMO_CLASS,
        createdAt: daysAgo(100, 9, 10)
      },
      {
        id: 'u_student_lin',
        username: 'student2',
        password: '123456',
        role: 'student',
        name: '林浩然',
        school: DEMO_SCHOOL,
        className: DEMO_CLASS,
        createdAt: daysAgo(100, 9, 20)
      },
      {
        id: 'u_student_zhou',
        username: 'student3',
        password: '123456',
        role: 'student',
        name: '周思远',
        school: DEMO_SCHOOL,
        className: DEMO_CLASS,
        createdAt: daysAgo(100, 9, 30)
      }
    ];
    var students = [
      {
        studentId: 'S260301',
        userId: 'u_student_chen',
        name: '陈雨桐',
        className: DEMO_CLASS,
        createdAt: daysAgo(100, 9, 10),
        weakTags: [],
        history: [],
        gradeTrend: []
      },
      {
        studentId: 'S260302',
        userId: 'u_student_lin',
        name: '林浩然',
        className: DEMO_CLASS,
        createdAt: daysAgo(100, 9, 20),
        weakTags: [],
        history: [],
        gradeTrend: []
      },
      {
        studentId: 'S260303',
        userId: 'u_student_zhou',
        name: '周思远',
        className: DEMO_CLASS,
        createdAt: daysAgo(100, 9, 30),
        weakTags: [],
        history: [],
        gradeTrend: []
      }
    ];

    saveUsers([teacher].concat(studentUsers));
    saveStudents(students);
    saveSubmissions([]);
    saveExcellent([]);
    saveReports([]);

    var submissions = [
      makeSeedSubmission('hw_demo_001', 'S260301', 'batch_ionic', 0, 8, {
        fileName: '陈雨桐_离子反应_作业照片.jpg',
        selfReport: '这次重点检查了离子方程式的拆分，计算题尝试写出完整步骤。'
      }),
      makeSeedSubmission('hw_demo_002', 'S260302', 'batch_ionic', 1, 8, {
        fileName: '林浩然_离子反应_作业照片.jpg',
        selfReport: '第3题不太确定“无色”条件怎么用。'
      }),
      makeSeedSubmission('hw_demo_003', 'S260301', 'batch_redox', 0, 4, {
        fileName: '陈雨桐_氧化还原_单元测评.jpg'
      }),
      makeSeedSubmission('hw_demo_004', 'S260302', 'batch_redox', 1, 4, {
        fileName: '林浩然_氧化还原_单元测评.jpg'
      }),
      {
        id: 'hw_demo_pending_001',
        studentId: 'S260301',
        studentName: '陈雨桐',
        className: DEMO_CLASS,
        batchId: 'batch_experiment',
        batchName: '化学实验基础 专题练习',
        unit: '实验基础与科学探究',
        assignmentTitle: '化学实验基础 专题练习',
        submittedAt: daysAgo(1, 21, 5),
        status: 'pending',
        selfReport: '误差分析第4题不太会写，想请老师看看我的思路。',
        fileName: '',
        source: 'student',
        result: null
      },
      {
        id: 'hw_demo_pending_002',
        studentId: 'S260303',
        studentName: '周思远',
        className: DEMO_CLASS,
        batchId: 'batch_redox',
        batchName: '氧化还原反应 单元测评',
        unit: '第四章 氧化还原反应',
        assignmentTitle: '氧化还原反应 单元测评',
        submittedAt: daysAgo(2, 20, 10),
        status: 'pending',
        selfReport: '配平还是有点慢，第3题双线桥画得不太确定。',
        fileName: '',
        source: 'student',
        result: null
      }
    ];
    saveSubmissions(submissions);

    function buildExcellent(id, submissionId, questionNo, comment, days) {
      var submission = submissions.filter(function (item) { return item.id === submissionId; })[0];
      var question = null;
      if (submission && submission.result) {
        question = submission.result.questions.filter(function (item) { return String(item.no) === String(questionNo); })[0];
      }
      if (!question) return null;
      return {
        id: id,
        submissionId: submissionId,
        studentId: submission.studentId,
        batchId: submission.batchId,
        questionNo: String(question.no),
        question: question.question,
        answer: question.studentAnswer,
        comment: comment,
        active: true,
        createdAt: daysAgo(days, 17, 40)
      };
    }

    var excellent = [
      buildExcellent('ex_demo_001', 'hw_demo_001', '1', '拆分依据清楚，“水溶液”这一条件抓得准，箭头与电荷标注规范，可作为酸式盐电离的示范。', 7),
      buildExcellent('ex_demo_002', 'hw_demo_002', '2', '配平后主动检查原子与电荷，步骤完整，值得全班借鉴。', 7),
      buildExcellent('ex_demo_003', 'hw_demo_003', '4', '设、列、算、答俱全，系数比与单位都写清楚了，是计算题的规范样板。', 3)
    ].filter(Boolean);
    saveExcellent(excellent);

    var report = {
      id: 'report_demo_001',
      className: DEMO_CLASS,
      createdAt: daysAgo(2, 16, 30),
      submissionIds: ['hw_demo_001', 'hw_demo_002', 'hw_demo_003', 'hw_demo_004'],
      sampleCount: 4,
      studentCount: 2,
      engine: 'AI 批改结果聚合',
      summary: '本次共分析 4 份已批改作业，覆盖 2 名学生。高频问题集中在离子方程式配平与电荷守恒、酸式盐拆分和电子转移方向，建议用“守恒双检”和“双线桥模板”开展一次 15 分钟微专题讲评。',
      topErrors: [
        {
          title: '离子方程式配平与电荷守恒',
          count: 3,
          percent: 75,
          description: '能写出主要反应物和生成物，但系数、原子个数或电荷总额未同时守恒，写完缺少复核动作。',
          examples: [
            { studentLabel: '学生 A', text: 'Ba²⁺ + OH⁻ + H⁺ + SO₄²⁻ → BaSO₄↓ + H₂O', verdict: '部分正确' },
            { studentLabel: '学生 B', text: '方程式两边 H、O 原子个数不相等，但未继续检查电荷。', verdict: '部分正确' }
          ]
        },
        {
          title: '酸式盐在水溶液中的拆分',
          count: 2,
          percent: 50,
          description: '把“水溶液中的完全电离”与“熔融状态”混为一谈，容易保留 HSO₄⁻。',
          examples: [
            { studentLabel: '学生 B', text: 'NaHSO₄ → Na⁺ + HSO₄⁻', verdict: '部分正确' }
          ]
        },
        {
          title: '离子共存题中的隐含条件',
          count: 2,
          percent: 50,
          description: '只关注离子之间是否反应，忽略“无色”“透明”“酸碱性”等题干限制。',
          examples: [
            { studentLabel: '学生 B', text: '选择 A 组，因为离子之间不反应，未注意 Cu²⁺ 呈蓝色。', verdict: '错误' }
          ]
        },
        {
          title: '电子转移方向与双线桥',
          count: 2,
          percent: 50,
          description: '能判断氧化剂和还原剂，但双线桥箭头、电子数目或“得到/失去”标注不完整。',
          examples: [
            { studentLabel: '学生 A', text: 'Mn：+7 → +2，得 5e⁻；Cl：-1 → 0，失 1e⁻。', verdict: '部分正确' }
          ]
        },
        {
          title: '计算题步骤与单位规范',
          count: 1,
          percent: 25,
          description: '计算思路基本正确，但缺少关系式、单位或答句，过程分容易丢失。',
          examples: [
            { studentLabel: '学生 B', text: '0.02 × 22.4 = 0.448', verdict: '部分正确' }
          ]
        }
      ],
      suggestions: [
        '用“拆—删—查”三步法重做离子方程式：先判断拆分，再删去旁观离子，最后同时检查原子守恒与电荷守恒。',
        '开设“双线桥 10 分钟微专题”：先标化合价变化，再写电子得失，最后核对电子总数，配合 2 道变式题即时检测。',
        '整理“离子共存四类隐含条件”清单，训练学生先圈画题干条件，再用逐项排除法作答。'
      ]
    };
    saveReports([report]);

    students.forEach(function (student) {
      refreshStudentProfile(student.studentId);
    });

    localStorage.setItem(KEYS.seeded, '1');
    return true;
  }

  function clearDemoData() {
    [KEYS.users, KEYS.session, KEYS.students, KEYS.submissions, KEYS.excellent, KEYS.reports].forEach(function (key) {
      localStorage.removeItem(key);
    });
    localStorage.setItem(KEYS.seeded, '0');
  }

  /* ---------------- 登录、注册与会话 ---------------- */
  function getSession() {
    var session = safeRead(KEYS.session, null);
    if (!session || !session.userId || !session.role) return null;
    return session;
  }

  function getCurrentUser() {
    var session = getSession();
    if (!session) return null;
    var users = getUsers();
    for (var i = 0; i < users.length; i += 1) {
      if (users[i].id === session.userId) return users[i];
    }
    localStorage.removeItem(KEYS.session);
    return null;
  }

  function login(username, password, role) {
    var account = String(username || '').trim();
    var pass = String(password || '');
    if (!account || !pass) {
      return { ok: false, message: '请输入账号和密码。' };
    }
    var users = getUsers();
    var user = null;
    for (var i = 0; i < users.length; i += 1) {
      if (String(users[i].username).toLowerCase() === account.toLowerCase()) {
        user = users[i];
        break;
      }
    }
    if (!user || user.password !== pass) {
      return { ok: false, message: '账号或密码不正确，请重新输入。' };
    }
    if (role && user.role !== role) {
      return { ok: false, message: '该账号是' + (user.role === 'teacher' ? '教师' : '学生') + '账号，请切换身份后再登录。' };
    }
    safeWrite(KEYS.session, {
      userId: user.id,
      role: user.role,
      name: user.name,
      loginAt: nowISO()
    });
    return { ok: true, user: user };
  }

  function nextStudentId() {
    var year = String(new Date().getFullYear()).slice(-2);
    var students = getStudents();
    var used = {};
    students.forEach(function (student) { used[student.studentId] = true; });
    var number = 301 + students.length;
    var candidate = 'S' + year + String(number).padStart(3, '0');
    while (used[candidate]) {
      number += 1;
      candidate = 'S' + year + String(number).padStart(3, '0');
    }
    return candidate;
  }

  function register(data) {
    var name = String(data.name || '').trim();
    var username = String(data.username || '').trim();
    var password = String(data.password || '');
    var role = data.role === 'teacher' ? 'teacher' : 'student';
    var className = String(data.className || '').trim() || DEMO_CLASS;
    if (name.length < 2) return { ok: false, message: '请输入至少 2 个字的姓名。' };
    if (!/^[A-Za-z0-9_\u4e00-\u9fa5]{3,20}$/.test(username)) {
      return { ok: false, message: '账号需为 3—20 位中文、字母、数字或下划线。' };
    }
    if (password.length < 6) return { ok: false, message: '密码至少需要 6 位。' };
    var users = getUsers();
    for (var i = 0; i < users.length; i += 1) {
      if (String(users[i].username).toLowerCase() === username.toLowerCase()) {
        return { ok: false, message: '该账号已被使用，请换一个。' };
      }
    }
    var user = {
      id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      username: username,
      password: password,
      role: role,
      name: name,
      title: role === 'teacher' ? '化学教师' : '',
      school: DEMO_SCHOOL,
      className: className,
      subject: '化学',
      createdAt: nowISO()
    };
    users.push(user);
    saveUsers(users);

    if (role === 'student') {
      var studentId = nextStudentId();
      var students = getStudents();
      students.push({
        studentId: studentId,
        userId: user.id,
        name: name,
        className: className,
        createdAt: nowISO(),
        weakTags: [],
        history: [],
        gradeTrend: []
      });
      saveStudents(students);
    }

    safeWrite(KEYS.session, {
      userId: user.id,
      role: user.role,
      name: user.name,
      loginAt: nowISO()
    });
    return { ok: true, user: user };
  }

  function logout() {
    localStorage.removeItem(KEYS.session);
    location.href = 'index.html?logout=1';
  }

  function dashboardFor(role) {
    return role === 'teacher' ? 'teacher-dashboard.html' : 'student-dashboard.html';
  }

  /* ---------------- 页面骨架 ---------------- */
  function renderHeader(activeModule) {
    var container = document.getElementById('site-header');
    if (!container) return;
    var user = getCurrentUser();
    if (!user) return;
    var file = global.__CHEMHUB_PAGE__ || location.pathname.split('/').pop() || 'index.html';
    var isTeacher = user.role === 'teacher';
    var roleLabel = isTeacher ? '教师端' : '学生端';
    var dashboard = isTeacher ? 'teacher-dashboard.html' : 'student-dashboard.html';
    var homeworkHome = isTeacher ? 'teacher-homework.html' : 'student-homework.html';
    var submissions = getSubmissions();
    var student = !isTeacher ? getStudentByUserId(user.id) : null;
    var pendingCount = submissions.filter(function (item) {
      if (item.status !== 'pending') return false;
      if (isTeacher) return item.className === user.className;
      return student && item.studentId === student.studentId;
    }).length;

    if (!activeModule) {
      if (file === 'teacher-homework.html' || file === 'student-homework.html') activeModule = 'homework';
      else if (file === 'teaching-design.html') activeModule = 'design';
      else if (file === 'classroom-teaching.html') activeModule = 'classroom';
      else if (file === 'after-school-service.html') activeModule = 'after';
    }

    var modules = [
      { key: 'design', label: '教学设计', icon: '✎', href: 'teaching-design.html' },
      { key: 'classroom', label: '课堂教学', icon: '▤', href: 'classroom-teaching.html' },
      { key: 'homework', label: '作业与评价', icon: '✓', href: homeworkHome },
      { key: 'after', label: '课后服务', icon: '☾', href: 'after-school-service.html' }
    ];
    var moduleHTML = modules.map(function (item) {
      var current = activeModule === item.key ? ' aria-current="page"' : '';
      return '<a class="module-link" href="' + item.href + '"' + current + '><span class="nav-icon">' + item.icon + '</span>' + item.label + '</a>';
    }).join('');

    var roleLinks = isTeacher ? [
      { key: 'dashboard', label: '工作台', icon: '⌂', href: 'teacher-dashboard.html' },
      { key: 'homework', label: '作业批改', icon: '✎', href: 'teacher-homework.html', count: pendingCount },
      { key: 'profile', label: '学生档案', icon: '◫', href: 'student-profile.html' },
      { key: 'issues', label: '共性分析', icon: '▦', href: 'common-issues.html' },
      { key: 'excellent', label: '优秀答案', icon: '★', href: 'excellent-answers.html' }
    ] : [
      { key: 'dashboard', label: '工作台', icon: '⌂', href: 'student-dashboard.html' },
      { key: 'homework', label: '我的作业', icon: '✓', href: 'student-homework.html', count: pendingCount },
      { key: 'profile', label: '我的档案', icon: '◫', href: 'student-profile.html' },
      { key: 'excellent', label: '优秀答案', icon: '★', href: 'excellent-answers.html' }
    ];
    var roleHTML = roleLinks.map(function (item) {
      var active = file === item.href ? ' aria-current="page"' : '';
      var count = item.count ? '<span class="nav-count">' + item.count + '</span>' : '';
      return '<a href="' + item.href + '"' + active + '><span class="mini-icon">' + item.icon + '</span>' + item.label + count + '</a>';
    }).join('');

    var initial = String(user.name || '化').slice(0, 1);
    container.innerHTML = [
      '<header class="site-header">',
      '  <div class="page-shell header-main">',
      '    <a class="brand" href="' + dashboard + '" aria-label="回到工作台">',
      '      <span class="brand-mark">化</span>',
      '      <span class="brand-text"><strong>知行化学</strong><small>高中化学智慧教学平台</small></span>',
      '    </a>',
      '    <nav class="module-nav" aria-label="教学模块">' + moduleHTML + '</nav>',
      '    <div class="header-tools">',
      '      <div class="user-chip"><span class="avatar ' + user.role + '">' + escapeHTML(initial) + '</span><span class="user-meta"><strong>' + escapeHTML(user.name) + '</strong><small>' + roleLabel + ' · ' + escapeHTML(user.className || DEMO_CLASS) + '</small></span></div>',
      '      <a class="header-link settings-link" href="settings.html">设置</a>',
      '      <a class="header-link danger" href="index.html" data-logout>退出</a>',
      '      <button class="nav-toggle" type="button" aria-label="打开导航" aria-expanded="false">☰</button>',
      '    </div>',
      '  </div>',
      '  <div class="role-bar"><div class="page-shell role-bar-inner">',
      '    <span class="role-capsule ' + user.role + '">' + roleLabel + '</span>',
      '    <nav class="role-nav" aria-label="' + roleLabel + '快捷导航">' + roleHTML + '</nav>',
      '    <span class="role-note">聚焦 <strong>作业与评价</strong> · AI 多模态批改</span>',
      '  </div></div>',
      '</header>'
    ].join('');

    var header = container.querySelector('.site-header');
    var toggle = container.querySelector('.nav-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = header.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.textContent = open ? '×' : '☰';
      });
    }
    var logoutLink = container.querySelector('[data-logout]');
    if (logoutLink) {
      logoutLink.addEventListener('click', function (event) {
        event.preventDefault();
        logout();
      });
    }
  }

  function renderFooter() {
    var container = document.getElementById('site-footer');
    if (!container || container.querySelector('.site-footer')) return;
    var year = new Date().getFullYear();
    // 页脚也要按角色指向对应作业页，避免学生点到教师批改页
    var footerUser = getCurrentUser();
    var footerHomework = footerUser && footerUser.role === 'student' ? 'student-homework.html' : 'teacher-homework.html';
    container.innerHTML = [
      '<footer class="site-footer">',
      '  <div class="page-shell footer-inner">',
      '    <div class="footer-brand"><span class="brand-mark">化</span><div><strong>知行化学 · 高中化学智慧教学平台</strong><small>教学设计 · 课堂教学 · 作业与评价 · 课后服务</small></div></div>',
      '    <div class="footer-links"><a href="teaching-design.html">教学设计</a><a href="classroom-teaching.html">课堂教学</a><a href="' + footerHomework + '">作业与评价</a><a href="after-school-service.html">课后服务</a><a href="settings.html">设置</a></div>',
      '  </div>',
      '  <div class="page-shell footer-copy">© ' + year + ' 知行化学教学演示项目 · 面向 AIGC 教学应用竞赛场景设计（非赛事官方平台）。所有学生信息与批改数据仅保存在当前浏览器，请勿录入真实师生隐私信息。AIGC 生成内容均由 AI 辅助生成，教师应进行人工复核。</div>',
      '</footer>'
    ].join('');
  }

  function setupPage(options) {
    options = options || {};
    seedDemoData();
    var session = getSession();
    if (!session) {
      location.replace('index.html?reason=auth');
      return null;
    }
    var user = getCurrentUser();
    if (!user) {
      location.replace('index.html?reason=auth');
      return null;
    }
    if (options.role && user.role !== options.role) {
      location.replace(dashboardFor(user.role));
      return null;
    }
    if (options.title) document.title = options.title;
    renderHeader(options.active || '');
    renderFooter();
    var nameNodes = document.querySelectorAll('[data-user-name]');
    for (var i = 0; i < nameNodes.length; i += 1) nameNodes[i].textContent = user.name;
    var classNodes = document.querySelectorAll('[data-user-class]');
    for (var j = 0; j < classNodes.length; j += 1) classNodes[j].textContent = user.className || DEMO_CLASS;
    var idNodes = document.querySelectorAll('[data-user-id]');
    for (var k = 0; k < idNodes.length; k += 1) {
      var student = getStudentByUserId(user.id);
      idNodes[k].textContent = student ? student.studentId : (user.role === 'teacher' ? '教师账号' : '—');
    }
    return user;
  }

  /* ---------------- 提示、确认弹窗 ---------------- */
  function toast(message, type) {
    var tone = type || 'info';
    var icons = { success: '✓', error: '!', warning: '!', info: 'i' };
    var old = document.querySelector('.toast');
    if (old) old.remove();
    var node = document.createElement('div');
    node.className = 'toast toast-' + tone;
    node.innerHTML = '<span class="toast-icon">' + (icons[tone] || 'i') + '</span><span>' + escapeHTML(message) + '</span>';
    document.body.appendChild(node);
    setTimeout(function () {
      if (node.parentNode) node.remove();
    }, 3800);
  }

  function confirmAction(options) {
    options = options || {};
    return new Promise(function (resolve) {
      var overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = [
        '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">',
        '  <div class="modal-header"><div><h2 id="confirmTitle">' + escapeHTML(options.title || '请确认') + '</h2><p>' + escapeHTML(options.subtitle || '此操作需要你的确认') + '</p></div><button class="modal-close" type="button" aria-label="关闭">×</button></div>',
        '  <div class="modal-body"><p class="muted" style="margin:0;font-size:12px;line-height:1.8;">' + escapeHTML(options.message || '') + '</p></div>',
        '  <div class="modal-footer"><button class="btn btn-ghost" type="button" data-cancel>取消</button><button class="btn ' + (options.danger ? 'btn-danger' : 'btn-primary') + '" type="button" data-confirm>' + escapeHTML(options.confirmText || '确认') + '</button></div>',
        '</div>'
      ].join('');
      document.body.appendChild(overlay);
      document.body.classList.add('modal-open');
      function close(value) {
        document.body.classList.remove('modal-open');
        overlay.remove();
        document.removeEventListener('keydown', onKey);
        resolve(value);
      }
      function onKey(event) {
        if (event.key === 'Escape') close(false);
      }
      overlay.querySelector('[data-cancel]').addEventListener('click', function () { close(false); });
      overlay.querySelector('.modal-close').addEventListener('click', function () { close(false); });
      overlay.querySelector('[data-confirm]').addEventListener('click', function () { close(true); });
      overlay.addEventListener('click', function (event) {
        if (event.target === overlay) close(false);
      });
      document.addEventListener('keydown', onKey);
      var confirmButton = overlay.querySelector('[data-confirm]');
      if (confirmButton) confirmButton.focus();
    });
  }

  /* ---------------- 图像读取 ---------------- */
  function readFileAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error('文件读取失败，请重新选择。')); };
      reader.readAsDataURL(file);
    });
  }

  function loadImage(dataUrl) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.onload = function () { resolve(image); };
      image.onerror = function () { reject(new Error('图片解码失败。')); };
      image.src = dataUrl;
    });
  }

  function compressImage(file, maxSize, quality) {
    var limit = maxSize || 1500;
    var q = quality || 0.86;
    return readFileAsDataURL(file).then(function (dataUrl) {
      return loadImage(dataUrl).then(function (image) {
        var width = image.naturalWidth || image.width;
        var height = image.naturalHeight || image.height;
        var ratio = Math.min(1, limit / Math.max(width, height));
        var canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * ratio));
        canvas.height = Math.max(1, Math.round(height * ratio));
        var context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        return {
          dataUrl: canvas.toDataURL('image/jpeg', q),
          width: canvas.width,
          height: canvas.height,
          originalWidth: width,
          originalHeight: height
        };
      });
    });
  }

  /* ---------------- DeepSeek 多模态接口 ---------------- */
  function resolveEndpoint(raw) {
    var value = String(raw || '').trim() || DEFAULT_SETTINGS.apiBase;
    value = value.replace(/\/+$/, '');
    if (/\/chat\/completions$/i.test(value)) return value;
    if (/\/v1$/i.test(value)) return value + '/chat/completions';
    return value + '/chat/completions';
  }

  function extractTextContent(content) {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content.map(function (part) {
        if (typeof part === 'string') return part;
        return part && (part.text || part.content || '');
      }).join('\n');
    }
    return '';
  }

  async function callDeepSeek(messages, options) {
    options = options || {};
    var settings = Object.assign({}, getSettings(), options.settingsOverride || {});
    if (!settings.apiKey) {
      var missing = new Error('尚未配置 DeepSeek API Key。');
      missing.code = 'NO_KEY';
      throw missing;
    }
    var endpoint = resolveEndpoint(settings.apiBase);
    var body = {
      model: settings.model || DEFAULT_SETTINGS.model,
      messages: messages,
      temperature: typeof options.temperature === 'number' ? options.temperature : 0.2,
      max_tokens: options.maxTokens || 4096,
      stream: false
    };
    if (options.jsonMode !== false) body.response_format = { type: 'json_object' };
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, options.timeout || 90000);
    var response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + settings.apiKey
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } catch (error) {
      if (error && error.name === 'AbortError') {
        var timeoutError = new Error('请求超时，已自动切换演示数据。');
        timeoutError.code = 'TIMEOUT';
        throw timeoutError;
      }
      var networkError = new Error('网络请求失败，请检查接口地址与网络连接。');
      networkError.code = 'NETWORK';
      throw networkError;
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      var detail = '';
      try {
        var errorData = await response.json();
        detail = (errorData && errorData.error && (errorData.error.message || errorData.error.code)) || '';
      } catch (ignore) {
        try { detail = await response.text(); } catch (ignore2) { detail = ''; }
      }
      var apiError = new Error('');
      if (response.status === 401) apiError.message = 'API Key 无效或已过期（401）。';
      else if (response.status === 402) apiError.message = '账户余额不足（402）。';
      else if (response.status === 404) apiError.message = '接口地址或模型名称不可用（404）。';
      else if (response.status === 429) apiError.message = '请求过于频繁（429），请稍后再试。';
      else apiError.message = '接口返回错误（' + response.status + '）' + (detail ? '：' + truncate(detail, 120) : '。');
      apiError.code = 'API_ERROR';
      apiError.status = response.status;
      throw apiError;
    }

    var data = await response.json();
    var choice = data && data.choices && data.choices[0];
    var content = choice && choice.message ? extractTextContent(choice.message.content) : '';
    if (!content) {
      // JSON Output 模式下，若模型输出无法被识别为 JSON，接口可能用空格替换整段内容；
      // 这里把 finish_reason 带回页面，便于区分“被截断”和“格式没被识别”。
      var emptyReason = choice && choice.finish_reason === 'length'
        ? '（输出达到长度上限，JSON 可能被截断）'
        : '（JSON 格式未被识别，或接口返回为空）';
      var emptyError = new Error('接口未返回有效内容' + emptyReason + '。');
      emptyError.code = 'EMPTY_RESPONSE';
      emptyError.finishReason = choice && choice.finish_reason;
      throw emptyError;
    }
    return { content: content, raw: data, model: body.model, finishReason: choice && choice.finish_reason };
  }

  function extractJsonObject(text) {
    var value = String(text || '').trim();
    var fence = String.fromCharCode(96, 96, 96);
    if (value.indexOf(fence) === 0) {
      value = value.slice(fence.length).replace(/^json/i, '').trim();
    }
    if (value.slice(-fence.length) === fence) value = value.slice(0, -fence.length).trim();
    var first = value.indexOf('{');
    var last = value.lastIndexOf('}');
    if (first >= 0 && last > first) value = value.slice(first, last + 1);
    try {
      return JSON.parse(value);
    } catch (error) {
      var parseError = new Error('AI 返回内容不是有效 JSON，已切换演示数据。');
      parseError.code = 'PARSE_ERROR';
      throw parseError;
    }
  }

  async function testApiConnection(override) {
    var settings = Object.assign({}, getSettings(), override || {});
    if (!settings.apiKey) {
      return { ok: false, message: '请先填写 API Key。' };
    }
    try {
      var response = await callDeepSeek([
        { role: 'system', content: '你是接口连通性测试助手，只回复“连接成功”。' },
        { role: 'user', content: '请回复：连接成功' }
      ], {
        settingsOverride: settings,
        jsonMode: false,
        maxTokens: 12,
        timeout: 30000
      });
      return { ok: true, message: '连接成功', reply: truncate(response.content, 80) };
    } catch (error) {
      return { ok: false, message: error.message || '连接失败。' };
    }
  }

  function asText(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value);
    if (Array.isArray(value)) return value.map(asText).filter(Boolean).join('；');
    if (typeof value === 'object') return String(value.comment || value.text || value.description || '').trim();
    return '';
  }

  function pickDimension(raw, keys, fallbackScore, fallbackComment) {
    var source = null;
    for (var i = 0; i < keys.length; i += 1) {
      if (raw && raw[keys[i]] !== undefined && raw[keys[i]] !== null) {
        source = raw[keys[i]];
        break;
      }
    }
    if (typeof source === 'string') {
      return { score: clamp(fallbackScore, 0, 100), comment: source };
    }
    if (source && typeof source === 'object') {
      return {
        score: clamp(Number(source.score || source.value || fallbackScore) || fallbackScore, 0, 100),
        comment: asText(source.comment || source.text || source.description) || fallbackComment
      };
    }
    return { score: clamp(fallbackScore, 0, 100), comment: fallbackComment };
  }

  function normalizeVerdict(value) {
    var text = asText(value);
    if (text.indexOf('部分') >= 0) return '部分正确';
    if (text.indexOf('存疑') >= 0 || text.indexOf('不确定') >= 0 || text.indexOf('模糊') >= 0) return '存疑';
    if (text.indexOf('错') >= 0 || text.indexOf('误') >= 0) return '错误';
    if (text.indexOf('正确') >= 0 || text.indexOf('对') === 0) return '正确';
    return '存疑';
  }

  function normalizeGradeResult(raw, meta) {
    if (!raw || typeof raw !== 'object') {
      var bad = new Error('AI 返回数据为空，已切换演示数据。');
      bad.code = 'BAD_RESULT';
      throw bad;
    }
    if (raw.result && typeof raw.result === 'object') raw = raw.result;
    var score = clamp(Math.round(Number(raw.score || raw.总分 || 0)) || 0, 0, 100);
    var grade = normalizeGrade(raw.grade || raw.等级);
    if (!grade) grade = gradeFromScore(score || 80);
    if (!score) score = scoreFromGrade(grade);
    if (score && !normalizeGrade(raw.grade || raw.等级)) grade = gradeFromScore(score);

    var dimensionsRaw = raw.dimensions || raw.维度 || raw.dimension || {};
    var accuracy = pickDimension(dimensionsRaw, ['accuracy', 'knowledge', '知识准确性', '准确性'], Math.max(60, score + 2), '知识准确性表现稳定，能抓住主要化学原理。');
    var logic = pickDimension(dimensionsRaw, ['logic', 'thinking', '思维完整性', '思维'], Math.max(60, score), '分析过程有条理，能够建立已知与所求之间的联系。');
    var normativity = pickDimension(dimensionsRaw, ['normativity', 'standard', '规范性', '表达规范性'], Math.max(60, score - 1), '化学用语和答题格式基本规范，细节仍可完善。');

    var questionSource = raw.questions || raw.逐题解析 || raw.items || raw.analysis;
    if (!Array.isArray(questionSource) || !questionSource.length) {
      var noQuestions = new Error('AI 未返回逐题解析，已切换演示数据。');
      noQuestions.code = 'NO_QUESTIONS';
      throw noQuestions;
    }
    var questions = questionSource.slice(0, 10).map(function (item, index) {
      var verdict = normalizeVerdict(item.verdict || item.judgement || item.判定);
      var errorType = asText(item.errorType || item.错误类型 || item.error_type);
      if (errorType.indexOf('配平') >= 0 && verdict === '错误') verdict = '部分正确';
      var tag = asText(item.tag || item.weakTag || item.knowledgePoint || item.知识点 || errorType);
      return {
        no: asText(item.no || item.index || (index + 1)) || String(index + 1),
        question: asText(item.question || item.题目 || item.questionText) || '【识别存疑：题目文字未能完整识别】',
        studentAnswer: asText(item.studentAnswer || item.answer || item.学生作答 || item.answerText) || '【识别存疑：学生作答未能完整识别】',
        verdict: verdict,
        errorType: errorType,
        reason: asText(item.reason || item.错因 || item.errorReason) || (verdict === '正确' ? '作答正确，无明显错误。' : '需要结合原题进一步核对。'),
        correctApproach: asText(item.correctApproach || item.correct || item.正确思路 || item.solution) || '先梳理题目条件，再按化学原理分步作答，最后检查守恒与规范。',
        tag: tag || '其他高频问题'
      };
    });

    var weakTags = Array.isArray(raw.weakTags) ? raw.weakTags.map(asText).filter(Boolean) : [];
    if (!weakTags.length) {
      weakTags = questions.filter(function (item) { return item.verdict !== '正确'; })
        .map(function (item) { return item.tag; }).filter(Boolean);
    }
    weakTags = unique(weakTags).slice(0, 6);

    var overall = asText(raw.overall || raw.整体评价 || raw.comment);
    if (!overall) {
      overall = '本次作业整体完成情况已记录。建议结合逐题解析，优先订正失分题目，并在课堂上重点听讲共性问题的分析思路。';
    }
    if (overall.length < 80) {
      overall += '建议完成订正后进行一次同类题复测，把“看懂解析”转化为独立作答能力。';
    }
    if (overall.length > 120) overall = overall.slice(0, 118) + '。';

    return {
      grade: grade,
      score: score,
      dimensions: { accuracy: accuracy, logic: logic, normativity: normativity },
      overall: overall,
      questions: questions,
      weakTags: weakTags,
      isMock: false,
      engine: 'deepseek',
      model: meta && meta.model ? meta.model : getSettings().model,
      gradedAt: nowISO()
    };
  }

  function buildGradingPrompt(meta) {
    var batch = getBatch(meta.batchId);
    var lines = [
      '你是一名具有二十年高中化学教学经验的特级教师，正在批改学生的化学作业。',
      '【批改对象】' + (batch ? batch.name : '高中化学作业') + '；班级：' + (meta.className || DEMO_CLASS) + '。',
      '【作业范围】' + (batch ? batch.task : '高中化学综合练习') + '。',
      meta.selfReport ? '【学生自述】' + meta.selfReport : '【学生自述】无。',
      '',
      '【必须遵守的化学学科批改规则】',
      '1. 方程式箭头必须区分：不可逆反应用“→”，可逆反应用“⇌”，计算关系式用“=”；不要把箭头和等号混用。',
      '2. 化学式正确但系数配平错误时，errorType 写“配平错误”，verdict 判“部分正确”，不能判为全错。',
      '3. 计算题按步骤给分：关系式、代入、结果、单位、答句分别检查；步骤缺失即使结果正确也要指出。',
      '4. 检查沉淀↓、气体↑、反应条件、电荷守恒、原子守恒和化学式书写规范。',
      '5. 手写内容识别不确定时，在对应文本中使用“【识别存疑：xxx】”标出，并把该题 verdict 判为“存疑”，不要臆造学生没有写的内容。',
      '6. 每条判定都要给出可执行、适合高中生理解的错因和正确思路，不使用空泛套话。',
      '7. 题目识别文本应尽量还原题干关键条件；若图片中无法看到某些题目，不要编造。',
      '',
      '【评分与输出】',
      '只输出一个合法 JSON 对象，不要使用 Markdown 代码块，不要输出 JSON 以外的文字。结构如下：',
      '{',
      '  "grade": "A+ / A / B+ / B / C+ / C 六级之一",',
      '  "score": 0到100的整数,',
      '  "dimensions": {',
      '    "accuracy": {"score": 0到100, "comment": "知识准确性评语，40字左右"},',
      '    "logic": {"score": 0到100, "comment": "思维完整性评语，40字左右"},',
      '    "normativity": {"score": 0到100, "comment": "规范性评语，40字左右"}',
      '  },',
      '  "overall": "整体评价，80到120个汉字",',
      '  "questions": [',
      '    {"no": "题号", "question": "识别出的题目", "studentAnswer": "学生作答", "verdict": "正确/部分正确/错误/存疑", "errorType": "错误类型，可为空", "reason": "错因", "correctApproach": "正确思路", "tag": "薄弱点标签"}',
      '  ],',
      '  "weakTags": ["自动归纳的薄弱点标签，2到5个"]',
      '}',
      '',
      '等级建议：A+ 95—100，A 90—94，B+ 85—89，B 80—84，C+ 70—79，C 60—69。',
      '逐题解析只针对图片中实际出现的题目，通常 3—6 题；每题都必须有 tag，便于写入学生档案。'
    ];
    return lines.join('\n');
  }

  async function tryAIGrade(meta) {
    var settings = getSettings();
    if (!settings.apiKey) {
      var noKey = new Error('尚未配置 API Key。');
      noKey.code = 'NO_KEY';
      throw noKey;
    }
    if (settings.forceDemo) {
      var force = new Error('设置页已开启“仅使用演示数据”。');
      force.code = 'FORCE_DEMO';
      throw force;
    }
    if (!meta.dataUrl) {
      var noImage = new Error('没有可发送的作业图片。');
      noImage.code = 'NO_IMAGE';
      throw noImage;
    }
    var prompt = buildGradingPrompt(meta);
    var messages = [
      { role: 'system', content: '你是严谨、温和、熟悉高中化学课程标准与评分量规的批改教师。你只输出 JSON。' },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          // detail: 'high' 保留原始清晰度，手写化学式和配平数字不容易被缩糊。
          { type: 'image_url', image_url: { url: meta.dataUrl, detail: 'high' } }
        ]
      }
    ];
    var lastError = null;
    // 第一次用 JSON Output；若接口把不合规的 JSON 替换成空格、或输出被截断，
    // 第二次关闭 JSON Output 重试，避免“明明有图却直接掉进演示数据”。
    for (var attempt = 0; attempt < 2; attempt += 1) {
      var attemptMessages = messages;
      if (attempt === 1) {
        attemptMessages = [
          messages[0],
          {
            role: 'user',
            content: messages[1].content.concat([
              { type: 'text', text: '注意：上一次输出无法解析为 JSON。请只输出一个以 { 开头、以 } 结尾的 JSON 对象，不要使用代码块，不要输出任何解释文字。' }
            ])
          }
        ];
      }
      try {
        var response = await callDeepSeek(attemptMessages, {
          maxTokens: 8192,
          jsonMode: attempt === 0,
          timeout: 120000
        });
        var parsed = extractJsonObject(response.content);
        var result = normalizeGradeResult(parsed, { model: response.model });
        result.model = response.model;
        return result;
      } catch (error) {
        lastError = error;
        var retryable = error && (
          error.code === 'EMPTY_RESPONSE' ||
          error.code === 'PARSE_ERROR' ||
          error.code === 'NO_QUESTIONS' ||
          error.code === 'BAD_RESULT' ||
          (error.code === 'API_ERROR' && error.status === 400)
        );
        if (!retryable || attempt === 1) throw error;
      }
    }
    throw lastError || new Error('AI 批改失败。');
  }

  /* ---------------- 作业与档案 ---------------- */
  function createSubmission(data) {
    var student = getStudentById(data.studentId);
    var batch = getBatch(data.batchId);
    if (!student) throw new Error('未找到该学生。');
    if (!batch) throw new Error('未找到该作业批次。');
    var submissions = getSubmissions();
    var submission = {
      id: 'hw_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      studentId: student.studentId,
      studentName: student.name,
      className: student.className,
      batchId: batch.id,
      batchName: batch.name,
      unit: batch.unit,
      assignmentTitle: batch.name,
      submittedAt: nowISO(),
      status: data.status === 'graded' ? 'graded' : 'pending',
      selfReport: String(data.selfReport || '').trim(),
      fileName: String(data.fileName || ''),
      imageThumb: data.imageThumb || '',
      source: data.source || 'manual',
      result: data.result || null
    };
    submissions.push(submission);
    saveSubmissions(submissions);
    return submission;
  }

  function gradeSubmission(submissionId, result, extra) {
    var submissions = getSubmissions();
    var index = -1;
    for (var i = 0; i < submissions.length; i += 1) {
      if (submissions[i].id === submissionId) {
        index = i;
        break;
      }
    }
    if (index < 0) throw new Error('未找到待批改作业。');
    var submission = submissions[index];
    submission.status = 'graded';
    submission.result = result;
    submission.gradedAt = result.gradedAt || nowISO();
    submission.gradedBy = result.isMock ? '演示批改数据' : ('DeepSeek 多模态 · ' + (result.model || getSettings().model));
    if (extra) {
      if (extra.fileName) submission.fileName = extra.fileName;
      if (extra.imageThumb) submission.imageThumb = extra.imageThumb;
    }
    submissions[index] = submission;
    saveSubmissions(submissions);
    refreshStudentProfile(submission.studentId);
    return submission;
  }

  function refreshStudentProfile(studentId) {
    var students = getStudents();
    var index = -1;
    for (var i = 0; i < students.length; i += 1) {
      if (students[i].studentId === studentId) {
        index = i;
        break;
      }
    }
    if (index < 0) return null;
    var graded = getSubmissions().filter(function (item) {
      return item.studentId === studentId && item.status === 'graded' && item.result;
    }).sort(function (a, b) {
      return new Date(a.gradedAt || a.submittedAt) - new Date(b.gradedAt || b.submittedAt);
    });
    var history = graded.map(function (item) {
      return {
        submissionId: item.id,
        batchId: item.batchId,
        batchName: item.batchName,
        title: item.batchName,
        date: item.gradedAt || item.submittedAt,
        grade: item.result.grade,
        score: item.result.score,
        weakTags: item.result.weakTags || [],
        isMock: Boolean(item.result.isMock)
      };
    });
    var counts = {};
    history.forEach(function (record) {
      (record.weakTags || []).forEach(function (tag) {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    var weakTags = Object.keys(counts).sort(function (a, b) {
      if (counts[b] !== counts[a]) return counts[b] - counts[a];
      return a.localeCompare(b, 'zh-CN');
    }).slice(0, 6);
    var student = students[index];
    student.history = history;
    student.gradeTrend = history.map(function (record) {
      return { date: record.date, score: record.score, grade: record.grade, batchName: record.batchName };
    });
    student.weakTags = weakTags;
    student.updatedAt = nowISO();
    students[index] = student;
    saveStudents(students);
    return student;
  }

  function getClassStudents(className) {
    return getStudents().filter(function (student) {
      return !className || student.className === className;
    });
  }

  function getStudentStats(studentId) {
    var student = getStudentById(studentId);
    if (!student) return { average: 0, graded: 0, pending: 0, highest: 0 };
    var submissions = getSubmissions().filter(function (item) { return item.studentId === studentId; });
    var graded = submissions.filter(function (item) { return item.status === 'graded' && item.result; });
    var scores = graded.map(function (item) { return Number(item.result.score) || 0; });
    return {
      average: scores.length ? Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length) : 0,
      graded: graded.length,
      pending: submissions.filter(function (item) { return item.status === 'pending'; }).length,
      highest: scores.length ? Math.max.apply(null, scores) : 0
    };
  }

  /* ---------------- 优秀答案 ---------------- */
  function findExcellent(submissionId, questionNo) {
    var items = getExcellent();
    for (var i = 0; i < items.length; i += 1) {
      if (items[i].submissionId === submissionId && String(items[i].questionNo) === String(questionNo)) return items[i];
    }
    return null;
  }

  function markExcellent(submissionId, questionNo, comment) {
    var submission = getSubmissionById(submissionId);
    if (!submission || !submission.result) throw new Error('未找到批改结果。');
    var question = submission.result.questions.filter(function (item) {
      return String(item.no) === String(questionNo);
    })[0];
    if (!question) throw new Error('未找到该题。');
    var items = getExcellent();
    var existing = null;
    for (var i = 0; i < items.length; i += 1) {
      if (items[i].submissionId === submissionId && String(items[i].questionNo) === String(questionNo)) {
        existing = items[i];
        break;
      }
    }
    if (existing) {
      existing.active = true;
      existing.comment = String(comment || existing.comment || '').trim() || '思路清晰、表达规范，可作为班级范例。';
      existing.updatedAt = nowISO();
    } else {
      existing = {
        id: 'ex_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        submissionId: submissionId,
        studentId: submission.studentId,
        batchId: submission.batchId,
        questionNo: String(question.no),
        question: question.question,
        answer: question.studentAnswer,
        comment: String(comment || '').trim() || '思路清晰、表达规范，可作为班级范例。',
        active: true,
        createdAt: nowISO()
      };
      items.push(existing);
    }
    saveExcellent(items);
    return existing;
  }

  function setExcellentActive(id, active) {
    var items = getExcellent();
    for (var i = 0; i < items.length; i += 1) {
      if (items[i].id === id) {
        items[i].active = Boolean(active);
        items[i].updatedAt = nowISO();
        break;
      }
    }
    saveExcellent(items);
  }

  function getActiveExcellent() {
    return getExcellent().filter(function (item) { return item.active; });
  }

  /* ---------------- 班级共性分析 ---------------- */
  function findTagGuide(tag) {
    var text = String(tag || '').trim();
    if (TAG_GUIDES[text]) return TAG_GUIDES[text];
    var keys = Object.keys(TAG_GUIDES);
    for (var i = 0; i < keys.length; i += 1) {
      if (text.indexOf(keys[i]) >= 0 || keys[i].indexOf(text) >= 0) return TAG_GUIDES[keys[i]];
    }
    return TAG_GUIDES['其他高频问题'];
  }

  function generateCommonReport(submissionIds) {
    var ids = Array.isArray(submissionIds) ? submissionIds : [];
    var all = getSubmissions();
    var selected = all.filter(function (item) {
      return ids.indexOf(item.id) >= 0 && item.status === 'graded' && item.result && item.result.questions;
    });
    if (selected.length < 2) throw new Error('请至少选择 2 份已批改作业。');
    var classNames = unique(selected.map(function (item) { return item.className; }));
    if (classNames.length > 1) throw new Error('请选择同一班级的作业进行共性分析。');
    var studentIds = unique(selected.map(function (item) { return item.studentId; }));
    var labels = {};
    studentIds.slice().sort().forEach(function (studentId, index) {
      labels[studentId] = '学生 ' + String.fromCharCode(65 + index);
    });

    var groups = {};
    selected.forEach(function (submission) {
      (submission.result.questions || []).forEach(function (question) {
        if (question.verdict === '正确') return;
        var tag = String(question.tag || question.errorType || '其他高频问题').trim() || '其他高频问题';
        if (!groups[tag]) groups[tag] = { tag: tag, students: {}, examples: [], reasons: [] };
        groups[tag].students[submission.studentId] = true;
        if (groups[tag].examples.length < 2 && question.studentAnswer) {
          groups[tag].examples.push({
            studentLabel: labels[submission.studentId],
            text: truncate(question.studentAnswer, 90),
            verdict: question.verdict
          });
        }
        if (groups[tag].reasons.length < 2 && question.reason) {
          groups[tag].reasons.push(truncate(question.reason, 70));
        }
      });
      (submission.result.weakTags || []).forEach(function (tag) {
        if (!groups[tag] && tag) groups[tag] = { tag: tag, students: {}, examples: [], reasons: [] };
        if (groups[tag]) groups[tag].students[submission.studentId] = true;
      });
    });

    var topErrors = Object.keys(groups).map(function (tag) {
      var group = groups[tag];
      var guide = findTagGuide(tag);
      var count = Object.keys(group.students).length;
      return {
        title: guide.title,
        count: count,
        percent: Math.round(count / studentIds.length * 100),
        description: group.reasons[0] || guide.desc,
        examples: group.examples.length ? group.examples : [{ studentLabel: '学生 A', text: '该题作答未能完整识别，建议结合原卷面批。', verdict: '存疑' }],
        tag: tag
      };
    }).sort(function (a, b) { return b.count - a.count; }).slice(0, 5);

    var suggestionSet = [];
    topErrors.forEach(function (item) {
      var guide = findTagGuide(item.tag);
      if (suggestionSet.indexOf(guide.suggestion) < 0) suggestionSet.push(guide.suggestion);
    });
    if (suggestionSet.length < 1) suggestionSet.push('先统计本次作业的典型错误，再安排 10—15 分钟针对性讲评，并布置 2 道同类变式题复测。');
    suggestionSet = suggestionSet.slice(0, 3);

    var summary = '';
    if (topErrors.length) {
      summary = '本次共分析 ' + selected.length + ' 份已批改作业，覆盖 ' + studentIds.length + ' 名学生。高频问题集中在“' +
        topErrors.slice(0, 2).map(function (item) { return item.title; }).join('”“') +
        '”，建议采用“错例展示—方法归纳—变式复测”的课堂讲评路径，并关注错误率较高的学生进行面批。';
    } else {
      summary = '本次共分析 ' + selected.length + ' 份已批改作业，未发现明显的集中错误。建议保持当前教学节奏，并通过变式题检验学生的迁移能力。';
    }

    var report = {
      id: 'report_' + Date.now().toString(36),
      className: classNames[0],
      createdAt: nowISO(),
      submissionIds: selected.map(function (item) { return item.id; }),
      sampleCount: selected.length,
      studentCount: studentIds.length,
      engine: 'AI 批改结果聚合',
      summary: summary,
      topErrors: topErrors,
      suggestions: suggestionSet
    };
    var reports = getReports();
    reports.unshift(report);
    saveReports(reports.slice(0, 20));
    return report;
  }

  /* ---------------- 趋势图 ---------------- */
  function buildTrendSVG(trend) {
    if (!Array.isArray(trend) || !trend.length) {
      return '<div class="empty-state"><div class="empty-icon">↗</div><h3>还没有等级趋势</h3><p>完成第一次批改后，这里会自动生成等级与分数变化曲线。</p></div>';
    }
    var width = 680;
    var height = 250;
    var left = 42;
    var right = 22;
    var top = 26;
    var bottom = 54;
    var plotW = width - left - right;
    var plotH = height - top - bottom;
    var scores = trend.map(function (item) { return Number(item.score) || 0; });
    var minScore = Math.max(0, Math.floor((Math.min.apply(null, scores) - 8) / 10) * 10);
    var maxScore = Math.min(100, Math.ceil((Math.max.apply(null, scores) + 6) / 10) * 10);
    if (maxScore - minScore < 20) { maxScore = Math.min(100, minScore + 20); }
    function yFor(score) { return top + plotH - ((score - minScore) / (maxScore - minScore)) * plotH; }
    function xFor(index) { return trend.length === 1 ? left + plotW / 2 : left + (index / (trend.length - 1)) * plotW; }
    var svg = '<svg class="trend-svg" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="学生等级趋势图">';
    svg += '<defs><linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3186bd" stop-opacity="0.22"/><stop offset="100%" stop-color="#3186bd" stop-opacity="0.01"/></linearGradient></defs>';
    var gridCount = 4;
    for (var g = 0; g <= gridCount; g += 1) {
      var gridScore = minScore + (maxScore - minScore) * (g / gridCount);
      var gridY = yFor(gridScore);
      svg += '<line x1="' + left + '" y1="' + gridY.toFixed(1) + '" x2="' + (width - right) + '" y2="' + gridY.toFixed(1) + '" stroke="#e8eff5" stroke-width="1"/>';
      svg += '<text x="' + (left - 8) + '" y="' + (gridY + 4).toFixed(1) + '" text-anchor="end" fill="#8a9aa8" font-size="10">' + Math.round(gridScore) + '</text>';
    }
    var points = trend.map(function (item, index) {
      return { x: xFor(index), y: yFor(Number(item.score) || 0), item: item };
    });
    var linePoints = points.map(function (point) { return point.x.toFixed(1) + ',' + point.y.toFixed(1); }).join(' ');
    var areaPoints = points.map(function (point) { return point.x.toFixed(1) + ',' + point.y.toFixed(1); }).join(' ');
    areaPoints += ' ' + points[points.length - 1].x.toFixed(1) + ',' + (height - bottom) + ' ' + points[0].x.toFixed(1) + ',' + (height - bottom);
    svg += '<polygon points="' + areaPoints + '" fill="url(#trendArea)"/>';
    if (points.length > 1) {
      svg += '<polyline points="' + linePoints + '" fill="none" stroke="#2473ac" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    points.forEach(function (point) {
      svg += '<circle cx="' + point.x.toFixed(1) + '" cy="' + point.y.toFixed(1) + '" r="4.5" fill="#fff" stroke="#2473ac" stroke-width="2.2"/>';
      svg += '<text x="' + point.x.toFixed(1) + '" y="' + (point.y - 13).toFixed(1) + '" text-anchor="middle" fill="#1c5f97" font-size="11" font-weight="700">' + escapeHTML(point.item.grade || '') + '</text>';
      svg += '<text x="' + point.x.toFixed(1) + '" y="' + (height - 20) + '" text-anchor="middle" fill="#8a9aa8" font-size="10">' + escapeHTML(formatDateShort(point.item.date)) + '</text>';
      svg += '<title>' + escapeHTML(formatDate(point.item.date) + ' · ' + (point.item.batchName || '') + ' · ' + point.item.grade + '（' + point.item.score + '分）') + '</title>';
    });
    svg += '</svg>';
    return svg;
  }

  /* ---------------- 对外暴露 ---------------- */
  var APP = {
    KEYS: KEYS,
    BATCHES: BATCHES,
    GRADES: GRADES,
    DEMO_CLASS: DEMO_CLASS,
    DEMO_SCHOOL: DEMO_SCHOOL,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    seedDemoData: seedDemoData,
    clearDemoData: clearDemoData,
    getUsers: getUsers,
    saveUsers: saveUsers,
    getStudents: getStudents,
    saveStudents: saveStudents,
    getClassStudents: getClassStudents,
    getStudentById: getStudentById,
    getStudentByUserId: getStudentByUserId,
    getStudentStats: getStudentStats,
    getSubmissions: getSubmissions,
    saveSubmissions: saveSubmissions,
    getSubmissionById: getSubmissionById,
    createSubmission: createSubmission,
    gradeSubmission: gradeSubmission,
    refreshStudentProfile: refreshStudentProfile,
    getExcellent: getExcellent,
    getActiveExcellent: getActiveExcellent,
    findExcellent: findExcellent,
    markExcellent: markExcellent,
    setExcellentActive: setExcellentActive,
    getReports: getReports,
    generateCommonReport: generateCommonReport,
    getSettings: getSettings,
    saveSettings: saveSettings,
    getSession: getSession,
    getCurrentUser: getCurrentUser,
    login: login,
    register: register,
    logout: logout,
    dashboardFor: dashboardFor,
    setupPage: setupPage,
    renderHeader: renderHeader,
    renderFooter: renderFooter,
    toast: toast,
    confirmAction: confirmAction,
    callDeepSeek: callDeepSeek,
    testApiConnection: testApiConnection,
    tryAIGrade: tryAIGrade,
    getMockResult: getMockResult,
    buildTrendSVG: buildTrendSVG,
    readFileAsDataURL: readFileAsDataURL,
    compressImage: compressImage,
    formatDate: formatDate,
    formatDateShort: formatDateShort,
    escapeHTML: escapeHTML,
    truncate: truncate,
    gradeClass: gradeClass,
    verdictClass: verdictClass,
    gradeFromScore: gradeFromScore,
    scoreFromGrade: scoreFromGrade,
    getBatch: getBatch,
    nowISO: nowISO,
    daysAgo: daysAgo
  };

  global.ChemHub = APP;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { seedDemoData(); });
  } else {
    seedDemoData();
  }
})(window);
