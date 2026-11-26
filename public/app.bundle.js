const {
  useState,
  useEffect
} = React;
const API_BASE = '';
const MODULE_OPTIONS = [{
  value: '',
  label: 'All Curriculum Modules (5,036 Qs — 1,931 Solving | 3,105 Element)'
}, {
  value: 'Module 1 - Power Plant Elements',
  label: 'Module 1: Power Plant Elements (1,610 Qs — 697 Solving | 913 Element)'
}, {
  value: 'Module 2 - Power Plant Design',
  label: 'Module 2: Power Plant Design (1,119 Qs — 569 Solving | 550 Element)'
}, {
  value: 'Module 3 - Industrial Plant Engineering',
  label: 'Module 3: Industrial Plant Engineering (677 Qs — 368 Solving | 309 Element)'
}, {
  value: 'Module 4 - Industrial Plant Design',
  label: 'Module 4: Industrial Plant Design (329 Qs — 24 Solving | 305 Element)'
}, {
  value: 'Module 5 - Refrigeration Engineering and Its Application',
  label: 'Module 5: Refrigeration Engineering (861 Qs — 136 Solving | 725 Element)'
}, {
  value: 'Module 6 - Air Conditioning',
  label: 'Module 6: Air Conditioning (294 Qs — 137 Solving | 157 Element)'
}, {
  value: 'Unclassified',
  label: 'Unclassified / General (146 Qs — 0 Solving | 146 Element)'
}];

// QUESTION TYPE CLASSIFICATION & AVAILABLE COUNT HELPERS
function isSolvingQuestion(q) {
  if (!q) return false;
  const t = String(q.Type || '').toLowerCase();
  return t === 'problems' || t === 'problem' || t === 'solving' || t.includes('solving') || t.includes('problem');
}
function getCanonicalTopic(q) {
  if (!q) return 'General';
  const mod = String(q.Module || '');
  const cmap = String(q.CurriculumMapID || '').toLowerCase();
  const top = String(q.Topic || '').toLowerCase();
  if (mod.includes('Module 1')) {
    if (cmap.includes('ppe-01-fuels') || top.includes('fuel') || top.includes('combustion')) return 'Fuels and Combustion';
    if (cmap.includes('ppe-02-variable') || top.includes('variable load')) return 'Variable Load Problems';
    if (cmap.includes('ppe-04') || top.includes('internal combustion') || top.includes('nternal combustion')) return 'Internal Combustion Engines';
    if (cmap.includes('ppe-05') || top.includes('heat transfer')) return 'Heat Transfer & Equipment';
    if (top.includes('fluid') || top.includes('nozzle') || top.includes('propeller') || top.includes('machinery') || top.includes('units') || top.includes('electrical') || top.includes('physics')) return 'Fluid Mechanics, Machinery & Units';
    return 'Engineering Thermodynamics';
  }
  if (mod.includes('Module 2')) {
    if (cmap.includes('ppe-09') || top.includes('steam power')) return 'Steam Power Plant';
    if (cmap.includes('ppe-06') || top.includes('diesel') || top.includes('internal combustion')) return 'Internal Combustion & Diesel Power Plant';
    if (cmap.includes('ppe-07') || top.includes('gas turbine')) return 'Gas Turbine Power Plant';
    if (cmap.includes('ppe-10') || top.includes('hydro')) return 'Hydro-Electric Power Plant';
    if (cmap.includes('ppe-11') || top.includes('geothermal')) return 'Geothermal Power Plant';
    if (cmap.includes('ppe-12') || top.includes('nuclear')) return 'Nuclear Power Plant';
    if (cmap.includes('ppe-13') || top.includes('non-conventional')) return 'Non-Conventional Sources of Energy';
    if (cmap.includes('ppe-08') || top.includes('combined cycle')) return 'Combined Cycle Power Plant';
    if (top.includes('chimney') || top.includes('smokestack') || top.includes('draft')) return 'Chimney, Smokestack & Draft System';
    if (top.includes('variable load')) return 'Variable Load Problems';
    if (cmap.includes('ppe-14') || cmap.includes('ppe-15') || top.includes('piping') || top.includes('instrumentation')) return 'Piping System, Instrumentation & Control';
    return 'Power Plant Design & General';
  }
  if (mod.includes('Module 3')) {
    if (top.includes('pump')) return 'Pumps';
    if (top.includes('compressor')) return 'Gas Compressors';
    if (top.includes('fan') || top.includes('blower')) return 'Fans and Blowers';
    if (cmap.includes('ppe-21') || top.includes('environmental') || top.includes('pollution')) return 'Environmental Engineering & Pollution Control';
    if (cmap.includes('ppe-17') || top.includes('safety')) return 'Industrial Safety & Accident Prevention';
    if (cmap.includes('ppe-20') || top.includes('lubrication') || top.includes('piping') || top.includes('process')) return 'Industrial Lubrication, Piping & Processes';
    return 'Fluid Machineries Principles & Operation';
  }
  if (mod.includes('Module 4')) {
    if (cmap.includes('ppe-24') || top.includes('pump')) return 'Pumps';
    if (cmap.includes('ppe-26') || top.includes('compressor')) return 'Gas Compressors';
    if (cmap.includes('ppe-31') || top.includes('foundation')) return 'Machinery Foundation';
    if (cmap.includes('ppe-27') || top.includes('chimney') || top.includes('draft')) return 'Chimney, Smokestack & Draft System';
    if (cmap.includes('ppe-30') || cmap.includes('ppe-15') || top.includes('instrumentation')) return 'Industrial Instrumentation & Control';
    if (cmap.includes('ppe-32') || top.includes('machinery performance') || top.includes('d.c')) return 'A.C. and D.C. Machinery Performance';
    if (cmap.includes('ppe-25') || top.includes('cooling tower')) return 'Cooling Towers & Water Cooling Equipment';
    if (cmap.includes('ppe-28') || top.includes('heat transfer')) return 'Heat Transfer Equipment';
    if (cmap.includes('ppe-22') || cmap.includes('ppe-23') || top.includes('dryer') || top.includes('fan')) return 'Dryers, Fans & Blowers';
    return 'Industrial Processes & Plant Design';
  }
  if (mod.includes('Module 5')) {
    if (cmap.includes('ppe-34') || top.includes('principles of')) return 'Principles of Different Refrigeration Systems';
    if (cmap.includes('ppe-36') || top.includes('ice plant') || top.includes('cold storage')) return 'Basic Design of Ice Plants & Cold Storage';
    if (cmap.includes('ppe-35') || top.includes('cooling load')) return 'Determination of Cooling Loads';
    if (top.includes('compressor') || top.includes('piping') || top.includes('instrumentation') || top.includes('safety')) return 'Refrigeration Compressors, Piping & Controls';
    return 'Design, Selection & Specification of Refrigeration Plants';
  }
  if (mod.includes('Module 6')) {
    if (cmap.includes('ppe-39') || cmap.includes('ppe-38') || top.includes('psychrometr')) return 'Psychrometric Properties of Air';
    if (cmap.includes('ppe-44') || top.includes('cooling load')) return 'Cooling Load Calculations & Determination';
    if (cmap.includes('ppe-42') || top.includes('air distribution') || top.includes('duct')) return 'Air Distribution & Duct Design';
    if (cmap.includes('ppe-43') || top.includes('drying') || top.includes('dryer') || top.includes('ventilation')) return 'Drying, Heating, Ventilation & Dryers';
    if (cmap.includes('ppe-40') || top.includes('various air')) return 'Various Air Conditioning Processes';
    if (cmap.includes('ppe-41') || top.includes('human comfort')) return 'Factors Affecting Human Comfort';
    if (top.includes('cooling tower')) return 'Cooling Towers & Water Cooling Equipment';
    return 'Selection & Specification of Air-Conditioning Plants';
  }
  if (top.includes('refrigeration') || top.includes('psychrometr')) return 'Refrigeration & Instrumentation Controls';
  if (top.includes('chemistry') || top.includes('physics') || top.includes('science') || top.includes('units')) return 'General Engineering, Physics & Chemistry';
  return 'Power Plant & Thermodynamics General';
}
function getTopicsForModule(moduleValue = '') {
  const all = typeof window !== 'undefined' && Array.isArray(window.INITIAL_QUESTIONS) ? window.INITIAL_QUESTIONS.filter(q => q && q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '') : [];
  const modLower = String(moduleValue || '').toLowerCase().trim();
  const filtered = modLower ? all.filter(q => {
    const qMod = String(q.Module || 'Unclassified').toLowerCase();
    return qMod.includes(modLower) || modLower.includes(qMod);
  }) : all;
  const map = new Map();
  filtered.forEach(q => {
    const tName = getCanonicalTopic(q);
    if (!map.has(tName)) {
      map.set(tName, {
        name: tName,
        total: 0,
        solving: 0,
        element: 0
      });
    }
    const entry = map.get(tName);
    entry.total++;
    if (isSolvingQuestion(q)) entry.solving++;else entry.element++;
  });
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}
function getAvailableQuestionCounts({
  moduleStr = '',
  batchStr = '',
  topicsStr = ''
} = {}) {
  const all = typeof window !== 'undefined' && Array.isArray(window.INITIAL_QUESTIONS) ? window.INITIAL_QUESTIONS.filter(q => q && q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '') : [];
  let filtered = all;
  if (moduleStr && String(moduleStr).trim() !== '') {
    const targetModules = String(moduleStr).split(',').map(m => m.toLowerCase().trim()).filter(Boolean);
    if (targetModules.length > 0) {
      filtered = filtered.filter(q => {
        const qMod = String(q.Module || 'Unclassified').toLowerCase();
        return targetModules.some(tm => qMod.includes(tm) || tm.includes(qMod));
      });
    }
  }
  if (batchStr && String(batchStr).trim() !== '') {
    filtered = filtered.filter(q => String(q.BatchNumber) === String(batchStr));
  }
  if (topicsStr && String(topicsStr).trim() !== '') {
    const targetTopics = String(topicsStr).split('||').map(t => t.toLowerCase().trim()).filter(Boolean);
    if (targetTopics.length > 0) {
      filtered = filtered.filter(q => {
        const canon = getCanonicalTopic(q).toLowerCase();
        const rawT = String(q.Topic || '').toLowerCase();
        const rawS = String(q.Subtopic || '').toLowerCase();
        return targetTopics.some(tt => canon === tt || canon.includes(tt) || rawT === tt || rawS === tt);
      });
    }
  }
  let solvingAvailable = 0;
  let elementAvailable = 0;
  filtered.forEach(q => {
    if (isSolvingQuestion(q)) {
      solvingAvailable++;
    } else {
      elementAvailable++;
    }
  });
  return {
    solvingAvailable,
    elementAvailable,
    totalAvailable: solvingAvailable + elementAvailable
  };
}

// ============================================================================
// ROTATING QUIZ SETS (A–Z) ENGINE + MICROSOFT WORD (.DOC) QUIZ GENERATOR
// ============================================================================
const QUIZ_WORD_EXPORT_CACHE = new Map();
const QUIZ_SET_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const QUIZ_SETS_STORAGE_KEY = 'me_quiz_sets_data';
function escapeHtmlForWord(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function getQuizStableId(quizConfig = {}) {
  if (quizConfig && quizConfig.id && String(quizConfig.id).trim() !== '') {
    return String(quizConfig.id).trim();
  }
  const slug = String(quizConfig && quizConfig.title || 'me_board_quiz').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'me_board_quiz';
  return 'draft_' + slug;
}

// Deterministic 12-bit Quiz Code (1..4095) encoded in the OMR Optical Barcode Strip
function getQuizOmrCode(quizId) {
  const str = String(quizId || 'custom');
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 4095 + 1;
}
function getStoredQuizSets() {
  try {
    const raw = localStorage.getItem(QUIZ_SETS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(s => s && s.quizId && s.setLetter) : [];
  } catch (e) {
    return [];
  }
}
function saveQuizSetRecord(setRecord) {
  if (!setRecord || !setRecord.id) return;
  try {
    const existing = getStoredQuizSets().filter(s => s.id !== setRecord.id);
    existing.unshift(setRecord);
    localStorage.setItem(QUIZ_SETS_STORAGE_KEY, JSON.stringify(existing));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('me_quiz_sets_updated', {
        detail: {
          sets: existing,
          latest: setRecord
        }
      }));
    }
  } catch (e) {}

  // Sync to Cloud Firestore (/quiz_sets) asynchronously so all admin devices share the exact Set A-Z keys
  try {
    if (typeof fetch !== 'undefined' && typeof API_BASE !== 'undefined') {
      fetch(`${API_BASE}/api/quiz-sets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(setRecord)
      }).catch(() => {});
    }
  } catch (e) {}
}
function getSetsForQuiz(quizId) {
  const id = String(quizId || '');
  return getStoredQuizSets().filter(s => s.quizId === id).sort((a, b) => (a.setIndex ?? 0) - (b.setIndex ?? 0));
}
function getLatestSetForQuiz(quizId) {
  const sets = getSetsForQuiz(quizId);
  if (sets.length === 0) return null;
  return [...sets].sort((a, b) => {
    const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    if (tB !== tA) return tB - tA;
    return (b.setIndex ?? 0) - (a.setIndex ?? 0);
  })[0];
}
function getNextSetLetterForQuiz(quizId) {
  const latest = getLatestSetForQuiz(quizId);
  if (!latest) return 'A';
  const curIdx = typeof latest.setIndex === 'number' ? latest.setIndex : Math.max(0, QUIZ_SET_LETTERS.indexOf(String(latest.setLetter || 'A').toUpperCase()));
  return QUIZ_SET_LETTERS[(curIdx + 1) % QUIZ_SET_LETTERS.length];
}
function shuffleArrayFisherYates(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}
function drawRandomizedQuestionsForQuiz(quizConfig = {}, previousIdsSignature = '') {
  const all = typeof window !== 'undefined' && Array.isArray(window.INITIAL_QUESTIONS) ? window.INITIAL_QUESTIONS.filter(q => q && q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '') : [];
  if (Array.isArray(quizConfig.questionsList) && quizConfig.questionsList.length > 0) {
    let drawn = shuffleArrayFisherYates(quizConfig.questionsList);
    for (let tries = 0; tries < 5 && drawn.length > 1 && drawn.map(q => q.ID).join(',') === previousIdsSignature; tries++) {
      drawn = shuffleArrayFisherYates(quizConfig.questionsList);
    }
    return drawn;
  }
  if (Array.isArray(quizConfig.specificQuestionIds) && quizConfig.specificQuestionIds.length > 0) {
    const idMap = new Map(all.map(q => [String(q.ID), q]));
    const picked = quizConfig.specificQuestionIds.map(id => idMap.get(String(id))).filter(Boolean);
    if (picked.length > 0) {
      let drawn = shuffleArrayFisherYates(picked);
      for (let tries = 0; tries < 5 && drawn.length > 1 && drawn.map(q => q.ID).join(',') === previousIdsSignature; tries++) {
        drawn = shuffleArrayFisherYates(picked);
      }
      return drawn;
    }
  }
  let filtered = all;
  const modStr = quizConfig.module || '';
  if (modStr && String(modStr).trim() !== '') {
    const targetModules = String(modStr).split(',').map(m => m.toLowerCase().trim()).filter(Boolean);
    if (targetModules.length > 0) {
      filtered = filtered.filter(q => {
        const qMod = String(q.Module || 'Unclassified').toLowerCase();
        return targetModules.some(tm => qMod.includes(tm) || tm.includes(qMod));
      });
    }
  }
  const topStr = quizConfig.topics || '';
  if (topStr && String(topStr).trim() !== '') {
    const targetTopics = String(topStr).split('||').map(t => t.toLowerCase().trim()).filter(Boolean);
    if (targetTopics.length > 0) {
      filtered = filtered.filter(q => {
        const canon = getCanonicalTopic(q).toLowerCase();
        const rawT = String(q.Topic || '').toLowerCase();
        const rawS = String(q.Subtopic || '').toLowerCase();
        return targetTopics.some(tt => canon === tt || canon.includes(tt) || rawT === tt || rawS === tt);
      });
    }
  }
  const hasTypeCounts = quizConfig.solvingCount !== undefined || quizConfig.elementCount !== undefined;
  const sCount = Math.max(0, parseInt(quizConfig.solvingCount, 10) || 0);
  const eCount = Math.max(0, parseInt(quizConfig.elementCount, 10) || 0);
  const pickOnce = () => {
    if (hasTypeCounts && sCount + eCount > 0) {
      const solvingPool = shuffleArrayFisherYates(filtered.filter(isSolvingQuestion));
      const elementPool = shuffleArrayFisherYates(filtered.filter(q => !isSolvingQuestion(q)));
      return shuffleArrayFisherYates([...solvingPool.slice(0, sCount), ...elementPool.slice(0, eCount)]);
    }
    const targetTotal = Math.max(1, parseInt(quizConfig.questionCount, 10) || 50);
    return shuffleArrayFisherYates(filtered).slice(0, targetTotal);
  };
  let selectedList = pickOnce();
  for (let tries = 0; tries < 5 && selectedList.length > 1 && selectedList.map(q => q.ID).join(',') === previousIdsSignature; tries++) {
    selectedList = pickOnce();
  }
  return selectedList;
}
function generateNewQuizSet(quizConfig = {}, {
  forcedSetLetter = null
} = {}) {
  const quizId = getQuizStableId(quizConfig);
  const latest = getLatestSetForQuiz(quizId);
  const prevSig = latest && Array.isArray(latest.questionIds) ? latest.questionIds.join(',') : '';
  const cleanForced = forcedSetLetter ? String(forcedSetLetter).trim().toUpperCase().charAt(0) : '';
  const setLetter = /^[A-Z]$/.test(cleanForced) ? cleanForced : getNextSetLetterForQuiz(quizId);
  const setIndex = QUIZ_SET_LETTERS.indexOf(setLetter);
  const questions = drawRandomizedQuestionsForQuiz(quizConfig, prevSig);
  if (!questions || questions.length === 0) return null;
  const answerKey = questions.map(q => {
    const ans = q && q.CorrectAnswer ? String(q.CorrectAnswer).trim().toUpperCase().charAt(0) : 'A';
    return ['A', 'B', 'C', 'D'].includes(ans) ? ans : 'A';
  }).join('');
  const prevMaxMs = latest ? new Date(latest.updatedAt || latest.createdAt || 0).getTime() : 0;
  const nowIso = new Date(Math.max(Date.now(), prevMaxMs + 1)).toISOString();
  const quizTitle = quizConfig.title && String(quizConfig.title).trim() ? String(quizConfig.title).trim() : 'ME Licensure Board Evaluation Quiz';
  const setDocId = `${quizId}__${setLetter}`;
  const setRecord = {
    id: setDocId,
    quizId,
    quizTitle,
    omrQuizCode: getQuizOmrCode(quizId),
    setLetter,
    setIndex,
    itemCount: questions.length,
    answerKey,
    questionIds: questions.map(q => String(q.ID)),
    passingScorePct: Math.max(1, Math.min(100, parseInt(quizConfig.passingScorePct, 10) || 70)),
    module: String(quizConfig.module || ''),
    createdAt: nowIso,
    updatedAt: nowIso
  };
  QUIZ_WORD_EXPORT_CACHE.set(setDocId, questions);
  saveQuizSetRecord(setRecord);
  return {
    setRecord,
    questions
  };
}
function resolveQuestionsForExistingSet(quizConfig = {}, setRecord = null) {
  if (!setRecord) return [];
  if (QUIZ_WORD_EXPORT_CACHE.has(setRecord.id)) {
    return QUIZ_WORD_EXPORT_CACHE.get(setRecord.id);
  }
  const all = typeof window !== 'undefined' && Array.isArray(window.INITIAL_QUESTIONS) ? window.INITIAL_QUESTIONS.filter(q => q && q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '') : [];
  if (Array.isArray(setRecord.questionIds) && setRecord.questionIds.length > 0) {
    const idMap = new Map(all.map(q => [String(q.ID), q]));
    const reconstructed = setRecord.questionIds.map(id => idMap.get(String(id))).filter(Boolean);
    if (reconstructed.length > 0) {
      QUIZ_WORD_EXPORT_CACHE.set(setRecord.id, reconstructed);
      return reconstructed;
    }
  }
  return drawRandomizedQuestionsForQuiz(quizConfig);
}
function resolveQuestionsForQuizExport(quizConfig = {}) {
  const quizId = getQuizStableId(quizConfig);
  const latest = getLatestSetForQuiz(quizId);
  if (latest && !quizConfig.forceReshuffle) {
    const qs = resolveQuestionsForExistingSet(quizConfig, latest);
    if (qs && qs.length > 0) return qs;
  }
  return drawRandomizedQuestionsForQuiz(quizConfig);
}
function ensureLatestSetForQuiz(quizConfig = {}) {
  const quizId = getQuizStableId(quizConfig);
  const latest = getLatestSetForQuiz(quizId);
  if (latest) return latest;
  const created = generateNewQuizSet(quizConfig, {
    forcedSetLetter: 'A'
  });
  return created ? created.setRecord : null;
}
function exportQuizToWordFile(quizConfig = {}, {
  answerKeyOnly = false,
  setLetter = null
} = {}) {
  if (typeof window !== 'undefined' && window.__CURRENT_USER_ROLE !== 'admin') {
    window.showToast?.('Access restricted: Only administrators can download quiz Word files.', 'error');
    return null;
  }
  const quizId = getQuizStableId(quizConfig);
  let activeSet = null;
  let quizQuestions = [];
  if (!answerKeyOnly) {
    // QUESTIONS WORD FILE: Every download generates the next rotating set A -> B -> ... -> Z -> A
    // (unless an explicit existing setLetter was requested from the Scanner/Set Manager)
    if (setLetter && /^[A-Z]$/i.test(String(setLetter))) {
      const upperLtr = String(setLetter).toUpperCase();
      const found = getSetsForQuiz(quizId).find(s => s.setLetter === upperLtr);
      if (found) {
        activeSet = found;
        quizQuestions = resolveQuestionsForExistingSet(quizConfig, found);
      } else {
        const gen = generateNewQuizSet(quizConfig, {
          forcedSetLetter: upperLtr
        });
        if (gen) {
          activeSet = gen.setRecord;
          quizQuestions = gen.questions;
        }
      }
    } else {
      const gen = generateNewQuizSet(quizConfig);
      if (gen) {
        activeSet = gen.setRecord;
        quizQuestions = gen.questions;
      }
    }
  } else {
    // ANSWER KEY WORD FILE: Matches the exact specified Set or the latest generated Set for this quiz
    const existingSets = getSetsForQuiz(quizId);
    if (setLetter && /^[A-Z]$/i.test(String(setLetter))) {
      activeSet = existingSets.find(s => s.setLetter === String(setLetter).toUpperCase()) || null;
    }
    if (!activeSet) {
      activeSet = getLatestSetForQuiz(quizId);
    }
    if (activeSet) {
      quizQuestions = resolveQuestionsForExistingSet(quizConfig, activeSet);
    } else {
      const gen = generateNewQuizSet(quizConfig, {
        forcedSetLetter: 'A'
      });
      if (gen) {
        activeSet = gen.setRecord;
        quizQuestions = gen.questions;
      }
    }
  }
  if (!quizQuestions || quizQuestions.length === 0 || !activeSet) {
    window.showToast?.('No questions available to export for this quiz configuration.', 'warning');
    return null;
  }
  const activeLetter = activeSet.setLetter || 'A';
  const nextLetter = QUIZ_SET_LETTERS[(QUIZ_SET_LETTERS.indexOf(activeLetter) + 1) % QUIZ_SET_LETTERS.length];
  const omrQuizCode = activeSet.omrQuizCode || getQuizOmrCode(quizId);
  const quizTitle = quizConfig.title && String(quizConfig.title).trim() ? String(quizConfig.title).trim() : activeSet.quizTitle || 'ME Licensure Board Evaluation Quiz';
  const quizDesc = quizConfig.description && String(quizConfig.description).trim() ? String(quizConfig.description).trim() : 'Read each item carefully and select the letter corresponding to the best answer.';
  const moduleLabel = quizConfig.module && String(quizConfig.module).trim() ? String(quizConfig.module).trim() : 'All Curriculum Modules (Comprehensive)';
  const durationMins = parseInt(quizConfig.durationMins, 10) || 50;
  const passingScorePct = parseInt(quizConfig.passingScorePct, 10) || activeSet.passingScorePct || 70;
  let actualSolving = 0;
  let actualElement = 0;
  quizQuestions.forEach(q => {
    if (isSolvingQuestion(q)) actualSolving++;else actualElement++;
  });
  let bodyInnerHtml = '';
  if (!answerKeyOnly) {
    // SEPARATE FILE 1: QUESTION WORD FILE ONLY (Questionnaire & Choices A-D, NO Answers)
    const questionsHtml = quizQuestions.map((q, idx) => {
      const num = idx + 1;
      const typeTag = isSolvingQuestion(q) ? 'Solving Question' : 'Element Question';
      return `
        <div style="margin-bottom: 14pt; page-break-inside: avoid;">
          <p style="margin: 0 0 5pt 0; font-size: 11pt; line-height: 1.35;">
            <b>${num}.</b> ${escapeHtmlForWord(q.QuestionText)}
            <span style="font-size: 8.5pt; color: #475569;"> [${typeTag}]</span>
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-left: 14pt; font-size: 10.5pt;">
            <tr>
              <td style="width: 50%; padding: 2pt 8pt 2pt 0; vertical-align: top;"><b>A.</b> ${escapeHtmlForWord(q.OptionA)}</td>
              <td style="width: 50%; padding: 2pt 0 2pt 8pt; vertical-align: top;"><b>B.</b> ${escapeHtmlForWord(q.OptionB)}</td>
            </tr>
            <tr>
              <td style="width: 50%; padding: 2pt 8pt 2pt 0; vertical-align: top;"><b>C.</b> ${escapeHtmlForWord(q.OptionC)}</td>
              <td style="width: 50%; padding: 2pt 0 2pt 8pt; vertical-align: top;"><b>D.</b> ${escapeHtmlForWord(q.OptionD)}</td>
            </tr>
          </table>
        </div>
      `;
    }).join('');
    bodyInnerHtml = `
      <table style="width: 100%; border-collapse: collapse; border-bottom: 2px solid #0f172a; margin-bottom: 10pt;">
        <tr>
          <td style="text-align: center; padding-bottom: 8pt;">
            <p style="margin: 0; font-size: 9.5pt; letter-spacing: 0.5pt;">REPUBLIC OF THE PHILIPPINES</p>
            <p style="margin: 1pt 0; font-size: 12pt; font-weight: bold;">NUEVA ECIJA UNIVERSITY OF SCIENCE AND TECHNOLOGY</p>
            <p style="margin: 1pt 0 6pt 0; font-size: 10pt;">College of Engineering — Mechanical Engineering Department</p>
            <h1 style="margin: 4pt 0 0 0; font-size: 13.5pt; text-transform: uppercase;">${escapeHtmlForWord(quizTitle)} — QUESTIONNAIRE</h1>
          </td>
          <td style="width: 95pt; text-align: center; vertical-align: middle; padding-bottom: 8pt;">
            <div style="border: 2.5px solid #0f172a; padding: 6pt 4pt; background: #f1f5f9;">
              <div style="font-size: 8pt; font-weight: bold; letter-spacing: 0.5pt; color: #334155;">EXAM SET</div>
              <div style="font-size: 20pt; font-weight: bold; line-height: 1.1; color: #0f172a;">SET ${activeLetter}</div>
              <div style="font-size: 7.5pt; color: #475569; margin-top: 2pt;">CODE #${omrQuizCode}</div>
            </div>
          </td>
        </tr>
      </table>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10pt; font-size: 10pt;">
        <tr>
          <td style="padding: 3pt 4pt; width: 55%;"><b>Student Name:</b> _____________________________________</td>
          <td style="padding: 3pt 4pt; width: 45%;"><b>Student No.:</b> _______________________</td>
        </tr>
        <tr>
          <td style="padding: 3pt 4pt;"><b>Year &amp; Section:</b> ____________________________________</td>
          <td style="padding: 3pt 4pt;"><b>Exam Set:</b> <b>SET ${activeLetter}</b> &nbsp;|&nbsp; <b>Date:</b> ______________</td>
        </tr>
        <tr>
          <td style="padding: 3pt 4pt;"><b>Module Coverage:</b> ${escapeHtmlForWord(moduleLabel)}</td>
          <td style="padding: 3pt 4pt;"><b>Time Limit:</b> ${durationMins} Minutes (${actualSolving} Solving | ${actualElement} Element)</td>
        </tr>
      </table>

      <div style="border: 1px solid #94a3b8; background: #f8fafc; padding: 6pt 8pt; margin-bottom: 14pt; font-size: 9.5pt;">
        <b>DIRECTIONS (SET ${activeLetter}):</b> ${escapeHtmlForWord(quizDesc)} Make sure your OMR Answer Sheet is also labeled <b>SET ${activeLetter}</b> and shade your 10-digit Student Number completely.
      </div>

      ${questionsHtml}
    `;
  } else {
    // SEPARATE FILE 2: ANSWER KEY WORD FILE ONLY (Quick Key Grid + Correct Answers & Complete Solutions)
    const quickKeyCells = quizQuestions.map((q, idx) => {
      const ans = escapeHtmlForWord(q.CorrectAnswer || 'A');
      return `<td style="border: 1px solid #cbd5e1; padding: 4pt 6pt; text-align: center; font-size: 9.5pt;"><b>${idx + 1}.</b> ${ans}</td>`;
    });
    const quickKeyRows = [];
    for (let i = 0; i < quickKeyCells.length; i += 5) {
      quickKeyRows.push(`<tr>${quickKeyCells.slice(i, i + 5).join('')}</tr>`);
    }
    const detailedSolutions = quizQuestions.map((q, idx) => {
      const num = idx + 1;
      const ansLetter = q.CorrectAnswer || 'A';
      const ansText = q['Option' + ansLetter] || '';
      const typeTag = isSolvingQuestion(q) ? 'Solving Question' : 'Element Question';
      const rawSol = (q.CompleteSolution || q.Explanation || 'Verified board key.').replace(/\n/g, '<br/>');
      return `
        <div style="margin-bottom: 12pt; padding-bottom: 8pt; border-bottom: 1px dashed #cbd5e1; page-break-inside: avoid;">
          <p style="margin: 0 0 3pt 0; font-size: 10.5pt;">
            <b>${num}. [Bank ID #${escapeHtmlForWord(q.ID)} — ${typeTag}]</b> ${escapeHtmlForWord(q.QuestionText)}
          </p>
          <p style="margin: 0 0 4pt 10pt; font-size: 10pt; color: #047857; font-weight: bold;">
            ✓ Correct Answer: ${escapeHtmlForWord(ansLetter)}. ${escapeHtmlForWord(ansText)}
          </p>
          <div style="font-size: 9.5pt; color: #1e293b; line-height: 1.4; margin-left: 10pt;">
            ${rawSol}
          </div>
          ${q.References ? `<p style="margin: 3pt 0 0 10pt; font-size: 8.5pt; color: #475569;"><i>Reference: ${escapeHtmlForWord(q.References)}</i></p>` : ''}
        </div>
      `;
    }).join('');
    bodyInnerHtml = `
      <table style="width: 100%; border-collapse: collapse; border-bottom: 2px solid #0f172a; margin-bottom: 12pt;">
        <tr>
          <td style="text-align: center; padding-bottom: 8pt;">
            <p style="margin: 0; font-size: 9.5pt; letter-spacing: 0.5pt;">REPUBLIC OF THE PHILIPPINES</p>
            <p style="margin: 1pt 0; font-size: 12pt; font-weight: bold;">NUEVA ECIJA UNIVERSITY OF SCIENCE AND TECHNOLOGY</p>
            <p style="margin: 1pt 0 6pt 0; font-size: 10pt;">College of Engineering — Mechanical Engineering Department</p>
            <h1 style="margin: 4pt 0 0 0; font-size: 13.5pt; text-transform: uppercase;">${escapeHtmlForWord(quizTitle)} — OFFICIAL ANSWER KEY (SET ${activeLetter})</h1>
            <p style="margin: 3pt 0 0 0; font-size: 9.5pt; color: #334155;">
              Total Items: ${quizQuestions.length} (${actualSolving} Solving | ${actualElement} Element) | Quiz Code: #${omrQuizCode} | Module: ${escapeHtmlForWord(moduleLabel)}
            </p>
          </td>
          <td style="width: 95pt; text-align: center; vertical-align: middle; padding-bottom: 8pt;">
            <div style="border: 2.5px solid #047857; padding: 6pt 4pt; background: #ecfdf5;">
              <div style="font-size: 8pt; font-weight: bold; color: #047857;">ANSWER KEY</div>
              <div style="font-size: 20pt; font-weight: bold; line-height: 1.1; color: #065f46;">SET ${activeLetter}</div>
              <div style="font-size: 7.5pt; color: #047857; margin-top: 2pt;">CODE #${omrQuizCode}</div>
            </div>
          </td>
        </tr>
      </table>

      <h3 style="font-size: 11pt; margin: 0 0 6pt 0;">I. Quick Answer Key Summary Grid (SET ${activeLetter})</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16pt;">
        ${quickKeyRows.join('')}
      </table>

      <h3 style="font-size: 11pt; margin: 0 0 8pt 0;">II. Item-by-Item Answer Key &amp; Complete Step-by-Step Solutions (SET ${activeLetter})</h3>
      ${detailedSolutions}
    `;
  }
  const wordDocHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtmlForWord(quizTitle)} - SET ${activeLetter} - ${answerKeyOnly ? 'Answer Key' : 'Questions'}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page WordSection1 {
      size: 8.5in 11.0in;
      margin: 0.85in 0.85in 0.85in 0.85in;
    }
    div.WordSection1 {
      page: WordSection1;
    }
    body {
      font-family: 'Calibri', 'Times New Roman', Arial, sans-serif;
      color: #0f172a;
      font-size: 11pt;
    }
  </style>
</head>
<body>
  <div class="WordSection1">
    ${bodyInnerHtml}
  </div>
</body>
</html>`;
  const blob = new Blob(['\ufeff', wordDocHtml], {
    type: 'application/msword;charset=utf-8'
  });
  const safeBaseName = quizTitle.replace(/[^a-z0-9\-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'ME_Board_Quiz';
  const suffix = answerKeyOnly ? `_SET_${activeLetter}_Answer_Key` : `_SET_${activeLetter}_Questions`;
  const fileName = `${safeBaseName}${suffix}.doc`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  window.showToast?.(answerKeyOnly ? `Downloaded SET ${activeLetter} Answer Key: "${fileName}" (${quizQuestions.length} Items)!` : `Downloaded SET ${activeLetter} Questions: "${fileName}" (${quizQuestions.length} Items). Matching SET ${activeLetter} Answer Key &amp; OMR Sheet synced! (Next download: SET ${nextLetter})`, 'success');
  return activeSet;
}

// ============================================================================
// ADMIN-ONLY OMR ANSWER SHEET GENERATOR & CAMERA/PHOTO SCANNER ENGINE
// (OPTICAL QUIZ+SET BARCODE + 10-DIGIT STUDENT NUMBER SHADING + ANSWER BUBBLES)
// ============================================================================
function encodeOmrQuizSetBarcode(omrQuizCode = 0, setLetter = '') {
  const code12 = Math.max(0, Math.min(4095, parseInt(omrQuizCode, 10) || 0));
  const cleanLtr = String(setLetter || '').trim().toUpperCase().charAt(0);
  const setNum = /^[A-Z]$/.test(cleanLtr) ? cleanLtr.charCodeAt(0) - 64 : 0; // 1=A .. 26=Z, 0=none
  const checksum6 = (code12 * 31 + setNum * 17 ^ code12 >> 5 ^ 0x2A) & 0x3F;
  const bits = [1, 0]; // Start calibration: BLACK, WHITE
  for (let i = 11; i >= 0; i--) bits.push(code12 >> i & 1);
  for (let i = 4; i >= 0; i--) bits.push(setNum >> i & 1);
  for (let i = 5; i >= 0; i--) bits.push(checksum6 >> i & 1);
  bits.push(0, 1); // Stop calibration: WHITE, BLACK
  return bits; // 27 bits total
}
function getOmrSheetLayout(itemCount = 50) {
  const N = Math.max(1, Math.min(100, parseInt(itemCount, 10) || 50));

  // --- OPTICAL QUIZ+SET BARCODE STRIP (27 crisp blocks between TL & TR fiducials) ---
  const bcCount = 27;
  const bcStartU = 0.125;
  const bcEndU = 0.875;
  const bcStepU = (bcEndU - bcStartU) / bcCount;
  const bcCenterV = 0.011;
  const bcBlockW = bcStepU * 0.72;
  const bcBlockH = 0.017;
  const barcodeBits = [];
  for (let i = 0; i < bcCount; i++) {
    barcodeBits.push({
      index: i,
      u: bcStartU + (i + 0.5) * bcStepU,
      v: bcCenterV,
      wu: bcBlockW,
      hv: bcBlockH
    });
  }

  // --- ZONE 1 (TOP): 10-DIGIT STUDENT NUMBER SHADING GRID (Columns 0..9, Rows 0..9) ---
  const idDigitsCount = 10;
  const idStartU = 0.068;
  const idEndU = 0.588;
  const idStepU = (idEndU - idStartU) / idDigitsCount;
  const idBoxTopV = 0.064;
  const idBoxBottomV = 0.094;
  const idGridTopV = 0.110;
  const idGridBottomV = 0.308;
  const idRowStepV = (idGridBottomV - idGridTopV) / 10;
  const idRadiusU = 0.0135;
  const idRadiusV = 0.0084;
  const studentIdCols = [];
  for (let c = 0; c < idDigitsCount; c++) {
    // Slight gap after 4th digit for YYYY-NNNNNN visual dash separator
    const dashOffset = c >= 4 ? 0.012 : 0;
    const u = idStartU + (c + 0.5) * idStepU + dashOffset;
    const digits = [];
    for (let d = 0; d < 10; d++) {
      digits.push({
        digit: String(d),
        u,
        v: idGridTopV + (d + 0.5) * idRowStepV,
        ru: idRadiusU,
        rv: idRadiusV
      });
    }
    studentIdCols.push({
      colIndex: c,
      u,
      boxU: u,
      boxTopV: idBoxTopV,
      boxBottomV: idBoxBottomV,
      digits
    });
  }

  // --- ZONE 2 (BOTTOM): EXAMINATION ANSWER BUBBLE GRID (Items 1..N, Options A..D) ---
  const cols = N <= 50 ? 2 : 4;
  const rowsPerCol = Math.ceil(N / cols);
  const padTop = 0.372;
  const padBottom = 0.034;
  const padLeft = 0.055;
  const padRight = 0.045;
  const usableW = 1 - padLeft - padRight;
  const usableH = 1 - padTop - padBottom;
  const colW = usableW / cols;
  const rowH = usableH / rowsPerCol;
  const opts = ['A', 'B', 'C', 'D'];
  const colHeaders = [];
  for (let c = 0; c < cols; c++) {
    const colX = padLeft + c * colW;
    const numW = colW * 0.24;
    const optAreaW = colW * 0.70;
    const stepX = optAreaW / 4;
    colHeaders.push({
      col: c,
      xStart: colX,
      numCenterU: colX + numW * 0.45,
      optUs: opts.map((_, oi) => colX + numW + (oi + 0.5) * stepX),
      headerV: 0.355
    });
  }
  const bubbles = [];
  const radiusU = Math.min(colW * 0.70 / 10.2, 0.020);
  const radiusV = Math.min(rowH * 0.36, 0.0136);
  for (let i = 0; i < N; i++) {
    const c = Math.floor(i / rowsPerCol);
    const r = i % rowsPerCol;
    const colX = padLeft + c * colW;
    const numW = colW * 0.24;
    const optAreaW = colW * 0.70;
    const stepX = optAreaW / 4;
    const v = padTop + (r + 0.5) * rowH;
    bubbles.push({
      itemNum: i + 1,
      col: c,
      row: r,
      numU: colX + numW * 0.45,
      v,
      options: opts.map((letter, oi) => ({
        letter,
        u: colX + numW + (oi + 0.5) * stepX,
        v,
        ru: radiusU,
        rv: radiusV
      }))
    });
  }
  return {
    N,
    cols,
    rowsPerCol,
    colHeaders,
    bubbles,
    radiusU,
    radiusV,
    studentIdCols,
    idRadiusU,
    idRadiusV,
    barcodeBits
  };
}
function buildOmrAnswerSheetSvg({
  title = 'ME Board Evaluation Quiz',
  itemCount = 50,
  subtitle = '',
  quizId = '',
  omrQuizCode = 0,
  setLetter = ''
} = {}) {
  const layout = getOmrSheetLayout(itemCount);
  const svgW = 816;
  const svgH = 1056;
  const fx0 = 58;
  const fy0 = 192;
  const fw = 700;
  const fh = 810;
  const mSize = 26;
  const mapX = u => fx0 + u * fw;
  const mapY = v => fy0 + v * fh;
  const effectiveCode = omrQuizCode || (quizId ? getQuizOmrCode(quizId) : 0);
  const cleanSet = setLetter && /^[A-Z]$/i.test(String(setLetter).trim()) ? String(setLetter).trim().toUpperCase().charAt(0) : '';
  const codeBits = encodeOmrQuizSetBarcode(effectiveCode, cleanSet);

  // --- OPTICAL QUIZ+SET BARCODE STRIP SVG ---
  let barcodeSvg = '';
  layout.barcodeBits.forEach((cell, idx) => {
    const bitVal = codeBits[idx];
    const bw = cell.wu * fw;
    const bh = cell.hv * fh;
    const bx = mapX(cell.u) - bw / 2;
    const by = mapY(cell.v) - bh / 2;
    barcodeSvg += `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${bitVal ? '#000000' : '#ffffff'}" stroke="${bitVal ? '#000000' : '#e2e8f0'}" stroke-width="0.6" />`;
  });

  // --- ZONE 1 SVG: STUDENT NUMBER SHADING GRID ---
  const idR = Math.max(6.0, Math.min(8.2, Math.min(layout.idRadiusU * fw, layout.idRadiusV * fh)));
  let studentIdSvg = '';
  studentIdSvg += `
    <rect x="${mapX(0.036).toFixed(1)}" y="${mapY(0.034).toFixed(1)}" width="${(0.585 * fw).toFixed(1)}" height="${(0.288 * fh).toFixed(1)}" fill="#ffffff" stroke="#334155" stroke-width="1.3" rx="5" />
    <text x="${mapX(0.328).toFixed(1)}" y="${mapY(0.054).toFixed(1)}" text-anchor="middle" font-size="10.2" font-weight="800" fill="#0f172a">STUDENT NUMBER (WRITE &amp; SHADE 0–9 BELOW)</text>
  `;
  for (let d = 0; d < 10; d++) {
    const dy = mapY(layout.studentIdCols[0].digits[d].v);
    studentIdSvg += `<text x="${mapX(0.052).toFixed(1)}" y="${(dy + 3).toFixed(1)}" text-anchor="middle" font-size="8.8" font-weight="700" fill="#475569">${d}</text>`;
  }
  const dashX = (mapX(layout.studentIdCols[3].u) + mapX(layout.studentIdCols[4].u)) / 2;
  const dashY = mapY((layout.studentIdCols[0].boxTopV + layout.studentIdCols[0].boxBottomV) / 2);
  studentIdSvg += `<text x="${dashX.toFixed(1)}" y="${(dashY + 4).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">-</text>`;
  layout.studentIdCols.forEach(col => {
    const bx = mapX(col.boxU);
    const bw = 26;
    const by = mapY(col.boxTopV);
    const bh = mapY(col.boxBottomV) - by;
    studentIdSvg += `<rect x="${(bx - bw / 2).toFixed(1)}" y="${by.toFixed(1)}" width="${bw}" height="${bh.toFixed(1)}" fill="#f8fafc" stroke="#0f172a" stroke-width="1.3" rx="2" />`;
    col.digits.forEach(dig => {
      const cx = mapX(dig.u);
      const cy = mapY(dig.v);
      studentIdSvg += `
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${idR.toFixed(1)}" fill="#ffffff" stroke="#1e293b" stroke-width="1.3" />
        <text x="${cx.toFixed(1)}" y="${(cy + 3).toFixed(1)}" text-anchor="middle" font-size="7.6" font-weight="600" fill="#64748b">${dig.digit}</text>
      `;
    });
  });

  // Right Info / Shading Guide Box inside Top Zone
  const guideX = mapX(0.635);
  const guideY = mapY(0.034);
  const guideW = 0.328 * fw;
  const guideH = 0.288 * fh;
  studentIdSvg += `
    <rect x="${guideX.toFixed(1)}" y="${guideY.toFixed(1)}" width="${guideW.toFixed(1)}" height="${guideH.toFixed(1)}" fill="#f8fafc" stroke="#334155" stroke-width="1.3" rx="5" />
    <rect x="${(guideX + 8).toFixed(1)}" y="${(guideY + 8).toFixed(1)}" width="${(guideW - 16).toFixed(1)}" height="28" fill="#0f172a" rx="4" />
    <text x="${(guideX + guideW / 2).toFixed(1)}" y="${(guideY + 26).toFixed(1)}" text-anchor="middle" font-size="11.5" font-weight="800" fill="#ffffff">${cleanSet ? `EXAM SET ${cleanSet}` : 'STANDARD SET'}  •  CODE #${effectiveCode || '0000'}</text>
    <circle cx="${(guideX + 26).toFixed(1)}" cy="${(guideY + 54).toFixed(1)}" r="7.5" fill="#0f172a" stroke="#0f172a" stroke-width="1.5" />
    <text x="${(guideX + 41).toFixed(1)}" y="${(guideY + 58).toFixed(1)}" font-size="9.2" font-weight="700" fill="#047857">CORRECT (Full dark shade)</text>
    <circle cx="${(guideX + 26).toFixed(1)}" cy="${(guideY + 76).toFixed(1)}" r="7.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5" />
    <line x1="${(guideX + 21).toFixed(1)}" y1="${(guideY + 71).toFixed(1)}" x2="${(guideX + 31).toFixed(1)}" y2="${(guideY + 81).toFixed(1)}" stroke="#dc2626" stroke-width="1.8" />
    <line x1="${(guideX + 31).toFixed(1)}" y1="${(guideY + 71).toFixed(1)}" x2="${(guideX + 21).toFixed(1)}" y2="${(guideY + 81).toFixed(1)}" stroke="#dc2626" stroke-width="1.8" />
    <text x="${(guideX + 41).toFixed(1)}" y="${(guideY + 80).toFixed(1)}" font-size="9.2" font-weight="700" fill="#dc2626">WRONG (Check / X / Partial)</text>
    <text x="${(guideX + 12).toFixed(1)}" y="${(guideY + 104).toFixed(1)}" font-size="8.4" fill="#334155">• Shade your 10-digit Student Number</text>
    <text x="${(guideX + 18).toFixed(1)}" y="${(guideY + 116).toFixed(1)}" font-size="8.4" fill="#334155">(skip dashes: 2022-001234 →</text>
    <text x="${(guideX + 18).toFixed(1)}" y="${(guideY + 128).toFixed(1)}" font-size="8.4" font-weight="700" fill="#0f172a">shade 2 0 2 2 0 0 1 2 3 4).</text>
    <text x="${(guideX + 12).toFixed(1)}" y="${(guideY + 145).toFixed(1)}" font-size="8.4" fill="#334155">• Do NOT mark top barcode or corners.</text>
    <text x="${(guideX + 12).toFixed(1)}" y="${(guideY + 159).toFixed(1)}" font-size="8.4" fill="#334155">• Use dark pencil or black/blue pen.</text>
    <line x1="${(guideX + 10).toFixed(1)}" y1="${(guideY + 174).toFixed(1)}" x2="${(guideX + guideW - 10).toFixed(1)}" y2="${(guideY + 174).toFixed(1)}" stroke="#cbd5e1" stroke-width="1" />
    <text x="${(guideX + 14).toFixed(1)}" y="${(guideY + 196).toFixed(1)}" font-size="10" font-weight="800" fill="#0f172a">TOTAL SCORE: _______ / ${layout.N}</text>
    <text x="${(guideX + 14).toFixed(1)}" y="${(guideY + 217).toFixed(1)}" font-size="8.8" font-weight="600" fill="#475569">Proctor / Admin: _______________</text>
  `;

  // Divider between Student Number Zone and Answer Grid Zone
  let gridSvg = `
    <line x1="${mapX(0.035).toFixed(1)}" y1="${mapY(0.335).toFixed(1)}" x2="${mapX(0.965).toFixed(1)}" y2="${mapY(0.335).toFixed(1)}" stroke="#0f172a" stroke-width="1.5" />
  `;
  for (let c = 1; c < layout.cols; c++) {
    const xLine = mapX(0.055 + c * ((1 - 0.10) / layout.cols) - 0.008);
    gridSvg += `<line x1="${xLine.toFixed(1)}" y1="${mapY(0.343).toFixed(1)}" x2="${xLine.toFixed(1)}" y2="${mapY(0.976).toFixed(1)}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4,4" />`;
  }
  layout.colHeaders.forEach(ch => {
    const hy = mapY(ch.headerV);
    gridSvg += `<text x="${mapX(ch.numCenterU).toFixed(1)}" y="${hy.toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#334155">#</text>`;
    ['A', 'B', 'C', 'D'].forEach((ltr, idx) => {
      gridSvg += `<text x="${mapX(ch.optUs[idx]).toFixed(1)}" y="${hy.toFixed(1)}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#0f172a">${ltr}</text>`;
    });
  });
  const rPx = Math.max(6.6, Math.min(10.3, Math.min(layout.radiusU * fw, layout.radiusV * fh)));
  layout.bubbles.forEach(item => {
    const cy = mapY(item.v);
    if (item.row % 2 === 1) {
      const colW = (1 - 0.10) / layout.cols;
      const rx = mapX(0.055 + item.col * colW);
      const rw = colW * fw - 8;
      const rh = (1 - 0.372 - 0.034) / layout.rowsPerCol * fh;
      gridSvg += `<rect x="${rx.toFixed(1)}" y="${(cy - rh / 2).toFixed(1)}" width="${rw.toFixed(1)}" height="${rh.toFixed(1)}" fill="#f8fafc" rx="3" />`;
    }
    gridSvg += `<text x="${mapX(item.numU).toFixed(1)}" y="${(cy + 3.5).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#0f172a">${item.itemNum}.</text>`;
    item.options.forEach(opt => {
      const cx = mapX(opt.u);
      gridSvg += `
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rPx.toFixed(1)}" fill="#ffffff" stroke="#1e293b" stroke-width="1.5" />
        <text x="${cx.toFixed(1)}" y="${(cy + 3).toFixed(1)}" text-anchor="middle" font-size="8.2" font-weight="600" fill="#64748b">${opt.letter}</text>
      `;
    });
  });
  const corners = [[fx0, fy0], [fx0 + fw, fy0], [fx0, fy0 + fh], [fx0 + fw, fy0 + fh]];
  const fiducialsSvg = corners.map(([cx, cy]) => `
    <rect x="${(cx - mSize / 2 - 6).toFixed(1)}" y="${(cy - mSize / 2 - 6).toFixed(1)}" width="${mSize + 12}" height="${mSize + 12}" fill="#ffffff" />
    <rect x="${(cx - mSize / 2).toFixed(1)}" y="${(cy - mSize / 2).toFixed(1)}" width="${mSize}" height="${mSize}" fill="#000000" />
  `).join('');
  const setHeaderBadge = cleanSet ? `
    <rect x="688" y="22" width="84" height="58" fill="#0f172a" rx="6" />
    <text x="730" y="39" text-anchor="middle" font-size="9" font-weight="700" fill="#94a3b8" letter-spacing="1">EXAM SET</text>
    <text x="730" y="69" text-anchor="middle" font-size="27" font-weight="900" fill="#ffffff">${cleanSet}</text>
  ` : '';
  const titleCenterX = cleanSet ? 364 : svgW / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="100%" style="background:#ffffff; display:block; font-family: Arial, Helvetica, sans-serif;">
    <rect x="0" y="0" width="${svgW}" height="${svgH}" fill="#ffffff" />
    <!-- OFFICIAL HEADER -->
    <text x="${titleCenterX}" y="30" text-anchor="middle" font-size="10" letter-spacing="1" fill="#334155">REPUBLIC OF THE PHILIPPINES</text>
    <text x="${titleCenterX}" y="48" text-anchor="middle" font-size="14" font-weight="800" fill="#0f172a">NUEVA ECIJA UNIVERSITY OF SCIENCE AND TECHNOLOGY</text>
    <text x="${titleCenterX}" y="64" text-anchor="middle" font-size="10.8" font-weight="600" fill="#334155">College of Engineering — Mechanical Engineering Department</text>
    <text x="${titleCenterX}" y="86" text-anchor="middle" font-size="12.5" font-weight="800" fill="#0f172a">${escapeHtmlForWord(title).toUpperCase().slice(0, 52)}${cleanSet ? ` — SET ${cleanSet}` : ''} (${layout.N} ITEMS)</text>
    ${subtitle ? `<text x="${titleCenterX}" y="101" text-anchor="middle" font-size="9.2" fill="#475569">${escapeHtmlForWord(subtitle)}</text>` : ''}
    ${setHeaderBadge}
    <line x1="42" y1="109" x2="${svgW - 42}" y2="109" stroke="#0f172a" stroke-width="2" />

    <!-- STUDENT INFO FIELDS -->
    <text x="48" y="133" font-size="11" font-weight="700" fill="#0f172a">Student Name:</text>
    <line x1="134" y1="135" x2="495" y2="135" stroke="#334155" stroke-width="1.2" />
    <text x="515" y="133" font-size="11" font-weight="700" fill="#0f172a">Date:</text>
    <line x1="550" y1="135" x2="768" y2="135" stroke="#334155" stroke-width="1.2" />

    <text x="48" y="158" font-size="11" font-weight="700" fill="#0f172a">Year &amp; Section:</text>
    <line x1="142" y1="160" x2="495" y2="160" stroke="#334155" stroke-width="1.2" />
    <text x="515" y="158" font-size="11" font-weight="700" fill="#0f172a">Student No.:</text>
    <line x1="590" y1="160" x2="768" y2="160" stroke="#334155" stroke-width="1.2" />

    <!-- OPTICAL QUIZ+SET BARCODE STRIP (AUTO-DETECTS QUIZ & SET A-Z) -->
    ${barcodeSvg}

    <!-- ZONE 1: STUDENT NUMBER SHADING GRID -->
    ${studentIdSvg}

    <!-- ZONE 2: ANSWER BUBBLE GRID -->
    ${gridSvg}

    <!-- 4 BLACK CORNER ALIGNMENT FIDUCIAL SQUARES -->
    ${fiducialsSvg}

    <text x="${svgW / 2}" y="${svgH - 14}" text-anchor="middle" font-size="8.6" fill="#64748b">ME BoardPrep Official OMR Scannable Sheet • Auto-ID Quiz #${effectiveCode || '0000'}${cleanSet ? ` • SET ${cleanSet}` : ''} • Student Number + Answers</text>
  </svg>`;
}
function exportOmrAnswerSheetHtml({
  title = 'ME Board Evaluation Quiz',
  itemCount = 50,
  subtitle = '',
  quizId = '',
  omrQuizCode = 0,
  setLetter = ''
} = {}) {
  if (typeof window !== 'undefined' && window.__CURRENT_USER_ROLE !== 'admin') {
    window.showToast?.('Access restricted: Only administrators can generate answer sheets.', 'error');
    return;
  }
  const cleanSet = setLetter && /^[A-Z]$/i.test(String(setLetter).trim()) ? String(setLetter).trim().toUpperCase().charAt(0) : '';
  const svgMarkup = buildOmrAnswerSheetSvg({
    title,
    itemCount,
    subtitle,
    quizId,
    omrQuizCode,
    setLetter: cleanSet
  });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtmlForWord(title)}${cleanSet ? ` - SET ${cleanSet}` : ''} - OMR Answer Sheet</title>
  <style>
    @page { size: letter portrait; margin: 0.25in; }
    body { margin: 0; padding: 16px; background: #e2e8f0; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; }
    .toolbar { margin-bottom: 14px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .print-btn { background: #2563eb; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; }
    .sheet-page { width: 8.5in; max-width: 100%; background: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.18); }
    @media print {
      body { background: #ffffff; padding: 0; }
      .toolbar { display: none !important; }
      .sheet-page { box-shadow: none; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="print-btn" onclick="window.print()">🖨️ Print / Save as PDF (100% Scale)</button>
    <span style="font-size: 13px; color: #334155;">${cleanSet ? `<b>SET ${cleanSet}</b> • ` : ''}Optical Quiz/Set Barcode + 10-Digit Student Number Shading + ${itemCount} Answer Bubbles. Print at 100% scale.</span>
  </div>
  <div class="sheet-page">${svgMarkup}</div>
</body>
</html>`;
  const blob = new Blob([html], {
    type: 'text/html;charset=utf-8'
  });
  const safeBase = String(title || 'ME_Quiz').replace(/[^a-z0-9\-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'ME_Quiz';
  const setPart = cleanSet ? `_SET_${cleanSet}` : '';
  const fileName = `${safeBase}${setPart}_OMR_Answer_Sheet_${itemCount}Qs.html`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  window.showToast?.(`Downloaded Printable OMR Answer Sheet "${fileName}" (${cleanSet ? `SET ${cleanSet} • ` : ''}Auto-Scannable Barcode + Student Number Shading)!`, 'success');
}
function exportOmrAnswerSheetWord({
  title = 'ME Board Evaluation Quiz',
  itemCount = 50,
  subtitle = '',
  quizId = '',
  omrQuizCode = 0,
  setLetter = ''
} = {}) {
  if (typeof window !== 'undefined' && window.__CURRENT_USER_ROLE !== 'admin') {
    window.showToast?.('Access restricted: Only administrators can generate answer sheets.', 'error');
    return;
  }
  const N = Math.max(1, Math.min(100, parseInt(itemCount, 10) || 50));
  const cleanSet = setLetter && /^[A-Z]$/i.test(String(setLetter).trim()) ? String(setLetter).trim().toUpperCase().charAt(0) : '';
  const effectiveCode = omrQuizCode || (quizId ? getQuizOmrCode(quizId) : 0);
  const cols = N <= 50 ? 2 : 4;
  const rowsPerCol = Math.ceil(N / cols);
  const circledDigits = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];
  const writeBoxesRow = Array.from({
    length: 10
  }, (_, idx) => `<td style="border: 1.5px solid #0f172a; height: 18pt; width: 22pt; text-align: center; background: #f8fafc;">&nbsp;</td>${idx === 3 ? '<td style="text-align:center; font-weight:bold; width:10pt;">-</td>' : ''}`).join('');
  let studentNumRows = `<tr><td style="font-size:8pt; font-weight:bold; padding-right:4pt;">ID:</td>${writeBoxesRow}</tr>`;
  for (let d = 0; d < 10; d++) {
    const cells = Array.from({
      length: 10
    }, (_, idx) => `<td style="text-align: center; font-family: 'Segoe UI Symbol', Arial, sans-serif; font-size: 9.5pt; padding: 1pt 0;">${circledDigits[d]}</td>${idx === 3 ? '<td></td>' : ''}`).join('');
    studentNumRows += `<tr><td style="font-size:8pt; color:#475569; font-weight:bold; text-align:right; padding-right:4pt;">${d}</td>${cells}</tr>`;
  }
  let tableRows = '';
  for (let r = 0; r < rowsPerCol; r++) {
    let rowCells = '';
    for (let c = 0; c < cols; c++) {
      const num = c * rowsPerCol + r + 1;
      if (num <= N) {
        rowCells += `
          <td style="padding: 2.5pt 4pt; font-weight: bold; text-align: right; border-bottom: 1px solid #e2e8f0; width: 22pt;">${num}.</td>
          <td style="padding: 2.5pt 6pt; text-align: center; border-bottom: 1px solid #e2e8f0; font-family: 'Segoe UI Symbol', Arial, sans-serif; font-size: 10.5pt; letter-spacing: 3pt;">Ⓐ Ⓑ Ⓒ Ⓓ</td>
        `;
      } else {
        rowCells += '<td colspan="2" style="padding: 2.5pt;"></td>';
      }
    }
    tableRows += `<tr>${rowCells}</tr>`;
  }
  const docHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtmlForWord(title)}${cleanSet ? ` - SET ${cleanSet}` : ''} - Answer Sheet</title>
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
  <style>
    @page WordSection1 { size: 8.5in 11.0in; margin: 0.55in; }
    div.WordSection1 { page: WordSection1; }
    body { font-family: Calibri, Arial, sans-serif; color: #0f172a; font-size: 10pt; }
  </style>
</head>
<body>
  <div class="WordSection1">
    <table style="width: 100%; border-collapse: collapse; border-bottom: 2px solid #0f172a; margin-bottom: 8pt;">
      <tr>
        <td style="text-align: center; padding-bottom: 5pt;">
          <p style="margin: 0; font-size: 8.5pt;">REPUBLIC OF THE PHILIPPINES</p>
          <p style="margin: 1pt 0; font-size: 11.5pt; font-weight: bold;">NUEVA ECIJA UNIVERSITY OF SCIENCE AND TECHNOLOGY</p>
          <p style="margin: 1pt 0 3pt 0; font-size: 9.5pt;">College of Engineering — Mechanical Engineering Department</p>
          <h1 style="margin: 2pt 0 0 0; font-size: 12pt; text-transform: uppercase;">${escapeHtmlForWord(title)} — OFFICIAL ANSWER SHEET (${N} ITEMS)</h1>
          ${subtitle ? `<p style="margin: 2pt 0 0 0; font-size: 8.5pt; color: #475569;">${escapeHtmlForWord(subtitle)}</p>` : ''}
        </td>
        ${cleanSet ? `
        <td style="width: 82pt; text-align: center; vertical-align: middle; padding-bottom: 5pt;">
          <div style="border: 2.5px solid #0f172a; padding: 4pt; background: #f1f5f9;">
            <div style="font-size: 7.5pt; font-weight: bold; color: #334155;">EXAM SET</div>
            <div style="font-size: 18pt; font-weight: bold; line-height: 1.05;">SET ${cleanSet}</div>
            <div style="font-size: 7pt; color: #475569;">CODE #${effectiveCode || '0000'}</div>
          </div>
        </td>` : ''}
      </tr>
    </table>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 8pt; font-size: 9.5pt;">
      <tr>
        <td style="padding: 2pt 0; width: 58%;"><b>Student Name:</b> ____________________________________</td>
        <td style="padding: 2pt 0; width: 42%;"><b>Date:</b> _______________________</td>
      </tr>
      <tr>
        <td style="padding: 2pt 0;"><b>Year &amp; Section:</b> ___________________________________</td>
        <td style="padding: 2pt 0;"><b>Score:</b> _________ / ${N}${cleanSet ? ` &nbsp;|&nbsp; <b>Set:</b> SET ${cleanSet}` : ''}</td>
      </tr>
    </table>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10pt;">
      <tr>
        <td style="width: 60%; border: 1.5px solid #0f172a; padding: 6pt; vertical-align: top;">
          <div style="font-size: 9pt; font-weight: bold; text-align: center; margin-bottom: 4pt;">STUDENT NUMBER (WRITE &amp; SHADE 0–9)</div>
          <table style="border-collapse: collapse; margin: 0 auto;">
            ${studentNumRows}
          </table>
        </td>
        <td style="width: 40%; border: 1.5px solid #0f172a; padding: 6pt 8pt; vertical-align: top; background: #f8fafc; font-size: 8.5pt;">
          <div style="font-weight: bold; margin-bottom: 4pt; font-size: 9pt;">EXAM INFO &amp; SHADING DIRECTIONS:</div>
          <p style="margin: 0 0 4pt 0;"><b>Exam Set:</b> ${cleanSet ? `SET ${cleanSet}` : 'Standard'} &nbsp;|&nbsp; <b>Quiz Code:</b> #${effectiveCode || '0000'}</p>
          <p style="margin: 0 0 4pt 0;">1. Write your Student Number in the boxes and completely shade the matching digit (0–9) below each box (skip dashes).</p>
          <p style="margin: 0 0 4pt 0;">2. Completely shade your chosen answer bubble (A, B, C, or D) using a dark pencil or black/blue pen.</p>
          <p style="margin: 0;">3. Tip: Use the Printable OMR Sheet (.html) for automatic camera Quiz/Set barcode scanning.</p>
        </td>
      </tr>
    </table>
    <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #0f172a;">
      ${tableRows}
    </table>
  </div>
</body>
</html>`;
  const blob = new Blob(['\ufeff', docHtml], {
    type: 'application/msword;charset=utf-8'
  });
  const safeBase = String(title || 'ME_Quiz').replace(/[^a-z0-9\-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'ME_Quiz';
  const setPart = cleanSet ? `_SET_${cleanSet}` : '';
  const fileName = `${safeBase}${setPart}_Answer_Sheet_${N}Qs.doc`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  window.showToast?.(`Downloaded Word Answer Sheet "${fileName}" (${cleanSet ? `SET ${cleanSet} • ` : ''}Student Number Shading)!`, 'success');
}

// --- PROJECTIVE 3x3 HOMOGRAPHY SOLVER (Maps normalized [0,1]x[0,1] -> 4 scanned corner points) ---
function computeOmrHomography(dstPts) {
  const src = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const [u, v] = src[i];
    const {
      x,
      y
    } = dstPts[i];
    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
    b.push(x);
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
    b.push(y);
  }
  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(A[r][i]) > Math.abs(A[maxRow][i])) maxRow = r;
    }
    [A[i], A[maxRow]] = [A[maxRow], A[i]];
    [b[i], b[maxRow]] = [b[maxRow], b[i]];
    const pivot = A[i][i] || 1e-12;
    for (let r = i + 1; r < n; r++) {
      const factor = A[r][i] / pivot;
      for (let c = i; c < n; c++) A[r][c] -= factor * A[i][c];
      b[r] -= factor * b[i];
    }
  }
  const h = new Array(8).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = b[i];
    for (let c = i + 1; c < n; c++) sum -= A[i][c] * h[c];
    h[i] = sum / (A[i][i] || 1e-12);
  }
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}
function applyOmrHomography(H, u, v) {
  const denom = H[6] * u + H[7] * v + H[8];
  const x = (H[0] * u + H[1] * v + H[2]) / (denom || 1e-9);
  const y = (H[3] * u + H[4] * v + H[5]) / (denom || 1e-9);
  return {
    x,
    y
  };
}

// --- FAST INTEGRAL-IMAGE FIDUCIAL SQUARE DETECTOR ---
function detectOmrFiducialCorners(imgData) {
  const {
    width: w,
    height: h,
    data
  } = imgData;
  const sat = new Float64Array((w + 1) * (h + 1));
  const stride = w + 1;
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    const rowOff = (y + 1) * stride;
    const prevOff = y * stride;
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      rowSum += lum;
      sat[rowOff + x + 1] = sat[prevOff + x + 1] + rowSum;
    }
  }
  const boxMean = (x0, y0, x1, y1) => {
    const cx0 = Math.max(0, Math.min(w, x0 | 0));
    const cy0 = Math.max(0, Math.min(h, y0 | 0));
    const cx1 = Math.max(cx0 + 1, Math.min(w, x1 | 0));
    const cy1 = Math.max(cy0 + 1, Math.min(h, y1 | 0));
    const area = (cx1 - cx0) * (cy1 - cy0);
    const sum = sat[cy1 * stride + cx1] - sat[cy0 * stride + cx1] - sat[cy1 * stride + cx0] + sat[cy0 * stride + cx0];
    return sum / area;
  };
  const scales = [Math.max(8, Math.round(w * 0.025)), Math.max(10, Math.round(w * 0.032)), Math.max(12, Math.round(w * 0.042))];
  const step = Math.max(2, Math.round(w / 260));
  const searchRegion = (rx0, ry0, rx1, ry1, fallback) => {
    let bestScore = -1e9;
    let bestPt = fallback;
    for (const s of scales) {
      const half = Math.floor(s / 2);
      const outer = Math.floor(s * 0.95);
      const xStart = Math.max(outer + 1, Math.floor(rx0));
      const xEnd = Math.min(w - outer - 2, Math.floor(rx1));
      const yStart = Math.max(outer + 1, Math.floor(ry0));
      const yEnd = Math.min(h - outer - 2, Math.floor(ry1));
      for (let y = yStart; y <= yEnd; y += step) {
        for (let x = xStart; x <= xEnd; x += step) {
          const innerMean = boxMean(x - half, y - half, x + half, y + half);
          if (innerMean > 135) continue;
          const outerBoxMean = boxMean(x - outer, y - outer, x + outer, y + outer);
          const innerArea = 2 * half * (2 * half);
          const outerArea = 2 * outer * (2 * outer);
          const ringMean = (outerBoxMean * outerArea - innerMean * innerArea) / Math.max(1, outerArea - innerArea);
          if (ringMean < 130) continue;
          const contrast = ringMean - innerMean;
          const q1 = boxMean(x - half, y - half, x, y);
          const q2 = boxMean(x, y - half, x + half, y);
          const q3 = boxMean(x - half, y, x, y + half);
          const q4 = boxMean(x, y, x + half, y + half);
          const maxQ = Math.max(q1, q2, q3, q4);
          if (maxQ > 155) continue;
          const uniformityPenalty = Math.abs(q1 - q4) + Math.abs(q2 - q3);
          const score = contrast - uniformityPenalty * 0.5;
          if (score > bestScore) {
            bestScore = score;
            bestPt = {
              x,
              y,
              detected: true,
              score
            };
          }
        }
      }
    }
    return bestPt;
  };
  const tl = searchRegion(0, h * 0.08, w * 0.36, h * 0.44, {
    x: w * (58 / 816),
    y: h * (192 / 1056),
    detected: false
  });
  const tr = searchRegion(w * 0.64, h * 0.08, w, h * 0.44, {
    x: w * (758 / 816),
    y: h * (192 / 1056),
    detected: false
  });
  const br = searchRegion(w * 0.64, h * 0.60, w, h * 0.99, {
    x: w * (758 / 816),
    y: h * (1002 / 1056),
    detected: false
  });
  const bl = searchRegion(0, h * 0.60, w * 0.36, h * 0.99, {
    x: w * (58 / 816),
    y: h * (1002 / 1056),
    detected: false
  });
  return [tl, tr, br, bl];
}

// --- OPTICAL QUIZ+SET BARCODE DECODER (27-bit self-validating checksum strip) ---
function decodeOmrBarcodeFromImageData(imgData, corners) {
  const {
    width: w,
    height: h,
    data
  } = imgData;
  const layout = getOmrSheetLayout(50);
  const H = computeOmrHomography(corners);
  const topW = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
  const leftH = Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y);
  const sampleDiskBrightness = (cx, cy, rPx) => {
    const r = Math.max(1.5, Math.round(rPx));
    const r2 = r * r;
    const xMin = Math.max(0, Math.floor(cx - r));
    const xMax = Math.min(w - 1, Math.ceil(cx + r));
    const yMin = Math.max(0, Math.floor(cy - r));
    const yMax = Math.min(h - 1, Math.ceil(cy + r));
    let sum = 0;
    let count = 0;
    for (let y = yMin; y <= yMax; y++) {
      const dy = y - cy;
      for (let x = xMin; x <= xMax; x++) {
        const dx = x - cx;
        if (dx * dx + dy * dy <= r2) {
          const idx = (y * w + x) * 4;
          sum += (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) / 255;
          count++;
        }
      }
    }
    return count > 0 ? sum / count : 1;
  };
  const samples = layout.barcodeBits.map(cell => {
    const pt = applyOmrHomography(H, cell.u, cell.v);
    const sampleR = Math.max(1.8, Math.min(cell.wu * topW, cell.hv * leftH) * 0.28);
    const brightness = sampleDiskBrightness(pt.x, pt.y, sampleR);
    return {
      index: cell.index,
      x: pt.x,
      y: pt.y,
      brightness
    };
  });

  // Calibration blocks: [0]=BLACK, [1]=WHITE, [25]=WHITE, [26]=BLACK
  const calBlack = (samples[0].brightness + samples[26].brightness) / 2;
  const calWhite = (samples[1].brightness + samples[25].brightness) / 2;
  if (calWhite - calBlack < 0.18) {
    return {
      valid: false,
      omrQuizCode: 0,
      setNumber: 0,
      setLetter: '',
      samples
    };
  }
  const threshold = (calBlack + calWhite) / 2;
  const bits = samples.map(s => s.brightness < threshold ? 1 : 0);
  if (bits[0] !== 1 || bits[1] !== 0 || bits[25] !== 0 || bits[26] !== 1) {
    return {
      valid: false,
      omrQuizCode: 0,
      setNumber: 0,
      setLetter: '',
      samples
    };
  }
  let omrQuizCode = 0;
  for (let i = 0; i < 12; i++) omrQuizCode = omrQuizCode << 1 | bits[2 + i];
  let setNumber = 0;
  for (let i = 0; i < 5; i++) setNumber = setNumber << 1 | bits[14 + i];
  let checksum = 0;
  for (let i = 0; i < 6; i++) checksum = checksum << 1 | bits[19 + i];
  const expectedChecksum = (omrQuizCode * 31 + setNumber * 17 ^ omrQuizCode >> 5 ^ 0x2A) & 0x3F;
  if (checksum !== expectedChecksum || setNumber > 26) {
    return {
      valid: false,
      omrQuizCode: 0,
      setNumber: 0,
      setLetter: '',
      samples
    };
  }
  const setLetter = setNumber >= 1 && setNumber <= 26 ? QUIZ_SET_LETTERS[setNumber - 1] : '';
  return {
    valid: true,
    omrQuizCode,
    setNumber,
    setLetter,
    samples
  };
}

// --- OMR BUBBLE SAMPLER FOR BARCODE + STUDENT NUMBER (0-9 x 10) + ANSWERS (A-D x 1..N) ---
function scanOmrBubblesFromImageData(imgData, corners, itemCount, sensitivity = 0.22) {
  const {
    width: w,
    height: h,
    data
  } = imgData;
  const layout = getOmrSheetLayout(itemCount);
  const H = computeOmrHomography(corners);
  const sampleDiskBrightness = (cx, cy, rPx) => {
    const r = Math.max(2, Math.round(rPx));
    const r2 = r * r;
    const xMin = Math.max(0, Math.floor(cx - r));
    const xMax = Math.min(w - 1, Math.ceil(cx + r));
    const yMin = Math.max(0, Math.floor(cy - r));
    const yMax = Math.min(h - 1, Math.ceil(cy + r));
    let sum = 0;
    let count = 0;
    for (let y = yMin; y <= yMax; y++) {
      const dy = y - cy;
      for (let x = xMin; x <= xMax; x++) {
        const dx = x - cx;
        if (dx * dx + dy * dy <= r2) {
          const idx = (y * w + x) * 4;
          sum += (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) / 255;
          count++;
        }
      }
    }
    return count > 0 ? sum / count : 1;
  };
  const topW = Math.hypot(corners[1].x - corners[0].x, corners[1].y - corners[0].y);
  const leftH = Math.hypot(corners[3].x - corners[0].x, corners[3].y - corners[0].y);

  // 0. DECODE OPTICAL QUIZ+SET BARCODE STRIP
  const barcode = decodeOmrBarcodeFromImageData(imgData, corners);

  // 1. SCAN 10-DIGIT STUDENT NUMBER SHADING GRID
  const studentIdColsStats = layout.studentIdCols.map(col => {
    const digitStats = col.digits.map(dig => {
      const pt = applyOmrHomography(H, dig.u, dig.v);
      const rPx = Math.max(2.5, Math.min(dig.ru * topW, dig.rv * leftH));
      const coreBrightness = sampleDiskBrightness(pt.x, pt.y, rPx * 0.60);
      const refL = sampleDiskBrightness(pt.x - rPx * 1.45, pt.y, Math.max(1.5, rPx * 0.25));
      const refR = sampleDiskBrightness(pt.x + rPx * 1.45, pt.y, Math.max(1.5, rPx * 0.25));
      const localPaper = Math.max(0.45, Math.max(refL, refR));
      const fillRatio = Math.max(0, (localPaper - coreBrightness) / localPaper);
      return {
        digit: dig.digit,
        x: pt.x,
        y: pt.y,
        rPx,
        fillRatio
      };
    });
    const sorted = [...digitStats].sort((a, b) => b.fillRatio - a.fillRatio);
    const darkest = sorted[0];
    const second = sorted[1];
    const unshadedAvg = sorted.slice(2).reduce((acc, s) => acc + s.fillRatio, 0) / 8;
    const contrast = darkest.fillRatio - unshadedAvg;
    const isShaded = contrast >= sensitivity * 0.85 && darkest.fillRatio >= sensitivity * 0.85 && (darkest.fillRatio - second.fillRatio >= 0.08 || contrast >= sensitivity);
    return {
      colIndex: col.colIndex,
      detectedDigit: isShaded ? darkest.digit : '',
      digitStats
    };
  });
  const rawIdDigits = studentIdColsStats.map(c => c.detectedDigit).join('');
  const formattedStudentNumber = rawIdDigits.length === 10 ? `${rawIdDigits.slice(0, 4)}-${rawIdDigits.slice(4)}` : rawIdDigits;

  // 2. SCAN EXAMINATION ANSWER BUBBLE GRID (1..N, A..D)
  const answerResults = layout.bubbles.map(item => {
    const optionStats = item.options.map(opt => {
      const pt = applyOmrHomography(H, opt.u, opt.v);
      const rPx = Math.max(2.8, Math.min(opt.ru * topW, opt.rv * leftH));
      const coreBrightness = sampleDiskBrightness(pt.x, pt.y, rPx * 0.62);
      const ref1 = sampleDiskBrightness(pt.x, pt.y - rPx * 1.45, Math.max(1.8, rPx * 0.25));
      const ref2 = sampleDiskBrightness(pt.x, pt.y + rPx * 1.45, Math.max(1.8, rPx * 0.25));
      const localPaper = Math.max(0.45, Math.max(ref1, ref2));
      const fillRatio = Math.max(0, (localPaper - coreBrightness) / localPaper);
      return {
        letter: opt.letter,
        x: pt.x,
        y: pt.y,
        rPx,
        fillRatio
      };
    });
    const sorted = [...optionStats].sort((a, b) => b.fillRatio - a.fillRatio);
    const darkest = sorted[0];
    const second = sorted[1];
    const unshadedBaseline = (sorted[1].fillRatio + sorted[2].fillRatio + sorted[3].fillRatio) / 3;
    const relativeContrast = darkest.fillRatio - unshadedBaseline;
    const marked = optionStats.filter(o => o.fillRatio - unshadedBaseline >= sensitivity && o.fillRatio >= sensitivity * 0.9);
    let detected = '';
    let status = 'blank';
    if (marked.length === 1) {
      detected = marked[0].letter;
      status = 'single';
    } else if (marked.length > 1) {
      if (darkest.fillRatio - second.fillRatio >= 0.18) {
        detected = darkest.letter;
        status = 'single';
      } else {
        detected = 'MULTI';
        status = 'multi';
      }
    } else if (relativeContrast >= sensitivity * 1.15 && darkest.fillRatio >= sensitivity) {
      detected = darkest.letter;
      status = 'single';
    }
    return {
      itemNum: item.itemNum,
      detected,
      status,
      optionStats
    };
  });
  return {
    barcode,
    studentIdColsStats,
    rawStudentNumberDigits: rawIdDigits,
    scannedStudentNumber: formattedStudentNumber,
    answerResults
  };
}

// ROBUST ATTEMPT SCORE EXTRACTION HELPERS
function getAttemptScore(att) {
  if (!att) return 0;
  if (att.score !== undefined && att.score !== null && !isNaN(parseInt(att.score, 10))) {
    return parseInt(att.score, 10);
  }
  if (att.correctAnswers !== undefined && att.correctAnswers !== null && !isNaN(parseInt(att.correctAnswers, 10))) {
    return parseInt(att.correctAnswers, 10);
  }
  if (att.moduleBreakdown && typeof att.moduleBreakdown === 'object') {
    let sum = 0;
    let found = false;
    Object.values(att.moduleBreakdown).forEach(m => {
      if (m && typeof m === 'object') {
        const val = m.correct !== undefined ? m.correct : m.score;
        if (val !== undefined && val !== null && !isNaN(parseInt(val, 10))) {
          sum += parseInt(val, 10);
          found = true;
        }
      }
    });
    if (found) return sum;
  }
  return 0;
}
function getAttemptTotal(att) {
  if (!att) return 0;
  if (att.totalQuestions !== undefined && att.totalQuestions !== null && !isNaN(parseInt(att.totalQuestions, 10))) {
    return parseInt(att.totalQuestions, 10);
  }
  if (att.total !== undefined && att.total !== null && !isNaN(parseInt(att.total, 10))) {
    return parseInt(att.total, 10);
  }
  if (att.moduleBreakdown && typeof att.moduleBreakdown === 'object') {
    let sum = 0;
    let found = false;
    Object.values(att.moduleBreakdown).forEach(m => {
      if (m && typeof m === 'object' && m.total !== undefined && m.total !== null && !isNaN(parseInt(m.total, 10))) {
        sum += parseInt(m.total, 10);
        found = true;
      }
    });
    if (found && sum > 0) return sum;
  }
  return 0;
}
function getAttemptPercentage(att) {
  if (!att) return 0;
  if (att.percentage !== undefined && att.percentage !== null && !isNaN(parseFloat(att.percentage))) {
    return Math.round(parseFloat(att.percentage));
  }
  if (att.scorePct !== undefined && att.scorePct !== null && !isNaN(parseFloat(att.scorePct))) {
    return Math.round(parseFloat(att.scorePct));
  }
  const score = getAttemptScore(att);
  const total = getAttemptTotal(att);
  return total > 0 ? Math.round(score / total * 100) : 0;
}

// FLOATING GLASSMORPHIC TOAST NOTIFICATION SYSTEM
function ToastContainer({
  toasts,
  removeToast
}) {
  if (!toasts || toasts.length === 0) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "toast-container",
    "aria-live": "polite"
  }, toasts.map(t => {
    let icon = 'ℹ️';
    if (t.type === 'success') icon = '✅';else if (t.type === 'error') icon = '❌';else if (t.type === 'warning') icon = '⚠️';
    return /*#__PURE__*/React.createElement("div", {
      key: t.id,
      className: `toast-item toast-${t.type || 'info'}`,
      onClick: () => removeToast(t.id),
      role: "status"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '1.15rem',
        flexShrink: 0
      }
    }, icon), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        wordBreak: 'break-word'
      }
    }, t.message), /*#__PURE__*/React.createElement("span", {
      style: {
        opacity: 0.6,
        fontSize: '0.85rem',
        cursor: 'pointer',
        marginLeft: '0.5rem'
      }
    }, "\u2715"));
  }));
}

// MODERN ACTION CONFIRMATION MODAL
function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: onCancel,
    style: {
      zIndex: 100000
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content glass-card",
    style: {
      maxWidth: '440px',
      padding: '1.75rem',
      textAlign: 'center'
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: type === 'danger' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
      color: type === 'danger' ? 'var(--danger)' : 'var(--primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.75rem',
      margin: '0 auto 1.25rem'
    }
  }, type === 'danger' ? '⚠️' : 'ℹ️'), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: '1.25rem',
      fontWeight: 700,
      marginBottom: '0.6rem',
      color: 'var(--text-main)'
    }
  }, title || 'Please Confirm'), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.92rem',
      color: 'var(--text-muted)',
      lineHeight: '1.5',
      marginBottom: '1.5rem'
    }
  }, message), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.75rem',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      flex: 1,
      padding: '0.65rem 1rem'
    },
    onClick: onCancel
  }, cancelText), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: type === 'danger' ? 'btn-danger' : 'btn-primary',
    style: {
      flex: 1,
      padding: '0.65rem 1rem'
    },
    onClick: () => {
      if (onConfirm) onConfirm();
      onCancel();
    }
  }, confirmText))));
}
function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [view, setView] = useState('dashboard'); // 'dashboard', 'exam', 'audit', 'admin'
  const [authModal, setAuthModal] = useState(null); // 'login', 'signup', null
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [quizListModalOpen, setQuizListModalOpen] = useState(false);
  const [quizResultsModalOpen, setQuizResultsModalOpen] = useState(false);
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [selectedQuizFilterForResults, setSelectedQuizFilterForResults] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [deviceMode, setDeviceMode] = useState(() => localStorage.getItem('me_device_mode') || 'auto');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Floating Toast Notifications & Action Confirm Dialog
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    onConfirm: null
  });
  const showToast = (message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, {
      id,
      message,
      type
    }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };
  const removeToast = id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };
  const showConfirmDialog = ({
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger',
    onConfirm
  }) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      type,
      onConfirm
    });
  };
  const closeConfirmDialog = () => {
    setConfirmState(prev => ({
      ...prev,
      isOpen: false
    }));
  };
  useEffect(() => {
    window.showToast = showToast;
    window.showConfirmDialog = showConfirmDialog;
  }, []);

  // App state
  const [stats, setStats] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [quizzesList, setQuizzesList] = useState([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);
  const [attemptsList, setAttemptsList] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);
  const [totalPagesCount, setTotalPagesCount] = useState(1);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [examMode, setExamMode] = useState('practice'); // 'practice', 'mock'
  const [examTimer, setExamTimer] = useState(3000); // seconds
  const [timerActive, setTimerActive] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);

  // Filters for Audit / Question Manager
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Admin Management Modals State
  const [usersList, setUsersList] = useState([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [quizEditorModalOpen, setQuizEditorModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__CURRENT_USER_ROLE = user && user.role ? user.role : null;
    }
  }, [user]);

  // Synchronize and persist device mode (auto, mobile, laptop)
  useEffect(() => {
    document.documentElement.setAttribute('data-device-mode', deviceMode);
    document.body.setAttribute('data-device-mode', deviceMode);
    localStorage.setItem('me_device_mode', deviceMode);
  }, [deviceMode]);

  // Check current session
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(res => res.json()).then(data => {
        if (data.user) {
          setUser(data.user);
          loadStats(token);
        } else {
          logout();
        }
      }).catch(() => logout());
    }
  }, [token]);
  const loadStats = authToken => {
    const activeToken = authToken || token || localStorage.getItem('token') || '';
    return fetch(`${API_BASE}/api/questions/stats?_t=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${activeToken}`,
        'Cache-Control': 'no-cache'
      }
    }).then(res => res.json()).then(data => {
      setStats(data);
      return data;
    }).catch(err => {
      console.error('Error loading stats:', err);
      return null;
    });
  };
  const loadQuestions = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const activeToken = token || localStorage.getItem('token') || '';
    return fetch(`${API_BASE}/api/questions?${query}&_t=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${activeToken}`,
        'Cache-Control': 'no-cache'
      }
    }).then(res => res.json()).then(data => {
      setQuestions(data.questions || []);
      setTotalQuestionsCount(data.total || 0);
      setTotalPagesCount(data.totalPages || 1);
      return data;
    }).catch(err => {
      console.error('Error loading questions:', err);
      return null;
    });
  };
  const loadQuizzes = () => {
    setIsLoadingQuizzes(true);
    const activeToken = token || localStorage.getItem('token') || '';
    return fetch(`${API_BASE}/api/quizzes?_t=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${activeToken}`,
        'Cache-Control': 'no-cache'
      }
    }).then(res => res.json()).then(data => {
      if (data && Array.isArray(data.quizzes)) {
        setQuizzesList(data.quizzes);
      }
      if (data && Array.isArray(data.myAttempts)) {
        setMyAttempts(data.myAttempts);
      }
      return data;
    }).catch(err => {
      console.error('Error loading quizzes:', err);
      return null;
    }).finally(() => {
      setIsLoadingQuizzes(false);
    });
  };
  const loadAttempts = () => {
    const activeToken = token || localStorage.getItem('token') || '';
    return fetch(`${API_BASE}/api/attempts?_t=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${activeToken}`,
        'Cache-Control': 'no-cache'
      }
    }).then(res => res.json()).then(data => {
      setAttemptsList(data.attempts || []);
      return data;
    }).catch(err => {
      console.error('Error loading attempts:', err);
      return null;
    });
  };
  const loadUsers = () => {
    const activeToken = token || localStorage.getItem('token') || '';
    return fetch(`${API_BASE}/api/users/full?_t=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${activeToken}`,
        'Cache-Control': 'no-cache'
      }
    }).then(res => res.json()).then(data => {
      setUsersList(data.users || []);
      return data;
    }).catch(err => {
      console.error('Error loading users:', err);
      return null;
    });
  };

  // Real-Time Live Sync: Automatically keep quizzes, attempts, users, and stats synchronized across all accounts & devices
  useEffect(() => {
    if (!token || !user) return;

    // Immediately load quizzes and stats
    loadQuizzes();
    loadStats(token);
    if (user.role === 'admin') {
      loadUsers();
      loadAttempts();
    }

    // Instant Real-Time WebSocket Event Listener (< 50ms sync across devices)
    const onLiveUpdate = e => {
      const detail = e.detail || {};
      console.log('[Live Engine] Real-time activity received:', detail.type);
      if (detail.type === 'QUIZ_DELETE' && detail.quizId) {
        setQuizzesList(prev => prev.filter(q => q && q.id !== detail.quizId));
      }
      if (detail.type === 'USER_DELETE' && detail.id) {
        setUsersList(prev => prev.filter(u => u && u.id !== detail.id));
      }
      if (detail.type === 'QUIZ_UPDATE' && detail.quiz) {
        setQuizzesList(prev => {
          const idx = prev.findIndex(q => q && q.id === detail.quiz.id);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = detail.quiz;
            return copy;
          }
          return [detail.quiz, ...prev];
        });
      }
      loadStats(token);
      loadQuizzes();
      if (user && user.role === 'admin') {
        loadUsers();
        loadAttempts();
      }
    };
    window.addEventListener('me_live_update', onLiveUpdate);

    // Heartbeat background sync every 5 minutes (relies on real-time MQTT push + focus sync, preventing quota exhaustion)
    const pollInterval = setInterval(() => {
      loadQuizzes();
      loadStats(token);
      if (user && user.role === 'admin') {
        loadUsers();
        loadAttempts();
      }
    }, 300000);

    // Refresh when window or tab becomes active (throttled: 'focus' and 'visibilitychange'
    // fire together, and every click back from DevTools re-triggers focus)
    let lastFocusSync = Date.now();
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastFocusSync < 30000) return;
      lastFocusSync = Date.now();
      loadQuizzes();
      loadStats(token);
      if (user && user.role === 'admin') {
        loadUsers();
        loadAttempts();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onVisibilityChange);
    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onVisibilityChange);
      window.removeEventListener('me_live_update', onLiveUpdate);
    };
  }, [token, user ? user.role : null]);
  const logout = () => {
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST'
    }).catch(() => {});
    setUser(null);
    setToken('');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('me_current_user');

    // Completely clear exam session history and in-progress answers
    setUserAnswers({});
    setActiveQuestionIndex(0);
    setShowExplanation(false);
    setActiveQuiz(null);
    setExamSubmitted(false);
    setTimerActive(false);
    setView('dashboard');
    showToast('Signed out of session', 'info');
  };
  const downloadReviewedCSV = () => {
    const generateClientCSV = () => {
      const questions = (window.INITIAL_QUESTIONS || []).filter(q => q && q.ID !== 'Total' && q.QuestionText);
      const headers = ['ID', 'Type', 'Module', 'Topic', 'Difficulty', 'DifficultyValue', 'QuestionText', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'CorrectAnswer', 'CurriculumMapID', 'CourseCode', 'Subtopic', 'Discrimination', 'Guessing', 'Active', 'ExposureCount', 'AttemptCount', 'CorrectCount', 'AverageTimeSeconds', 'Explanation', 'LearningOutcome', 'AIReviewStatus', 'FieldsChanged', 'CorrectionSummary', 'References', 'ConfidenceLevel', 'HumanReviewRequired', 'HumanReviewReason', 'AIReviewedDate', 'BatchNumber'];
      const rows = [headers.join(',')];
      questions.forEach(q => {
        const row = headers.map(h => {
          const val = q[h] !== undefined && q[h] !== null ? String(q[h]) : '';
          return /[",\r\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
        });
        rows.push(row.join(','));
      });
      const blob = new Blob(['\uFEFF' + rows.join('\r\n')], {
        type: 'text/csv;charset=utf-8;'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'QuestionBank_Reviewed.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Question Bank CSV downloaded successfully', 'success');
    };
    fetch(`${API_BASE}/api/download/csv`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => {
      if (!res.ok) throw new Error('Download failed');
      return res.blob();
    }).then(blob => {
      if (!blob || blob.size < 100) {
        generateClientCSV();
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'QuestionBank_Reviewed.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Question Bank CSV downloaded successfully', 'success');
    }).catch(() => {
      generateClientCSV();
    });
  };
  const startPracticeMode = ({
    moduleVal,
    topicsVal,
    batchVal,
    solvingCount,
    elementCount,
    limitVal = 50
  }) => {
    setExamMode('practice');
    setExamSubmitted(false);
    setUserAnswers({});
    setActiveQuestionIndex(0);
    setShowExplanation(true);
    setPracticeModalOpen(false);
    setQuizListModalOpen(false);
    setTimerActive(false);
    setActiveQuiz(null);
    const hasTypeBreakdown = solvingCount !== undefined || elementCount !== undefined;
    const sCount = Math.max(0, parseInt(solvingCount, 10) || 0);
    const eCount = Math.max(0, parseInt(elementCount, 10) || 0);
    const targetLimit = hasTypeBreakdown && sCount + eCount > 0 ? sCount + eCount : parseInt(limitVal, 10) || 50;
    const queryObj = {
      limit: targetLimit,
      random: 'true'
    };
    if (moduleVal) queryObj.module = moduleVal;
    if (topicsVal) queryObj.topics = topicsVal;
    if (batchVal) queryObj.batch = batchVal;
    if (hasTypeBreakdown && sCount + eCount > 0) {
      queryObj.solvingCount = sCount;
      queryObj.elementCount = eCount;
    }
    const query = new URLSearchParams(queryObj).toString();
    fetch(`${API_BASE}/api/questions?${query}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => res.json()).then(data => {
      let qList = data.questions || [];
      if (qList.length > targetLimit) {
        qList = qList.slice(0, targetLimit);
      }
      setQuestions(qList);
      setView('exam');
    }).catch(console.error);
  };
  const launchPostedQuiz = quiz => {
    setActiveQuiz(quiz);
    setExamMode('mock');
    setExamSubmitted(false);
    setUserAnswers({});
    setActiveQuestionIndex(0);
    setShowExplanation(false);
    setQuizListModalOpen(false);
    let queryUrl = '';
    const hasTypeCounts = quiz.solvingCount !== undefined || quiz.elementCount !== undefined;
    const sCount = Math.max(0, parseInt(quiz.solvingCount, 10) || 0);
    const eCount = Math.max(0, parseInt(quiz.elementCount, 10) || 0);
    const targetCount = hasTypeCounts && sCount + eCount > 0 ? sCount + eCount : parseInt(quiz.questionCount, 10) || 50;
    if (quiz.specificQuestionIds && quiz.specificQuestionIds.length > 0) {
      queryUrl = `${API_BASE}/api/questions?ids=${encodeURIComponent(quiz.specificQuestionIds.join(','))}`;
    } else {
      const queryObj = {
        limit: targetCount,
        random: 'true'
      };
      if (quiz.module) queryObj.module = quiz.module;
      if (quiz.topics) queryObj.topics = quiz.topics;
      if (hasTypeCounts && sCount + eCount > 0) {
        queryObj.solvingCount = sCount;
        queryObj.elementCount = eCount;
      }
      queryUrl = `${API_BASE}/api/questions?${new URLSearchParams(queryObj).toString()}`;
    }
    fetch(queryUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => res.json()).then(data => {
      let qList = data.questions || [];
      if (qList.length > targetCount) {
        qList = qList.slice(0, targetCount);
      }
      setQuestions(qList);
      setView('exam');
      setExamTimer((quiz.durationMins || 50) * 60);
      setTimerActive(true);
    }).catch(console.error);
  };
  const startDiagnosticBenchmark = () => {
    fetch(`${API_BASE}/api/adaptive/diagnostic/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => res.json()).then(data => {
      setQuestions(data.questions || []);
      setActiveQuiz({
        id: 'diagnostic_benchmark',
        title: 'Step 1: Diagnostic Benchmark Assessment (100 Items)',
        passingScorePct: 70,
        durationMins: 90,
        isDiagnostic: true
      });
      setExamMode('mock');
      setExamSubmitted(false);
      setUserAnswers({});
      setActiveQuestionIndex(0);
      setShowExplanation(false);
      setExamTimer(90 * 60);
      setTimerActive(true);
      setView('exam');
    }).catch(err => showToast('Error launching diagnostic benchmark: ' + err.message, 'error'));
  };
  const startAdaptiveSmartQuiz = () => {
    fetch(`${API_BASE}/api/adaptive/smart-quiz`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => res.json()).then(data => {
      setQuestions(data.questions || []);
      setActiveQuiz({
        id: 'adaptive_smart_quiz',
        title: data.title || 'Step 3: Adaptive Smart-Quiz (Weak Spot Targeted)',
        passingScorePct: 75,
        durationMins: 30,
        isSmartQuiz: true,
        targetModule: data.targetModule
      });
      setExamMode('mock');
      setExamSubmitted(false);
      setUserAnswers({});
      setActiveQuestionIndex(0);
      setShowExplanation(false);
      setExamTimer(30 * 60);
      setTimerActive(true);
      setView('exam');
    }).catch(err => showToast('Error launching smart quiz: ' + err.message, 'error'));
  };
  const startBoardSimulation = () => {
    fetch(`${API_BASE}/api/adaptive/simulation/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => res.json()).then(data => {
      setQuestions(data.questions || []);
      setActiveQuiz({
        id: 'board_exam_simulation',
        title: 'Step 4: Simulated Board Exam (100 Items)',
        passingScorePct: 75,
        durationMins: 240,
        isSimulation: true
      });
      setExamMode('mock');
      setExamSubmitted(false);
      setUserAnswers({});
      setActiveQuestionIndex(0);
      setShowExplanation(false);
      setExamTimer(240 * 60);
      setTimerActive(true);
      setView('exam');
    }).catch(err => showToast('Error launching board simulation: ' + err.message, 'error'));
  };
  const recordQuizAttempt = (score, total, pct, passed, timeSpentSecs) => {
    const questionBreakdown = buildAttemptQuestionBreakdown(questions, qItem => userAnswers[qItem.ID] || '');
    if (activeQuiz && activeQuiz.isDiagnostic) {
      fetch(`${API_BASE}/api/adaptive/diagnostic/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userAnswers,
          timeSpentSeconds: timeSpentSecs,
          questionDetails: questions,
          questionBreakdown
        })
      }).then(res => res.json()).then(data => {
        console.log('Diagnostic benchmark recorded:', data);
        loadStats();
      }).catch(console.error);
      return;
    }
    if (activeQuiz && activeQuiz.isSimulation) {
      fetch(`${API_BASE}/api/adaptive/simulation/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userAnswers,
          timeSpentSeconds: timeSpentSecs,
          questionDetails: questions,
          questionBreakdown
        })
      }).then(res => res.json()).then(data => {
        console.log('Board simulation attempt recorded:', data);
        loadStats();
      }).catch(console.error);
      return;
    }
    if (activeQuiz && activeQuiz.isSmartQuiz) {
      fetch(`${API_BASE}/api/adaptive/smart-quiz/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userAnswers,
          timeSpentSeconds: timeSpentSecs,
          questionDetails: questions,
          targetModule: activeQuiz.targetModule,
          questionBreakdown
        })
      }).then(res => res.json()).then(data => {
        console.log('Smart Quiz attempt recorded & statistics updated:', data);
        loadStats();
      }).catch(console.error);
      return;
    }
    const moduleBreakdown = {};
    questions.forEach(qItem => {
      const mod = qItem.Module || 'Module 1 - Power Plant Elements';
      if (!moduleBreakdown[mod]) moduleBreakdown[mod] = {
        total: 0,
        correct: 0
      };
      moduleBreakdown[mod].total++;
      if (userAnswers[qItem.ID] === qItem.CorrectAnswer) {
        moduleBreakdown[mod].correct++;
      }
    });
    fetch(`${API_BASE}/api/attempts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quizId: activeQuiz ? activeQuiz.id : 'custom_quiz',
        quizTitle: activeQuiz ? activeQuiz.title : 'Board Prep Quiz',
        score,
        correctAnswers: score,
        totalQuestions: total,
        percentage: pct,
        scorePct: pct,
        passed,
        timeSpentSeconds: timeSpentSecs,
        moduleBreakdown,
        questionBreakdown
      })
    }).then(res => res.json()).then(data => {
      console.log('Quiz attempt recorded successfully:', data);
      loadStats();
    }).catch(console.error);
  };
  const toggleQuizStatus = qz => {
    const newStatus = qz.status === 'published' ? 'draft' : 'published';
    setQuizzesList(prev => prev.map(q => q && q.id === qz.id ? {
      ...q,
      status: newStatus
    } : q));
    fetch(`${API_BASE}/api/quizzes/${qz.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: newStatus
      })
    }).then(() => loadQuizzes());
  };
  const deleteQuiz = (id, title) => {
    const quizTitle = title || (quizzesList.find(q => q && q.id === id) || {}).title || `Quiz #${id}`;
    showConfirmDialog({
      title: 'Delete Board Quiz',
      message: `Are you sure you want to permanently delete board quiz "${quizTitle}"? All student attempts associated with it will remain in history logs.`,
      confirmText: 'Delete Quiz',
      type: 'danger',
      onConfirm: () => {
        setQuizzesList(prev => prev.filter(q => q.id !== id));
        fetch(`${API_BASE}/api/quizzes/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json()).then(data => {
          if (data.error) showToast('Error: ' + data.error, 'error');else showToast(`Board quiz "${quizTitle}" deleted successfully`, 'success');
          loadQuizzes();
        }).catch(err => {
          console.error('Delete quiz error:', err);
          showToast('Delete quiz error: ' + err.message, 'error');
          loadQuizzes();
        });
      }
    });
  };

  // Timer countdown for Quiz
  useEffect(() => {
    let interval = null;
    if (timerActive && examTimer > 0 && !examSubmitted) {
      interval = setInterval(() => {
        setExamTimer(prev => prev - 1);
      }, 1000);
    } else if (examTimer === 0 && timerActive) {
      setExamSubmitted(true);
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, examTimer, examSubmitted]);

  // Auth Submit Handlers
  const handleAuthSubmit = (e, type, selectedRole) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData.entries());
    body.role = selectedRole;
    const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/register';
    fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).then(res => res.json().then(data => ({
      status: res.status,
      data
    }))).then(({
      status,
      data
    }) => {
      if (status >= 400) {
        showToast(data.error || 'Authentication failed', 'error');
      } else if (data.pending) {
        setAuthModal(null);
        showToast(data.message || 'Registration submitted! Your student account is now awaiting administrator approval. You will be able to log in once an administrator approves your registration.', 'warning', 6500);
      } else {
        // Reset previous session history so each login starts fresh with clean tests
        setUserAnswers({});
        setActiveQuestionIndex(0);
        setShowExplanation(false);
        setActiveQuiz(null);
        setExamSubmitted(false);
        setTimerActive(false);
        setView('dashboard');
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setAuthModal(null);
        loadStats(data.token);
        loadQuizzes();
        showToast(`Welcome back, ${data.user?.fullName || 'Reviewee'}!`, 'success');
      }
    }).catch(err => showToast('Network error: ' + err.message, 'error'));
  };
  const pendingApprovalCount = user && user.role === 'admin' ? (usersList || []).filter(u => u && u.role === 'student' && u.status === 'pending').length : 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "app-container"
  }, /*#__PURE__*/React.createElement("header", {
    className: "navbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nav-brand",
    onClick: () => {
      setUserAnswers({});
      setActiveQuestionIndex(0);
      setShowExplanation(false);
      setActiveQuiz(null);
      setExamSubmitted(false);
      setTimerActive(false);
      setView('dashboard');
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "images/neust_coe_seal.png",
    alt: "NEUST COE Seal",
    style: {
      width: '38px',
      height: '38px',
      objectFit: 'contain'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '1.25rem',
      fontWeight: '800',
      lineHeight: '1.1'
    }
  }, "ME ", /*#__PURE__*/React.createElement("span", {
    className: "gradient-text"
  }, "BoardPrep")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.68rem',
      color: '#fbbf24',
      fontWeight: '600',
      letterSpacing: '0.03em'
    }
  }, "NEUST College of Engineering"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.85rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "device-mode-switcher",
    title: "Switch Layout Fit: Mobile Phone or Laptop"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `device-pill-btn ${deviceMode === 'auto' ? 'active' : ''}`,
    onClick: () => setDeviceMode('auto'),
    title: "Auto-Fit: Responsively adapts to current screen size"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD04"), " ", /*#__PURE__*/React.createElement("span", {
    className: "device-btn-label"
  }, "Auto")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `device-pill-btn ${deviceMode === 'mobile' ? 'active' : ''}`,
    onClick: () => setDeviceMode('mobile'),
    title: "Mobile Phone Mode: Fits layout into touch-friendly smartphone view"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCF1"), " ", /*#__PURE__*/React.createElement("span", {
    className: "device-btn-label"
  }, "Phone")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `device-pill-btn ${deviceMode === 'laptop' ? 'active' : ''}`,
    onClick: () => setDeviceMode('laptop'),
    title: "Laptop Mode: Full widescreen desktop layout"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCBB"), " ", /*#__PURE__*/React.createElement("span", {
    className: "device-btn-label"
  }, "Laptop"))), /*#__PURE__*/React.createElement("nav", {
    className: "nav-items"
  }, /*#__PURE__*/React.createElement("button", {
    className: `nav-btn ${view === 'dashboard' ? 'active' : ''}`,
    onClick: () => {
      setUserAnswers({});
      setActiveQuestionIndex(0);
      setShowExplanation(false);
      setActiveQuiz(null);
      setExamSubmitted(false);
      setTimerActive(false);
      setView('dashboard');
    }
  }, "Dashboard"), user && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: `nav-btn ${view === 'audit' ? 'active' : ''}`,
    onClick: () => {
      loadQuestions({
        page: 1,
        limit: 20
      });
      setView('audit');
    }
  }, "Question Explorer"), /*#__PURE__*/React.createElement("button", {
    className: "nav-btn",
    onClick: () => setPracticeModalOpen(true)
  }, "\uD83D\uDCD6 Practice Mode"), /*#__PURE__*/React.createElement("button", {
    className: "nav-btn",
    onClick: () => {
      loadQuizzes();
      setQuizListModalOpen(true);
    }
  }, "\u23F1\uFE0F Board Quizzes"), /*#__PURE__*/React.createElement("button", {
    className: "nav-btn",
    onClick: () => {
      loadAttempts();
      setSelectedQuizFilterForResults(null);
      setQuizResultsModalOpen(true);
    }
  }, "\uD83D\uDCCA My Results")), user && user.role === 'admin' && /*#__PURE__*/React.createElement("button", {
    className: `nav-btn ${view === 'admin' ? 'active' : ''}`,
    onClick: () => {
      loadUsers();
      loadQuestions({
        page: 1,
        limit: 20
      });
      loadQuizzes();
      loadAttempts();
      setView('admin');
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-admin",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem'
    }
  }, "Admin Portal", pendingApprovalCount > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      background: '#f59e0b',
      color: '#000',
      padding: '1px 6px',
      borderRadius: '10px',
      fontSize: '0.72rem',
      fontWeight: '800'
    }
  }, pendingApprovalCount))), /*#__PURE__*/React.createElement("button", {
    className: "nav-btn",
    onClick: () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  }, theme === 'dark' ? '☀️ Light' : '🌙 Dark'), user ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: `badge ${user.role === 'admin' ? 'badge-admin' : 'badge-student'}`
  }, user.fullName, " (", user.role, ")"), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      padding: '0.4rem 0.8rem',
      fontSize: '0.85rem'
    },
    onClick: () => setProfileModalOpen(true)
  }, "\u2699\uFE0F Profile"), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      padding: '0.4rem 0.8rem',
      fontSize: '0.85rem'
    },
    onClick: logout
  }, "Logout")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    onClick: () => setAuthModal('login')
  }, "Login"), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: () => setAuthModal('signup')
  }, "Sign Up"))), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "mobile-menu-toggle",
    onClick: () => setMobileMenuOpen(prev => !prev),
    "aria-label": "Toggle navigation menu",
    title: "Open Menu"
  }, mobileMenuOpen ? '✕' : '☰'))), mobileMenuOpen && /*#__PURE__*/React.createElement("div", {
    className: "mobile-nav-drawer"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '0.85rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.72rem',
      color: 'var(--text-muted)',
      fontWeight: '700',
      letterSpacing: '0.05em'
    }
  }, "LAYOUT DISPLAY MODE"), /*#__PURE__*/React.createElement("div", {
    className: "device-mode-switcher",
    style: {
      width: '100%',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `device-pill-btn ${deviceMode === 'auto' ? 'active' : ''}`,
    style: {
      flex: 1,
      justifyContent: 'center'
    },
    onClick: () => setDeviceMode('auto')
  }, "\uD83D\uDD04 Auto-Fit"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `device-pill-btn ${deviceMode === 'mobile' ? 'active' : ''}`,
    style: {
      flex: 1,
      justifyContent: 'center'
    },
    onClick: () => setDeviceMode('mobile')
  }, "\uD83D\uDCF1 Mobile Phone"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `device-pill-btn ${deviceMode === 'laptop' ? 'active' : ''}`,
    style: {
      flex: 1,
      justifyContent: 'center'
    },
    onClick: () => setDeviceMode('laptop')
  }, "\uD83D\uDCBB Laptop"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: `drawer-nav-item ${view === 'dashboard' ? 'active' : ''}`,
    onClick: () => {
      setUserAnswers({});
      setActiveQuestionIndex(0);
      setShowExplanation(false);
      setActiveQuiz(null);
      setExamSubmitted(false);
      setTimerActive(false);
      setView('dashboard');
      setMobileMenuOpen(false);
    }
  }, "\uD83C\uDFE0 Dashboard"), user && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "drawer-nav-item",
    onClick: () => {
      setPracticeModalOpen(true);
      setMobileMenuOpen(false);
    }
  }, "\uD83D\uDCD6 Practice Mode"), /*#__PURE__*/React.createElement("button", {
    className: "drawer-nav-item",
    onClick: () => {
      loadQuizzes();
      setQuizListModalOpen(true);
      setMobileMenuOpen(false);
    }
  }, "\u23F1\uFE0F Board Quizzes"), /*#__PURE__*/React.createElement("button", {
    className: "drawer-nav-item",
    onClick: () => {
      loadAttempts();
      setSelectedQuizFilterForResults(null);
      setQuizResultsModalOpen(true);
      setMobileMenuOpen(false);
    }
  }, "\uD83D\uDCCA My Quiz Results"), /*#__PURE__*/React.createElement("button", {
    className: `drawer-nav-item ${view === 'audit' ? 'active' : ''}`,
    onClick: () => {
      loadQuestions({
        page: 1,
        limit: 20
      });
      setView('audit');
      setMobileMenuOpen(false);
    }
  }, "\uD83D\uDD0D Question Explorer")), user && user.role === 'admin' && /*#__PURE__*/React.createElement("button", {
    className: `drawer-nav-item ${view === 'admin' ? 'active' : ''}`,
    onClick: () => {
      loadUsers();
      loadQuestions({
        page: 1,
        limit: 20
      });
      loadQuizzes();
      loadAttempts();
      setView('admin');
      setMobileMenuOpen(false);
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDEE1\uFE0F Admin Portal"), pendingApprovalCount > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      background: '#f59e0b',
      color: '#000',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: '800'
    }
  }, pendingApprovalCount, " Pending")), /*#__PURE__*/React.createElement("button", {
    className: "drawer-nav-item",
    onClick: () => {
      setTheme(t => t === 'dark' ? 'light' : 'dark');
    }
  }, theme === 'dark' ? '☀️ Switch to Light Theme' : '🌙 Switch to Dark Theme')), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border-color)',
      paddingTop: '0.85rem'
    }
  }, user ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.65rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: `badge ${user.role === 'admin' ? 'badge-admin' : 'badge-student'}`
  }, user.fullName, " (", user.role, ")"), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      padding: '0.35rem 0.75rem',
      fontSize: '0.8rem'
    },
    onClick: () => {
      setProfileModalOpen(true);
      setMobileMenuOpen(false);
    }
  }, "\u2699\uFE0F Profile")), /*#__PURE__*/React.createElement("button", {
    className: "btn-danger",
    style: {
      width: '100%',
      padding: '0.6rem'
    },
    onClick: () => {
      logout();
      setMobileMenuOpen(false);
    }
  }, "Logout")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    onClick: () => {
      setAuthModal('login');
      setMobileMenuOpen(false);
    }
  }, "Login"), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: () => {
      setAuthModal('signup');
      setMobileMenuOpen(false);
    }
  }, "Sign Up")))), deviceMode !== 'auto' && /*#__PURE__*/React.createElement("div", {
    className: "device-mode-status-banner"
  }, /*#__PURE__*/React.createElement("span", null, deviceMode === 'mobile' ? '📱 Mobile Phone Mode Active — Layout fitted for smartphone screens' : '💻 Laptop / Desktop Mode Active — Full widescreen layout'), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "device-mode-status-reset",
    onClick: () => setDeviceMode('auto')
  }, "Reset to Auto \uD83D\uDD04")), /*#__PURE__*/React.createElement("main", {
    className: "main-content"
  }, !user ? /*#__PURE__*/React.createElement(HeroSection, {
    onLoginClick: () => setAuthModal('login'),
    onSignupClick: () => setAuthModal('signup')
  }) : /*#__PURE__*/React.createElement("div", {
    className: "tab-content-fade",
    key: view
  }, view === 'dashboard' && /*#__PURE__*/React.createElement(DashboardView, {
    token: token,
    user: user,
    stats: stats,
    openPracticeModal: () => setPracticeModalOpen(true),
    openQuizListModal: () => {
      loadQuizzes();
      setQuizListModalOpen(true);
    },
    openQuizResultsModal: () => {
      loadAttempts();
      setSelectedQuizFilterForResults(null);
      setQuizResultsModalOpen(true);
    },
    startDiagnosticBenchmark: startDiagnosticBenchmark,
    startAdaptiveSmartQuiz: startAdaptiveSmartQuiz,
    startBoardSimulation: startBoardSimulation,
    setView: setView,
    loadQuestions: loadQuestions,
    downloadReviewedCSV: downloadReviewedCSV
  }), view === 'exam' && /*#__PURE__*/React.createElement(ExamView, {
    questions: questions,
    activeQuiz: activeQuiz,
    activeIdx: activeQuestionIndex,
    setActiveIdx: setActiveQuestionIndex,
    userAnswers: userAnswers,
    setUserAnswers: setUserAnswers,
    showExplanation: showExplanation,
    setShowExplanation: setShowExplanation,
    examMode: examMode,
    examTimer: examTimer,
    examSubmitted: examSubmitted,
    setExamSubmitted: setExamSubmitted,
    recordQuizAttempt: recordQuizAttempt,
    startBoardSimulation: startBoardSimulation,
    startAdaptiveSmartQuiz: startAdaptiveSmartQuiz,
    onFinish: () => {
      setUserAnswers({});
      setActiveQuestionIndex(0);
      setShowExplanation(false);
      setActiveQuiz(null);
      setExamSubmitted(false);
      setTimerActive(false);
      setView('dashboard');
    }
  }), view === 'audit' && /*#__PURE__*/React.createElement(BatchAuditView, {
    questions: questions,
    loadQuestions: loadQuestions,
    totalQuestionsCount: totalQuestionsCount,
    totalPagesCount: totalPagesCount,
    searchQuery: searchQuery,
    setSearchQuery: setSearchQuery,
    moduleFilter: moduleFilter,
    setModuleFilter: setModuleFilter,
    batchFilter: batchFilter,
    setBatchFilter: setBatchFilter,
    typeFilter: typeFilter,
    setTypeFilter: setTypeFilter,
    statusFilter: statusFilter,
    setStatusFilter: setStatusFilter,
    downloadReviewedCSV: downloadReviewedCSV
  }), view === 'admin' && user.role === 'admin' && /*#__PURE__*/React.createElement(AdminView, {
    stats: stats,
    loadStats: loadStats,
    usersList: usersList,
    loadUsers: loadUsers,
    questions: questions,
    loadQuestions: loadQuestions,
    quizzesList: quizzesList,
    loadQuizzes: loadQuizzes,
    attemptsList: attemptsList,
    loadAttempts: loadAttempts,
    totalQuestionsCount: totalQuestionsCount,
    totalPagesCount: totalPagesCount,
    openUserModal: userToEdit => {
      setEditingUser(userToEdit);
      setUserModalOpen(true);
    },
    openQuestionModal: qToEdit => {
      setEditingQuestion(qToEdit);
      setQuestionModalOpen(true);
    },
    openQuizEditorModal: qzToEdit => {
      setEditingQuiz(qzToEdit);
      setQuizEditorModalOpen(true);
    },
    openQuizResultsModal: qzFilter => {
      setSelectedQuizFilterForResults(qzFilter);
      loadAttempts();
      setQuizResultsModalOpen(true);
    },
    openUserDetailModal: uDetail => {
      setSelectedUserDetail(uDetail);
      setUserDetailModalOpen(true);
    },
    downloadReviewedCSV: downloadReviewedCSV,
    deleteQuiz: deleteQuiz,
    toggleQuizStatus: toggleQuizStatus,
    showToast: showToast,
    showConfirmDialog: showConfirmDialog
  }))), authModal && /*#__PURE__*/React.createElement(AuthModal, {
    authModal: authModal,
    setAuthModal: setAuthModal,
    handleAuthSubmit: handleAuthSubmit
  }), practiceModalOpen && /*#__PURE__*/React.createElement(PracticeConfigModal, {
    onClose: () => setPracticeModalOpen(false),
    onStart: startPracticeMode
  }), quizListModalOpen && /*#__PURE__*/React.createElement(QuizListModal, {
    quizzes: quizzesList,
    myAttempts: myAttempts,
    onClose: () => setQuizListModalOpen(false),
    onLaunch: launchPostedQuiz,
    user: user,
    openQuizEditorModal: qzToEdit => {
      setEditingQuiz(qzToEdit);
      setQuizEditorModalOpen(true);
    },
    openQuizResultsModal: qzFilter => {
      setSelectedQuizFilterForResults(qzFilter);
      loadAttempts();
      setQuizResultsModalOpen(true);
    },
    toggleQuizStatus: toggleQuizStatus,
    deleteQuiz: deleteQuiz,
    isLoading: isLoadingQuizzes,
    onRefresh: loadQuizzes
  }), quizResultsModalOpen && /*#__PURE__*/React.createElement(QuizResultsModal, {
    attempts: attemptsList,
    quizzes: quizzesList,
    selectedQuizFilter: selectedQuizFilterForResults,
    setSelectedQuizFilter: setSelectedQuizFilterForResults,
    user: user,
    onClose: () => setQuizResultsModalOpen(false)
  }), userDetailModalOpen && selectedUserDetail && /*#__PURE__*/React.createElement(UserDetailModal, {
    user: selectedUserDetail,
    attemptsList: attemptsList,
    quizzesList: quizzesList,
    onClose: () => {
      setUserDetailModalOpen(false);
      setSelectedUserDetail(null);
    }
  }), profileModalOpen && /*#__PURE__*/React.createElement(ProfileModal, {
    user: user,
    setUser: setUser,
    onClose: () => setProfileModalOpen(false)
  }), userModalOpen && /*#__PURE__*/React.createElement(UserModal, {
    editingUser: editingUser,
    onClose: () => {
      setUserModalOpen(false);
      setEditingUser(null);
    },
    onSaved: () => loadUsers()
  }), questionModalOpen && /*#__PURE__*/React.createElement(QuestionModal, {
    editingQuestion: editingQuestion,
    onClose: () => {
      setQuestionModalOpen(false);
      setEditingQuestion(null);
    },
    onSaved: () => loadQuestions({
      page: 1,
      limit: 20
    })
  }), quizEditorModalOpen && /*#__PURE__*/React.createElement(QuizEditorModal, {
    editingQuiz: editingQuiz,
    onClose: () => {
      setQuizEditorModalOpen(false);
      setEditingQuiz(null);
    },
    onSaved: savedQuiz => {
      if (savedQuiz && savedQuiz.id) {
        setQuizzesList(prev => {
          const idx = prev.findIndex(q => q && q.id === savedQuiz.id);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = savedQuiz;
            return copy;
          }
          return [savedQuiz, ...prev];
        });
      }
      loadQuizzes();
    }
  }), /*#__PURE__*/React.createElement(ConfirmModal, {
    isOpen: confirmState.isOpen,
    title: confirmState.title,
    message: confirmState.message,
    confirmText: confirmState.confirmText,
    cancelText: confirmState.cancelText,
    type: confirmState.type,
    onConfirm: confirmState.onConfirm,
    onCancel: closeConfirmDialog
  }), /*#__PURE__*/React.createElement(ToastContainer, {
    toasts: toasts,
    removeToast: removeToast
  }), /*#__PURE__*/React.createElement(Footer, {
    deviceMode: deviceMode,
    setDeviceMode: setDeviceMode
  }));
}

// INSTITUTIONAL CREATOR ATTRIBUTION BANNER
function CreatorAttributionBanner() {
  return /*#__PURE__*/React.createElement("div", {
    className: "creator-banner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "creator-seals"
  }, /*#__PURE__*/React.createElement("img", {
    src: "images/neust_seal.png",
    alt: "NEUST University Seal",
    className: "creator-seal-img"
  }), /*#__PURE__*/React.createElement("img", {
    src: "images/neust_coe_seal.png",
    alt: "NEUST College of Engineering Seal",
    className: "creator-seal-img"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: '#fbbf24',
      fontWeight: '800',
      fontSize: '0.78rem',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      marginBottom: '0.2rem'
    }
  }, "\uD83C\uDFDB\uFE0F Institutional Developer & Platform Creator"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: '1.25rem',
      color: '#ffffff',
      marginBottom: '0.2rem'
    }
  }, "Nueva Ecija University of Science and Technology (NEUST)"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.85rem',
      lineHeight: '1.4'
    }
  }, "College of Engineering \u2014 Department of Mechanical Engineering (Est. 1968 / Centennial 1908-2008). Built exclusively for Mechanical Engineering Board Exam Reviewees.")));
}

// SHARED INSTITUTIONAL FOOTER
function Footer({
  deviceMode,
  setDeviceMode
}) {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      marginTop: '4rem',
      padding: '2.5rem 1rem',
      borderTop: '1px solid var(--border-color)',
      textAlign: 'center',
      background: 'rgba(15, 23, 42, 0.75)',
      position: 'relative',
      zIndex: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '1.25rem',
      marginBottom: '1rem'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "images/neust_seal.png",
    alt: "NEUST Seal",
    style: {
      width: '48px',
      height: '48px',
      objectFit: 'contain'
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: "images/neust_coe_seal.png",
    alt: "NEUST COE Seal",
    style: {
      width: '48px',
      height: '48px',
      objectFit: 'contain'
    }
  })), /*#__PURE__*/React.createElement("p", {
    style: {
      fontWeight: '800',
      color: '#ffffff',
      fontSize: '1.05rem'
    }
  }, "Nueva Ecija University of Science and Technology (NEUST)"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: '#fbbf24',
      fontWeight: '600',
      fontSize: '0.9rem',
      marginTop: '0.2rem'
    }
  }, "College of Engineering \u2014 Department of Mechanical Engineering (Est. 1968)"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.85rem',
      marginTop: '0.5rem',
      maxWidth: '650px',
      margin: '0.5rem auto 0'
    }
  }, "Official Licensure Board Examination Preparation Platform & Solved 5,036 Item Question Bank Repository."), setDeviceMode && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '1.5rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '0.75rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.78rem',
      color: 'var(--text-dim)',
      fontWeight: '600'
    }
  }, "DISPLAY MODE:"), /*#__PURE__*/React.createElement("div", {
    className: "device-mode-switcher"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `device-pill-btn ${deviceMode === 'auto' ? 'active' : ''}`,
    onClick: () => setDeviceMode('auto')
  }, "\uD83D\uDD04 Auto-Fit"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `device-pill-btn ${deviceMode === 'mobile' ? 'active' : ''}`,
    onClick: () => setDeviceMode('mobile')
  }, "\uD83D\uDCF1 Mobile Phone"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: `device-pill-btn ${deviceMode === 'laptop' ? 'active' : ''}`,
    onClick: () => setDeviceMode('laptop')
  }, "\uD83D\uDCBB Laptop"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.78rem',
      color: 'var(--text-dim)',
      marginTop: '1.25rem'
    }
  }, "\xA9 2026 NEUST BS Mechanical Engineering. All Rights Reserved. Powered by First-Principles Solutions."));
}

// ADAPTIVE LEARNING & KNOWLEDGE GAP ANALYTICS WIDGET (5-STEP MODEL)
function AdaptiveAnalyticsWidget({
  token,
  user,
  stats,
  startDiagnosticBenchmark,
  startAdaptiveSmartQuiz,
  startBoardSimulation
}) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchAnalytics = () => {
    fetch(`${API_BASE}/api/adaptive/analytics`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => res.json()).then(data => {
      setAnalytics(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };
  useEffect(() => {
    fetchAnalytics();
  }, [token, stats]);
  if (loading) return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '1rem',
      color: 'var(--text-muted)'
    }
  }, "Loading Adaptive Learning analytics...");
  if (!analytics) return null;
  const {
    readinessIndex,
    isReadyForBoard,
    diagnosticCompleted,
    moduleMastery,
    recommendedFocusModule,
    simulationUnlocked,
    simulationPassed,
    simulationAttemptsCount,
    lastSimulationScore,
    needsRemediation,
    readinessStatus
  } = analytics;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: '2.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '0.75rem',
      marginBottom: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: `adaptive-step-card ${diagnosticCompleted ? 'completed' : 'active'}`,
    style: {
      padding: '1rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "step-number-badge"
  }, "Step 1"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '700',
      fontSize: '0.85rem',
      marginTop: '0.3rem'
    }
  }, "Diagnostic Benchmark"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-muted)'
    }
  }, diagnosticCompleted ? '✓ Completed (100 Items)' : '100-Item Baseline')), /*#__PURE__*/React.createElement("div", {
    className: `adaptive-step-card ${diagnosticCompleted ? 'completed' : ''}`,
    style: {
      padding: '1rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "step-number-badge"
  }, "Step 2"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '700',
      fontSize: '0.85rem',
      marginTop: '0.3rem'
    }
  }, "Knowledge Gap Analysis"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-muted)'
    }
  }, diagnosticCompleted ? '✓ Analytics Active' : 'Data-Driven Matrix')), /*#__PURE__*/React.createElement("div", {
    className: `adaptive-step-card ${diagnosticCompleted ? 'completed' : ''}`,
    style: {
      padding: '1rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "step-number-badge"
  }, "Step 3"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '700',
      fontSize: '0.85rem',
      marginTop: '0.3rem'
    }
  }, "Adaptive Targeted Practice"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-muted)'
    }
  }, "Weak Spot Smart-Quizzes")), /*#__PURE__*/React.createElement("div", {
    className: `adaptive-step-card ${simulationUnlocked ? simulationPassed ? 'completed' : 'active' : ''}`,
    style: {
      padding: '1rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "step-number-badge"
  }, "Step 4"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '700',
      fontSize: '0.85rem',
      marginTop: '0.3rem'
    }
  }, "Simulated Board Exam"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-muted)'
    }
  }, simulationPassed ? '✓ Simulation Passed' : simulationUnlocked ? 'Unlocked (100 Items)' : 'Locked until Practice')), /*#__PURE__*/React.createElement("div", {
    className: `adaptive-step-card ${isReadyForBoard ? 'completed' : needsRemediation ? 'warning' : ''}`,
    style: {
      padding: '1rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "step-number-badge"
  }, "Step 5"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '700',
      fontSize: '0.85rem',
      marginTop: '0.3rem'
    }
  }, "Readiness Loop"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-muted)'
    }
  }, isReadyForBoard ? '🟢 Green Light Ready' : needsRemediation ? '⚠️ Remediation Active' : 'Guaranteed Path'))), isReadyForBoard ? /*#__PURE__*/React.createElement("div", {
    className: "green-light-banner"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '2.8rem',
      marginBottom: '0.5rem'
    }
  }, "\uD83D\uDFE2 \uD83C\uDF93 \uD83C\uDFC6"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: '2rem',
      color: 'var(--success)',
      marginBottom: '0.5rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }
  }, "Congratulations, you are now ready to take the board exam."), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-main)',
      fontSize: '1.1rem',
      maxWidth: '750px',
      margin: '0 auto 1.25rem'
    }
  }, "You have successfully completed the ", /*#__PURE__*/React.createElement("strong", null, "Guaranteed Readiness Path"), "! Passed the 100-item Simulated Board Exam with a mastery score of ", /*#__PURE__*/React.createElement("strong", null, lastSimulationScore, "%"), " in a real-world testing environment across all subjects."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: '0.75rem',
      flexWrap: 'wrap',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-status",
    style: {
      fontSize: '0.9rem',
      padding: '0.5rem 1rem'
    }
  }, "\u2713 Real-World Simulation Passed (", lastSimulationScore, "%)"), /*#__PURE__*/React.createElement("span", {
    className: "badge badge-admin",
    style: {
      fontSize: '0.9rem',
      padding: '0.5rem 1rem'
    }
  }, "\u2713 All 6 Curriculum Modules Mastered"), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      fontSize: '0.85rem',
      padding: '0.45rem 1rem',
      background: 'linear-gradient(135deg, #10b981, #059669)'
    },
    onClick: startBoardSimulation
  }, "\uD83D\uDD04 Retake Simulation"), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      fontSize: '0.85rem',
      padding: '0.45rem 1rem'
    },
    onClick: startDiagnosticBenchmark
  }, "\uD83D\uDD04 Retake Diagnostic"))) : /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.75rem',
      marginBottom: '1.75rem',
      border: '1px solid var(--border-glow)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
      flexWrap: 'wrap',
      gap: '1rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "step-number-badge"
  }, "5-Step Guaranteed Readiness Engine"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: '1.4rem'
    }
  }, "Adaptive Board Readiness Index: ", /*#__PURE__*/React.createElement("span", {
    className: "gradient-text"
  }, readinessIndex, "%")), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.9rem',
      marginTop: '0.2rem'
    }
  }, /*#__PURE__*/React.createElement("strong", null, "Status:"), " ", readinessStatus)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap',
      alignItems: 'center'
    }
  }, !diagnosticCompleted ? /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: startDiagnosticBenchmark
  }, "\uD83D\uDE80 Step 1: Start Diagnostic Benchmark (100 Items)") : simulationUnlocked ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      fontSize: '0.85rem',
      padding: '0.45rem 0.9rem'
    },
    onClick: startDiagnosticBenchmark
  }, "\uD83D\uDD04 Retake Diagnostic"), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      background: 'linear-gradient(135deg, #10b981, #059669)'
    },
    onClick: startBoardSimulation
  }, "\uD83C\uDFDB\uFE0F Step 4: Launch Simulated Board Exam (100 Items)")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      fontSize: '0.85rem',
      padding: '0.45rem 0.9rem'
    },
    onClick: startDiagnosticBenchmark
  }, "\uD83D\uDD04 Retake Diagnostic"), /*#__PURE__*/React.createElement("span", {
    className: "badge badge-admin",
    style: {
      background: 'rgba(245, 158, 11, 0.15)',
      color: 'var(--warning)',
      borderColor: 'var(--warning)',
      padding: '0.5rem 0.8rem',
      fontSize: '0.82rem'
    }
  }, "\uD83D\uDD12 Step 4 Locked (Target: 75% Readiness)"), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: startAdaptiveSmartQuiz
  }, "\u26A1 Step 3: Launch Smart-Quiz (Current: ", readinessIndex, "%)")))), needsRemediation && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '1rem 1.25rem',
      background: 'rgba(245, 158, 11, 0.12)',
      borderLeft: '4px solid var(--warning)',
      borderRadius: '8px',
      margin: '1rem 0 1.25rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--warning)',
      fontWeight: '700',
      fontSize: '0.95rem',
      marginBottom: '0.25rem'
    }
  }, "\uD83D\uDD04 Continuous Feedback Loop & Remediation Active"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-main)',
      fontSize: '0.88rem',
      margin: 0
    }
  }, "Your last Simulated Board Exam score was ", /*#__PURE__*/React.createElement("strong", null, lastSimulationScore, "%"), ". Your Adaptive Board Readiness Index has been reset to ", /*#__PURE__*/React.createElement("strong", null, readinessIndex, "%"), ". Complete targeted Smart-Quizzes to rebuild your readiness index back to ", /*#__PURE__*/React.createElement("strong", null, "75%"), " to unlock the Simulated Board Exam retake!"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.75rem',
      marginTop: '0.75rem'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      fontSize: '0.85rem'
    },
    onClick: startAdaptiveSmartQuiz
  }, "\uD83C\uDFAF Launch Targeted Smart-Quiz (Current: ", readinessIndex, "%, Target: 75%)"))), /*#__PURE__*/React.createElement("div", {
    className: "readiness-progress-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "readiness-progress-fill",
    style: {
      width: `${readinessIndex}%`,
      background: readinessIndex >= 75 ? 'var(--success)' : 'linear-gradient(90deg, var(--warning), var(--primary-light))'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '0.8rem',
      color: 'var(--text-dim)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "0% Baseline"), /*#__PURE__*/React.createElement("span", null, "Step 3 Practice Target (75%)"), /*#__PURE__*/React.createElement("span", null, "100% Comprehensive Mastery"))), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.75rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      gap: '1rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "step-number-badge"
  }, "Step 2: Knowledge Gap Analysis"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: '1.3rem'
    }
  }, "Curriculum Module Proficiency & Weak Spot Map")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      fontSize: '0.85rem'
    },
    onClick: startAdaptiveSmartQuiz
  }, "\uD83C\uDFAF Targeted Practice on Weak Spots"), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      fontSize: '0.85rem',
      borderColor: 'var(--primary-light)'
    },
    onClick: startBoardSimulation
  }, "\uD83C\uDFDB\uFE0F Simulated Board Exam"))), /*#__PURE__*/React.createElement("div", {
    className: "grid-2col",
    style: {
      gap: '1.25rem'
    }
  }, Object.keys(moduleMastery || {}).map(mod => {
    const data = moduleMastery[mod];
    const pct = data.percentage || 0;
    const isStrength = pct >= 75;
    return /*#__PURE__*/React.createElement("div", {
      key: mod,
      className: "mastery-bar-container"
    }, /*#__PURE__*/React.createElement("div", {
      className: "mastery-bar-header"
    }, /*#__PURE__*/React.createElement("span", null, mod), /*#__PURE__*/React.createElement("span", {
      style: {
        color: isStrength ? 'var(--success)' : 'var(--warning)',
        fontWeight: '700'
      }
    }, pct, "% ", isStrength ? '✓ Strength' : '⚠️ Focus Area')), /*#__PURE__*/React.createElement("div", {
      className: "readiness-progress-bar",
      style: {
        height: '8px',
        margin: '0.25rem 0'
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "readiness-progress-fill",
      style: {
        width: `${pct}%`,
        background: isStrength ? 'var(--success)' : 'var(--warning)'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '0.75rem',
        color: 'var(--text-dim)'
      }
    }, data.totalAttempts > 0 ? `${data.correctCount}/${data.totalAttempts} questions correct` : 'No items attempted yet'));
  }))));
}

// HERO SECTION FOR PUBLIC VISITORS
function HeroSection({
  onLoginClick,
  onSignupClick
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '2rem 1rem'
    }
  }, /*#__PURE__*/React.createElement(CreatorAttributionBanner, null), /*#__PURE__*/React.createElement("div", {
    className: "badge badge-admin",
    style: {
      display: 'inline-block',
      marginBottom: '1.5rem'
    }
  }, "Verified Mechanical Engineering Question Bank & AI Review System"), /*#__PURE__*/React.createElement("h1", {
    className: "hero-title",
    style: {
      fontSize: 'clamp(1.75rem, 5.5vw, 3.2rem)',
      marginBottom: '1.5rem',
      maxWidth: '900px',
      margin: '0 auto 1.5rem',
      lineHeight: '1.2'
    }
  }, "Master the Mechanical Engineer Board Exam with ", /*#__PURE__*/React.createElement("span", {
    className: "gradient-text"
  }, "First-Principles Solutions")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)',
      color: 'var(--text-muted)',
      maxWidth: '750px',
      margin: '0 auto 2.5rem'
    }
  }, "Comprehensive question bank of 5,036 solved items covering Power Plant Engineering, Industrial Plant Design, Heat Transfer, Refrigeration & Air Conditioning, and ME Design."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
      marginBottom: '3.5rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      padding: '0.85rem 2rem',
      fontSize: '1.05rem'
    },
    onClick: onSignupClick
  }, "Create Free Student Account"), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      padding: '0.85rem 2rem',
      fontSize: '1.05rem'
    },
    onClick: onLoginClick
  }, "Log In")), /*#__PURE__*/React.createElement("div", {
    className: "stats-grid",
    style: {
      marginTop: '2rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '2rem',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      marginBottom: '0.75rem',
      color: 'var(--primary-light)'
    }
  }, "\uD83D\uDCD6 Self-Paced Practice"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.95rem'
    }
  }, "Study questions by curriculum module or batch with instant step-by-step solutions, governing equations, and academic citations.")), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '2rem',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      marginBottom: '0.75rem',
      color: 'var(--accent-light)'
    }
  }, "\u23F1\uFE0F Admin-Posted Quizzes"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.95rem'
    }
  }, "Attempt official timed quizzes created, posted, and managed exclusively by faculty administrators under simulated licensure exam conditions.")), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '2rem',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      marginBottom: '0.75rem',
      color: 'var(--success)'
    }
  }, "\u26A1 5,036 Solved Questions"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.95rem'
    }
  }, "100% verified question bank across 63 review batches covering all 6 board exam modules."))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '3.5rem',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: '2rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-admin",
    style: {
      marginBottom: '0.75rem'
    }
  }, "Guaranteed Readiness Path"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: '2.2rem'
    }
  }, "Study Smarter, Not Harder: Your Personalized Path to Passing"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      maxWidth: '750px',
      margin: '0.5rem auto 0'
    }
  }, "Don\u2019t waste time studying what you already know. Our Adaptive Learning System pinpoints exactly what you need to focus on, and our realistic mock exams ensure you can walk into your board exam with absolute confidence.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1.25rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "adaptive-step-card"
  }, /*#__PURE__*/React.createElement("span", {
    className: "step-number-badge"
  }, "Step 1"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: '1.1rem',
      marginBottom: '0.5rem',
      color: 'var(--primary-light)'
    }
  }, "The Diagnostic Benchmark"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.88rem',
      color: 'var(--text-muted)'
    }
  }, "When you create an account, you'll start with a 100-item comprehensive assessment covering all essential exam modules to establish your baseline.")), /*#__PURE__*/React.createElement("div", {
    className: "adaptive-step-card"
  }, /*#__PURE__*/React.createElement("span", {
    className: "step-number-badge"
  }, "Step 2"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: '1.1rem',
      marginBottom: '0.5rem',
      color: 'var(--accent-light)'
    }
  }, "Knowledge Gap Analysis"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.88rem',
      color: 'var(--text-muted)'
    }
  }, "Instantly receive data-driven analytics that highlight your specific strengths and pinpoint exactly where you need to focus.")), /*#__PURE__*/React.createElement("div", {
    className: "adaptive-step-card"
  }, /*#__PURE__*/React.createElement("span", {
    className: "step-number-badge"
  }, "Step 3"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: '1.1rem',
      marginBottom: '0.5rem',
      color: 'var(--warning)'
    }
  }, "Adaptive Targeted Practice"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.88rem',
      color: 'var(--text-muted)'
    }
  }, "Our Smart-Quiz System takes over, generating custom quizzes specifically designed to challenge your weak spots until you turn them into strengths.")), /*#__PURE__*/React.createElement("div", {
    className: "adaptive-step-card"
  }, /*#__PURE__*/React.createElement("span", {
    className: "step-number-badge"
  }, "Step 4"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: '1.1rem',
      marginBottom: '0.5rem',
      color: '#10b981'
    }
  }, "The Board Exam Simulation"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.88rem',
      color: 'var(--text-muted)'
    }
  }, "Unlock the ", /*#__PURE__*/React.createElement("strong", null, "Simulated Board Exam"), "\u2014a 100-item comprehensive randomized assessment spanning all subjects in a real-world testing environment.")), /*#__PURE__*/React.createElement("div", {
    className: "adaptive-step-card"
  }, /*#__PURE__*/React.createElement("span", {
    className: "step-number-badge"
  }, "Step 5"), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: '1.1rem',
      marginBottom: '0.5rem',
      color: 'var(--success)'
    }
  }, "The Readiness Loop"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.88rem',
      color: 'var(--text-muted)'
    }
  }, "Pass the simulation to unlock: ", /*#__PURE__*/React.createElement("strong", null, "\"Congratulations, you are now ready to take the board exam.\""), " Fall short? Our continuous feedback loop & unlimited remediation let you review and retake until ready!")))));
}

// STUDENT & MAIN DASHBOARD VIEW
function DashboardView({
  token,
  user,
  stats,
  openPracticeModal,
  openQuizListModal,
  openQuizResultsModal,
  startDiagnosticBenchmark,
  startAdaptiveSmartQuiz,
  startBoardSimulation,
  setView,
  loadQuestions,
  downloadReviewedCSV
}) {
  const totalCount = stats ? stats.totalQuestions : 5036;
  const reviewedCount = stats ? stats.reviewedQuestions : 5036;
  const totalBatches = stats ? stats.totalBatchesCompleted : 63;
  const postedQuizzes = stats ? stats.publishedQuizzesCount : 4;
  const totalAttempts = stats ? stats.totalAttemptsCount || 0 : 0;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(CreatorAttributionBanner, null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      gap: '1rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: '1.8rem'
    }
  }, "Welcome back, ", user.fullName, "!"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)'
    }
  }, "Target Exam Date: ", user.targetExamDate || 'October 2026 Board Exam', " | School: ", user.school || 'NEUST College of Engineering')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: openPracticeModal
  }, "\uD83D\uDCD6 Practice Mode"), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      borderColor: 'var(--accent-light)',
      color: 'var(--accent-light)'
    },
    onClick: openQuizListModal
  }, "\u23F1\uFE0F Posted Quizzes (", postedQuizzes, ")"), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      borderColor: 'var(--primary-light)',
      color: 'var(--primary-light)'
    },
    onClick: openQuizResultsModal
  }, "\uD83D\uDCCA My Quiz Results"))), /*#__PURE__*/React.createElement(AdaptiveAnalyticsWidget, {
    token: token,
    user: user,
    stats: stats,
    startDiagnosticBenchmark: startDiagnosticBenchmark,
    startAdaptiveSmartQuiz: startAdaptiveSmartQuiz,
    startBoardSimulation: startBoardSimulation
  }), /*#__PURE__*/React.createElement("div", {
    className: "stats-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass-card stat-card"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stat-value gradient-text"
  }, totalCount), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Total Verified Questions")), /*#__PURE__*/React.createElement("div", {
    className: "stat-icon"
  }, "\uD83D\uDCDA")), /*#__PURE__*/React.createElement("div", {
    className: "glass-card stat-card"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stat-value",
    style: {
      color: 'var(--success)'
    }
  }, reviewedCount), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "100% Fact-Checked & Solved")), /*#__PURE__*/React.createElement("div", {
    className: "stat-icon"
  }, "\u2705")), /*#__PURE__*/React.createElement("div", {
    className: "glass-card stat-card"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stat-value",
    style: {
      color: 'var(--primary-light)'
    }
  }, postedQuizzes), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Faculty-Posted Board Quizzes")), /*#__PURE__*/React.createElement("div", {
    className: "stat-icon"
  }, "\uD83D\uDCCB")), /*#__PURE__*/React.createElement("div", {
    className: "glass-card stat-card"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stat-value",
    style: {
      color: 'var(--accent-light)'
    }
  }, totalAttempts), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Total Student Quiz Attempts")), /*#__PURE__*/React.createElement("div", {
    className: "stat-icon"
  }, "\uD83D\uDCC8"))), /*#__PURE__*/React.createElement("h3", {
    style: {
      marginBottom: '1rem',
      marginTop: '2rem'
    }
  }, "Board Exam Curriculum Modules"), /*#__PURE__*/React.createElement("div", {
    className: "stats-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.5rem',
      cursor: 'pointer'
    },
    onClick: () => {
      loadQuestions({
        module: 'Module 1',
        page: 1,
        limit: 20
      });
      setView('audit');
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      color: 'var(--primary-light)',
      marginBottom: '0.5rem'
    }
  }, "Module 1: Power Plant Elements"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.9rem',
      marginBottom: '1rem'
    }
  }, "Thermodynamics, Heat Transfer, Fluid Mechanics, Boilers, Combustion, Steam Turbines, Gas Turbines."), /*#__PURE__*/React.createElement("span", {
    className: "badge badge-student"
  }, "1,111 Questions Available")), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.5rem',
      cursor: 'pointer'
    },
    onClick: () => {
      loadQuestions({
        module: 'Module 2',
        page: 1,
        limit: 20
      });
      setView('audit');
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      color: 'var(--accent-light)',
      marginBottom: '0.5rem'
    }
  }, "Module 2: Power Plant Design"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.9rem',
      marginBottom: '1rem'
    }
  }, "Thermal cycles, Hydroelectric plants, Diesel power plants, Chimney design, Energy balances."), /*#__PURE__*/React.createElement("span", {
    className: "badge badge-student"
  }, "790 Questions Available")), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.5rem',
      cursor: 'pointer'
    },
    onClick: () => {
      loadQuestions({
        module: 'Module 3',
        page: 1,
        limit: 20
      });
      setView('audit');
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      color: 'var(--success)',
      marginBottom: '0.5rem'
    }
  }, "Module 3: Industrial Plant Engg"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.9rem',
      marginBottom: '1rem'
    }
  }, "Piping networks, Conveyors, Compressors, Pumps, Fans, Blowers, Plant Safety."), /*#__PURE__*/React.createElement("span", {
    className: "badge badge-status"
  }, "313 Questions Available")), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.5rem',
      cursor: 'pointer'
    },
    onClick: () => {
      loadQuestions({
        module: 'Module 4',
        page: 1,
        limit: 20
      });
      setView('audit');
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      color: 'var(--primary-light)',
      marginBottom: '0.5rem'
    }
  }, "Module 4: Industrial Plant Design"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.9rem',
      marginBottom: '1rem'
    }
  }, "Heat Exchangers, Evaporators, Cooling Towers, Refrigerant systems, Piping."), /*#__PURE__*/React.createElement("span", {
    className: "badge badge-student"
  }, "295 Questions Available")), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.5rem',
      cursor: 'pointer'
    },
    onClick: () => {
      loadQuestions({
        module: 'Module 5',
        page: 1,
        limit: 20
      });
      setView('audit');
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      color: 'var(--accent-light)',
      marginBottom: '0.5rem'
    }
  }, "Module 5: Refrigeration Engg"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.9rem',
      marginBottom: '1rem'
    }
  }, "Vapor compression, Absorption refrigeration, Refrigerants, COP calculation, Compressors."), /*#__PURE__*/React.createElement("span", {
    className: "badge badge-student"
  }, "392 Questions Available")), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.5rem',
      cursor: 'pointer'
    },
    onClick: () => {
      loadQuestions({
        module: 'Module 6',
        page: 1,
        limit: 20
      });
      setView('audit');
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      color: 'var(--success)',
      marginBottom: '0.5rem'
    }
  }, "Module 6: Air Conditioning"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.9rem',
      marginBottom: '1rem'
    }
  }, "Psychrometric processes, Cooling load calculations, Duct design, Air handlers."), /*#__PURE__*/React.createElement("span", {
    className: "badge badge-status"
  }, "157 Questions Available"))));
}

// DEDICATED PRACTICE STUDY MODE MODAL
function PracticeConfigModal({
  onClose,
  onStart
}) {
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [solvingCount, setSolvingCount] = useState(25);
  const [elementCount, setElementCount] = useState(25);
  const moduleTopicsList = React.useMemo(() => {
    if (!selectedModule) return [];
    return getTopicsForModule(selectedModule);
  }, [selectedModule]);
  const topicsStr = selectedTopics.join('||');
  const {
    solvingAvailable,
    elementAvailable,
    totalAvailable
  } = getAvailableQuestionCounts({
    moduleStr: selectedModule,
    batchStr: selectedBatch,
    topicsStr
  });
  const rebalanceCounts = counts => {
    let nextSolving = Math.min(solvingCount, counts.solvingAvailable);
    let nextElement = Math.min(elementCount, counts.elementAvailable);
    if (nextSolving + nextElement === 0) {
      if (counts.solvingAvailable > 0 && counts.elementAvailable > 0) {
        nextSolving = Math.min(25, counts.solvingAvailable);
        nextElement = Math.min(25, counts.elementAvailable);
      } else if (counts.solvingAvailable > 0) {
        nextSolving = Math.min(50, counts.solvingAvailable);
      } else if (counts.elementAvailable > 0) {
        nextElement = Math.min(50, counts.elementAvailable);
      }
    }
    setSolvingCount(nextSolving);
    setElementCount(nextElement);
  };

  // Automatically clamp or balance counts when module or batch changes
  const applyPoolSelection = (nextModule, nextBatch) => {
    setSelectedModule(nextModule);
    setSelectedTopics([]);
    setSelectedBatch(nextBatch);
    const counts = getAvailableQuestionCounts({
      moduleStr: nextModule,
      batchStr: nextBatch,
      topicsStr: ''
    });
    rebalanceCounts(counts);
  };
  const togglePracticeTopic = topicName => {
    const nextTopics = selectedTopics.includes(topicName) ? selectedTopics.filter(t => t !== topicName) : [...selectedTopics, topicName];
    setSelectedTopics(nextTopics);
    const counts = getAvailableQuestionCounts({
      moduleStr: selectedModule,
      batchStr: selectedBatch,
      topicsStr: nextTopics.join('||')
    });
    rebalanceCounts(counts);
  };
  const selectAllPracticeTopics = () => {
    const allNames = moduleTopicsList.map(t => t.name);
    setSelectedTopics(allNames);
    const counts = getAvailableQuestionCounts({
      moduleStr: selectedModule,
      batchStr: selectedBatch,
      topicsStr: allNames.join('||')
    });
    rebalanceCounts(counts);
  };
  const clearPracticeTopics = () => {
    setSelectedTopics([]);
    const counts = getAvailableQuestionCounts({
      moduleStr: selectedModule,
      batchStr: selectedBatch,
      topicsStr: ''
    });
    rebalanceCounts(counts);
  };
  const handleSolvingChange = val => {
    const parsed = Math.max(0, parseInt(val, 10) || 0);
    setSolvingCount(Math.min(parsed, solvingAvailable));
  };
  const handleElementChange = val => {
    const parsed = Math.max(0, parseInt(val, 10) || 0);
    setElementCount(Math.min(parsed, elementAvailable));
  };
  const applyPreset = (sTarget, eTarget) => {
    setSolvingCount(Math.min(sTarget, solvingAvailable));
    setElementCount(Math.min(eTarget, elementAvailable));
  };
  const totalSelected = solvingCount + elementCount;
  const handleStart = () => {
    if (totalSelected <= 0) {
      window.showToast?.('Please specify at least 1 Solving Question or Element Question to start.', 'warning');
      return;
    }
    onStart({
      moduleVal: selectedModule,
      topicsVal: topicsStr,
      batchVal: selectedBatch,
      solvingCount,
      elementCount,
      limitVal: totalSelected
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content glass-card",
    onClick: e => e.stopPropagation(),
    style: {
      maxWidth: '680px',
      width: '94%'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      marginBottom: '0.4rem',
      textAlign: 'center'
    }
  }, "\uD83D\uDCD6 Practice & Study Mode"), /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: 'center',
      color: 'var(--text-muted)',
      marginBottom: '1.25rem',
      fontSize: '0.88rem'
    }
  }, "Select a ", /*#__PURE__*/React.createElement("strong", null, "Curriculum Module"), ", choose your preferred ", /*#__PURE__*/React.createElement("strong", null, "Topics"), " in that module, and specify ", /*#__PURE__*/React.createElement("strong", null, "Solving"), " & ", /*#__PURE__*/React.createElement("strong", null, "Element"), " question counts."), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Select Curriculum Module to Practice"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: selectedModule,
    onChange: e => applyPoolSelection(e.target.value, '')
  }, MODULE_OPTIONS.map(opt => /*#__PURE__*/React.createElement("option", {
    key: opt.value,
    value: opt.value
  }, opt.label)))), selectedModule && moduleTopicsList.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.45rem',
      flexWrap: 'wrap',
      gap: '0.4rem'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      margin: 0,
      fontWeight: '700',
      color: 'var(--primary-light)'
    }
  }, "\uD83D\uDCC2 Choose Topics in ", selectedModule, " (", selectedTopics.length === 0 ? `All ${moduleTopicsList.length} Topics Included` : `${selectedTopics.length} Topic(s) Selected`, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.4rem'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.18rem 0.55rem',
      fontSize: '0.74rem'
    },
    onClick: selectAllPracticeTopics
  }, "\u2713 Select All Topics"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.18rem 0.55rem',
      fontSize: '0.74rem'
    },
    onClick: clearPracticeTopics
  }, "\u2715 Clear (All Topics)"))), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '0.75rem',
      background: 'var(--bg-input)',
      borderRadius: 'var(--radius-md)',
      maxHeight: '185px',
      overflowY: 'auto',
      border: '1px solid rgba(56, 189, 248, 0.35)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.35rem'
    }
  }, moduleTopicsList.map(topItem => {
    const isChecked = selectedTopics.includes(topItem.name);
    return /*#__PURE__*/React.createElement("label", {
      key: topItem.name,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.42rem 0.65rem',
        borderRadius: '6px',
        cursor: 'pointer',
        background: isChecked ? 'rgba(56, 189, 248, 0.16)' : 'rgba(255,255,255,0.02)',
        border: isChecked ? '1px solid var(--primary-light)' : '1px solid rgba(255,255,255,0.06)',
        transition: 'all 0.15s ease'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem'
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: isChecked,
      onChange: () => togglePracticeTopic(topItem.name),
      style: {
        width: '15px',
        height: '15px',
        accentColor: 'var(--primary-light)',
        cursor: 'pointer'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.84rem',
        color: isChecked ? '#ffffff' : 'var(--text-main)',
        fontWeight: isChecked ? '600' : '500'
      }
    }, topItem.name)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.74rem',
        color: 'var(--text-muted)',
        whiteSpace: 'nowrap'
      }
    }, /*#__PURE__*/React.createElement("strong", null, topItem.total, " Qs"), " (", topItem.solving, " Solving | ", topItem.element, " Element)"));
  })))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Or Select Specific Review Batch"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: selectedBatch,
    onChange: e => applyPoolSelection('', e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "All Batches (Randomized Practice Set \u2014 5,036 Qs)"), /*#__PURE__*/React.createElement("option", {
    value: "PIPE-PROB-01"
  }, "Batch PIPE-PROB-01 (1,931 Solving Questions)"), Array.from({
    length: 65
  }, (_, i) => i + 1).map(b => /*#__PURE__*/React.createElement("option", {
    key: b,
    value: b
  }, "Batch ", b, " (", b === 65 ? '5' : '50', " Element Questions)")))), /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginTop: '1rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem',
      flexWrap: 'wrap',
      gap: '0.4rem'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      margin: 0,
      fontWeight: '700'
    }
  }, "Specify Question Breakdown (Solving vs. Element)"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.78rem',
      color: 'var(--primary-light)',
      fontWeight: '600'
    }
  }, "Pool Available: ", totalAvailable.toLocaleString(), " Total (", solvingAvailable.toLocaleString(), " Solving | ", elementAvailable.toLocaleString(), " Element)")), /*#__PURE__*/React.createElement("div", {
    className: "grid-2col",
    style: {
      gap: '0.85rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '0.9rem',
      background: 'rgba(56, 189, 248, 0.08)',
      border: '1px solid rgba(56, 189, 248, 0.35)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.4rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: '700',
      fontSize: '0.9rem',
      color: 'var(--text-main)'
    }
  }, "\uD83E\uDDEE Solving Questions"), /*#__PURE__*/React.createElement("span", {
    className: "badge badge-status",
    style: {
      fontSize: '0.72rem'
    }
  }, "Max: ", solvingAvailable.toLocaleString())), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.76rem',
      color: 'var(--text-muted)',
      marginBottom: '0.55rem'
    }
  }, "Can add up to ", /*#__PURE__*/React.createElement("strong", null, solvingAvailable.toLocaleString()), " solving problem(s)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    className: "form-control",
    min: "0",
    max: solvingAvailable,
    value: solvingCount,
    onChange: e => handleSolvingChange(e.target.value),
    disabled: solvingAvailable === 0,
    style: {
      fontWeight: '700',
      fontSize: '1rem',
      textAlign: 'center',
      marginBottom: '0.5rem'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.3rem',
      flexWrap: 'wrap',
      justifyContent: 'center'
    }
  }, [0, 10, 15, 25, 50].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    type: "button",
    className: "btn-secondary",
    disabled: solvingAvailable === 0 && n > 0,
    onClick: () => handleSolvingChange(n),
    style: {
      padding: '0.18rem 0.48rem',
      fontSize: '0.72rem'
    }
  }, n)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    disabled: solvingAvailable === 0,
    onClick: () => handleSolvingChange(Math.min(100, solvingAvailable)),
    style: {
      padding: '0.18rem 0.48rem',
      fontSize: '0.72rem'
    }
  }, "Max (", Math.min(100, solvingAvailable), ")"))), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '0.9rem',
      background: 'rgba(245, 158, 11, 0.08)',
      border: '1px solid rgba(245, 158, 11, 0.35)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.4rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: '700',
      fontSize: '0.9rem',
      color: 'var(--text-main)'
    }
  }, "\uD83D\uDCD8 Element Questions"), /*#__PURE__*/React.createElement("span", {
    className: "badge badge-admin",
    style: {
      fontSize: '0.72rem'
    }
  }, "Max: ", elementAvailable.toLocaleString())), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.76rem',
      color: 'var(--text-muted)',
      marginBottom: '0.55rem'
    }
  }, "Can add up to ", /*#__PURE__*/React.createElement("strong", null, elementAvailable.toLocaleString()), " element question(s)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    className: "form-control",
    min: "0",
    max: elementAvailable,
    value: elementCount,
    onChange: e => handleElementChange(e.target.value),
    disabled: elementAvailable === 0,
    style: {
      fontWeight: '700',
      fontSize: '1rem',
      textAlign: 'center',
      marginBottom: '0.5rem'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.3rem',
      flexWrap: 'wrap',
      justifyContent: 'center'
    }
  }, [0, 10, 15, 25, 50].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    type: "button",
    className: "btn-secondary",
    disabled: elementAvailable === 0 && n > 0,
    onClick: () => handleElementChange(n),
    style: {
      padding: '0.18rem 0.48rem',
      fontSize: '0.72rem'
    }
  }, n)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    disabled: elementAvailable === 0,
    onClick: () => handleElementChange(Math.min(100, elementAvailable)),
    style: {
      padding: '0.18rem 0.48rem',
      fontSize: '0.72rem'
    }
  }, "Max (", Math.min(100, elementAvailable), ")")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '0.75rem',
      padding: '0.65rem 0.85rem',
      borderRadius: '8px',
      background: 'var(--bg-input)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.85rem'
    }
  }, /*#__PURE__*/React.createElement("strong", null, "Total Practice Questions:"), ' ', /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--primary-light)',
      fontWeight: '700'
    }
  }, totalSelected, " Qs"), ' ', /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.8rem'
    }
  }, "(", solvingCount, " Solving + ", elementCount, " Element)")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.35rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.2rem 0.55rem',
      fontSize: '0.74rem'
    },
    onClick: () => applyPreset(10, 10)
  }, "20 Qs (10+10)"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.2rem 0.55rem',
      fontSize: '0.74rem'
    },
    onClick: () => applyPreset(25, 25)
  }, "50 Qs (25+25)"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.2rem 0.55rem',
      fontSize: '0.74rem'
    },
    onClick: () => applyPreset(50, 50)
  }, "100 Qs (50+50)")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.75rem',
      marginTop: '1.25rem'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      flex: 1
    },
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-primary",
    style: {
      flex: 1
    },
    onClick: handleStart,
    disabled: totalSelected <= 0
  }, "\uD83D\uDE80 Start Practice (", totalSelected, " Qs)"))));
}

// POSTED QUIZZES LIBRARY MODAL FOR STUDENTS & FACULTY
function QuizListModal({
  quizzes,
  myAttempts = [],
  onClose,
  onLaunch,
  user,
  openQuizEditorModal,
  openQuizResultsModal,
  toggleQuizStatus,
  deleteQuiz,
  isLoading = false,
  onRefresh
}) {
  const isAdmin = user && user.role === 'admin';
  useEffect(() => {
    if (onRefresh && quizzes.length === 0) {
      onRefresh();
    }
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content modal-content-lg glass-card",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: '1.6rem'
    }
  }, "\u23F1\uFE0F Faculty-Posted Board Quizzes"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.85rem'
    }
  }, isAdmin ? 'Manage, compose, publish, or view student attempt logs.' : 'Attempt and retake official licensure board exam quizzes posted by administrators. All attempts are saved in your academic record.')), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, onRefresh && /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      padding: '0.4rem 0.85rem',
      fontSize: '0.85rem',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem'
    },
    onClick: onRefresh,
    disabled: isLoading,
    title: "Synchronize quizzes with Cloud Firestore"
  }, /*#__PURE__*/React.createElement("span", {
    className: isLoading ? 'spin-icon' : '',
    style: {
      display: 'inline-block'
    }
  }, "\uD83D\uDD04"), /*#__PURE__*/React.createElement("span", null, isLoading ? 'Syncing...' : 'Sync Live')), isAdmin && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      padding: '0.4rem 0.9rem',
      fontSize: '0.85rem',
      borderColor: 'var(--accent-light)',
      color: 'var(--accent-light)'
    },
    onClick: () => openQuizResultsModal(null)
  }, "\uD83D\uDCCA Student Scores"), /*#__PURE__*/React.createElement("button", {
    className: "btn-success",
    style: {
      padding: '0.4rem 0.9rem',
      fontSize: '0.85rem'
    },
    onClick: () => openQuizEditorModal(null)
  }, "+ Create & Post Quiz")), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      padding: '0.4rem 0.8rem'
    },
    onClick: onClose
  }, "\u2715 Close"))), isLoading && quizzes.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '3rem',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "spin-icon",
    style: {
      fontSize: '2rem',
      marginBottom: '1rem',
      display: 'inline-block'
    }
  }, "\uD83D\uDD04"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '1rem',
      color: 'var(--text-main)'
    }
  }, "Fetching active licensure board quizzes from Cloud Database...")) : quizzes.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '2.5rem',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      marginBottom: '1.25rem',
      fontSize: '1rem'
    }
  }, "No quizzes are currently published by faculty administrators."), onRefresh && /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: onRefresh,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      margin: '0 auto'
    }
  }, "\uD83D\uDD04 Fetch Quizzes from Cloud Database")) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      maxHeight: '60vh',
      overflowY: 'auto'
    }
  }, quizzes.map(qz => {
    const userAttempt = myAttempts.find(a => a.quizId === qz.id);
    const hasAttempted = !isAdmin && !!userAttempt;
    return /*#__PURE__*/React.createElement("div", {
      key: qz.id,
      className: "glass-card",
      style: {
        padding: '1.25rem',
        borderLeft: '4px solid var(--accent)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginBottom: '0.5rem'
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: '1.15rem',
        color: 'var(--text-main)'
      }
    }, qz.title), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "badge badge-admin",
      title: qz.module || 'All Modules'
    }, !qz.module ? 'Comprehensive (All Modules)' : qz.module.includes(',') ? `🎯 Combined (${qz.module.split(',').length} Modules)` : qz.module), /*#__PURE__*/React.createElement("span", {
      className: "badge badge-status"
    }, qz.questionCount, " Questions", qz.solvingCount !== undefined || qz.elementCount !== undefined ? ` (${qz.solvingCount || 0} Solving | ${qz.elementCount || 0} Element)` : '', ' ', "| \u23F0 ", qz.durationMins, " Mins"), hasAttempted && /*#__PURE__*/React.createElement("span", {
      className: `badge ${userAttempt.passed ? 'badge-status' : 'badge-admin'}`
    }, "Latest Score: ", userAttempt.percentage, "% (", userAttempt.passed ? 'Passed' : 'Needs Review', ")"), isAdmin && /*#__PURE__*/React.createElement("span", {
      className: `badge ${qz.status === 'published' ? 'badge-status' : 'badge-student'}`
    }, qz.status))), /*#__PURE__*/React.createElement("p", {
      style: {
        color: 'var(--text-muted)',
        fontSize: '0.9rem',
        marginBottom: '1rem'
      }
    }, qz.description || 'Official licensure board prep evaluation assessment.'), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '0.8rem',
        color: 'var(--text-dim)'
      }
    }, /*#__PURE__*/React.createElement("strong", null, "Posted By:"), " ", qz.createdBy || 'Faculty Admin', " | ", /*#__PURE__*/React.createElement("strong", null, "Passing Score:"), " ", qz.passingScorePct || 70, "%"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }
    }, isAdmin && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn-secondary",
      style: {
        padding: '0.35rem 0.75rem',
        fontSize: '0.8rem',
        borderColor: 'rgba(56, 189, 248, 0.45)',
        color: '#38bdf8'
      },
      onClick: () => exportQuizToWordFile(qz, {
        answerKeyOnly: false
      }),
      title: "Admin Only: Download this quiz as a Microsoft Word (.doc) examination paper"
    }, "\uD83D\uDCC4 Questions (.doc)"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn-secondary",
      style: {
        padding: '0.35rem 0.75rem',
        fontSize: '0.8rem',
        borderColor: 'rgba(16, 185, 129, 0.45)',
        color: '#34d399'
      },
      onClick: () => exportQuizToWordFile(qz, {
        answerKeyOnly: true
      }),
      title: "Admin Only: Download Microsoft Word (.doc) file with Answer Key and Step-by-Step Solutions"
    }, "\uD83D\uDD11 Answer Key (.doc)"), /*#__PURE__*/React.createElement("button", {
      className: "btn-secondary",
      style: {
        padding: '0.35rem 0.75rem',
        fontSize: '0.8rem'
      },
      onClick: () => openQuizResultsModal(qz.id)
    }, "\uD83D\uDCCA Results"), /*#__PURE__*/React.createElement("button", {
      className: "btn-secondary",
      style: {
        padding: '0.35rem 0.75rem',
        fontSize: '0.8rem'
      },
      onClick: () => openQuizEditorModal(qz)
    }, "Edit"), /*#__PURE__*/React.createElement("button", {
      className: "btn-secondary",
      style: {
        padding: '0.35rem 0.75rem',
        fontSize: '0.8rem'
      },
      onClick: () => toggleQuizStatus(qz)
    }, qz.status === 'published' ? 'Unpublish' : 'Publish'), /*#__PURE__*/React.createElement("button", {
      className: "btn-danger",
      style: {
        padding: '0.35rem 0.75rem',
        fontSize: '0.8rem'
      },
      onClick: () => deleteQuiz(qz.id)
    }, "Delete")), hasAttempted ? /*#__PURE__*/React.createElement("button", {
      className: "btn-primary",
      style: {
        padding: '0.45rem 1.1rem',
        fontSize: '0.85rem',
        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
      },
      onClick: () => onLaunch(qz)
    }, "\uD83D\uDD04 Retake Quiz") : /*#__PURE__*/React.createElement("button", {
      className: "btn-primary",
      style: {
        padding: '0.45rem 1.1rem',
        fontSize: '0.85rem'
      },
      onClick: () => onLaunch(qz)
    }, "\u26A1 Start Quiz"))));
  }))));
}

// ============================================================================
// PER-QUESTION TOPIC BREAKDOWN HELPERS & ADMIN QUIZ HISTORY INSPECTOR
// ============================================================================
function buildAttemptQuestionBreakdown(questionsList = [], getStudentAns = () => '') {
  if (!Array.isArray(questionsList) || questionsList.length === 0) return [];
  return questionsList.slice(0, 500).map((qItem, idx) => {
    const rawStudent = typeof getStudentAns === 'function' ? getStudentAns(qItem, idx) : '';
    const studentAnswer = String(rawStudent || '').trim().toUpperCase();
    const correctAnswer = String(qItem && qItem.CorrectAnswer || '').trim().toUpperCase().charAt(0);
    const isCorrect = !!(studentAnswer && studentAnswer !== 'MULTI' && correctAnswer && studentAnswer === correctAnswer);
    return {
      num: idx + 1,
      questionId: String(qItem && qItem.ID || ''),
      topic: getCanonicalTopic(qItem),
      module: String(qItem && qItem.Module || 'General'),
      studentAnswer,
      correctAnswer,
      isCorrect
    };
  });
}
function resolveAttemptQuestionTopics(attempt, quizzesList = []) {
  if (!attempt) return {
    source: 'none',
    items: [],
    hasStudentAnswers: false,
    setLetter: ''
  };

  // 1. Exact recorded per-question topic breakdown saved with the attempt
  if (Array.isArray(attempt.questionBreakdown) && attempt.questionBreakdown.length > 0) {
    return {
      source: 'recorded',
      items: attempt.questionBreakdown.map((item, idx) => ({
        num: item.num || idx + 1,
        questionId: String(item.questionId || ''),
        topic: item.topic || 'General',
        module: item.module || 'General',
        studentAnswer: item.studentAnswer || '',
        correctAnswer: item.correctAnswer || '',
        isCorrect: item.isCorrect
      })),
      hasStudentAnswers: true,
      setLetter: ''
    };
  }
  const allQuestions = typeof window !== 'undefined' && Array.isArray(window.INITIAL_QUESTIONS) ? window.INITIAL_QUESTIONS : [];
  const idMap = new Map(allQuestions.filter(Boolean).map(q => [String(q.ID), q]));

  // 2. Retroactive reconstruction from saved Quiz Set (A-Z) if this was an OMR Scan or Set-based quiz
  const titleStr = String(attempt.quizTitle || '');
  const setMatch = titleStr.match(/\bSET\s+([A-Z])\b/i);
  const detectedSetLetter = setMatch ? setMatch[1].toUpperCase() : '';
  if (attempt.quizId) {
    const setsForQuiz = getSetsForQuiz(attempt.quizId);
    const targetSet = detectedSetLetter ? setsForQuiz.find(s => s.setLetter === detectedSetLetter) : setsForQuiz.length === 1 ? setsForQuiz[0] : null;
    if (targetSet && Array.isArray(targetSet.questionIds) && targetSet.questionIds.length > 0) {
      const items = targetSet.questionIds.map((qid, idx) => {
        const qObj = idMap.get(String(qid));
        return {
          num: idx + 1,
          questionId: String(qid),
          topic: qObj ? getCanonicalTopic(qObj) : 'General',
          module: qObj ? String(qObj.Module || 'General') : targetSet.module || 'General',
          studentAnswer: '',
          correctAnswer: qObj ? String(qObj.CorrectAnswer || '').trim().toUpperCase().charAt(0) : targetSet.answerKey ? targetSet.answerKey[idx] || '' : '',
          isCorrect: null
        };
      });
      return {
        source: 'set',
        items,
        hasStudentAnswers: false,
        setLetter: targetSet.setLetter
      };
    }
  }

  // 3. Retroactive reconstruction for manually picked quizzes (specificQuestionIds)
  const matchingQuiz = (quizzesList || []).find(q => q && q.id === attempt.quizId) || null;
  if (matchingQuiz && Array.isArray(matchingQuiz.specificQuestionIds) && matchingQuiz.specificQuestionIds.length > 0) {
    const items = matchingQuiz.specificQuestionIds.map((qid, idx) => {
      const qObj = idMap.get(String(qid));
      return {
        num: idx + 1,
        questionId: String(qid),
        topic: qObj ? getCanonicalTopic(qObj) : 'General',
        module: qObj ? String(qObj.Module || 'General') : matchingQuiz.module || 'General',
        studentAnswer: '',
        correctAnswer: qObj ? String(qObj.CorrectAnswer || '').trim().toUpperCase().charAt(0) : '',
        isCorrect: null
      };
    });
    return {
      source: 'manual_quiz',
      items,
      hasStudentAnswers: false,
      setLetter: ''
    };
  }
  return {
    source: 'none',
    items: [],
    hasStudentAnswers: false,
    setLetter: '',
    matchingQuiz
  };
}
function AdminAttemptTopicBreakdown({
  attempt,
  quizzesList = []
}) {
  const [resultFilter, setResultFilter] = useState('all'); // 'all' | 'wrong' | 'correct'
  const resolved = React.useMemo(() => resolveAttemptQuestionTopics(attempt, quizzesList), [attempt, quizzesList]);
  const topicSummary = React.useMemo(() => {
    const map = {};
    resolved.items.forEach(item => {
      const t = item.topic || 'General';
      if (!map[t]) map[t] = {
        topic: t,
        total: 0,
        correct: 0
      };
      map[t].total++;
      if (item.isCorrect === true) map[t].correct++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [resolved.items]);
  const visibleItems = React.useMemo(() => {
    if (!resolved.hasStudentAnswers || resultFilter === 'all') return resolved.items;
    if (resultFilter === 'correct') return resolved.items.filter(i => i.isCorrect === true);
    return resolved.items.filter(i => i.isCorrect !== true);
  }, [resolved.items, resolved.hasStudentAnswers, resultFilter]);
  const correctTotal = resolved.items.filter(i => i.isCorrect === true).length;
  const wrongTotal = resolved.items.length - correctTotal;
  const shortModLabel = modStr => {
    const m = String(modStr || '');
    const match = m.match(/Module\s*\d+/i);
    return match ? match[0] : m.length > 24 ? m.slice(0, 22) + '…' : m || 'General';
  };
  if (resolved.items.length === 0) {
    const modEntries = attempt && attempt.moduleBreakdown && typeof attempt.moduleBreakdown === 'object' ? Object.entries(attempt.moduleBreakdown).filter(([, v]) => v && (v.total > 0 || v.correct > 0)) : [];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0.85rem 1rem',
        background: 'rgba(15, 23, 42, 0.55)',
        borderRadius: '8px',
        border: '1px solid rgba(56, 189, 248, 0.25)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '0.82rem',
        fontWeight: '700',
        color: '#38bdf8',
        marginBottom: '0.35rem'
      }
    }, "\uD83D\uDCDA Per-Question Topic Log Not Recorded on Legacy Attempt"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        margin: '0 0 0.5rem 0'
      }
    }, "This older quiz attempt was submitted before per-question topic logging was enabled. All new online quizzes and OMR scanned papers automatically record the exact topic for every question number (#1 to #N)."), modEntries.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.4rem',
        marginTop: '0.4rem'
      }
    }, modEntries.map(([modName, st]) => {
      const pct = st.total > 0 ? Math.round(st.correct / st.total * 100) : 0;
      return /*#__PURE__*/React.createElement("span", {
        key: modName,
        className: "badge badge-student",
        style: {
          fontSize: '0.72rem'
        }
      }, modName, ": ", st.correct, "/", st.total, " (", pct, "%)");
    })));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0.9rem 1rem',
      background: 'rgba(15, 23, 42, 0.6)',
      borderRadius: '8px',
      border: '1px solid rgba(56, 189, 248, 0.35)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.5rem',
      marginBottom: '0.65rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.86rem',
      fontWeight: '700',
      color: '#38bdf8'
    }
  }, "\uD83D\uDCDA Topic per Question Number (", resolved.items.length, " Questions)"), resolved.source === 'set' && /*#__PURE__*/React.createElement("span", {
    className: "badge badge-student",
    style: {
      marginLeft: '0.5rem',
      fontSize: '0.7rem'
    }
  }, "From Saved SET ", resolved.setLetter), resolved.source === 'manual_quiz' && /*#__PURE__*/React.createElement("span", {
    className: "badge badge-student",
    style: {
      marginLeft: '0.5rem',
      fontSize: '0.7rem'
    }
  }, "From Quiz Item List")), resolved.hasStudentAnswers && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.35rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.18rem 0.55rem',
      fontSize: '0.73rem',
      borderColor: resultFilter === 'all' ? '#38bdf8' : undefined,
      color: resultFilter === 'all' ? '#38bdf8' : undefined
    },
    onClick: () => setResultFilter('all')
  }, "All (", resolved.items.length, ")"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.18rem 0.55rem',
      fontSize: '0.73rem',
      borderColor: resultFilter === 'wrong' ? '#f87171' : undefined,
      color: resultFilter === 'wrong' ? '#f87171' : undefined
    },
    onClick: () => setResultFilter('wrong')
  }, "\u274C Wrong (", wrongTotal, ")"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.18rem 0.55rem',
      fontSize: '0.73rem',
      borderColor: resultFilter === 'correct' ? '#34d399' : undefined,
      color: resultFilter === 'correct' ? '#34d399' : undefined
    },
    onClick: () => setResultFilter('correct')
  }, "\u2705 Correct (", correctTotal, ")"))), topicSummary.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.4rem',
      marginBottom: '0.75rem'
    }
  }, topicSummary.map(ts => {
    const pct = ts.total > 0 ? Math.round(ts.correct / ts.total * 100) : 0;
    const accent = !resolved.hasStudentAnswers ? {
      bg: 'rgba(56, 189, 248, 0.12)',
      bd: 'rgba(56, 189, 248, 0.35)',
      fg: '#38bdf8'
    } : pct >= 75 ? {
      bg: 'rgba(16, 185, 129, 0.14)',
      bd: 'rgba(16, 185, 129, 0.4)',
      fg: '#34d399'
    } : pct >= 50 ? {
      bg: 'rgba(245, 158, 11, 0.14)',
      bd: 'rgba(245, 158, 11, 0.4)',
      fg: '#fbbf24'
    } : {
      bg: 'rgba(239, 68, 68, 0.14)',
      bd: 'rgba(239, 68, 68, 0.4)',
      fg: '#f87171'
    };
    return /*#__PURE__*/React.createElement("span", {
      key: ts.topic,
      style: {
        padding: '0.22rem 0.55rem',
        borderRadius: '999px',
        fontSize: '0.73rem',
        fontWeight: '600',
        background: accent.bg,
        border: `1px solid ${accent.bd}`,
        color: accent.fg
      }
    }, ts.topic, ": ", resolved.hasStudentAnswers ? `${ts.correct}/${ts.total} (${pct}%)` : `${ts.total} Q${ts.total > 1 ? 's' : ''}`);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: '260px',
      overflowY: 'auto',
      borderRadius: '6px',
      border: '1px solid var(--border-color)'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "data-table",
    style: {
      marginBottom: 0,
      fontSize: '0.79rem'
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: '58px'
    }
  }, "Q#"), /*#__PURE__*/React.createElement("th", null, "Topic"), /*#__PURE__*/React.createElement("th", null, "Module"), resolved.hasStudentAnswers && /*#__PURE__*/React.createElement("th", {
    style: {
      width: '90px'
    }
  }, "Student"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: '72px'
    }
  }, "Key"), resolved.hasStudentAnswers && /*#__PURE__*/React.createElement("th", {
    style: {
      width: '92px'
    }
  }, "Result"))), /*#__PURE__*/React.createElement("tbody", null, visibleItems.map(item => /*#__PURE__*/React.createElement("tr", {
    key: `${attempt.id}_q_${item.num}`
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: '800',
      fontFamily: 'monospace',
      color: '#38bdf8'
    }
  }, "#", item.num), /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: '600',
      color: 'var(--text-main)'
    }
  }, item.topic), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-student",
    style: {
      fontSize: '0.68rem'
    },
    title: item.module
  }, shortModLabel(item.module))), resolved.hasStudentAnswers && /*#__PURE__*/React.createElement("td", {
    style: {
      fontFamily: 'monospace',
      fontWeight: '700'
    }
  }, item.studentAnswer || '—'), /*#__PURE__*/React.createElement("td", {
    style: {
      fontFamily: 'monospace',
      fontWeight: '700',
      color: 'var(--primary-light)'
    }
  }, item.correctAnswer || '—'), resolved.hasStudentAnswers && /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: `badge ${item.isCorrect ? 'badge-status' : 'badge-admin'}`,
    style: {
      fontSize: '0.68rem'
    }
  }, item.isCorrect ? '✅ Correct' : '❌ Wrong'))))))));
}

// QUIZ RESULTS & STUDENT SCORE LOGS MODAL (SUPPORTS BOTH ADMIN AUDIT & STUDENT SCORE HISTORY)
function QuizResultsModal({
  attempts,
  quizzes,
  selectedQuizFilter,
  setSelectedQuizFilter,
  onClose,
  user
}) {
  const isStudent = user && user.role !== 'admin';
  const [expandedAttemptId, setExpandedAttemptId] = useState(null);
  const relevantAttempts = isStudent ? attempts.filter(a => a && (a.studentId === user.id || user.email && a.studentEmail && user.email.toLowerCase() === a.studentEmail.toLowerCase())) : attempts;
  const filteredAttempts = selectedQuizFilter ? relevantAttempts.filter(a => a.quizId === selectedQuizFilter) : relevantAttempts;
  const totalAttempts = filteredAttempts.length;
  const passedAttempts = filteredAttempts.filter(a => a.passed).length;
  const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts * 100).toFixed(1) : '0.0';
  const avgScore = totalAttempts > 0 ? (filteredAttempts.reduce((acc, a) => acc + getAttemptPercentage(a), 0) / totalAttempts).toFixed(1) : '0.0';
  const formatTime = secs => {
    if (!secs) return 'N/A';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content modal-content-lg glass-card",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: '1.6rem'
    }
  }, isStudent ? '📊 My Quiz & Activity Results' : '📊 Student Quiz Performance & Score Logs'), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.85rem'
    }
  }, isStudent ? 'Permanent record of all your submitted board exam quizzes, diagnostic benchmarks, simulations, and practice activities.' : 'Real-time audit log of all student quiz submissions, test scores, passing rates, and completion times.')), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    onClick: onClose
  }, "\u2715 Close")), /*#__PURE__*/React.createElement("div", {
    className: "stats-grid",
    style: {
      marginBottom: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass-card stat-card",
    style: {
      padding: '1rem 1.25rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stat-value gradient-text",
    style: {
      fontSize: '1.8rem'
    }
  }, totalAttempts), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, isStudent ? 'Completed Assessments' : 'Total Student Attempts'))), /*#__PURE__*/React.createElement("div", {
    className: "glass-card stat-card",
    style: {
      padding: '1rem 1.25rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stat-value",
    style: {
      fontSize: '1.8rem',
      color: 'var(--primary-light)'
    }
  }, avgScore, "%"), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Average Score"))), /*#__PURE__*/React.createElement("div", {
    className: "glass-card stat-card",
    style: {
      padding: '1.25rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stat-value",
    style: {
      fontSize: '1.8rem',
      color: 'var(--success)'
    }
  }, passRate, "%"), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Overall Pass Rate")))), /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginBottom: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("label", null, isStudent ? 'Filter My Results by Assessment' : 'Filter Log by Quiz'), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: selectedQuizFilter || '',
    onChange: e => setSelectedQuizFilter(e.target.value || null)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, isStudent ? `All My Quizzes & Activities (${relevantAttempts.length} records saved)` : `All Faculty Quizzes (${attempts.length} attempts recorded)`), quizzes.map(qz => /*#__PURE__*/React.createElement("option", {
    key: qz.id,
    value: qz.id
  }, qz.title)), isStudent && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("option", {
    value: "diagnostic_assessment"
  }, "Diagnostic Benchmark Assessment"), /*#__PURE__*/React.createElement("option", {
    value: "board_exam_simulation"
  }, "Licensure Exam Simulation")))), filteredAttempts.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '2rem',
      color: 'var(--text-muted)'
    }
  }, isStudent ? 'No quiz or activity records saved yet. Complete a quiz or diagnostic exam to record your first score!' : 'No student attempt records recorded for this quiz yet.') : /*#__PURE__*/React.createElement("div", {
    className: "table-responsive",
    style: {
      maxHeight: '45vh',
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "data-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, !isStudent && /*#__PURE__*/React.createElement("th", null, "Student Name"), !isStudent && /*#__PURE__*/React.createElement("th", null, "School / University"), /*#__PURE__*/React.createElement("th", null, "Assessment / Quiz Title"), /*#__PURE__*/React.createElement("th", null, "Score"), /*#__PURE__*/React.createElement("th", null, "Percentage"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", null, "Time Taken"), /*#__PURE__*/React.createElement("th", null, "Submitted At"), !isStudent && /*#__PURE__*/React.createElement("th", null, "Topics per Q#"))), /*#__PURE__*/React.createElement("tbody", null, filteredAttempts.map(att => {
    const isExpanded = !isStudent && expandedAttemptId === att.id;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: att.id
    }, /*#__PURE__*/React.createElement("tr", null, !isStudent && /*#__PURE__*/React.createElement("td", {
      style: {
        fontWeight: '600'
      }
    }, att.studentName, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '0.75rem',
        color: 'var(--text-dim)'
      }
    }, att.studentEmail)), !isStudent && /*#__PURE__*/React.createElement("td", null, att.school || 'NEUST'), /*#__PURE__*/React.createElement("td", {
      style: {
        maxWidth: isStudent ? '320px' : '240px',
        fontSize: '0.85rem',
        fontWeight: isStudent ? '600' : 'normal'
      }
    }, att.quizTitle), /*#__PURE__*/React.createElement("td", {
      style: {
        fontWeight: '700'
      }
    }, getAttemptScore(att), " / ", getAttemptTotal(att)), /*#__PURE__*/React.createElement("td", {
      style: {
        fontWeight: '700',
        color: att.passed ? 'var(--success)' : 'var(--danger)'
      }
    }, getAttemptPercentage(att), "%"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: `badge ${att.passed ? 'badge-status' : 'badge-admin'}`
    }, att.passed ? 'PASSED' : 'FAILED')), /*#__PURE__*/React.createElement("td", null, formatTime(att.timeSpentSeconds)), /*#__PURE__*/React.createElement("td", {
      style: {
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }
    }, att.submittedAt), !isStudent && /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn-secondary",
      style: {
        padding: '0.24rem 0.6rem',
        fontSize: '0.74rem',
        borderColor: isExpanded ? '#38bdf8' : undefined,
        color: isExpanded ? '#38bdf8' : undefined
      },
      onClick: () => setExpandedAttemptId(isExpanded ? null : att.id)
    }, isExpanded ? '🔼 Hide Topics' : '📋 View Topics'))), isExpanded && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
      colSpan: 9,
      style: {
        padding: '0.5rem 0.75rem',
        background: 'rgba(2, 6, 23, 0.35)'
      }
    }, /*#__PURE__*/React.createElement(AdminAttemptTopicBreakdown, {
      attempt: att,
      quizzesList: quizzes
    }))));
  }))))));
}

// ADMIN COMPLETE USER MASTER DATA & ACADEMIC RECORD MODAL
function UserDetailModal({
  user,
  attemptsList = [],
  quizzesList = [],
  onClose
}) {
  const [expandedAttemptId, setExpandedAttemptId] = useState(null);
  const userAttempts = user.attempts && user.attempts.length > 0 ? user.attempts : (attemptsList || []).filter(a => a && (a.studentId === user.id || user.email && a.studentEmail && user.email.toLowerCase() === a.studentEmail.toLowerCase()));
  const passedCount = userAttempts.filter(a => a.passed).length;
  const failedCount = userAttempts.length - passedCount;
  const avgScore = userAttempts.length > 0 ? Math.round(userAttempts.reduce((acc, a) => acc + getAttemptPercentage(a), 0) / userAttempts.length) : 0;
  const stats = user.stats && user.stats.totalAttempts > 0 ? user.stats : {
    totalAttempts: userAttempts.length,
    passedCount,
    failedCount,
    avgScore
  };
  const attempts = userAttempts;
  const passRate = stats.totalAttempts > 0 ? (stats.passedCount / stats.totalAttempts * 100).toFixed(1) : '0.0';
  const formatTime = secs => {
    if (!secs) return 'N/A';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content modal-content-lg glass-card",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center',
      marginBottom: '0.25rem'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: '1.6rem'
    }
  }, user.fullName), /*#__PURE__*/React.createElement("span", {
    className: `badge ${user.role === 'admin' ? 'badge-admin' : 'badge-student'}`
  }, user.role.toUpperCase()), /*#__PURE__*/React.createElement("span", {
    className: `badge ${user.status === 'active' ? 'badge-status' : 'badge-admin'}`
  }, user.status.toUpperCase())), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.85rem'
    }
  }, "Master User Profile & Academic Examination History")), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    onClick: onClose
  }, "\u2715 Close")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem',
      background: 'rgba(255,255,255,0.02)',
      padding: '1.25rem',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-color)'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-dim)',
      textTransform: 'uppercase'
    }
  }, "Student Number"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '700',
      fontSize: '0.95rem',
      color: '#fbbf24'
    }
  }, user.studentNumber || 'Not Provided')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-dim)',
      textTransform: 'uppercase'
    }
  }, "Student Section"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '700',
      fontSize: '0.95rem',
      color: '#38bdf8'
    }
  }, user.section || 'Not Provided')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-dim)',
      textTransform: 'uppercase'
    }
  }, "Account ID"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '600',
      fontSize: '0.9rem'
    }
  }, user.id)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-dim)',
      textTransform: 'uppercase'
    }
  }, "Email Address"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '600',
      fontSize: '0.9rem'
    }
  }, user.email)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-dim)',
      textTransform: 'uppercase'
    }
  }, "University / School"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '600',
      fontSize: '0.9rem',
      color: 'var(--primary-light)'
    }
  }, user.school || 'Mapúa University')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-dim)',
      textTransform: 'uppercase'
    }
  }, "Target PRC Exam Date"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '600',
      fontSize: '0.9rem',
      color: 'var(--accent-light)'
    }
  }, user.targetExamDate || '2026-10-15')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-dim)',
      textTransform: 'uppercase'
    }
  }, "Account Registration Date"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '600',
      fontSize: '0.9rem'
    }
  }, user.createdDate || '2026-07-27'))), /*#__PURE__*/React.createElement("h4", {
    style: {
      marginBottom: '0.75rem'
    }
  }, "\uD83D\uDCC8 Student Academic Performance Summary"), /*#__PURE__*/React.createElement("div", {
    className: "stats-grid",
    style: {
      marginBottom: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass-card stat-card",
    style: {
      padding: '1rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stat-value gradient-text",
    style: {
      fontSize: '1.6rem'
    }
  }, stats.totalAttempts), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Total Quizzes Attempted"))), /*#__PURE__*/React.createElement("div", {
    className: "glass-card stat-card",
    style: {
      padding: '1rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stat-value",
    style: {
      fontSize: '1.6rem',
      color: 'var(--primary-light)'
    }
  }, stats.avgScore, "%"), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Average Score"))), /*#__PURE__*/React.createElement("div", {
    className: "glass-card stat-card",
    style: {
      padding: '1rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stat-value",
    style: {
      fontSize: '1.6rem',
      color: 'var(--success)'
    }
  }, stats.passedCount), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Quizzes Passed"))), /*#__PURE__*/React.createElement("div", {
    className: "glass-card stat-card",
    style: {
      padding: '1rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stat-value",
    style: {
      fontSize: '1.6rem',
      color: 'var(--danger)'
    }
  }, stats.failedCount), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Quizzes Failed")))), /*#__PURE__*/React.createElement("h4", {
    style: {
      marginBottom: '0.75rem'
    }
  }, "\uD83D\uDCCB Student Quiz Attempt History (", attempts.length, ")"), attempts.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '1.5rem',
      color: 'var(--text-muted)',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: 'var(--radius-md)'
    }
  }, "This student has not attempted any faculty board quizzes yet.") : /*#__PURE__*/React.createElement("div", {
    className: "table-responsive",
    style: {
      maxHeight: '48vh',
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "data-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Quiz Title"), /*#__PURE__*/React.createElement("th", null, "Score"), /*#__PURE__*/React.createElement("th", null, "Percentage"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", null, "Time Taken"), /*#__PURE__*/React.createElement("th", null, "Submitted At"), /*#__PURE__*/React.createElement("th", null, "Topics per Q#"))), /*#__PURE__*/React.createElement("tbody", null, attempts.map(att => {
    const isExpanded = expandedAttemptId === att.id;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: att.id
    }, /*#__PURE__*/React.createElement("tr", {
      style: {
        cursor: 'pointer'
      },
      onClick: () => setExpandedAttemptId(isExpanded ? null : att.id),
      title: "Click to inspect the Topic per Question Number for this quiz"
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        fontWeight: '600'
      }
    }, att.quizTitle), /*#__PURE__*/React.createElement("td", {
      style: {
        fontWeight: '700'
      }
    }, getAttemptScore(att), " / ", getAttemptTotal(att)), /*#__PURE__*/React.createElement("td", {
      style: {
        fontWeight: '700',
        color: att.passed ? 'var(--success)' : 'var(--danger)'
      }
    }, getAttemptPercentage(att), "%"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: `badge ${att.passed ? 'badge-status' : 'badge-admin'}`
    }, att.passed ? 'PASSED' : 'FAILED')), /*#__PURE__*/React.createElement("td", null, formatTime(att.timeSpentSeconds)), /*#__PURE__*/React.createElement("td", {
      style: {
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }
    }, att.submittedAt), /*#__PURE__*/React.createElement("td", {
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn-secondary",
      style: {
        padding: '0.24rem 0.6rem',
        fontSize: '0.74rem',
        borderColor: isExpanded ? '#38bdf8' : undefined,
        color: isExpanded ? '#38bdf8' : undefined
      },
      onClick: () => setExpandedAttemptId(isExpanded ? null : att.id)
    }, isExpanded ? '🔼 Hide Topics' : '📋 View Topics'))), isExpanded && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
      colSpan: 7,
      style: {
        padding: '0.5rem 0.75rem',
        background: 'rgba(2, 6, 23, 0.35)'
      }
    }, /*#__PURE__*/React.createElement(AdminAttemptTopicBreakdown, {
      attempt: att,
      quizzesList: quizzesList
    }))));
  }))))));
}

// AUTH MODAL COMPONENT
function AuthModal({
  authModal,
  setAuthModal,
  handleAuthSubmit
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setAuthModal(null)
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content glass-card",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      marginBottom: '0.5rem',
      textAlign: 'center'
    }
  }, authModal === 'login' ? 'Welcome Back' : 'Create Student Account'), /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: 'center',
      color: 'var(--text-muted)',
      marginBottom: '1.5rem',
      fontSize: '0.9rem'
    }
  }, "Access 5,036 Solved Mechanical Engineering Licensure Questions"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: `btn-secondary ${authModal === 'login' ? 'btn-primary' : ''}`,
    style: {
      flex: 1
    },
    onClick: () => setAuthModal('login')
  }, "Login"), /*#__PURE__*/React.createElement("button", {
    className: `btn-secondary ${authModal === 'signup' ? 'btn-primary' : ''}`,
    style: {
      flex: 1
    },
    onClick: () => setAuthModal('signup')
  }, "Sign Up")), authModal === 'signup' && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(245, 158, 11, 0.12)',
      border: '1px solid rgba(245, 158, 11, 0.35)',
      borderRadius: '8px',
      padding: '0.65rem 0.85rem',
      marginBottom: '1.25rem',
      fontSize: '0.82rem',
      color: '#fbbf24',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '1.1rem'
    }
  }, "\uD83D\uDEE1\uFE0F"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Admin Approval Required:"), " New student accounts are reviewed and activated by faculty administrators before login access is granted.")), /*#__PURE__*/React.createElement("form", {
    onSubmit: e => handleAuthSubmit(e, authModal, 'student')
  }, authModal === 'signup' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Full Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    name: "fullName",
    className: "form-control",
    placeholder: "Engr. Juan Dela Cruz",
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid-2col",
    style: {
      gap: '0.75rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Student Number"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    name: "studentNumber",
    className: "form-control",
    placeholder: "e.g. 2022-001234",
    maxLength: "60",
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Student Section"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    name: "section",
    className: "form-control",
    placeholder: "e.g. BSME 4A",
    maxLength: "60",
    required: true
  })))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Email Address"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    name: "email",
    className: "form-control",
    placeholder: "user@me-boardprep.edu",
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Password"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    name: "password",
    className: "form-control",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    required: true
  })), authModal === 'signup' && /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "University / School"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    name: "school",
    className: "form-control",
    placeholder: "Map\xFAa / UP / UST / NEUST / TUP"
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn-primary",
    style: {
      width: '100%',
      marginTop: '1rem',
      justifyContent: 'center'
    }
  }, authModal === 'login' ? 'Sign In to Account' : 'Register Student Account'))));
}

// EXAM & PRACTICE SIMULATOR VIEW
function ExamView({
  questions,
  activeQuiz,
  activeIdx,
  setActiveIdx,
  userAnswers,
  setUserAnswers,
  showExplanation,
  setShowExplanation,
  examMode,
  examTimer,
  examSubmitted,
  setExamSubmitted,
  recordQuizAttempt,
  startBoardSimulation,
  startAdaptiveSmartQuiz,
  onFinish
}) {
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'incorrect', 'correct'
  const [hasRecorded, setHasRecorded] = useState(false);
  const [startTime] = useState(Date.now());
  if (!questions || questions.length === 0) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        padding: '3rem'
      }
    }, "Loading examination questions...");
  }
  const q = questions[activeIdx] || questions[0];
  const selectedOption = userAnswers[q.ID];
  const handleSelectOption = letter => {
    if (examSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [q.ID]: letter
    }));
  };
  const calculateScore = () => {
    let score = 0;
    questions.forEach(item => {
      if (userAnswers[item.ID] === item.CorrectAnswer) {
        score++;
      }
    });
    return score;
  };
  const formatTime = secs => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };
  const scorePct = (calculateScore() / questions.length * 100).toFixed(1);
  const passingScorePct = activeQuiz ? activeQuiz.passingScorePct || 70 : 70;
  const isPassed = parseFloat(scorePct) >= passingScorePct;
  const handleSubmitQuiz = () => {
    setExamSubmitted(true);
    if (!hasRecorded && recordQuizAttempt) {
      const timeSpentSecs = Math.round((Date.now() - startTime) / 1000);
      recordQuizAttempt(calculateScore(), questions.length, scorePct, isPassed, timeSpentSecs);
      setHasRecorded(true);
    }
  };

  // Auto record if timer ran out
  useEffect(() => {
    if (examSubmitted && !hasRecorded && recordQuizAttempt) {
      const timeSpentSecs = Math.round((Date.now() - startTime) / 1000);
      recordQuizAttempt(calculateScore(), questions.length, scorePct, isPassed, timeSpentSecs);
      setHasRecorded(true);
    }
  }, [examSubmitted, hasRecorded]);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "glass-card exam-top-bar",
    style: {
      padding: '1rem 1.25rem',
      marginBottom: '1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '0.85rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: `badge ${examMode === 'mock' ? 'badge-admin' : 'badge-student'}`,
    style: {
      marginRight: '0.75rem'
    }
  }, examMode === 'mock' ? activeQuiz ? `⏱️ Quiz: ${activeQuiz.title.substring(0, 30)}...` : '⏱️ Timed Quiz' : '📖 Practice Mode'), /*#__PURE__*/React.createElement("strong", {
    style: {
      fontSize: '1.1rem'
    }
  }, "Question ", activeIdx + 1, " of ", questions.length)), examMode === 'mock' && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '1.2rem',
      fontWeight: '700',
      color: examTimer < 300 ? 'var(--danger)' : 'var(--accent-light)'
    }
  }, "\u23F0 Remaining Time: ", formatTime(examTimer)), /*#__PURE__*/React.createElement("div", null, !examSubmitted ? /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      background: 'linear-gradient(135deg, #10b981, #059669)',
      padding: '0.6rem 1.25rem',
      fontWeight: '700'
    },
    onClick: handleSubmitQuiz
  }, "\u2705 Submit Quiz & Update Readiness Index") : /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    onClick: onFinish
  }, "Return to Dashboard"))), examSubmitted && /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '2.25rem 2rem',
      marginBottom: '2rem',
      textAlign: 'center',
      border: isPassed ? '2px solid var(--success)' : '2px solid var(--warning)',
      background: isPassed ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(5, 150, 105, 0.28))' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.25))',
      boxShadow: isPassed ? '0 0 35px rgba(16, 185, 129, 0.3)' : '0 0 25px rgba(245, 158, 11, 0.2)'
    }
  }, isPassed ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '3rem',
      marginBottom: '0.5rem'
    }
  }, "\uD83D\uDFE2 \uD83C\uDF93 \uD83C\uDFC6"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: '2.2rem',
      color: 'var(--success)',
      marginBottom: '0.5rem',
      textTransform: 'uppercase',
      letterSpacing: '0.04em'
    }
  }, "Congratulations, you are now ready to take the board exam."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '1.8rem',
      fontWeight: '800',
      color: '#ffffff',
      margin: '0.5rem 0'
    }
  }, "Final Score: ", calculateScore(), " / ", questions.length, " (", scorePct, "%)"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-main)',
      fontSize: '1.05rem',
      maxWidth: '750px',
      margin: '0.5rem auto 1.5rem'
    }
  }, "\uD83C\uDF89 You satisfied the ", /*#__PURE__*/React.createElement("strong", null, passingScorePct, "%"), " passing threshold! Your green-light readiness status is unlocked on your student dashboard.")) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '2.8rem',
      marginBottom: '0.5rem'
    }
  }, "\uD83D\uDD04 \u26A0\uFE0F \uD83D\uDCDA"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: '1.9rem',
      color: 'var(--warning)',
      marginBottom: '0.5rem'
    }
  }, "Simulated Board Exam Evaluation Completed"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '1.8rem',
      fontWeight: '800',
      color: 'var(--warning)',
      margin: '0.5rem 0'
    }
  }, "Score: ", calculateScore(), " / ", questions.length, " (", scorePct, "%)"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '1rem 1.25rem',
      background: 'rgba(15, 23, 42, 0.6)',
      borderLeft: '4px solid var(--warning)',
      borderRadius: '8px',
      maxWidth: '750px',
      margin: '1rem auto 1.5rem',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--warning)',
      fontWeight: '700',
      fontSize: '0.95rem',
      marginBottom: '0.25rem'
    }
  }, "\uD83D\uDD04 Continuous Feedback Loop & Remediation Active"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.9rem',
      margin: 0
    }
  }, "You scored ", /*#__PURE__*/React.createElement("strong", null, scorePct, "%"), ". Your Adaptive Board Readiness Index has been reset to 0%. Complete targeted Smart-Quizzes to build your readiness index back up to ", /*#__PURE__*/React.createElement("strong", null, "75%"), " to unlock the Simulated Board Exam retake!")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.75rem',
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginBottom: '1.5rem'
    }
  }, startAdaptiveSmartQuiz && /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem'
    },
    onClick: startAdaptiveSmartQuiz
  }, "\u26A1 Step 3: Launch Smart-Quiz (Target: 75% Readiness)"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.5rem',
      justifyContent: 'center',
      flexWrap: 'wrap',
      paddingTop: '1rem',
      borderTop: '1px solid var(--border-color)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: `btn-secondary ${filterMode === 'all' ? 'btn-primary' : ''}`,
    onClick: () => setFilterMode('all')
  }, "Show All Questions (", questions.length, ")"), /*#__PURE__*/React.createElement("button", {
    className: `btn-secondary ${filterMode === 'incorrect' ? 'btn-primary' : ''}`,
    onClick: () => setFilterMode('incorrect')
  }, "Incorrect Answers (", questions.length - calculateScore(), ")"), /*#__PURE__*/React.createElement("button", {
    className: `btn-secondary ${filterMode === 'correct' ? 'btn-primary' : ''}`,
    onClick: () => setFilterMode('correct')
  }, "Correct Answers (", calculateScore(), ")"))), /*#__PURE__*/React.createElement("div", {
    className: "exam-container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass-card question-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "question-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-admin",
    style: {
      marginRight: '0.5rem'
    }
  }, q.Module), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.85rem',
      color: 'var(--text-muted)'
    }
  }, "ID: #", q.ID, " | ", q.Subtopic || q.Topic)), q.AIReviewStatus && /*#__PURE__*/React.createElement("span", {
    className: "badge badge-status"
  }, "AI Status: ", q.AIReviewStatus)), /*#__PURE__*/React.createElement("div", {
    className: "question-text"
  }, q.QuestionText), /*#__PURE__*/React.createElement("div", {
    className: "options-grid"
  }, ['A', 'B', 'C', 'D'].map(letter => {
    const text = q[`Option${letter}`];
    if (!text) return null;
    const isQuizMode = examMode === 'mock';
    const showAnswersNow = isQuizMode ? examSubmitted : showExplanation && selectedOption;
    let optClass = '';
    if (selectedOption === letter) optClass += ' selected';
    if (showAnswersNow) {
      if (letter === q.CorrectAnswer) optClass += ' correct';else if (selectedOption === letter && letter !== q.CorrectAnswer) optClass += ' incorrect';
    }
    return /*#__PURE__*/React.createElement("button", {
      key: letter,
      className: `option-btn ${optClass}`,
      onClick: () => handleSelectOption(letter)
    }, /*#__PURE__*/React.createElement("div", {
      className: "option-letter"
    }, letter), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, text));
  })), (examMode === 'mock' && examSubmitted || examMode === 'practice' && showExplanation) && q.Explanation && /*#__PURE__*/React.createElement("div", {
    className: "explanation-box"
  }, /*#__PURE__*/React.createElement("h4", null, "\uD83D\uDD2C First-Principles Engineering Solution & Explanation"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.95rem',
      lineHeight: '1.7',
      marginBottom: '1rem'
    }
  }, q.Explanation), q.References && /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: '0.75rem',
      borderTop: '1px solid var(--border-color)',
      fontSize: '0.85rem',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("strong", null, "\uD83D\uDCD6 Standard Academic Reference:"), " ", q.References)), /*#__PURE__*/React.createElement("div", {
    className: "exam-nav-actions",
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '2rem',
      gap: '0.75rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    disabled: activeIdx === 0,
    onClick: () => setActiveIdx(i => i - 1)
  }, "\u2190 Previous Question"), examMode === 'practice' && /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    onClick: () => setShowExplanation(e => !e)
  }, showExplanation ? 'Hide Solution' : 'Show Solution'), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    disabled: activeIdx === questions.length - 1,
    onClick: () => setActiveIdx(i => i + 1)
  }, "Next Question \u2192"))), /*#__PURE__*/React.createElement("div", {
    className: "glass-card question-palette-card",
    style: {
      padding: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      marginBottom: '1rem'
    }
  }, "Question Navigator"), /*#__PURE__*/React.createElement("div", {
    className: "question-nav-grid",
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
      gap: '0.5rem',
      maxHeight: '420px',
      overflowY: 'auto'
    }
  }, questions.map((item, idx) => {
    const isAns = !!userAnswers[item.ID];
    const isCorrect = userAnswers[item.ID] === item.CorrectAnswer;
    const isCurr = idx === activeIdx;
    if (examSubmitted) {
      if (filterMode === 'correct' && !isCorrect) return null;
      if (filterMode === 'incorrect' && isCorrect) return null;
    }
    let bg = 'rgba(255,255,255,0.05)';
    if (isAns) bg = 'var(--primary-glow)';
    if (examSubmitted) {
      bg = isCorrect ? 'var(--success-bg)' : 'var(--danger-bg)';
    }
    if (isCurr) bg = 'var(--primary)';
    return /*#__PURE__*/React.createElement("button", {
      key: item.ID,
      style: {
        padding: '0.5rem',
        borderRadius: 'var(--radius-sm)',
        border: isCurr ? '2px solid var(--primary-light)' : '1px solid var(--border-color)',
        background: bg,
        color: isCurr ? 'white' : 'var(--text-main)',
        fontWeight: '700',
        cursor: 'pointer'
      },
      onClick: () => setActiveIdx(idx)
    }, idx + 1);
  })), !examSubmitted && /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      width: '100%',
      marginTop: '1.25rem',
      background: 'linear-gradient(135deg, #10b981, #059669)',
      justifyContent: 'center',
      fontWeight: '700'
    },
    onClick: handleSubmitQuiz
  }, "\u2705 Submit Quiz & Update Readiness Index"))));
}

// QUESTION EXPLORER VIEW
function BatchAuditView({
  questions,
  loadQuestions,
  totalQuestionsCount,
  totalPagesCount,
  searchQuery,
  setSearchQuery,
  moduleFilter,
  setModuleFilter,
  batchFilter,
  setBatchFilter,
  typeFilter = '',
  setTypeFilter = () => {},
  statusFilter,
  setStatusFilter,
  downloadReviewedCSV
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSolutions, setExpandedSolutions] = useState({});
  const [searchingId, setSearchingId] = useState(null);
  const [allExpanded, setAllExpanded] = useState(false);
  const {
    solvingAvailable,
    elementAvailable,
    totalAvailable
  } = getAvailableQuestionCounts({
    moduleStr: moduleFilter,
    batchStr: batchFilter
  });
  const fetchFilteredPage = (page = 1, overrides = {}) => {
    setCurrentPage(page);
    const activeSearch = overrides.search !== undefined ? overrides.search : searchQuery;
    const activeModule = overrides.module !== undefined ? overrides.module : moduleFilter;
    const activeBatch = overrides.batch !== undefined ? overrides.batch : batchFilter;
    const activeType = overrides.type !== undefined ? overrides.type : typeFilter;
    const queryParams = {
      search: activeSearch,
      module: activeModule,
      batch: activeBatch,
      page,
      limit: 20
    };
    if (activeType) queryParams.type = activeType;
    loadQuestions(queryParams);
  };
  useEffect(() => {
    fetchFilteredPage(1);
  }, [moduleFilter, batchFilter, typeFilter]);
  const handleToggleSolution = qId => {
    if (expandedSolutions[qId]) {
      setExpandedSolutions(prev => ({
        ...prev,
        [qId]: false
      }));
      return;
    }
    setSearchingId(qId);
    setTimeout(() => {
      setExpandedSolutions(prev => ({
        ...prev,
        [qId]: true
      }));
      setSearchingId(null);
      window.showToast?.('Complete step-by-step solution retrieved!', 'success', 2200);
    }, 280);
  };
  const handleToggleAllSolutions = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const updated = {};
    questions.forEach(q => {
      updated[q.ID] = nextState;
    });
    setExpandedSolutions(updated);
    window.showToast?.(nextState ? 'All solutions on this page expanded' : 'All solutions collapsed', 'info');
  };
  const renderSolutionBreakdown = q => {
    const rawText = q.CompleteSolution || q.Explanation || '';
    if (!rawText) return null;
    if (rawText.includes('📐 GIVEN') || rawText.includes('🎯 TARGET') || rawText.includes('⚙️ GOVERNING')) {
      const sections = rawText.split('\n\n').filter(s => s.trim());
      return /*#__PURE__*/React.createElement("div", {
        className: "solution-content-grid",
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          marginTop: '0.65rem'
        }
      }, sections.map((sec, idx) => {
        const lines = sec.trim().split('\n');
        const header = lines[0] || '';
        const bodyLines = lines.slice(1);
        let headerColor = 'var(--primary-light)';
        let cardBg = 'rgba(255,255,255,0.03)';
        let borderColor = 'rgba(255,255,255,0.08)';
        if (header.includes('🏆') || header.includes('FINAL')) {
          cardBg = 'rgba(16, 185, 129, 0.12)';
          borderColor = 'rgba(16, 185, 129, 0.35)';
          headerColor = '#34d399';
        } else if (header.includes('💡') || header.includes('TIP') || header.includes('NOTE')) {
          cardBg = 'rgba(245, 158, 11, 0.1)';
          borderColor = 'rgba(245, 158, 11, 0.3)';
          headerColor = '#fbbf24';
        } else if (header.includes('⚙️') || header.includes('FORMULAS')) {
          cardBg = 'rgba(99, 102, 241, 0.08)';
          borderColor = 'rgba(99, 102, 241, 0.25)';
          headerColor = '#818cf8';
        } else if (header.includes('🧮') || header.includes('DERIVATION')) {
          cardBg = 'rgba(56, 189, 248, 0.08)';
          borderColor = 'rgba(56, 189, 248, 0.25)';
          headerColor = '#38bdf8';
        }
        const isFormula = header.includes('⚙️') || header.includes('FORMULAS');
        return /*#__PURE__*/React.createElement("div", {
          key: idx,
          style: {
            background: cardBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1.15rem'
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            fontWeight: '700',
            fontSize: '0.9rem',
            color: headerColor,
            marginBottom: bodyLines.length > 0 ? '0.45rem' : '0'
          }
        }, header), bodyLines.map((line, lIdx) => /*#__PURE__*/React.createElement("div", {
          key: lIdx,
          style: {
            fontSize: isFormula ? '0.92rem' : '0.86rem',
            fontFamily: isFormula ? 'var(--font-mono, monospace)' : 'inherit',
            fontWeight: isFormula ? '600' : 'normal',
            color: isFormula ? '#c7d2fe' : 'var(--text-main)',
            lineHeight: '1.6',
            padding: isFormula && !line.startsWith('• Governing') ? '0.25rem 0.6rem' : '0',
            background: isFormula && !line.startsWith('• Governing') ? 'rgba(0,0,0,0.3)' : 'transparent',
            borderRadius: isFormula ? '4px' : '0',
            marginTop: isFormula ? '0.25rem' : '0',
            paddingLeft: line.startsWith('•') ? '0.4rem' : '0'
          }
        }, line)));
      }));
    }
    return /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.85rem 1rem',
        fontSize: '0.88rem',
        lineHeight: '1.65',
        color: 'var(--text-main)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        marginTop: '0.65rem'
      }
    }, rawText);
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      gap: '1rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: '1.8rem',
      marginBottom: '0.5rem'
    }
  }, "Question Bank Explorer (5,036 Items)"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)'
    }
  }, "Independently solved, fact-checked, and enhanced questions with academic textbook references and review-tracking metadata across 63 batches.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    onClick: handleToggleAllSolutions,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.45rem',
      fontSize: '0.9rem'
    }
  }, /*#__PURE__*/React.createElement("span", null, allExpanded ? '✕ Collapse All Solutions' : '📐 Expand All Formulas & Solutions')))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '1rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.6rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: typeFilter === '' ? 'btn-primary' : 'btn-secondary',
    onClick: () => setTypeFilter(''),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.45rem',
      padding: '0.5rem 1rem',
      fontSize: '0.86rem'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCCB All Questions"), /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'rgba(255,255,255,0.16)',
      padding: '0.1rem 0.45rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: '700'
    }
  }, totalAvailable.toLocaleString())), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: typeFilter === 'solving' ? 'btn-primary' : 'btn-secondary',
    onClick: () => setTypeFilter('solving'),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.45rem',
      padding: '0.5rem 1rem',
      fontSize: '0.86rem',
      borderColor: typeFilter === 'solving' ? 'var(--primary-light)' : 'rgba(56, 189, 248, 0.4)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83E\uDDEE Solving Questions"), /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'rgba(56, 189, 248, 0.22)',
      color: '#38bdf8',
      padding: '0.1rem 0.45rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: '700'
    }
  }, solvingAvailable.toLocaleString())), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: typeFilter === 'element' ? 'btn-primary' : 'btn-secondary',
    onClick: () => setTypeFilter('element'),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.45rem',
      padding: '0.5rem 1rem',
      fontSize: '0.86rem',
      borderColor: typeFilter === 'element' ? '#fbbf24' : 'rgba(245, 158, 11, 0.4)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCD8 Element Questions"), /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'rgba(245, 158, 11, 0.22)',
      color: '#fbbf24',
      padding: '0.1rem 0.45rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: '700'
    }
  }, elementAvailable.toLocaleString()))), (searchQuery || moduleFilter || batchFilter || typeFilter) && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    onClick: () => {
      setSearchQuery('');
      setModuleFilter('');
      setBatchFilter('');
      setTypeFilter('');
      fetchFilteredPage(1, {
        search: '',
        module: '',
        batch: '',
        type: ''
      });
    },
    style: {
      padding: '0.45rem 0.85rem',
      fontSize: '0.8rem'
    }
  }, "\u2715 Reset Filters")), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.5rem',
      marginBottom: '2rem',
      display: 'flex',
      gap: '1rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "Search text, topic, subtopic, ID...",
    style: {
      flex: 2,
      minWidth: '200px'
    },
    value: searchQuery,
    onChange: e => setSearchQuery(e.target.value),
    onKeyDown: e => e.key === 'Enter' && fetchFilteredPage(1)
  }), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    style: {
      flex: 1.2,
      minWidth: '180px'
    },
    value: typeFilter,
    onChange: e => setTypeFilter(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "All Question Types (", totalAvailable.toLocaleString(), " Qs)"), /*#__PURE__*/React.createElement("option", {
    value: "solving"
  }, "\uD83E\uDDEE Solving Questions (", solvingAvailable.toLocaleString(), " Qs)"), /*#__PURE__*/React.createElement("option", {
    value: "element"
  }, "\uD83D\uDCD8 Element Questions (", elementAvailable.toLocaleString(), " Qs)")), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    style: {
      flex: 1.5,
      minWidth: '200px'
    },
    value: moduleFilter,
    onChange: e => setModuleFilter(e.target.value)
  }, MODULE_OPTIONS.map(opt => /*#__PURE__*/React.createElement("option", {
    key: opt.value,
    value: opt.value
  }, opt.label))), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    style: {
      flex: 1,
      minWidth: '160px'
    },
    value: batchFilter,
    onChange: e => setBatchFilter(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "All Batches"), /*#__PURE__*/React.createElement("option", {
    value: "PIPE-PROB-01"
  }, "Batch PIPE-PROB-01 (1,931 Solving Qs)"), Array.from({
    length: 65
  }, (_, i) => i + 1).map(b => /*#__PURE__*/React.createElement("option", {
    key: b,
    value: b
  }, "Batch ", b, " (", b === 65 ? '5' : '50', " Element Qs)"))), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: () => fetchFilteredPage(1)
  }, "Filter Bank")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }
  }, questions.map(q => {
    const isExpanded = !!expandedSolutions[q.ID];
    const isSearching = searchingId === q.ID;
    return /*#__PURE__*/React.createElement("div", {
      key: q.ID,
      className: "glass-card",
      style: {
        padding: '1.75rem'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.45rem'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "badge badge-student"
    }, "ID: #", q.ID), /*#__PURE__*/React.createElement("span", {
      className: `badge ${isSolvingQuestion(q) ? 'badge-status' : 'badge-admin'}`,
      style: {
        background: isSolvingQuestion(q) ? 'rgba(56, 189, 248, 0.16)' : 'rgba(245, 158, 11, 0.16)',
        color: isSolvingQuestion(q) ? '#38bdf8' : '#fbbf24',
        border: isSolvingQuestion(q) ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
      }
    }, isSolvingQuestion(q) ? '🧮 Solving Question' : '📘 Element Question'), /*#__PURE__*/React.createElement("span", {
      className: "badge badge-admin"
    }, q.Module), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.85rem',
        color: 'var(--text-muted)'
      }
    }, "Batch: ", q.BatchNumber || 'N/A', " | Subtopic: ", q.Subtopic || 'General')), /*#__PURE__*/React.createElement("span", {
      className: "badge badge-status"
    }, "Status: ", q.AIReviewStatus || 'Verified')), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontSize: '1.15rem',
        marginBottom: '1rem',
        fontWeight: '600'
      }
    }, q.QuestionText), /*#__PURE__*/React.createElement("div", {
      className: "grid-2col",
      style: {
        gap: '0.75rem',
        marginBottom: '1.25rem'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0.65rem',
        background: q.CorrectAnswer === 'A' ? 'var(--success-bg)' : 'rgba(255,255,255,0.03)',
        borderRadius: 'var(--radius-sm)',
        border: q.CorrectAnswer === 'A' ? '1px solid var(--success)' : '1px solid var(--border-color)'
      }
    }, /*#__PURE__*/React.createElement("strong", null, "A:"), " ", q.OptionA), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0.65rem',
        background: q.CorrectAnswer === 'B' ? 'var(--success-bg)' : 'rgba(255,255,255,0.03)',
        borderRadius: 'var(--radius-sm)',
        border: q.CorrectAnswer === 'B' ? '1px solid var(--success)' : '1px solid var(--border-color)'
      }
    }, /*#__PURE__*/React.createElement("strong", null, "B:"), " ", q.OptionB), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0.65rem',
        background: q.CorrectAnswer === 'C' ? 'var(--success-bg)' : 'rgba(255,255,255,0.03)',
        borderRadius: 'var(--radius-sm)',
        border: q.CorrectAnswer === 'C' ? '1px solid var(--success)' : '1px solid var(--border-color)'
      }
    }, /*#__PURE__*/React.createElement("strong", null, "C:"), " ", q.OptionC), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0.65rem',
        background: q.CorrectAnswer === 'D' ? 'var(--success-bg)' : 'rgba(255,255,255,0.03)',
        borderRadius: 'var(--radius-sm)',
        border: q.CorrectAnswer === 'D' ? '1px solid var(--success)' : '1px solid var(--border-color)'
      }
    }, /*#__PURE__*/React.createElement("strong", null, "D:"), " ", q.OptionD)), /*#__PURE__*/React.createElement("div", {
      className: "explanation-box",
      style: {
        marginTop: '0.75rem'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.65rem',
        marginBottom: '0.5rem'
      }
    }, /*#__PURE__*/React.createElement("h4", {
      style: {
        fontSize: '0.96rem',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        color: 'var(--text-main)'
      }
    }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCDD"), " Solution & Concept Explanation:"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: `btn-search-solution ${isExpanded ? 'active' : ''}`,
      onClick: () => handleToggleSolution(q.ID),
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.45rem',
        padding: '0.45rem 0.95rem',
        fontSize: '0.83rem',
        fontWeight: '700',
        borderRadius: 'var(--radius-sm)',
        border: isExpanded ? '1px solid var(--primary-light)' : '1px solid rgba(59, 130, 246, 0.45)',
        background: isExpanded ? 'linear-gradient(135deg, rgba(37,99,235,0.35), rgba(30,64,175,0.45))' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        color: '#ffffff',
        cursor: 'pointer',
        boxShadow: isExpanded ? 'none' : '0 2px 10px rgba(37,99,235,0.35)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      },
      title: "Automatically display the complete engineering formulas and step-by-step mathematical calculation"
    }, /*#__PURE__*/React.createElement("span", null, isSearching ? '⏳ Retrieving Solution...' : isExpanded ? '✕ Hide Solution' : '📐 Formula & Complete Solution'), !isExpanded && !isSearching && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.7rem',
        padding: '0.1rem 0.4rem',
        borderRadius: '4px',
        background: 'rgba(255,255,255,0.2)'
      }
    }, q.Type === 'Problems' ? 'Formula & Steps' : 'Concept & Theory')), /*#__PURE__*/React.createElement("a", {
      href: `https://www.google.com/search?q=${encodeURIComponent('PRC Mechanical Engineering ' + q.QuestionText)}`,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "btn-web-search",
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.45rem 0.75rem',
        fontSize: '0.8rem',
        fontWeight: '600',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-color)',
        background: 'rgba(255,255,255,0.05)',
        color: 'var(--text-muted)',
        textDecoration: 'none',
        transition: 'all 0.2s ease'
      },
      title: "Search this exact problem and PRC board discussions on Google"
    }, "\uD83C\uDF10 ", /*#__PURE__*/React.createElement("span", null, "Google")))), !isExpanded && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '0.88rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem',
        marginTop: '0.25rem'
      }
    }, /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontStyle: 'italic',
        color: 'var(--text-muted)'
      }
    }, q.Type === 'Problems' ? `💡 Target Answer: Option ${q.CorrectAnswer} (${q['Option' + q.CorrectAnswer]}). Click "📐 Formula & Complete Solution" to view exact formula and full step-by-step mathematical calculation.` : q.Explanation ? q.Explanation.length > 140 ? q.Explanation.substring(0, 140) + '...' : q.Explanation : 'Click to inspect complete solution.'), /*#__PURE__*/React.createElement("button", {
      type: "button",
      onClick: () => handleToggleSolution(q.ID),
      style: {
        background: 'none',
        border: 'none',
        color: 'var(--primary-light)',
        cursor: 'pointer',
        fontSize: '0.82rem',
        fontWeight: '600',
        padding: 0
      }
    }, "Show Formula & Solution \u2192")), isExpanded && /*#__PURE__*/React.createElement("div", {
      className: "complete-solution-box tab-content-fade",
      style: {
        marginTop: '0.85rem'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.65rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "badge badge-success",
      style: {
        fontSize: '0.75rem',
        padding: '0.2rem 0.55rem'
      }
    }, "\u2728 Complete ", q.Type === 'Problems' ? 'Calculation Derivation' : 'Solution & Theory'), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.78rem',
        color: 'var(--text-muted)'
      }
    }, "Module: ", q.Module, " | Topic: ", q.Topic))), renderSolutionBreakdown(q)), q.References && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '0.82rem',
        color: 'var(--primary-light)',
        marginTop: '0.65rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: '0.45rem'
      }
    }, /*#__PURE__*/React.createElement("strong", null, "Academic Reference:"), " ", q.References)));
  })), /*#__PURE__*/React.createElement("div", {
    className: "pagination-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pagination-info"
  }, "Showing Page ", /*#__PURE__*/React.createElement("strong", null, currentPage), " of ", /*#__PURE__*/React.createElement("strong", null, totalPagesCount), " (", totalQuestionsCount, " verified questions)"), /*#__PURE__*/React.createElement("div", {
    className: "pagination-controls"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    disabled: currentPage <= 1,
    onClick: () => fetchFilteredPage(currentPage - 1)
  }, "\u2190 Previous"), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    disabled: currentPage >= totalPagesCount,
    onClick: () => fetchFilteredPage(currentPage + 1)
  }, "Next \u2192"))));
}

// ============================================================================
// ADMIN-ONLY OMR ANSWER SHEET GENERATOR & PAPER SCANNER VIEW
// (WITH ROTATING SETS A-Z, OPTICAL QUIZ+SET AUTO-DETECT, AND AUTO SCORE RECORD)
// ============================================================================
function AdminOmrScannerView({
  quizzesList = [],
  usersList = [],
  loadAttempts,
  loadUsers,
  showToast
}) {
  // Quiz Sets A-Z Cloud/Local Sync
  const [quizSetsList, setQuizSetsList] = useState(() => getStoredQuizSets());
  useEffect(() => {
    const onSetsUpdate = () => setQuizSetsList(getStoredQuizSets());
    window.addEventListener('me_quiz_sets_updated', onSetsUpdate);
    // Fetch fresh sets from Cloud Firestore on mount
    fetch(`${API_BASE}/api/quiz-sets`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    }).then(r => r.json()).then(d => {
      if (d && Array.isArray(d.sets)) {
        try {
          localStorage.setItem(QUIZ_SETS_STORAGE_KEY, JSON.stringify(d.sets));
        } catch (e) {}
        setQuizSetsList(d.sets);
      }
    }).catch(() => {});
    return () => window.removeEventListener('me_quiz_sets_updated', onSetsUpdate);
  }, []);

  // Mode & Quiz / Set / Key State
  const initialQuizId = quizzesList[0]?.id || 'custom';
  const [selectedQuizId, setSelectedQuizId] = useState(initialQuizId);
  const [selectedSetLetter, setSelectedSetLetter] = useState(() => {
    const latest = initialQuizId !== 'custom' ? getLatestSetForQuiz(initialQuizId) : null;
    return latest ? latest.setLetter : '';
  });
  const [customTitle, setCustomTitle] = useState('ME Board Exam Practice Quiz');
  const [itemCount, setItemCount] = useState(quizzesList[0]?.questionCount ? Math.min(100, quizzesList[0].questionCount) : 50);
  const [passingPct, setPassingPct] = useState(quizzesList[0]?.passingScorePct || 70);
  const [answerKey, setAnswerKey] = useState([]);
  const [bulkKeyInput, setBulkKeyInput] = useState('');
  const [showSheetPreview, setShowSheetPreview] = useState(true);

  // Camera & Scanner State
  const videoRef = React.useRef(null);
  const scanCanvasRef = React.useRef(null);
  const sourceCanvasRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const autoSavedScanIdsRef = React.useRef(new Set());
  const skipEffectKeyLoadRef = React.useRef(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [streamObj, setStreamObj] = useState(null);
  const [hasScannedImage, setHasScannedImage] = useState(false);
  const [corners, setCorners] = useState(null); // [TL, TR, BR, BL]
  const [draggingCornerIdx, setDraggingCornerIdx] = useState(null);
  const [sensitivity, setSensitivity] = useState(0.22);
  const [scanResults, setScanResults] = useState([]);
  const [scannedStudentNumber, setScannedStudentNumber] = useState('');
  const [matchedStudentInfo, setMatchedStudentInfo] = useState(null);
  const [detectedBarcodeInfo, setDetectedBarcodeInfo] = useState(null);
  const [manualOverrides, setManualOverrides] = useState({});

  // Auto-Save & Student Recording State
  const studentsOnly = usersList.filter(u => u && u.role !== 'admin');
  const [autoSaveOnScan, setAutoSaveOnScan] = useState(true);
  const [autoSaveBanner, setAutoSaveBanner] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [manualStudentName, setManualStudentName] = useState('');
  const [manualStudentSection, setManualStudentSection] = useState('BSME');
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [scannedHistory, setScannedHistory] = useState([]);
  const selectedQuiz = quizzesList.find(q => q.id === selectedQuizId) || null;
  const activeExamTitle = selectedQuiz ? selectedQuiz.title : customTitle;
  const activeQuizKeyId = selectedQuiz ? selectedQuiz.id : getQuizStableId({
    title: customTitle
  });
  const activeQuizCode = getQuizOmrCode(activeQuizKeyId);
  const setsForActiveQuiz = React.useMemo(() => quizSetsList.filter(s => s.quizId === activeQuizKeyId).sort((a, b) => (a.setIndex ?? 0) - (b.setIndex ?? 0)), [quizSetsList, activeQuizKeyId]);
  const activeSetRecord = setsForActiveQuiz.find(s => s.setLetter === selectedSetLetter) || null;
  const nextRotatingLetter = getNextSetLetterForQuiz(activeQuizKeyId);
  const handleQuizDropdownChange = newQuizId => {
    setSelectedQuizId(newQuizId);
    const targetKeyId = newQuizId === 'custom' ? getQuizStableId({
      title: customTitle
    }) : newQuizId;
    const latest = getLatestSetForQuiz(targetKeyId);
    setSelectedSetLetter(latest ? latest.setLetter : '');
    setManualOverrides({});
  };

  // Load Answer Key automatically when selectedQuizId or selectedSetLetter changes
  useEffect(() => {
    if (skipEffectKeyLoadRef.current) {
      skipEffectKeyLoadRef.current = false;
      return;
    }
    if (activeSetRecord && activeSetRecord.answerKey) {
      const count = Math.max(1, Math.min(100, activeSetRecord.itemCount || activeSetRecord.answerKey.length));
      const keyArr = Array.from({
        length: count
      }, (_, idx) => activeSetRecord.answerKey[idx] || 'A');
      setItemCount(count);
      setPassingPct(activeSetRecord.passingScorePct || (selectedQuiz ? selectedQuiz.passingScorePct : 70) || 70);
      setAnswerKey(keyArr);
      setBulkKeyInput(keyArr.join(''));
      return;
    }
    if (selectedQuiz) {
      const qs = resolveQuestionsForQuizExport(selectedQuiz);
      const count = Math.max(1, Math.min(100, qs.length || selectedQuiz.questionCount || 50));
      setItemCount(count);
      setPassingPct(selectedQuiz.passingScorePct || 70);
      const keyArr = Array.from({
        length: count
      }, (_, idx) => {
        const ans = qs[idx] && qs[idx].CorrectAnswer ? String(qs[idx].CorrectAnswer).trim().toUpperCase().charAt(0) : 'A';
        return ['A', 'B', 'C', 'D'].includes(ans) ? ans : 'A';
      });
      setAnswerKey(keyArr);
      setBulkKeyInput(keyArr.join(''));
    } else {
      const count = Math.max(1, Math.min(100, parseInt(itemCount, 10) || 50));
      setAnswerKey(prev => {
        const next = Array.from({
          length: count
        }, (_, idx) => prev[idx] || ['A', 'B', 'C', 'D'][idx % 4]);
        setBulkKeyInput(next.join(''));
        return next;
      });
    }
  }, [selectedQuizId, selectedSetLetter, activeSetRecord?.id, activeSetRecord?.updatedAt]);
  const handleGenerateNextSet = () => {
    const cfg = selectedQuiz || {
      id: activeQuizKeyId,
      title: customTitle,
      questionCount: itemCount,
      passingScorePct: passingPct
    };
    const gen = generateNewQuizSet(cfg);
    if (!gen) {
      showToast?.('Could not generate quiz set — check available questions.', 'warning');
      return;
    }
    setQuizSetsList(getStoredQuizSets());
    setSelectedSetLetter(gen.setRecord.setLetter);
    showToast?.(`Generated SET ${gen.setRecord.setLetter} (${gen.setRecord.itemCount} Items) with its own unique Answer Key! Next set in rotation: SET ${getNextSetLetterForQuiz(activeQuizKeyId)}.`, 'success');
  };
  const handleDownloadOmrSheetForActiveSet = (asWord = false) => {
    let targetSet = activeSetRecord;
    if (!targetSet && selectedQuiz) {
      targetSet = ensureLatestSetForQuiz(selectedQuiz);
      if (targetSet) {
        setQuizSetsList(getStoredQuizSets());
        setSelectedSetLetter(targetSet.setLetter);
      }
    }
    const opts = {
      title: activeExamTitle,
      itemCount: targetSet ? Math.min(100, targetSet.itemCount) : itemCount,
      subtitle: selectedQuiz ? selectedQuiz.module || 'Comprehensive Board Exam' : '',
      quizId: activeQuizKeyId,
      omrQuizCode: targetSet ? targetSet.omrQuizCode : activeQuizCode,
      setLetter: targetSet ? targetSet.setLetter : selectedSetLetter || 'A'
    };
    if (asWord) exportOmrAnswerSheetWord(opts);else exportOmrAnswerSheetHtml(opts);
  };
  const handleItemCountChange = newCount => {
    const n = Math.max(1, Math.min(100, parseInt(newCount, 10) || 20));
    setItemCount(n);
    setAnswerKey(prev => {
      const next = Array.from({
        length: n
      }, (_, idx) => prev[idx] || ['A', 'B', 'C', 'D'][idx % 4]);
      setBulkKeyInput(next.join(''));
      return next;
    });
    setManualOverrides({});
  };
  const applyBulkKeyString = val => {
    setBulkKeyInput(val);
    const cleaned = val.toUpperCase().replace(/[^ABCD]/g, '');
    if (cleaned.length > 0) {
      const next = Array.from({
        length: itemCount
      }, (_, idx) => cleaned[idx] || answerKey[idx] || 'A');
      setAnswerKey(next);
    }
  };
  const stopCamera = () => {
    if (streamObj) {
      streamObj.getTracks().forEach(t => t.stop());
      setStreamObj(null);
    }
    setCameraActive(false);
  };
  useEffect(() => {
    return () => {
      if (streamObj) streamObj.getTracks().forEach(t => t.stop());
    };
  }, [streamObj]);
  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast?.('Camera access is not supported in this browser. Use "Upload Test Paper Photo" instead.', 'warning');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: 'environment'
          },
          width: {
            ideal: 1600
          },
          height: {
            ideal: 1200
          }
        },
        audio: false
      });
      setStreamObj(stream);
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err) {
      showToast?.('Unable to open camera (' + (err.message || 'Permission denied') + '). You can still upload a photo of the test paper.', 'error');
    }
  };

  // Persist scanned score directly onto the matched student's official cloud record
  const persistScoreToStudentRecord = React.useCallback(async ({
    chosenStudent,
    fallbackName = '',
    fallbackSection = 'BSME',
    scannedNum = '',
    quizObj = null,
    examTitle = '',
    setLetter = '',
    scoreVal = 0,
    totalVal = 50,
    pctVal = 0,
    passedVal = false,
    questionBreakdown = [],
    isAuto = false
  }) => {
    const finalName = chosenStudent ? chosenStudent.fullName : fallbackName.trim() || (scannedNum ? `Student #${scannedNum}` : '');
    if (!finalName) {
      if (!isAuto) showToast?.('Please select a registered student or enter the student name.', 'warning');
      return false;
    }
    setIsSavingScore(true);
    if (isAuto) {
      setAutoSaveBanner({
        status: 'saving',
        message: `Auto-recording score for ${finalName} (${scannedNum || chosenStudent?.studentNumber || ''})...`
      });
    }
    const setLabel = setLetter ? `SET ${setLetter}` : '';
    const displayQuizTitle = setLabel ? `[OMR Scan • ${setLabel}] ${examTitle}` : `[OMR Scan] ${examTitle}`;
    const payload = {
      studentId: chosenStudent ? chosenStudent.id : scannedNum ? `stud_${scannedNum.replace(/\D/g, '')}` : `scanned_${Date.now()}`,
      studentName: chosenStudent ? chosenStudent.studentNumber ? `${chosenStudent.fullName} (${chosenStudent.studentNumber})` : chosenStudent.fullName : scannedNum && !finalName.includes(scannedNum) ? `${finalName} (${scannedNum})` : finalName,
      studentEmail: chosenStudent ? chosenStudent.email || '' : '',
      school: chosenStudent ? chosenStudent.school || 'NEUST' : fallbackSection || 'NEUST',
      quizId: quizObj ? quizObj.id : `omr_paper_${Date.now()}`,
      quizTitle: displayQuizTitle.slice(0, 300),
      score: scoreVal,
      totalQuestions: totalVal,
      percentage: pctVal,
      passed: passedVal,
      timeSpentSeconds: 60,
      ...(Array.isArray(questionBreakdown) && questionBreakdown.length > 0 ? {
        questionBreakdown
      } : {})
    };
    try {
      const res = await fetch(`${API_BASE}/api/attempts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error) {
        if (isAuto) {
          setAutoSaveBanner({
            status: 'error',
            message: 'Auto-save failed: ' + data.error
          });
        }
        showToast?.(data.error, 'error');
        return false;
      }
      setScannedHistory(prev => [{
        id: Date.now() + Math.random(),
        studentName: finalName,
        studentNumber: chosenStudent && chosenStudent.studentNumber || scannedNum || '—',
        section: payload.school,
        quizTitle: examTitle,
        setLetter: setLetter || '—',
        score: scoreVal,
        total: totalVal,
        percentage: pctVal,
        passed: passedVal,
        autoSaved: isAuto,
        scannedAt: new Date().toLocaleTimeString()
      }, ...prev]);
      if (isAuto) {
        setAutoSaveBanner({
          status: 'saved',
          studentName: finalName,
          studentNumber: chosenStudent && chosenStudent.studentNumber || scannedNum,
          quizTitle: examTitle,
          setLetter,
          score: scoreVal,
          total: totalVal,
          percentage: pctVal,
          passed: passedVal,
          message: `Automatically moved score to ${finalName}'s official student record!`
        });
        showToast?.(`✅ Auto-Saved! ${finalName} (${setLabel || 'OMR'}) — ${scoreVal}/${totalVal} (${pctVal}%) moved to student record!`, 'success');
      } else {
        showToast?.(`Saved scanned score for ${finalName}: ${scoreVal}/${totalVal} (${pctVal}%)!`, 'success');
        setManualStudentName('');
      }
      if (loadAttempts) loadAttempts();
      if (loadUsers) loadUsers();
      return true;
    } catch (err) {
      if (isAuto) {
        setAutoSaveBanner({
          status: 'error',
          message: 'Auto-save error: ' + err.message
        });
      }
      showToast?.('Error saving scanned score: ' + err.message, 'error');
      return false;
    } finally {
      setIsSavingScore(false);
    }
  }, [loadAttempts, loadUsers, showToast]);

  // Run OMR grading + draw annotated overlay onto scanCanvasRef
  const runScanAndRender = React.useCallback((activeCorners, activeSensitivity, overridesMap = manualOverrides) => {
    const srcCanvas = sourceCanvasRef.current;
    const dispCanvas = scanCanvasRef.current;
    if (!srcCanvas || !dispCanvas || !activeCorners || activeCorners.length !== 4) return;
    const w = srcCanvas.width;
    const h = srcCanvas.height;
    dispCanvas.width = w;
    dispCanvas.height = h;
    const srcCtx = srcCanvas.getContext('2d', {
      willReadFrequently: true
    });
    const dispCtx = dispCanvas.getContext('2d');
    const imgData = srcCtx.getImageData(0, 0, w, h);
    const scanOutput = scanOmrBubblesFromImageData(imgData, activeCorners, itemCount, activeSensitivity);
    const rawResults = scanOutput.answerResults || [];
    setScanResults(rawResults);

    // Match Student Number against registered student accounts
    const detectedNumStr = scanOutput.scannedStudentNumber || '';
    const detectedDigitsOnly = scanOutput.rawStudentNumberDigits || '';
    setScannedStudentNumber(detectedNumStr);
    if (detectedDigitsOnly.length >= 4) {
      const matched = studentsOnly.find(st => {
        const stDigits = String(st.studentNumber || '').replace(/\D/g, '');
        return stDigits && (stDigits === detectedDigitsOnly || stDigits.endsWith(detectedDigitsOnly) || detectedDigitsOnly.endsWith(stDigits));
      });
      if (matched) {
        setMatchedStudentInfo(matched);
        setSelectedStudentId(matched.id);
      } else {
        setMatchedStudentInfo(null);
      }
    } else {
      setMatchedStudentInfo(null);
    }

    // Draw original image
    dispCtx.clearRect(0, 0, w, h);
    dispCtx.drawImage(srcCanvas, 0, 0);

    // Draw alignment quad connecting TL -> TR -> BR -> BL
    dispCtx.save();
    dispCtx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    dispCtx.lineWidth = Math.max(2, w / 350);
    dispCtx.setLineDash([8, 6]);
    dispCtx.beginPath();
    dispCtx.moveTo(activeCorners[0].x, activeCorners[0].y);
    dispCtx.lineTo(activeCorners[1].x, activeCorners[1].y);
    dispCtx.lineTo(activeCorners[2].x, activeCorners[2].y);
    dispCtx.lineTo(activeCorners[3].x, activeCorners[3].y);
    dispCtx.closePath();
    dispCtx.stroke();
    dispCtx.setLineDash([]);

    // Draw emerald highlight around decoded Optical Quiz+Set Barcode Strip
    if (scanOutput.barcode && scanOutput.barcode.valid && scanOutput.barcode.samples && scanOutput.barcode.samples.length === 27) {
      const firstS = scanOutput.barcode.samples[0];
      const lastS = scanOutput.barcode.samples[26];
      const midX = (firstS.x + lastS.x) / 2;
      const midY = (firstS.y + lastS.y) / 2;
      const stripLen = Math.hypot(lastS.x - firstS.x, lastS.y - firstS.y);
      const angle = Math.atan2(lastS.y - firstS.y, lastS.x - firstS.x);
      dispCtx.save();
      dispCtx.translate(midX, midY);
      dispCtx.rotate(angle);
      dispCtx.strokeStyle = '#10b981';
      dispCtx.fillStyle = 'rgba(16, 185, 129, 0.16)';
      dispCtx.lineWidth = Math.max(2, w / 380);
      dispCtx.fillRect(-stripLen / 2 - 8, -12, stripLen + 16, 24);
      dispCtx.strokeRect(-stripLen / 2 - 8, -12, stripLen + 16, 24);
      dispCtx.restore();
    }

    // Draw purple rings on detected Student Number shaded bubbles
    (scanOutput.studentIdColsStats || []).forEach(col => {
      if (!col.detectedDigit) return;
      const digObj = col.digitStats.find(d => d.digit === col.detectedDigit);
      if (digObj) {
        dispCtx.beginPath();
        dispCtx.arc(digObj.x, digObj.y, digObj.rPx * 1.25, 0, Math.PI * 2);
        dispCtx.lineWidth = Math.max(2.2, w / 360);
        dispCtx.strokeStyle = '#a855f7';
        dispCtx.fillStyle = 'rgba(168, 85, 247, 0.28)';
        dispCtx.fill();
        dispCtx.stroke();
      }
    });

    // Draw graded bubble overlays
    rawResults.forEach((res, idx) => {
      const correctAns = answerKey[idx] || 'A';
      const studentAns = overridesMap[res.itemNum] !== undefined ? overridesMap[res.itemNum] : res.detected;
      const isCorrect = studentAns && studentAns !== 'MULTI' && studentAns === correctAns;
      res.optionStats.forEach(opt => {
        const isStudentChoice = studentAns === opt.letter;
        const isRightOption = correctAns === opt.letter;
        if (isStudentChoice) {
          dispCtx.beginPath();
          dispCtx.arc(opt.x, opt.y, opt.rPx * 1.15, 0, Math.PI * 2);
          dispCtx.lineWidth = Math.max(2.2, w / 340);
          dispCtx.strokeStyle = isCorrect ? '#10b981' : '#ef4444';
          dispCtx.fillStyle = isCorrect ? 'rgba(16, 185, 129, 0.28)' : 'rgba(239, 68, 68, 0.28)';
          dispCtx.fill();
          dispCtx.stroke();
        } else if (!isCorrect && isRightOption) {
          dispCtx.beginPath();
          dispCtx.arc(opt.x, opt.y, opt.rPx * 1.12, 0, Math.PI * 2);
          dispCtx.lineWidth = Math.max(1.8, w / 420);
          dispCtx.strokeStyle = '#10b981';
          dispCtx.stroke();
        } else if (studentAns === 'MULTI' && opt.fillRatio >= activeSensitivity) {
          dispCtx.beginPath();
          dispCtx.arc(opt.x, opt.y, opt.rPx * 1.15, 0, Math.PI * 2);
          dispCtx.lineWidth = Math.max(2, w / 360);
          dispCtx.strokeStyle = '#f59e0b';
          dispCtx.stroke();
        }
      });
    });

    // Draw 4 draggable corner handles (TL, TR, BR, BL)
    const labels = ['TL', 'TR', 'BR', 'BL'];
    const handleR = Math.max(11, Math.round(w / 55));
    activeCorners.forEach((pt, idx) => {
      dispCtx.beginPath();
      dispCtx.arc(pt.x, pt.y, handleR, 0, Math.PI * 2);
      dispCtx.fillStyle = 'rgba(14, 165, 233, 0.85)';
      dispCtx.fill();
      dispCtx.lineWidth = 2.5;
      dispCtx.strokeStyle = '#ffffff';
      dispCtx.stroke();
      dispCtx.fillStyle = '#ffffff';
      dispCtx.font = `bold ${Math.max(10, Math.round(handleR * 0.8))}px Arial`;
      dispCtx.textAlign = 'center';
      dispCtx.textBaseline = 'middle';
      dispCtx.fillText(labels[idx], pt.x, pt.y);
    });
    dispCtx.restore();
  }, [itemCount, answerKey, manualOverrides, studentsOnly]);
  useEffect(() => {
    if (hasScannedImage && corners) {
      runScanAndRender(corners, sensitivity, manualOverrides);
    }
  }, [hasScannedImage, corners, sensitivity, answerKey, itemCount, manualOverrides, runScanAndRender]);

  // Load new scanned image -> Auto-Identify Quiz & Set -> Auto-Grade -> Auto-Move Score to Student Record!
  const loadImageOntoScanner = (imgOrVideo, srcW, srcH) => {
    const scanSessionId = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const maxDim = 1100;
    const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
    const w = Math.round(srcW * scale);
    const h = Math.round(srcH * scale);
    if (!sourceCanvasRef.current) {
      sourceCanvasRef.current = document.createElement('canvas');
    }
    const srcCanvas = sourceCanvasRef.current;
    srcCanvas.width = w;
    srcCanvas.height = h;
    const ctx = srcCanvas.getContext('2d', {
      willReadFrequently: true
    });
    ctx.drawImage(imgOrVideo, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const detectedCorners = detectOmrFiducialCorners(imgData);
    const foundCount = detectedCorners.filter(c => c.detected).length;

    // 1. AUTO-IDENTIFY QUIZ & SET (A-Z) FROM OPTICAL BARCODE STRIP
    const barcode = decodeOmrBarcodeFromImageData(imgData, detectedCorners);
    let effQuiz = selectedQuiz;
    let effTitle = activeExamTitle;
    let effSetLetter = selectedSetLetter;
    let effItemCount = itemCount;
    let effPassingPct = passingPct;
    let effAnswerKey = answerKey;
    if (barcode && barcode.valid && barcode.omrQuizCode > 0) {
      const allSets = getStoredQuizSets();
      const matchedQuiz = quizzesList.find(q => getQuizOmrCode(q.id) === barcode.omrQuizCode) || null;
      const matchedSet = allSets.find(s => (matchedQuiz ? s.quizId === matchedQuiz.id : s.omrQuizCode === barcode.omrQuizCode) && (!barcode.setLetter || s.setLetter === barcode.setLetter)) || null;
      if (matchedQuiz) {
        effQuiz = matchedQuiz;
        effTitle = matchedQuiz.title;
      } else if (matchedSet && matchedSet.quizTitle) {
        effTitle = matchedSet.quizTitle;
      }
      if (barcode.setLetter) {
        effSetLetter = barcode.setLetter;
      }
      if (matchedSet && matchedSet.answerKey) {
        effItemCount = Math.max(1, Math.min(100, matchedSet.itemCount || matchedSet.answerKey.length));
        effPassingPct = matchedSet.passingScorePct || (matchedQuiz ? matchedQuiz.passingScorePct : 70) || 70;
        effAnswerKey = Array.from({
          length: effItemCount
        }, (_, i) => matchedSet.answerKey[i] || 'A');
      } else if (matchedQuiz) {
        const qs = resolveQuestionsForQuizExport(matchedQuiz);
        effItemCount = Math.max(1, Math.min(100, qs.length || matchedQuiz.questionCount || 50));
        effPassingPct = matchedQuiz.passingScorePct || 70;
        effAnswerKey = Array.from({
          length: effItemCount
        }, (_, i) => {
          const ans = qs[i] && qs[i].CorrectAnswer ? String(qs[i].CorrectAnswer).trim().toUpperCase().charAt(0) : 'A';
          return ['A', 'B', 'C', 'D'].includes(ans) ? ans : 'A';
        });
      }

      // Sync UI selectors to the auto-detected Quiz + Set + Answer Key
      skipEffectKeyLoadRef.current = true;
      if (matchedQuiz) setSelectedQuizId(matchedQuiz.id);
      if (effSetLetter) setSelectedSetLetter(effSetLetter);
      setItemCount(effItemCount);
      setPassingPct(effPassingPct);
      setAnswerKey(effAnswerKey);
      setBulkKeyInput(effAnswerKey.join(''));
      setDetectedBarcodeInfo({
        valid: true,
        omrQuizCode: barcode.omrQuizCode,
        setLetter: effSetLetter,
        matchedQuizTitle: effTitle,
        setKeyFound: !!matchedSet
      });
    } else {
      setDetectedBarcodeInfo({
        valid: false
      });
    }

    // 2. RUN IMMEDIATE SCAN WITH RESOLVED QUIZ/SET ANSWER KEY
    const initialScan = scanOmrBubblesFromImageData(imgData, detectedCorners, effItemCount, sensitivity);
    const detectedDigits = initialScan.rawStudentNumberDigits || '';
    const detectedNumFormatted = initialScan.scannedStudentNumber || '';
    const matchedStudent = detectedDigits.length >= 4 ? studentsOnly.find(st => {
      const stDigits = String(st.studentNumber || '').replace(/\D/g, '');
      return stDigits && (stDigits === detectedDigits || stDigits.endsWith(detectedDigits) || detectedDigits.endsWith(stDigits));
    }) || null : null;
    let initialCorrect = 0;
    (initialScan.answerResults || []).forEach((res, idx) => {
      const k = effAnswerKey[idx] || 'A';
      if (res.detected && res.detected !== 'MULTI' && res.detected === k) initialCorrect++;
    });
    const initialPct = effItemCount > 0 ? Math.round(initialCorrect / effItemCount * 100) : 0;
    const initialPassed = initialPct >= effPassingPct;
    setManualOverrides({});
    setAutoSaveBanner(null);
    setCorners(detectedCorners);
    setHasScannedImage(true);
    setScannedStudentNumber(detectedNumFormatted);
    if (matchedStudent) {
      setMatchedStudentInfo(matchedStudent);
      setSelectedStudentId(matchedStudent.id);
    } else {
      setMatchedStudentInfo(null);
    }

    // 3. AUTOMATICALLY MOVE SCORE TO MATCHED STUDENT'S RECORD (WITH PER-QUESTION TOPICS)
    if (autoSaveOnScan && matchedStudent && foundCount >= 3 && !autoSavedScanIdsRef.current.has(scanSessionId)) {
      autoSavedScanIdsRef.current.add(scanSessionId);
      const setRecForBreakdown = effQuiz && effSetLetter ? getSetsForQuiz(effQuiz.id).find(s => s.setLetter === effSetLetter) : barcode && barcode.valid ? getStoredQuizSets().find(s => s.omrQuizCode === barcode.omrQuizCode && s.setLetter === effSetLetter) : null;
      const orderedQsForBreakdown = setRecForBreakdown ? resolveQuestionsForExistingSet(effQuiz || {}, setRecForBreakdown) : effQuiz ? resolveQuestionsForQuizExport(effQuiz) : [];
      const omrQuestionBreakdown = Array.from({
        length: effItemCount
      }, (_, idx) => {
        const qObj = orderedQsForBreakdown[idx] || null;
        const detAns = initialScan.answerResults && initialScan.answerResults[idx] ? initialScan.answerResults[idx].detected || '' : '';
        const kAns = effAnswerKey[idx] || (qObj ? String(qObj.CorrectAnswer || 'A').trim().toUpperCase().charAt(0) : 'A');
        return {
          num: idx + 1,
          questionId: qObj ? String(qObj.ID || '') : '',
          topic: qObj ? getCanonicalTopic(qObj) : effQuiz && effQuiz.module ? effQuiz.module : 'General',
          module: qObj ? String(qObj.Module || 'General') : effQuiz ? String(effQuiz.module || 'General') : 'General',
          studentAnswer: detAns,
          correctAnswer: kAns,
          isCorrect: !!(detAns && detAns !== 'MULTI' && detAns === kAns)
        };
      });
      persistScoreToStudentRecord({
        chosenStudent: matchedStudent,
        scannedNum: detectedNumFormatted,
        quizObj: effQuiz,
        examTitle: effTitle,
        setLetter: effSetLetter,
        scoreVal: initialCorrect,
        totalVal: effItemCount,
        pctVal: initialPct,
        passedVal: initialPassed,
        questionBreakdown: omrQuestionBreakdown,
        isAuto: true
      });
    } else if (autoSaveOnScan && !matchedStudent) {
      setAutoSaveBanner({
        status: 'unmatched',
        message: detectedNumFormatted ? `Scanned Student No. ${detectedNumFormatted} did not match any registered student account. Select the student below and click Save.` : 'Student Number shading was blank or incomplete. Select the student below and click Save.'
      });
      showToast?.(foundCount === 4 ? `Paper scanned (${effSetLetter ? `SET ${effSetLetter} • ` : ''}${initialCorrect}/${effItemCount}). Select a student to save score.` : `Auto-aligned ${foundCount}/4 corner markers. Drag cyan handles if needed.`, foundCount === 4 ? 'info' : 'warning');
    } else {
      showToast?.(foundCount === 4 ? `Scanned ${effTitle}${effSetLetter ? ` (SET ${effSetLetter})` : ''}: ${initialCorrect}/${effItemCount} (${initialPct}%).` : `Auto-aligned ${foundCount}/4 corner markers. Drag cyan handles onto the black squares if needed.`, foundCount === 4 ? 'success' : 'info');
    }
  };
  const captureFromCamera = () => {
    const vid = videoRef.current;
    if (!vid || !vid.videoWidth) return;
    loadImageOntoScanner(vid, vid.videoWidth, vid.videoHeight);
    stopCamera();
  };
  const handlePhotoUpload = e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        loadImageOntoScanner(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Generate a realistic Demo Completed Answer Sheet (with Quiz+Set Barcode + Shaded Student Number + Answers)
  const loadDemoCompletedPaper = () => {
    let demoSet = activeSetRecord;
    if (!demoSet && selectedQuiz) {
      demoSet = ensureLatestSetForQuiz(selectedQuiz);
      if (demoSet) {
        setQuizSetsList(getStoredQuizSets());
        setSelectedSetLetter(demoSet.setLetter);
      }
    }
    const demoSetLetter = demoSet ? demoSet.setLetter : selectedSetLetter || 'A';
    const demoQuizCode = demoSet ? demoSet.omrQuizCode : activeQuizCode;
    const demoItemCount = demoSet ? Math.min(100, demoSet.itemCount) : itemCount;
    const demoKey = demoSet && demoSet.answerKey ? demoSet.answerKey.split('') : answerKey;
    const sampleStudent = studentsOnly.find(s => s.studentNumber && String(s.studentNumber).replace(/\D/g, '').length >= 4);
    const demoDigits = (sampleStudent ? String(sampleStudent.studentNumber).replace(/\D/g, '') : '2022001234').slice(0, 10);
    const svgStr = buildOmrAnswerSheetSvg({
      title: activeExamTitle,
      itemCount: demoItemCount,
      subtitle: `DEMO PAPER • SET ${demoSetLetter} • STUDENT NO: ${demoDigits.length === 10 ? demoDigits.slice(0, 4) + '-' + demoDigits.slice(4) : demoDigits}`,
      quizId: activeQuizKeyId,
      omrQuizCode: demoQuizCode,
      setLetter: demoSetLetter
    });
    const layout = getOmrSheetLayout(demoItemCount);
    const fx0 = 58,
      fy0 = 192,
      fw = 700,
      fh = 810;
    const idR = Math.max(6.0, Math.min(8.2, Math.min(layout.idRadiusU * fw, layout.idRadiusV * fh)));
    const rPx = Math.max(6.6, Math.min(10.3, Math.min(layout.radiusU * fw, layout.radiusV * fh)));
    let shadedCircles = '';

    // Shade demo Student Number digits & print written digits in top boxes
    for (let c = 0; c < Math.min(demoDigits.length, layout.studentIdCols.length); c++) {
      const col = layout.studentIdCols[c];
      const digChar = demoDigits[c];
      const boxX = fx0 + col.boxU * fw;
      const boxMidY = fy0 + (col.boxTopV + col.boxBottomV) / 2 * fh + 4;
      shadedCircles += `<text x="${boxX.toFixed(1)}" y="${boxMidY.toFixed(1)}" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">${digChar}</text>`;
      const digObj = col.digits.find(d => d.digit === digChar);
      if (digObj) {
        const cx = fx0 + digObj.u * fw;
        const cy = fy0 + digObj.v * fh;
        shadedCircles += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(idR * 0.94).toFixed(1)}" fill="#0f172a" />`;
      }
    }

    // Shade demo Answer bubbles (~82% correct against this Set's Answer Key)
    layout.bubbles.forEach((item, idx) => {
      const correctLtr = demoKey[idx] || 'A';
      let chosen = correctLtr;
      if (idx % 17 === 4) chosen = '';else if (idx % 7 === 2) {
        const others = ['A', 'B', 'C', 'D'].filter(l => l !== correctLtr);
        chosen = others[idx % others.length];
      }
      if (chosen) {
        const opt = item.options.find(o => o.letter === chosen);
        if (opt) {
          const cx = fx0 + opt.u * fw;
          const cy = fy0 + opt.v * fh;
          shadedCircles += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(rPx * 0.92).toFixed(1)}" fill="#1e293b" />`;
        }
      }
    });
    const filledSvg = svgStr.replace('</svg>', `${shadedCircles}</svg>`);
    const blob = new Blob([filledSvg], {
      type: 'image/svg+xml;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const demoC = document.createElement('canvas');
      demoC.width = 900;
      demoC.height = 1140;
      const dCtx = demoC.getContext('2d');
      dCtx.fillStyle = '#d1d5db';
      dCtx.fillRect(0, 0, demoC.width, demoC.height);
      dCtx.save();
      dCtx.translate(demoC.width / 2, demoC.height / 2);
      dCtx.rotate(0.022);
      dCtx.drawImage(img, -408, -528, 816, 1056);
      dCtx.restore();
      URL.revokeObjectURL(url);
      loadImageOntoScanner(demoC, demoC.width, demoC.height);
    };
    img.src = url;
  };

  // Dragging 4 corner handles (Mouse + Touch)
  const getCanvasPoint = e => {
    const canvas = scanCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / rect.width * canvas.width,
      y: (clientY - rect.top) / rect.height * canvas.height
    };
  };
  const handleCanvasPointerDown = e => {
    if (!corners) return;
    const pt = getCanvasPoint(e);
    if (!pt) return;
    const hitR = Math.max(24, (scanCanvasRef.current?.width || 800) / 28);
    const idx = corners.findIndex(c => Math.hypot(c.x - pt.x, c.y - pt.y) <= hitR);
    if (idx !== -1) {
      e.preventDefault();
      setDraggingCornerIdx(idx);
    }
  };
  const handleCanvasPointerMove = e => {
    if (draggingCornerIdx === null || !corners) return;
    e.preventDefault();
    const pt = getCanvasPoint(e);
    if (!pt) return;
    const next = corners.map((c, idx) => idx === draggingCornerIdx ? {
      ...c,
      x: pt.x,
      y: pt.y,
      detected: true
    } : c);
    setCorners(next);
  };
  const handleCanvasPointerUp = () => {
    setDraggingCornerIdx(null);
  };
  const handleReAutoAlign = () => {
    if (!sourceCanvasRef.current) return;
    const srcCanvas = sourceCanvasRef.current;
    const ctx = srcCanvas.getContext('2d', {
      willReadFrequently: true
    });
    const detected = detectOmrFiducialCorners(ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height));
    setCorners(detected);
    showToast?.('Re-ran automatic 4-corner marker detection.', 'info');
  };

  // Compute Grading Summary
  const gradedItems = React.useMemo(() => {
    return Array.from({
      length: itemCount
    }, (_, idx) => {
      const itemNum = idx + 1;
      const keyAns = answerKey[idx] || 'A';
      const scanItem = scanResults[idx];
      const detected = scanItem ? scanItem.detected : '';
      const finalAns = manualOverrides[itemNum] !== undefined ? manualOverrides[itemNum] : detected;
      const isCorrect = !!finalAns && finalAns !== 'MULTI' && finalAns === keyAns;
      const isBlank = !finalAns;
      const isMulti = finalAns === 'MULTI';
      return {
        itemNum,
        keyAns,
        detected,
        finalAns,
        isCorrect,
        isBlank,
        isMulti
      };
    });
  }, [itemCount, answerKey, scanResults, manualOverrides]);
  const correctCount = gradedItems.filter(i => i.isCorrect).length;
  const blankOrMultiCount = gradedItems.filter(i => i.isBlank || i.isMulti).length;
  const wrongCount = itemCount - correctCount - blankOrMultiCount;
  const scorePct = itemCount > 0 ? Math.round(correctCount / itemCount * 100) : 0;
  const isPassed = scorePct >= passingPct;
  const handleSaveScannedScore = async () => {
    if (!hasScannedImage && Object.keys(manualOverrides).length === 0) {
      showToast?.('Please scan a student answer sheet first before saving.', 'warning');
      return;
    }
    const chosenStudent = studentsOnly.find(s => s.id === selectedStudentId) || null;
    const orderedQsManual = activeSetRecord ? resolveQuestionsForExistingSet(selectedQuiz || {}, activeSetRecord) : selectedQuiz ? resolveQuestionsForQuizExport(selectedQuiz) : [];
    const manualQuestionBreakdown = gradedItems.map((gi, idx) => {
      const qObj = orderedQsManual[idx] || null;
      return {
        num: gi.itemNum,
        questionId: qObj ? String(qObj.ID || '') : '',
        topic: qObj ? getCanonicalTopic(qObj) : selectedQuiz && selectedQuiz.module ? selectedQuiz.module : 'General',
        module: qObj ? String(qObj.Module || 'General') : selectedQuiz ? String(selectedQuiz.module || 'General') : 'General',
        studentAnswer: gi.finalAns || '',
        correctAnswer: gi.keyAns || 'A',
        isCorrect: !!gi.isCorrect
      };
    });
    await persistScoreToStudentRecord({
      chosenStudent,
      fallbackName: manualStudentName,
      fallbackSection: manualStudentSection,
      scannedNum: scannedStudentNumber,
      quizObj: selectedQuiz,
      examTitle: activeExamTitle,
      setLetter: selectedSetLetter,
      scoreVal: correctCount,
      totalVal: itemCount,
      pctVal: scorePct,
      passedVal: isPassed,
      questionBreakdown: manualQuestionBreakdown,
      isAuto: false
    });
  };
  const exportSessionScoresCsv = () => {
    if (scannedHistory.length === 0) {
      showToast?.('No scanned papers saved in this session yet.', 'warning');
      return;
    }
    const headers = ['Student Name', 'Student Number', 'Section/School', 'Quiz Title', 'Exam Set', 'Score', 'Total Items', 'Percentage', 'Status', 'Mode', 'Scanned Time'];
    const rows = [headers.join(',')];
    scannedHistory.forEach(r => {
      rows.push([`"${String(r.studentName).replace(/"/g, '""')}"`, `"${String(r.studentNumber || '').replace(/"/g, '""')}"`, `"${String(r.section).replace(/"/g, '""')}"`, `"${String(r.quizTitle).replace(/"/g, '""')}"`, `"${String(r.setLetter || '—')}"`, r.score, r.total, `${r.percentage}%`, r.passed ? 'PASSED' : 'FAILED', r.autoSaved ? 'Auto-Recorded' : 'Manual Save', `"${r.scannedAt}"`].join(','));
    });
    const blob = new Blob(['\ufeff' + rows.join('\r\n')], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OMR_Scanned_Scores_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast?.('Exported scanned scores CSV successfully!', 'success');
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "tab-content-fade",
    key: "tab-omr"
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.5rem',
      marginBottom: '1.5rem',
      borderLeft: '4px solid #38bdf8'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.25rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-admin",
    style: {
      fontSize: '0.72rem'
    }
  }, "\uD83D\uDD12 ADMIN EXCLUSIVE"), /*#__PURE__*/React.createElement("span", {
    className: "badge badge-status",
    style: {
      fontSize: '0.72rem'
    }
  }, "Sets A\u2013Z Optical Auto-ID"), /*#__PURE__*/React.createElement("span", {
    className: "badge badge-student",
    style: {
      fontSize: '0.72rem'
    }
  }, "\u26A1 Auto-Records to Student Profile")), /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: '1.35rem',
      marginBottom: '0.25rem'
    }
  }, "\uD83D\uDCC4 Answer Sheet Generator & Smart OMR Scanner"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.88rem',
      margin: 0
    }
  }, "Every quiz download rotates Sets ", /*#__PURE__*/React.createElement("strong", null, "A \u2192 Z"), " (looping back to A) with its own saved Answer Key and optical Quiz+Set barcode. Scanning a student paper automatically detects the ", /*#__PURE__*/React.createElement("strong", null, "Quiz, Set, and Student Number"), " and moves the score straight to that student's record.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.6rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-primary",
    onClick: () => handleDownloadOmrSheetForActiveSet(false)
  }, "\uD83D\uDDA8\uFE0F Printable OMR Sheet (.html)", selectedSetLetter ? ` — SET ${selectedSetLetter}` : ''), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      borderColor: 'rgba(56, 189, 248, 0.5)',
      color: '#38bdf8'
    },
    onClick: () => handleDownloadOmrSheetForActiveSet(true)
  }, "\uD83D\uDCC4 Word Answer Sheet (.doc)", selectedSetLetter ? ` — SET ${selectedSetLetter}` : '')))), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.5rem',
      marginBottom: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.75rem',
      marginBottom: '1rem'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      fontSize: '1.05rem',
      color: 'var(--primary-light)'
    }
  }, "1\uFE0F\u20E3 Step 1: Select Quiz & Exam Set (A\u2013Z Rotation \u2022 Code #", activeQuizCode, ")"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.45rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.32rem 0.7rem',
      fontSize: '0.78rem',
      borderColor: 'rgba(168, 85, 247, 0.55)',
      color: '#c084fc',
      fontWeight: '700'
    },
    onClick: handleGenerateNextSet,
    title: "Generate the next distinct Set in the A\u2013Z rotation with a fresh randomized Answer Key"
  }, "\u2795 Generate Next Set (SET ", nextRotatingLetter, ")"), selectedQuiz && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.32rem 0.7rem',
      fontSize: '0.78rem',
      borderColor: 'rgba(56, 189, 248, 0.5)',
      color: '#38bdf8'
    },
    onClick: () => {
      const createdSet = exportQuizToWordFile(selectedQuiz, {
        answerKeyOnly: false,
        setLetter: selectedSetLetter || null
      });
      if (createdSet) {
        setQuizSetsList(getStoredQuizSets());
        setSelectedSetLetter(createdSet.setLetter);
      }
    }
  }, "\uD83D\uDCC4 Questions (.doc)", selectedSetLetter ? ` [SET ${selectedSetLetter}]` : ` [Next: SET ${nextRotatingLetter}]`), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.32rem 0.7rem',
      fontSize: '0.78rem',
      borderColor: 'rgba(16, 185, 129, 0.5)',
      color: '#34d399'
    },
    onClick: () => {
      const keySet = exportQuizToWordFile(selectedQuiz, {
        answerKeyOnly: true,
        setLetter: selectedSetLetter || null
      });
      if (keySet) {
        setQuizSetsList(getStoredQuizSets());
        setSelectedSetLetter(keySet.setLetter);
      }
    }
  }, "\uD83D\uDD11 Answer Key (.doc)", selectedSetLetter ? ` [SET ${selectedSetLetter}]` : '')))), /*#__PURE__*/React.createElement("div", {
    className: "grid-2col",
    style: {
      gap: '1rem',
      marginBottom: '1rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("label", null, "Select Faculty Quiz (Auto-Loads Saved Sets & Answer Keys)"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: selectedQuizId,
    onChange: e => handleQuizDropdownChange(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "custom"
  }, "\u270F\uFE0F Custom Test Paper / Manual Answer Key"), quizzesList.map(qz => {
    const countSets = quizSetsList.filter(s => s.quizId === qz.id).length;
    return /*#__PURE__*/React.createElement("option", {
      key: qz.id,
      value: qz.id
    }, qz.title, " (", Math.min(100, qz.questionCount || 50), " Items \u2022 Code #", getQuizOmrCode(qz.id), countSets > 0 ? ` • ${countSets} Set${countSets > 1 ? 's' : ''}` : '', ")");
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1.3fr 1fr 0.9fr',
      gap: '0.65rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("label", null, "Exam Set (A\u2013Z)"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: selectedSetLetter,
    onChange: e => {
      setSelectedSetLetter(e.target.value);
      setManualOverrides({});
    }
  }, setsForActiveQuiz.length === 0 ? /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "No Set Generated Yet (Next: SET A)") : setsForActiveQuiz.map(s => /*#__PURE__*/React.createElement("option", {
    key: s.id,
    value: s.setLetter
  }, "SET ", s.setLetter, " (", s.itemCount, " Items)")))), /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("label", null, "Items (1\u2013100)"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: itemCount,
    onChange: e => handleItemCountChange(e.target.value),
    disabled: !!selectedQuiz || !!activeSetRecord
  }, /*#__PURE__*/React.createElement("option", {
    value: "10"
  }, "10 Items"), /*#__PURE__*/React.createElement("option", {
    value: "20"
  }, "20 Items"), /*#__PURE__*/React.createElement("option", {
    value: "25"
  }, "25 Items"), /*#__PURE__*/React.createElement("option", {
    value: "30"
  }, "30 Items"), /*#__PURE__*/React.createElement("option", {
    value: "40"
  }, "40 Items"), /*#__PURE__*/React.createElement("option", {
    value: "50"
  }, "50 Items"), /*#__PURE__*/React.createElement("option", {
    value: "75"
  }, "75 Items"), /*#__PURE__*/React.createElement("option", {
    value: "100"
  }, "100 Items"), ![10, 20, 25, 30, 40, 50, 75, 100].includes(itemCount) && /*#__PURE__*/React.createElement("option", {
    value: itemCount
  }, itemCount, " Items"))), /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement("label", null, "Passing %"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    className: "form-control",
    min: "1",
    max: "100",
    value: passingPct,
    onChange: e => setPassingPct(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 70)))
  })))), setsForActiveQuiz.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: '0.9rem',
      padding: '0.6rem 0.75rem',
      background: 'rgba(168, 85, 247, 0.08)',
      border: '1px solid rgba(168, 85, 247, 0.28)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.45rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.76rem',
      fontWeight: '700',
      color: '#c084fc',
      marginRight: '0.25rem'
    }
  }, "Saved Sets (", setsForActiveQuiz.length, "/26):"), setsForActiveQuiz.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.id,
    type: "button",
    onClick: () => {
      setSelectedSetLetter(s.setLetter);
      setManualOverrides({});
    },
    style: {
      padding: '0.2rem 0.55rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: '700',
      cursor: 'pointer',
      border: selectedSetLetter === s.setLetter ? '1px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.3)',
      background: selectedSetLetter === s.setLetter ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.5)',
      color: selectedSetLetter === s.setLetter ? '#38bdf8' : 'var(--text-main)'
    },
    title: `Switch to SET ${s.setLetter} (${s.itemCount} Items, Code #${s.omrQuizCode})`
  }, "SET ", s.setLetter)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.73rem',
      color: 'var(--text-muted)',
      marginLeft: 'auto'
    }
  }, "Next download rotates to: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: '#38bdf8'
    }
  }, "SET ", nextRotatingLetter))), !selectedQuiz && /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginBottom: '1rem'
    }
  }, /*#__PURE__*/React.createElement("label", null, "Custom Exam / Quiz Title (Printed on Answer Sheet)"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    value: customTitle,
    onChange: e => setCustomTitle(e.target.value),
    placeholder: "e.g. Midterm Exam - Power Plant Design"
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginBottom: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.35rem',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      margin: 0
    }
  }, "Official Answer Key ", selectedSetLetter ? `(SET ${selectedSetLetter} • ${answerKey.length} Items)` : `(${answerKey.length} Items)`, " \u2014 Click pills below or type A/B/C/D string:"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.2rem 0.65rem',
      fontSize: '0.76rem'
    },
    onClick: () => setShowSheetPreview(p => !p)
  }, showSheetPreview ? '🙈 Hide Answer Sheet Preview' : '👁️ Show Answer Sheet Preview')), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    style: {
      fontFamily: 'monospace',
      letterSpacing: '2px',
      fontSize: '0.88rem'
    },
    value: bulkKeyInput,
    onChange: e => applyBulkKeyString(e.target.value),
    placeholder: "e.g. ABCDABCD..."
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.35rem',
      marginTop: '0.6rem',
      maxHeight: '110px',
      overflowY: 'auto',
      padding: '0.5rem',
      background: 'var(--bg-input)',
      borderRadius: '8px',
      border: '1px solid var(--border-color)'
    }
  }, answerKey.map((ltr, idx) => /*#__PURE__*/React.createElement("button", {
    key: idx,
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.18rem 0.48rem',
      fontSize: '0.73rem',
      fontFamily: 'monospace'
    },
    title: `Click to cycle Answer Key for Item #${idx + 1}`,
    onClick: () => {
      const opts = ['A', 'B', 'C', 'D'];
      const nextLtr = opts[(opts.indexOf(ltr) + 1) % 4];
      const nextKey = [...answerKey];
      nextKey[idx] = nextLtr;
      setAnswerKey(nextKey);
      setBulkKeyInput(nextKey.join(''));
    }
  }, idx + 1, ":", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--primary-light)',
      marginLeft: '2px'
    }
  }, ltr))))), showSheetPreview && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '1rem',
      padding: '1rem',
      background: 'rgba(15, 23, 42, 0.5)',
      borderRadius: '10px',
      border: '1px solid var(--border-color)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.75rem',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.84rem',
      fontWeight: '600',
      color: '#38bdf8'
    }
  }, "\uD83D\uDCCB Scannable OMR Sheet Preview (", selectedSetLetter ? `SET ${selectedSetLetter} • ` : '', "Code #", activeQuizCode, " \u2022 ", itemCount, " Items)"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.76rem',
      color: 'var(--text-muted)'
    }
  }, "Top optical barcode auto-identifies Quiz & Set on scan. Print at 100% scale.")), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: '460px',
      margin: '0 auto',
      borderRadius: '6px',
      overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
    },
    dangerouslySetInnerHTML: {
      __html: buildOmrAnswerSheetSvg({
        title: activeExamTitle,
        itemCount,
        subtitle: selectedQuiz ? selectedQuiz.module || 'Comprehensive Board Exam' : '',
        quizId: activeQuizKeyId,
        omrQuizCode: activeQuizCode,
        setLetter: selectedSetLetter || 'A'
      })
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.5rem',
      marginBottom: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
      flexWrap: 'wrap',
      gap: '0.75rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0,
      fontSize: '1.05rem',
      color: '#34d399'
    }
  }, "2\uFE0F\u20E3 Step 2: Scan Student Answer Sheet (Auto-Detects Quiz, Set A\u2013Z & Student No.)"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0.2rem 0 0 0',
      fontSize: '0.82rem',
      color: 'var(--text-muted)'
    }
  }, "Scan any Set A\u2013Z answer sheet \u2014 the scanner automatically identifies the Quiz & Set from the top barcode, grades against that Set's Answer Key, reads the shaded Student Number, and moves the score into that student's record.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.4rem',
      padding: '0.35rem 0.65rem',
      borderRadius: '8px',
      background: autoSaveOnScan ? 'rgba(16, 185, 129, 0.14)' : 'rgba(148, 163, 184, 0.12)',
      border: autoSaveOnScan ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid var(--border-color)',
      fontSize: '0.78rem',
      fontWeight: '700',
      color: autoSaveOnScan ? '#34d399' : 'var(--text-muted)',
      cursor: 'pointer',
      margin: 0
    },
    title: "When enabled, scanning a paper with a matched Student Number automatically saves the score to that student's official record."
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: autoSaveOnScan,
    onChange: e => setAutoSaveOnScan(e.target.checked)
  }), "\u26A1 Auto-Save to Student Record"), !cameraActive ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-primary",
    onClick: startCamera
  }, "\uD83D\uDCF7 Start Live Camera") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-success",
    onClick: captureFromCamera
  }, "\uD83D\uDCF8 Capture & Grade Paper"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-danger",
    onClick: stopCamera
  }, "\u23F9\uFE0F Stop Camera")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    onClick: () => fileInputRef.current?.click()
  }, "\uD83D\uDDBC\uFE0F Upload Paper Photo"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      borderColor: 'rgba(245, 158, 11, 0.5)',
      color: '#fbbf24'
    },
    onClick: loadDemoCompletedPaper,
    title: "Load a sample shaded student answer sheet (with Quiz+Set Barcode & Student Number) to test auto-grading & auto-recording"
  }, "\uD83E\uDDEA Test with Demo Paper"), /*#__PURE__*/React.createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: "image/*",
    capture: "environment",
    style: {
      display: 'none'
    },
    onChange: handlePhotoUpload
  }))), hasScannedImage && detectedBarcodeInfo && detectedBarcodeInfo.valid && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0.65rem 0.9rem',
      marginBottom: '1rem',
      borderRadius: '8px',
      background: 'rgba(16, 185, 129, 0.12)',
      border: '1px solid rgba(16, 185, 129, 0.45)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.84rem',
      color: 'var(--text-main)'
    }
  }, "\uD83C\uDFAF ", /*#__PURE__*/React.createElement("strong", null, "Optical Barcode Auto-Identified:"), ' ', /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#38bdf8',
      fontWeight: '700'
    }
  }, detectedBarcodeInfo.matchedQuizTitle), detectedBarcodeInfo.setLetter && /*#__PURE__*/React.createElement("span", {
    className: "badge badge-status",
    style: {
      marginLeft: '0.5rem',
      fontSize: '0.75rem'
    }
  }, "SET ", detectedBarcodeInfo.setLetter), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.76rem',
      color: 'var(--text-muted)',
      marginLeft: '0.5rem'
    }
  }, "(Quiz Code #", detectedBarcodeInfo.omrQuizCode, ")")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.76rem',
      fontWeight: '700',
      color: '#34d399'
    }
  }, detectedBarcodeInfo.setKeyFound ? '✅ Exact Set Answer Key Loaded Automatically' : 'ℹ️ Quiz Matched')), autoSaveBanner && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0.75rem 1rem',
      marginBottom: '1rem',
      borderRadius: '8px',
      background: autoSaveBanner.status === 'saved' ? 'rgba(16, 185, 129, 0.16)' : autoSaveBanner.status === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.14)',
      border: autoSaveBanner.status === 'saved' ? '1px solid rgba(16, 185, 129, 0.55)' : autoSaveBanner.status === 'error' ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(245, 158, 11, 0.5)',
      fontSize: '0.85rem',
      fontWeight: '600',
      color: autoSaveBanner.status === 'saved' ? '#34d399' : autoSaveBanner.status === 'error' ? '#f87171' : '#fbbf24'
    }
  }, autoSaveBanner.status === 'saved' ? /*#__PURE__*/React.createElement("span", null, "\u2705 ", /*#__PURE__*/React.createElement("strong", null, "Score Automatically Moved to Student Record:"), ' ', autoSaveBanner.studentName, autoSaveBanner.studentNumber ? ` [${autoSaveBanner.studentNumber}]` : '', " \u2014", ' ', autoSaveBanner.quizTitle, autoSaveBanner.setLetter ? ` (SET ${autoSaveBanner.setLetter})` : '', ":", ' ', /*#__PURE__*/React.createElement("strong", null, autoSaveBanner.score, "/", autoSaveBanner.total, " (", autoSaveBanner.percentage, "%)")) : /*#__PURE__*/React.createElement("span", null, autoSaveBanner.status === 'saving' ? '⏳ ' : '⚠️ ', autoSaveBanner.message)), cameraActive && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: '580px',
      margin: '0 auto 1.25rem auto',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '2px solid #34d399',
      background: '#000'
    }
  }, /*#__PURE__*/React.createElement("video", {
    ref: videoRef,
    playsInline: true,
    muted: true,
    style: {
      width: '100%',
      display: 'block'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: '8% 8%',
      border: '2px dashed rgba(52, 211, 153, 0.85)',
      borderRadius: '6px',
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      paddingBottom: '0.6rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'rgba(0,0,0,0.7)',
      color: '#34d399',
      padding: '0.25rem 0.7rem',
      borderRadius: '999px',
      fontSize: '0.78rem',
      fontWeight: '600'
    }
  }, "Align all 4 black corner squares inside this frame"))), /*#__PURE__*/React.createElement("div", {
    className: "grid-2col",
    style: {
      gap: '1.25rem',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.82rem',
      fontWeight: '600',
      color: 'var(--text-main)'
    }
  }, "Scanned Paper Optical Overlay"), hasScannedImage && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-muted)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem',
      margin: 0
    }
  }, "Sensitivity:", /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "0.10",
    max: "0.42",
    step: "0.02",
    value: sensitivity,
    onChange: e => setSensitivity(parseFloat(e.target.value)),
    style: {
      width: '85px'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'monospace'
    }
  }, Math.round(sensitivity * 100), "%")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.2rem 0.55rem',
      fontSize: '0.74rem'
    },
    onClick: handleReAutoAlign
  }, "\uD83D\uDD04 Auto-Align"))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(2, 6, 23, 0.65)',
      border: '1px solid var(--border-color)',
      borderRadius: '10px',
      minHeight: '340px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative'
    }
  }, !hasScannedImage ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '2rem',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '2.5rem',
      marginBottom: '0.6rem'
    }
  }, "\uD83D\uDCF7"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.9rem',
      marginBottom: '0.4rem',
      color: 'var(--text-main)',
      fontWeight: '600'
    }
  }, "No Test Paper Scanned Yet"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.8rem',
      maxWidth: '300px',
      margin: '0 auto'
    }
  }, "Click ", /*#__PURE__*/React.createElement("strong", null, "Start Live Camera"), ", ", /*#__PURE__*/React.createElement("strong", null, "Upload Paper Photo"), ", or ", /*#__PURE__*/React.createElement("strong", null, "Test with Demo Paper"), " to auto-identify Quiz/Set, grade, and record to the student's account.")) : /*#__PURE__*/React.createElement("canvas", {
    ref: scanCanvasRef,
    onMouseDown: handleCanvasPointerDown,
    onMouseMove: handleCanvasPointerMove,
    onMouseUp: handleCanvasPointerUp,
    onMouseLeave: handleCanvasPointerUp,
    onTouchStart: handleCanvasPointerDown,
    onTouchMove: handleCanvasPointerMove,
    onTouchEnd: handleCanvasPointerUp,
    style: {
      width: '100%',
      height: 'auto',
      display: 'block',
      cursor: draggingCornerIdx !== null ? 'grabbing' : 'grab',
      touchAction: 'none'
    }
  })), hasScannedImage && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '0.45rem',
      fontSize: '0.74rem',
      color: 'var(--text-muted)',
      display: 'flex',
      gap: '0.85rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDFE9 Quiz+Set Barcode"), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDFE3 Scanned Student No."), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDFE2 Correct Answer"), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD34 Wrong Answer"), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDFE1 Multiple Marks"), /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD35 Drag TL/TR/BR/BL"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.15rem',
      marginBottom: '1rem',
      background: hasScannedImage ? isPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' : 'var(--bg-input)',
      border: hasScannedImage ? isPassed ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(239, 68, 68, 0.45)' : '1px solid var(--border-color)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.65rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.78rem',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }
  }, "Scanned Score ", selectedSetLetter ? `• SET ${selectedSetLetter}` : ''), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '2rem',
      fontWeight: '800',
      color: hasScannedImage ? isPassed ? '#34d399' : '#f87171' : 'var(--text-dim)',
      lineHeight: 1.1
    }
  }, hasScannedImage ? `${correctCount} / ${itemCount}` : `-- / ${itemCount}`)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '1.65rem',
      fontWeight: '800',
      color: hasScannedImage ? isPassed ? '#34d399' : '#f87171' : 'var(--text-dim)'
    }
  }, hasScannedImage ? `${scorePct}%` : '--%'), hasScannedImage && /*#__PURE__*/React.createElement("span", {
    className: `badge ${isPassed ? 'badge-status' : 'badge-admin'}`
  }, isPassed ? '✅ PASSED' : '❌ NEEDS REVIEW'))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '0.5rem',
      textAlign: 'center',
      fontSize: '0.78rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0.35rem',
      borderRadius: '6px',
      background: 'rgba(16, 185, 129, 0.14)',
      color: '#34d399'
    }
  }, /*#__PURE__*/React.createElement("strong", null, hasScannedImage ? correctCount : 0), " Correct"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0.35rem',
      borderRadius: '6px',
      background: 'rgba(239, 68, 68, 0.14)',
      color: '#f87171'
    }
  }, /*#__PURE__*/React.createElement("strong", null, hasScannedImage ? wrongCount : 0), " Wrong"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0.35rem',
      borderRadius: '6px',
      background: 'rgba(245, 158, 11, 0.14)',
      color: '#fbbf24'
    }
  }, /*#__PURE__*/React.createElement("strong", null, hasScannedImage ? blankOrMultiCount : 0), " Blank/Multi"))), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1rem',
      marginBottom: '1rem',
      background: 'var(--bg-input)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '700',
      fontSize: '0.88rem',
      marginBottom: '0.6rem'
    }
  }, "\uD83D\uDCBE Scanned Student Number & Record Sync"), hasScannedImage && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0.6rem 0.75rem',
      marginBottom: '0.7rem',
      borderRadius: '8px',
      background: matchedStudentInfo ? 'rgba(16, 185, 129, 0.14)' : 'rgba(168, 85, 247, 0.14)',
      border: matchedStudentInfo ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(168, 85, 247, 0.45)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.4rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: 'var(--text-muted)',
      textTransform: 'uppercase'
    }
  }, "Scanned Student Number (From Shading)"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '1.05rem',
      fontWeight: '800',
      fontFamily: 'monospace',
      color: matchedStudentInfo ? '#34d399' : '#c084fc'
    }
  }, scannedStudentNumber || 'Not Shaded / Blank')), matchedStudentInfo ? /*#__PURE__*/React.createElement("span", {
    className: "badge badge-status",
    style: {
      fontSize: '0.72rem'
    }
  }, "\u2705 Auto-Matched: ", matchedStudentInfo.fullName) : scannedStudentNumber ? /*#__PURE__*/React.createElement("span", {
    className: "badge badge-admin",
    style: {
      fontSize: '0.72rem'
    }
  }, "\uD83D\uDFE3 Unmatched \u2014 Select or Enter Name") : null), /*#__PURE__*/React.createElement("div", {
    className: "form-group",
    style: {
      marginBottom: '0.6rem'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontSize: '0.78rem'
    }
  }, "Registered Student Account"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: selectedStudentId,
    onChange: e => setSelectedStudentId(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "-- Or Enter Walk-In Student Name Below --"), studentsOnly.map(st => /*#__PURE__*/React.createElement("option", {
    key: st.id,
    value: st.id
  }, st.fullName, st.studentNumber ? ` [${st.studentNumber}]` : '', st.section ? ` (${st.section})` : '', " \u2014 ", st.email)))), !selectedStudentId && /*#__PURE__*/React.createElement("div", {
    className: "grid-2col",
    style: {
      gap: '0.5rem',
      marginBottom: '0.65rem'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "Student Full Name",
    value: manualStudentName,
    onChange: e => setManualStudentName(e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "Year & Section (e.g. BSME 4A)",
    value: manualStudentSection,
    onChange: e => setManualStudentSection(e.target.value)
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-success",
    style: {
      width: '100%',
      fontWeight: '700'
    },
    onClick: handleSaveScannedScore,
    disabled: isSavingScore || !hasScannedImage
  }, isSavingScore ? '⏳ Saving to Cloud Database...' : autoSaveBanner && autoSaveBanner.status === 'saved' ? '🔄 Save Updated / Corrected Score to Student Record' : '💾 Save Scanned Score to Student Academic Log')), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '0.9rem',
      background: 'var(--bg-input)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: '700',
      fontSize: '0.84rem'
    }
  }, "\uD83D\uDD0D Item-by-Item Breakdown (Click to Override)"), Object.keys(manualOverrides).length > 0 && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.15rem 0.45rem',
      fontSize: '0.7rem'
    },
    onClick: () => setManualOverrides({})
  }, "Reset Overrides")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
      gap: '0.35rem',
      maxHeight: '240px',
      overflowY: 'auto'
    }
  }, gradedItems.map(item => /*#__PURE__*/React.createElement("button", {
    key: item.itemNum,
    type: "button",
    onClick: () => {
      const cycle = ['A', 'B', 'C', 'D', ''];
      const cur = item.finalAns === 'MULTI' ? '' : item.finalAns;
      const nextVal = cycle[(cycle.indexOf(cur) + 1) % cycle.length];
      setManualOverrides(prev => ({
        ...prev,
        [item.itemNum]: nextVal
      }));
    },
    title: `Item #${item.itemNum}: Detected=${item.finalAns || 'Blank'}, Key=${item.keyAns}. Click to override.`,
    style: {
      padding: '0.32rem 0.45rem',
      borderRadius: '6px',
      fontSize: '0.74rem',
      fontFamily: 'monospace',
      cursor: 'pointer',
      textAlign: 'left',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      border: !hasScannedImage ? '1px solid var(--border-color)' : item.isCorrect ? '1px solid rgba(16, 185, 129, 0.5)' : item.isBlank || item.isMulti ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(239, 68, 68, 0.5)',
      background: !hasScannedImage ? 'rgba(255,255,255,0.03)' : item.isCorrect ? 'rgba(16, 185, 129, 0.14)' : item.isBlank || item.isMulti ? 'rgba(245, 158, 11, 0.14)' : 'rgba(239, 68, 68, 0.14)',
      color: 'var(--text-main)'
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, item.itemNum, "."), " ", hasScannedImage ? item.finalAns || '—' : '·'), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.68rem',
      color: 'var(--text-muted)'
    }
  }, "(", item.keyAns, ")")))))))), scannedHistory.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.25rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.85rem',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: 0
    }
  }, "\u2705 Papers Checked in This Session (", scannedHistory.length, ")"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      fontSize: '0.8rem',
      padding: '0.35rem 0.75rem'
    },
    onClick: exportSessionScoresCsv
  }, "\uD83D\uDCE5 Export Session Scores (.csv)")), /*#__PURE__*/React.createElement("div", {
    className: "table-responsive"
  }, /*#__PURE__*/React.createElement("table", {
    className: "data-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Student"), /*#__PURE__*/React.createElement("th", null, "Student No."), /*#__PURE__*/React.createElement("th", null, "Quiz / Exam"), /*#__PURE__*/React.createElement("th", null, "Set"), /*#__PURE__*/React.createElement("th", null, "Score"), /*#__PURE__*/React.createElement("th", null, "Percentage"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", null, "Time"))), /*#__PURE__*/React.createElement("tbody", null, scannedHistory.map(row => /*#__PURE__*/React.createElement("tr", {
    key: row.id
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: '600'
    }
  }, row.studentName, row.autoSaved && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: '0.35rem',
      fontSize: '0.68rem',
      color: '#34d399'
    }
  }, "\u26A1 Auto")), /*#__PURE__*/React.createElement("td", {
    style: {
      fontFamily: 'monospace',
      fontSize: '0.82rem'
    }
  }, row.studentNumber || '—'), /*#__PURE__*/React.createElement("td", null, row.quizTitle), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-student",
    style: {
      fontSize: '0.72rem'
    }
  }, row.setLetter !== '—' ? `SET ${row.setLetter}` : '—')), /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: '700'
    }
  }, row.score, " / ", row.total), /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: '700',
      color: row.passed ? 'var(--success)' : 'var(--danger)'
    }
  }, row.percentage, "%"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: `badge ${row.passed ? 'badge-status' : 'badge-admin'}`
  }, row.passed ? 'PASSED' : 'FAILED')), /*#__PURE__*/React.createElement("td", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--text-muted)'
    }
  }, row.scannedAt))))))));
}

// ADMIN DASHBOARD, USER MASTER BOARD, QUIZ & RESULTS MANAGEMENT VIEW
function AdminView({
  stats,
  loadStats,
  usersList,
  loadUsers,
  questions,
  loadQuestions,
  quizzesList,
  loadQuizzes,
  attemptsList,
  loadAttempts,
  totalQuestionsCount,
  totalPagesCount,
  openUserModal,
  openQuestionModal,
  openQuizEditorModal,
  openQuizResultsModal,
  openUserDetailModal,
  downloadReviewedCSV,
  deleteQuiz,
  toggleQuizStatus,
  showToast = (msg, type) => window.showToast?.(msg, type),
  showConfirmDialog = cfg => window.showConfirmDialog?.(cfg)
}) {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'quizzes', 'results', 'questions'
  const [currentPage, setCurrentPage] = useState(1);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminTypeFilter, setAdminTypeFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters for User Data Board
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const fetchAdminQuestions = (page = 1, typeOverride = undefined) => {
    setCurrentPage(page);
    const activeType = typeOverride !== undefined ? typeOverride : adminTypeFilter;
    const qParams = {
      search: adminSearch,
      page,
      limit: 20
    };
    if (activeType) qParams.type = activeType;
    loadQuestions(qParams);
  };
  const toggleUserStatus = u => {
    const newStatus = u.status === 'active' ? 'deactivated' : 'active';
    fetch(`${API_BASE}/api/users/${u.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: newStatus
      })
    }).then(() => {
      showToast(`User status set to ${newStatus}`, 'info');
      loadUsers();
    });
  };
  const deleteUser = u => {
    if (u.role === 'admin') {
      showToast('System Protection: Administrator accounts cannot be deleted directly to maintain platform stability.', 'warning');
      return;
    }
    showConfirmDialog({
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete user account: "${u.fullName || u.email}"? This will erase their user record and quiz history.`,
      confirmText: 'Delete Account',
      type: 'danger',
      onConfirm: () => {
        fetch(`${API_BASE}/api/users/${u.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json()).then(data => {
          if (data.error) showToast(data.error, 'error');else showToast(`User "${u.fullName || u.email}" deleted successfully`, 'success');
          loadUsers();
        }).catch(err => showToast('Failed to delete user: ' + err.message, 'error'));
      }
    });
  };
  const deleteQuestion = id => {
    showConfirmDialog({
      title: 'Delete Question',
      message: `Are you sure you want to permanently delete question #${id} from the question bank?`,
      confirmText: 'Delete Question',
      type: 'danger',
      onConfirm: () => {
        fetch(`${API_BASE}/api/questions/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(() => {
          showToast(`Question #${id} deleted`, 'success');
          fetchAdminQuestions(currentPage);
        });
      }
    });
  };

  // User Board Analytics Calculations
  const totalUsersCount = usersList.length;
  const activeStudentsCount = usersList.filter(u => u.role === 'student' && u.status === 'active').length;
  const pendingUsers = usersList.filter(u => u.role === 'student' && u.status === 'pending');
  const pendingCount = pendingUsers.length;
  const activeAdminsCount = usersList.filter(u => u.role === 'admin').length;
  const schoolsSet = new Set(usersList.map(u => u.school).filter(Boolean));
  const uniqueSchoolsCount = schoolsSet.size;
  const approveUser = u => {
    fetch(`${API_BASE}/api/users/${u.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'active'
      })
    }).then(res => res.json()).then(data => {
      if (data.error) showToast(data.error, 'error');else showToast(`Student "${u.fullName || u.email}" approved and activated!`, 'success');
      loadUsers();
    }).catch(err => showToast('Failed to approve account: ' + err.message, 'error'));
  };
  const rejectUser = u => {
    showConfirmDialog({
      title: 'Reject Registration Request',
      message: `Are you sure you want to reject the registration request for "${u.fullName || u.email}"?`,
      confirmText: 'Reject Request',
      type: 'danger',
      onConfirm: () => {
        fetch(`${API_BASE}/api/users/${u.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: 'deactivated'
          })
        }).then(res => res.json()).then(data => {
          if (data.error) showToast(data.error, 'error');else showToast(`Registration for "${u.fullName || u.email}" was rejected`, 'warning');
          loadUsers();
        }).catch(err => showToast('Failed to reject account: ' + err.message, 'error'));
      }
    });
  };
  const approveAllPending = () => {
    showConfirmDialog({
      title: 'Approve All Pending Students',
      message: `Approve all ${pendingCount} pending student account registrations? They will immediately receive access to log in.`,
      confirmText: `Approve All (${pendingCount})`,
      type: 'primary',
      onConfirm: async () => {
        let count = 0;
        for (const u of pendingUsers) {
          try {
            await fetch(`${API_BASE}/api/users/${u.id}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                status: 'active'
              })
            });
            count++;
          } catch (err) {
            console.error('Error approving user:', u.id, err);
          }
        }
        loadUsers();
        showToast(`Successfully approved ${count} student account(s)!`, 'success');
      }
    });
  };
  const filteredUsers = usersList.filter(u => {
    if (userRoleFilter && u.role !== userRoleFilter) return false;
    if (userStatusFilter && u.status !== userStatusFilter) return false;
    if (userSearchTerm) {
      const term = userSearchTerm.toLowerCase().trim();
      const matchName = u.fullName && u.fullName.toLowerCase().includes(term);
      const matchEmail = u.email && u.email.toLowerCase().includes(term);
      const matchSchool = u.school && u.school.toLowerCase().includes(term);
      const matchStudentNo = u.studentNumber && String(u.studentNumber).toLowerCase().includes(term);
      const matchSection = u.section && String(u.section).toLowerCase().includes(term);
      const matchId = u.id && u.id.toLowerCase().includes(term);
      return matchName || matchEmail || matchSchool || matchStudentNo || matchSection || matchId;
    }
    return true;
  });
  const handleRefreshLiveData = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    showToast('Connecting to Cloud Firestore & refreshing live records...', 'info');
    try {
      const activeToken = localStorage.getItem('token');
      await Promise.all([loadUsers ? loadUsers() : Promise.resolve(), loadAttempts ? loadAttempts() : Promise.resolve(), loadQuizzes ? loadQuizzes() : Promise.resolve(), loadStats ? loadStats(activeToken) : Promise.resolve()]);
      if (activeTab === 'questions') {
        fetchAdminQuestions(currentPage);
      }
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('me_force_live_sync'));
      }
      showToast('Live Cloud data successfully refreshed & synchronized!', 'success');
    } catch (err) {
      console.error('Refresh live data error:', err);
      showToast('Failed to refresh data: ' + (err.message || 'Network error'), 'error');
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    }
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      gap: '1rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: '1.8rem',
      marginBottom: '0.5rem'
    }
  }, "Administrator Master Control Board"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)'
    }
  }, "Complete user directory, student academic records, quiz management, and question bank administration.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    onClick: handleRefreshLiveData,
    disabled: isRefreshing,
    title: "Force Live Sync from Cloud Firestore and Peer Devices",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      opacity: isRefreshing ? 0.75 : 1,
      cursor: isRefreshing ? 'wait' : 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: isRefreshing ? 'spin-icon' : '',
    style: {
      display: 'inline-block'
    }
  }, "\uD83D\uDD04"), /*#__PURE__*/React.createElement("span", null, isRefreshing ? 'Syncing Live Data...' : 'Refresh Live Data')))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '2rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: `btn-secondary ${activeTab === 'users' ? 'btn-primary' : ''}`,
    onClick: () => {
      setActiveTab('users');
      loadUsers();
    }
  }, "\uD83D\uDC65 Master User Data Board (", usersList.length, ")"), /*#__PURE__*/React.createElement("button", {
    className: `btn-secondary ${activeTab === 'approvals' ? 'btn-primary' : ''}`,
    style: pendingCount > 0 ? {
      border: '1px solid #f59e0b',
      color: activeTab === 'approvals' ? '#fff' : '#fbbf24'
    } : {},
    onClick: () => {
      setActiveTab('approvals');
      loadUsers();
    }
  }, "\u23F3 Registration Approvals ", pendingCount > 0 && /*#__PURE__*/React.createElement("span", {
    style: {
      background: '#f59e0b',
      color: '#000',
      borderRadius: '9999px',
      padding: '0.1rem 0.5rem',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      marginLeft: '0.35rem'
    }
  }, pendingCount)), /*#__PURE__*/React.createElement("button", {
    className: `btn-secondary ${activeTab === 'quizzes' ? 'btn-primary' : ''}`,
    onClick: () => {
      setActiveTab('quizzes');
      loadQuizzes();
    }
  }, "\u23F1\uFE0F Quiz Management (", quizzesList.length, ")"), /*#__PURE__*/React.createElement("button", {
    className: `btn-secondary ${activeTab === 'results' ? 'btn-primary' : ''}`,
    onClick: () => {
      setActiveTab('results');
      loadAttempts();
    }
  }, "\uD83D\uDCCA Student Quiz Scores (", attemptsList.length, ")"), /*#__PURE__*/React.createElement("button", {
    className: `btn-secondary ${activeTab === 'questions' ? 'btn-primary' : ''}`,
    onClick: () => {
      setActiveTab('questions');
      fetchAdminQuestions(1);
    }
  }, "\uD83D\uDCDD Question Bank (", stats ? stats.totalQuestions : totalQuestionsCount, ")"), /*#__PURE__*/React.createElement("button", {
    className: `btn-secondary ${activeTab === 'omr' ? 'btn-primary' : ''}`,
    style: activeTab !== 'omr' ? {
      borderColor: 'rgba(56, 189, 248, 0.5)',
      color: '#38bdf8'
    } : {},
    onClick: () => {
      setActiveTab('omr');
      loadQuizzes();
      loadUsers();
    }
  }, "\uD83D\uDCF7 Answer Sheet & Scanner")), activeTab === 'users' && /*#__PURE__*/React.createElement("div", {
    className: "tab-content-fade",
    key: "tab-users"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stats-grid",
    style: {
      marginBottom: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass-card stat-card"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stat-value gradient-text"
  }, totalUsersCount), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Total Registered Accounts")), /*#__PURE__*/React.createElement("div", {
    className: "stat-icon"
  }, "\uD83D\uDC65")), /*#__PURE__*/React.createElement("div", {
    className: "glass-card stat-card"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stat-value",
    style: {
      color: 'var(--success)'
    }
  }, activeStudentsCount), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Active Student Reviewees")), /*#__PURE__*/React.createElement("div", {
    className: "stat-icon"
  }, "\uD83C\uDF93")), /*#__PURE__*/React.createElement("div", {
    className: "glass-card stat-card",
    style: {
      cursor: 'pointer',
      border: pendingCount > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : undefined
    },
    onClick: () => setActiveTab('approvals'),
    title: "Click to view pending student registration requests"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stat-value",
    style: {
      color: '#fbbf24'
    }
  }, pendingCount), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Pending Approvals")), /*#__PURE__*/React.createElement("div", {
    className: "stat-icon"
  }, "\u23F3")), /*#__PURE__*/React.createElement("div", {
    className: "glass-card stat-card"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stat-value",
    style: {
      color: 'var(--accent-light)'
    }
  }, activeAdminsCount), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Faculty Administrators")), /*#__PURE__*/React.createElement("div", {
    className: "stat-icon"
  }, "\uD83D\uDD11")), /*#__PURE__*/React.createElement("div", {
    className: "glass-card stat-card"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stat-value",
    style: {
      color: 'var(--primary-light)'
    }
  }, uniqueSchoolsCount), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, "Universities Represented")), /*#__PURE__*/React.createElement("div", {
    className: "stat-icon"
  }, "\uD83C\uDFDB\uFE0F"))), pendingCount > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'rgba(245, 158, 11, 0.12)',
      border: '1px solid rgba(245, 158, 11, 0.4)',
      borderRadius: '10px',
      padding: '1rem 1.25rem',
      marginBottom: '1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '1.5rem'
    }
  }, "\u26A0\uFE0F"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '700',
      color: '#fbbf24'
    }
  }, pendingCount, " Student Account Registration", pendingCount > 1 ? 's' : '', " Awaiting Approval"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.85rem',
      color: 'var(--text-muted)'
    }
  }, "New students cannot access the question bank or exams until an administrator approves their profile."))), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    style: {
      background: '#f59e0b',
      color: '#000',
      fontWeight: '700',
      border: 'none'
    },
    onClick: () => setActiveTab('approvals')
  }, "Review & Approve Requests (", pendingCount, ") \u2192")), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      gap: '1rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Master User Directory & Academic Records"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.85rem'
    }
  }, "Inspect complete user profile data, university credentials, PRC exam target dates, and detailed quiz performance records.")), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: () => openUserModal(null)
  }, "+ Register New Account")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "Search name, student number, email, school...",
    style: {
      flex: 2,
      minWidth: '220px'
    },
    value: userSearchTerm,
    onChange: e => setUserSearchTerm(e.target.value)
  }), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    style: {
      flex: 1,
      minWidth: '160px'
    },
    value: userRoleFilter,
    onChange: e => setUserRoleFilter(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "All Account Roles"), /*#__PURE__*/React.createElement("option", {
    value: "student"
  }, "Student Reviewees"), /*#__PURE__*/React.createElement("option", {
    value: "admin"
  }, "Administrators")), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    style: {
      flex: 1,
      minWidth: '160px'
    },
    value: userStatusFilter,
    onChange: e => setUserStatusFilter(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "All Account Statuses"), /*#__PURE__*/React.createElement("option", {
    value: "active"
  }, "Active Accounts"), /*#__PURE__*/React.createElement("option", {
    value: "pending"
  }, "Pending Approvals (", pendingCount, ")"), /*#__PURE__*/React.createElement("option", {
    value: "deactivated"
  }, "Deactivated Accounts"))), /*#__PURE__*/React.createElement("div", {
    className: "table-responsive"
  }, /*#__PURE__*/React.createElement("table", {
    className: "data-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "User Profile Info"), /*#__PURE__*/React.createElement("th", null, "Role & Status"), /*#__PURE__*/React.createElement("th", null, "University / School"), /*#__PURE__*/React.createElement("th", null, "Target Exam Date"), /*#__PURE__*/React.createElement("th", null, "Exam History Stats"), /*#__PURE__*/React.createElement("th", null, "Actions & Details"))), /*#__PURE__*/React.createElement("tbody", null, filteredUsers.map(u => {
    const uStats = u.stats || {
      totalAttempts: 0,
      passedCount: 0,
      failedCount: 0,
      avgScore: 0
    };
    return /*#__PURE__*/React.createElement("tr", {
      key: u.id
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: '600',
        color: 'var(--text-main)'
      }
    }, u.fullName), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }
    }, u.email), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '0.35rem',
        flexWrap: 'wrap',
        marginTop: '0.25rem'
      }
    }, u.studentNumber && /*#__PURE__*/React.createElement("span", {
      className: "badge badge-admin",
      style: {
        fontSize: '0.7rem'
      }
    }, "ID No: ", u.studentNumber), u.section && /*#__PURE__*/React.createElement("span", {
      className: "badge badge-status",
      style: {
        fontSize: '0.7rem'
      }
    }, "Section: ", u.section), /*#__PURE__*/React.createElement("span", {
      className: "badge badge-student",
      style: {
        fontSize: '0.68rem'
      }
    }, u.id))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
        alignItems: 'flex-start'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: `badge ${u.role === 'admin' ? 'badge-admin' : 'badge-student'}`
    }, u.role), /*#__PURE__*/React.createElement("span", {
      className: `badge ${u.status === 'active' ? 'badge-status' : u.status === 'pending' ? 'badge-pending' : 'badge-deactivated'}`
    }, u.status === 'pending' ? '⏳ Pending' : u.status))), /*#__PURE__*/React.createElement("td", {
      style: {
        fontWeight: '500',
        color: 'var(--primary-light)'
      }
    }, u.school || 'Mapúa University'), /*#__PURE__*/React.createElement("td", {
      style: {
        fontSize: '0.85rem'
      }
    }, u.targetExamDate || '2026-10-15'), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '0.85rem',
        fontWeight: '600'
      }
    }, "Attempts: ", uStats.totalAttempts, " | Avg: ", uStats.avgScore, "%"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: '0.75rem',
        color: 'var(--text-dim)'
      }
    }, "Passed: ", /*#__PURE__*/React.createElement("strong", {
      style: {
        color: 'var(--success)'
      }
    }, uStats.passedCount), " | Failed: ", /*#__PURE__*/React.createElement("strong", {
      style: {
        color: 'var(--danger)'
      }
    }, uStats.failedCount))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '0.4rem',
        flexWrap: 'wrap'
      }
    }, u.status === 'pending' && /*#__PURE__*/React.createElement("button", {
      className: "btn-success",
      style: {
        padding: '0.35rem 0.65rem',
        fontSize: '0.8rem',
        fontWeight: '700'
      },
      onClick: () => approveUser(u),
      title: "Approve student registration"
    }, "\u2705 Approve"), /*#__PURE__*/React.createElement("button", {
      className: "btn-primary",
      style: {
        padding: '0.35rem 0.75rem',
        fontSize: '0.8rem'
      },
      onClick: () => openUserDetailModal(u)
    }, "\uD83D\uDC41\uFE0F View All Data"), /*#__PURE__*/React.createElement("button", {
      className: "btn-secondary",
      style: {
        padding: '0.35rem 0.65rem',
        fontSize: '0.8rem'
      },
      onClick: () => openUserModal(u)
    }, "Edit"), u.status !== 'pending' && /*#__PURE__*/React.createElement("button", {
      className: "btn-secondary",
      style: {
        padding: '0.35rem 0.65rem',
        fontSize: '0.8rem'
      },
      onClick: () => toggleUserStatus(u)
    }, u.status === 'active' ? 'Deactivate' : 'Activate'), u.status === 'pending' && /*#__PURE__*/React.createElement("button", {
      className: "btn-secondary",
      style: {
        padding: '0.35rem 0.65rem',
        fontSize: '0.8rem'
      },
      onClick: () => rejectUser(u)
    }, "\u274C Reject"), u.role !== 'admin' && /*#__PURE__*/React.createElement("button", {
      className: "btn-danger",
      style: {
        padding: '0.35rem 0.65rem',
        fontSize: '0.8rem'
      },
      onClick: () => deleteUser(u)
    }, "\uD83D\uDDD1\uFE0F Delete"))));
  })))))), activeTab === 'approvals' && /*#__PURE__*/React.createElement("div", {
    className: "tab-content-fade",
    key: "tab-approvals"
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      gap: '1rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDEE1\uFE0F"), " Student Registration Approval Queue"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.85rem'
    }
  }, "Review and approve newly registered student accounts before they are permitted to access review questions, diagnostic assessments, and licensure exam simulators.")), pendingCount > 0 && /*#__PURE__*/React.createElement("button", {
    className: "btn-success",
    style: {
      fontWeight: '700',
      padding: '0.6rem 1.25rem'
    },
    onClick: approveAllPending
  }, "\u2705 Approve All (", pendingCount, ") Students")), pendingCount === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '3.5rem 1rem',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '3rem',
      marginBottom: '1rem'
    }
  }, "\uD83C\uDF89"), /*#__PURE__*/React.createElement("h4", {
    style: {
      color: 'var(--text-main)',
      marginBottom: '0.5rem'
    }
  }, "All Clear! No Pending Registrations"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.9rem',
      maxWidth: '520px',
      margin: '0 auto',
      lineHeight: '1.5'
    }
  }, "All registered student accounts have been reviewed and approved. When a new student signs up, their registration request will automatically appear here for administrator verification.")) : /*#__PURE__*/React.createElement("div", {
    className: "table-responsive"
  }, /*#__PURE__*/React.createElement("table", {
    className: "data-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Student Applicant"), /*#__PURE__*/React.createElement("th", null, "University / School"), /*#__PURE__*/React.createElement("th", null, "Target Exam Date"), /*#__PURE__*/React.createElement("th", null, "Registration Date"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", null, "Approval Actions"))), /*#__PURE__*/React.createElement("tbody", null, pendingUsers.map(u => /*#__PURE__*/React.createElement("tr", {
    key: u.id
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '600',
      color: 'var(--text-main)'
    }
  }, u.fullName), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--text-muted)'
    }
  }, u.email), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.35rem',
      flexWrap: 'wrap',
      marginTop: '0.25rem'
    }
  }, u.studentNumber && /*#__PURE__*/React.createElement("span", {
    className: "badge badge-admin",
    style: {
      fontSize: '0.72rem'
    }
  }, "Student No: ", u.studentNumber), u.section && /*#__PURE__*/React.createElement("span", {
    className: "badge badge-status",
    style: {
      fontSize: '0.72rem'
    }
  }, "Section: ", u.section), /*#__PURE__*/React.createElement("span", {
    className: "badge badge-student",
    style: {
      fontSize: '0.68rem'
    }
  }, u.id))), /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: '500',
      color: 'var(--primary-light)'
    }
  }, u.school || 'NEUST College of Engineering'), /*#__PURE__*/React.createElement("td", {
    style: {
      fontSize: '0.85rem'
    }
  }, u.targetExamDate || '2026-10-15'), /*#__PURE__*/React.createElement("td", {
    style: {
      fontSize: '0.85rem'
    }
  }, u.createdDate || 'Just now'), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-pending"
  }, "\u23F3 Pending Approval")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-success",
    style: {
      padding: '0.4rem 0.85rem',
      fontSize: '0.85rem',
      fontWeight: '700'
    },
    onClick: () => approveUser(u),
    title: "Approve and activate this student account"
  }, "\u2705 Approve"), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      padding: '0.4rem 0.75rem',
      fontSize: '0.85rem'
    },
    onClick: () => rejectUser(u),
    title: "Reject this student registration"
  }, "\u274C Reject"), /*#__PURE__*/React.createElement("button", {
    className: "btn-danger",
    style: {
      padding: '0.4rem 0.75rem',
      fontSize: '0.85rem'
    },
    onClick: () => deleteUser(u),
    title: "Delete this student record"
  }, "\uD83D\uDDD1\uFE0F Delete")))))))))), activeTab === 'quizzes' && /*#__PURE__*/React.createElement("div", {
    className: "tab-content-fade",
    key: "tab-quizzes"
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      gap: '1rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Faculty-Posted Board Quizzes"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.85rem'
    }
  }, "Only administrators have permission to create, edit, post, publish, and view student attempt logs.")), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: () => openQuizEditorModal(null)
  }, "+ Create & Post New Quiz")), /*#__PURE__*/React.createElement("div", {
    className: "table-responsive"
  }, /*#__PURE__*/React.createElement("table", {
    className: "data-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Quiz Title"), /*#__PURE__*/React.createElement("th", null, "Module"), /*#__PURE__*/React.createElement("th", null, "Questions"), /*#__PURE__*/React.createElement("th", null, "Time Limit"), /*#__PURE__*/React.createElement("th", null, "Passing Score"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", null, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, quizzesList.map(qz => /*#__PURE__*/React.createElement("tr", {
    key: qz.id
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: '600',
      maxWidth: '280px'
    }
  }, qz.title), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-admin"
  }, qz.module ? qz.module.substring(0, 12) + '...' : 'Mixed')), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", null, qz.questionCount, " Qs"), (qz.solvingCount !== undefined || qz.elementCount !== undefined) && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.72rem',
      color: 'var(--text-muted)'
    }
  }, qz.solvingCount || 0, " Solving | ", qz.elementCount || 0, " Element")), /*#__PURE__*/React.createElement("td", null, qz.durationMins, " Mins"), /*#__PURE__*/React.createElement("td", null, qz.passingScorePct || 70, "%"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: `badge ${qz.status === 'published' ? 'badge-status' : 'badge-student'}`
  }, qz.status)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.4rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.3rem 0.6rem',
      fontSize: '0.8rem',
      borderColor: 'rgba(56, 189, 248, 0.45)',
      color: '#38bdf8'
    },
    onClick: () => exportQuizToWordFile(qz, {
      answerKeyOnly: false
    }),
    title: "Download Quiz Questionnaire as Microsoft Word (.doc)"
  }, "\uD83D\uDCC4 Questions (.doc)"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.3rem 0.6rem',
      fontSize: '0.8rem',
      borderColor: 'rgba(16, 185, 129, 0.45)',
      color: '#34d399'
    },
    onClick: () => exportQuizToWordFile(qz, {
      answerKeyOnly: true
    }),
    title: "Download Answer Key & Solutions as Microsoft Word (.doc)"
  }, "\uD83D\uDD11 Answer Key (.doc)"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.3rem 0.6rem',
      fontSize: '0.8rem',
      borderColor: 'rgba(245, 158, 11, 0.45)',
      color: '#fbbf24'
    },
    onClick: () => {
      const activeSet = ensureLatestSetForQuiz(qz);
      exportOmrAnswerSheetHtml({
        title: qz.title,
        itemCount: Math.min(100, activeSet && activeSet.itemCount || qz.questionCount || 50),
        subtitle: qz.module || 'Comprehensive Board Exam',
        quizId: qz.id,
        omrQuizCode: activeSet && activeSet.omrQuizCode || getQuizOmrCode(qz.id),
        setLetter: activeSet && activeSet.setLetter || 'A'
      });
    },
    title: "Admin Only: Generate & Download Printable OMR Scannable Answer Sheet (with Quiz & Set Barcode)"
  }, "\uD83D\uDCDD Answer Sheet"), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      padding: '0.3rem 0.6rem',
      fontSize: '0.8rem',
      borderColor: 'var(--accent-light)',
      color: 'var(--accent-light)'
    },
    onClick: () => openQuizResultsModal(qz.id)
  }, "\uD83D\uDCCA Results"), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      padding: '0.3rem 0.6rem',
      fontSize: '0.8rem'
    },
    onClick: () => openQuizEditorModal(qz)
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      padding: '0.3rem 0.6rem',
      fontSize: '0.8rem'
    },
    onClick: () => toggleQuizStatus(qz)
  }, qz.status === 'published' ? 'Unpublish' : 'Publish'), /*#__PURE__*/React.createElement("button", {
    className: "btn-danger",
    style: {
      padding: '0.3rem 0.6rem',
      fontSize: '0.8rem'
    },
    onClick: () => deleteQuiz(qz.id, qz.title)
  }, "Delete")))))))))), activeTab === 'results' && /*#__PURE__*/React.createElement("div", {
    className: "tab-content-fade",
    key: "tab-results"
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Student Quiz Attempt Records & Score Logs"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.85rem'
    }
  }, "Complete breakdown of student scores, pass/fail status, schools, and attempt completion times.")), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    onClick: async () => {
      showToast('Refreshing quiz attempt score logs...', 'info');
      await loadAttempts();
      showToast('Score logs refreshed!', 'success');
    }
  }, "\uD83D\uDD04 Refresh Logs")), attemptsList.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '2rem',
      color: 'var(--text-muted)'
    }
  }, "No student quiz attempt records found.") : /*#__PURE__*/React.createElement("div", {
    className: "table-responsive"
  }, /*#__PURE__*/React.createElement("table", {
    className: "data-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Student Name"), /*#__PURE__*/React.createElement("th", null, "School / University"), /*#__PURE__*/React.createElement("th", null, "Quiz Title"), /*#__PURE__*/React.createElement("th", null, "Score"), /*#__PURE__*/React.createElement("th", null, "Percentage"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", null, "Submitted At"))), /*#__PURE__*/React.createElement("tbody", null, attemptsList.map(att => /*#__PURE__*/React.createElement("tr", {
    key: att.id
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: '600'
    }
  }, att.studentName, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.75rem',
      color: 'var(--text-dim)'
    }
  }, att.studentEmail)), /*#__PURE__*/React.createElement("td", null, att.school || 'NEUST'), /*#__PURE__*/React.createElement("td", {
    style: {
      maxWidth: '240px',
      fontSize: '0.85rem'
    }
  }, att.quizTitle), /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: '700'
    }
  }, getAttemptScore(att), " / ", getAttemptTotal(att)), /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: '700',
      color: att.passed ? 'var(--success)' : 'var(--danger)'
    }
  }, getAttemptPercentage(att), "%"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: `badge ${att.passed ? 'badge-status' : 'badge-admin'}`
  }, att.passed ? 'PASSED' : 'FAILED')), /*#__PURE__*/React.createElement("td", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--text-muted)'
    }
  }, att.submittedAt)))))))), activeTab === 'questions' && /*#__PURE__*/React.createElement("div", {
    className: "tab-content-fade",
    key: "tab-questions"
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      gap: '1rem'
    }
  }, /*#__PURE__*/React.createElement("h3", null, "Question Bank Database"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    style: {
      width: '210px'
    },
    value: adminTypeFilter,
    onChange: e => {
      setAdminTypeFilter(e.target.value);
      fetchAdminQuestions(1, e.target.value);
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "All Question Types (5,036)"), /*#__PURE__*/React.createElement("option", {
    value: "solving"
  }, "\uD83E\uDDEE Solving Questions (1,931)"), /*#__PURE__*/React.createElement("option", {
    value: "element"
  }, "\uD83D\uDCD8 Element Questions (3,105)")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "Search questions...",
    style: {
      width: '240px'
    },
    value: adminSearch,
    onChange: e => setAdminSearch(e.target.value),
    onKeyDown: e => e.key === 'Enter' && fetchAdminQuestions(1)
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: () => fetchAdminQuestions(1)
  }, "Search"), /*#__PURE__*/React.createElement("button", {
    className: "btn-success",
    onClick: () => openQuestionModal(null)
  }, "+ Add Question"))), /*#__PURE__*/React.createElement("div", {
    className: "table-responsive"
  }, /*#__PURE__*/React.createElement("table", {
    className: "data-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "ID"), /*#__PURE__*/React.createElement("th", null, "Type"), /*#__PURE__*/React.createElement("th", null, "Module"), /*#__PURE__*/React.createElement("th", null, "Question Text"), /*#__PURE__*/React.createElement("th", null, "Correct Ans"), /*#__PURE__*/React.createElement("th", null, "AI Review Status"), /*#__PURE__*/React.createElement("th", null, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, questions.map(q => /*#__PURE__*/React.createElement("tr", {
    key: q.ID
  }, /*#__PURE__*/React.createElement("td", null, "#", q.ID), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: `badge ${isSolvingQuestion(q) ? 'badge-status' : 'badge-admin'}`
  }, isSolvingQuestion(q) ? '🧮 Solving' : '📘 Element')), /*#__PURE__*/React.createElement("td", null, q.Module), /*#__PURE__*/React.createElement("td", {
    style: {
      maxWidth: '380px'
    }
  }, q.QuestionText ? q.QuestionText.substring(0, 80) : '', "..."), /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: '700',
      color: 'var(--success)'
    }
  }, q.CorrectAnswer), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-status"
  }, q.AIReviewStatus || 'Verified')), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    style: {
      padding: '0.3rem 0.6rem',
      fontSize: '0.8rem'
    },
    onClick: () => openQuestionModal(q)
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    className: "btn-danger",
    style: {
      padding: '0.3rem 0.6rem',
      fontSize: '0.8rem'
    },
    onClick: () => deleteQuestion(q.ID)
  }, "Delete")))))))), /*#__PURE__*/React.createElement("div", {
    className: "pagination-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pagination-info"
  }, "Showing Page ", /*#__PURE__*/React.createElement("strong", null, currentPage), " of ", /*#__PURE__*/React.createElement("strong", null, totalPagesCount), " (", totalQuestionsCount, " questions)"), /*#__PURE__*/React.createElement("div", {
    className: "pagination-controls"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    disabled: currentPage <= 1,
    onClick: () => fetchAdminQuestions(currentPage - 1)
  }, "\u2190 Previous"), /*#__PURE__*/React.createElement("button", {
    className: "btn-secondary",
    disabled: currentPage >= totalPagesCount,
    onClick: () => fetchAdminQuestions(currentPage + 1)
  }, "Next \u2192"))))), activeTab === 'omr' && /*#__PURE__*/React.createElement(AdminOmrScannerView, {
    quizzesList: quizzesList,
    usersList: usersList,
    loadAttempts: loadAttempts,
    loadUsers: loadUsers,
    showToast: showToast
  }));
}

// ADMIN QUIZ CREATE / EDIT MODAL
function QuizEditorModal({
  editingQuiz,
  onClose,
  onSaved
}) {
  const isEdit = !!editingQuiz;

  // Available curriculum modules excluding 'All'
  const REAL_MODULES = MODULE_OPTIONS.filter(m => m.value !== '');

  // Parse existing modules if editing
  const parseInitialModules = () => {
    if (!editingQuiz || !editingQuiz.module) return [];
    const parts = editingQuiz.module.split(',').map(m => m.trim()).filter(Boolean);
    return parts;
  };
  const initialTotal = editingQuiz?.questionCount || 50;
  const initialSolving = editingQuiz?.solvingCount !== undefined ? editingQuiz.solvingCount : Math.floor(initialTotal / 2);
  const initialElement = editingQuiz?.elementCount !== undefined ? editingQuiz.elementCount : initialTotal - initialSolving;
  const parseInitialTopics = () => {
    if (!editingQuiz || !editingQuiz.topics) return [];
    return String(editingQuiz.topics).split('||').map(t => t.trim()).filter(Boolean);
  };
  const [title, setTitle] = useState(editingQuiz?.title || '');
  const [description, setDescription] = useState(editingQuiz?.description || '');
  const [selectedModules, setSelectedModules] = useState(parseInitialModules);
  const [selectedTopics, setSelectedTopics] = useState(parseInitialTopics);
  const [expandedModulesForTopics, setExpandedModulesForTopics] = useState(parseInitialModules);
  const [solvingCount, setSolvingCount] = useState(initialSolving);
  const [elementCount, setElementCount] = useState(initialElement);
  const [durationMins, setDurationMins] = useState(editingQuiz?.durationMins || 50);
  const [passingScorePct, setPassingScorePct] = useState(editingQuiz?.passingScorePct || 70);
  const [status, setStatus] = useState(editingQuiz?.status || 'published');

  // Question Selection Mode: 'random' (Dynamic Random Sampling) vs 'manual' (Manual Specific Question Picker)
  const [selectionMode, setSelectionMode] = useState(editingQuiz?.selectionMode || 'random');
  const [specificQuestionIds, setSpecificQuestionIds] = useState(editingQuiz?.specificQuestionIds || []);

  // Manual Picker Search & Type filter state
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerTypeFilter, setPickerTypeFilter] = useState('all'); // 'all', 'solving', 'element'
  const [pickerQuestions, setPickerQuestions] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [error, setError] = useState('');
  const combinedModuleStr = selectedModules.length === 0 ? '' : selectedModules.length === REAL_MODULES.length ? '' : selectedModules.join(', ');
  const combinedTopicsStr = selectedTopics.join('||');
  const {
    solvingAvailable,
    elementAvailable,
    totalAvailable
  } = getAvailableQuestionCounts({
    moduleStr: combinedModuleStr,
    topicsStr: combinedTopicsStr
  });

  // Compute breakdown of manually picked questions
  const pickedBreakdown = React.useMemo(() => {
    const all = typeof window !== 'undefined' && Array.isArray(window.INITIAL_QUESTIONS) ? window.INITIAL_QUESTIONS : [];
    const idSet = new Set(specificQuestionIds.map(String));
    let solving = 0;
    let element = 0;
    all.forEach(q => {
      if (q && idSet.has(String(q.ID))) {
        if (isSolvingQuestion(q)) solving++;else element++;
      }
    });
    return {
      solving,
      element,
      total: specificQuestionIds.length
    };
  }, [specificQuestionIds]);

  // Clamp solvingCount & elementCount if selectedModules reduces available pool
  useEffect(() => {
    if (solvingCount > solvingAvailable) {
      setSolvingCount(solvingAvailable);
    }
    if (elementCount > elementAvailable) {
      setElementCount(elementAvailable);
    }
  }, [solvingAvailable, elementAvailable]);

  // Load questions for manual picker when picker search, type filter, or selected modules change
  useEffect(() => {
    if (selectionMode === 'manual') {
      setPickerLoading(true);
      const token = localStorage.getItem('token');
      const queryObj = {
        limit: 100
      };
      if (selectedModules.length > 0) queryObj.module = selectedModules.join(',');
      if (selectedTopics.length > 0) queryObj.topics = selectedTopics.join('||');
      if (pickerSearch) queryObj.search = pickerSearch;
      if (pickerTypeFilter !== 'all') queryObj.type = pickerTypeFilter;
      fetch(`${API_BASE}/api/questions?${new URLSearchParams(queryObj).toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(res => res.json()).then(data => {
        setPickerQuestions(data.questions || []);
        setPickerLoading(false);
      }).catch(err => {
        console.error(err);
        setPickerLoading(false);
      });
    }
  }, [selectionMode, selectedModules, selectedTopics, pickerSearch, pickerTypeFilter]);
  const toggleModule = modValue => {
    if (selectedModules.includes(modValue)) {
      const nextMods = selectedModules.filter(m => m !== modValue);
      setSelectedModules(nextMods);
      // Remove topics belonging exclusively to the unchecked module
      const modTopicNames = new Set(getTopicsForModule(modValue).map(t => t.name));
      setSelectedTopics(prev => prev.filter(t => !modTopicNames.has(t)));
      setExpandedModulesForTopics(prev => prev.filter(m => m !== modValue));
    } else {
      setSelectedModules([...selectedModules, modValue]);
      if (!expandedModulesForTopics.includes(modValue)) {
        setExpandedModulesForTopics([...expandedModulesForTopics, modValue]);
      }
    }
  };
  const toggleExpandModuleTopics = (modValue, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (expandedModulesForTopics.includes(modValue)) {
      setExpandedModulesForTopics(expandedModulesForTopics.filter(m => m !== modValue));
    } else {
      setExpandedModulesForTopics([...expandedModulesForTopics, modValue]);
      if (!selectedModules.includes(modValue)) {
        setSelectedModules([...selectedModules, modValue]);
      }
    }
  };
  const toggleQuizTopic = (modValue, topicName) => {
    if (!selectedModules.includes(modValue)) {
      setSelectedModules([...selectedModules, modValue]);
    }
    if (selectedTopics.includes(topicName)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topicName));
    } else {
      setSelectedTopics([...selectedTopics, topicName]);
    }
  };
  const selectAllTopicsInModule = (modValue, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!selectedModules.includes(modValue)) {
      setSelectedModules([...selectedModules, modValue]);
    }
    const modTopics = getTopicsForModule(modValue).map(t => t.name);
    setSelectedTopics(Array.from(new Set([...selectedTopics, ...modTopics])));
  };
  const clearTopicsInModule = (modValue, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const modTopics = new Set(getTopicsForModule(modValue).map(t => t.name));
    setSelectedTopics(selectedTopics.filter(t => !modTopics.has(t)));
  };
  const selectAllModules = () => {
    setSelectedModules(REAL_MODULES.map(m => m.value));
  };
  const clearAllModules = () => {
    setSelectedModules([]);
    setSelectedTopics([]);
    setExpandedModulesForTopics([]);
  };
  const toggleSpecificQuestion = qId => {
    const strId = String(qId);
    if (specificQuestionIds.includes(strId)) {
      setSpecificQuestionIds(specificQuestionIds.filter(id => id !== strId));
    } else {
      setSpecificQuestionIds([...specificQuestionIds, strId]);
    }
  };
  const handleSolvingInput = val => {
    const parsed = Math.max(0, parseInt(val, 10) || 0);
    setSolvingCount(Math.min(parsed, solvingAvailable, 500));
  };
  const handleElementInput = val => {
    const parsed = Math.max(0, parseInt(val, 10) || 0);
    setElementCount(Math.min(parsed, elementAvailable, 500));
  };
  const applyQuizPreset = (sTarget, eTarget) => {
    setSolvingCount(Math.min(sTarget, solvingAvailable));
    setElementCount(Math.min(eTarget, elementAvailable));
  };

  // Auto-pick specified Solving & Element counts into Manual Question Picker
  const handleAutoPickManualCounts = () => {
    const all = typeof window !== 'undefined' && Array.isArray(window.INITIAL_QUESTIONS) ? window.INITIAL_QUESTIONS.filter(q => q && q.ID !== 'Total' && q.QuestionText && q.QuestionText.trim() !== '') : [];
    let filtered = all;
    if (combinedModuleStr) {
      const targetMods = combinedModuleStr.split(',').map(m => m.toLowerCase().trim()).filter(Boolean);
      filtered = filtered.filter(q => {
        const qMod = String(q.Module || 'Unclassified').toLowerCase();
        return targetMods.some(tm => qMod.includes(tm) || tm.includes(qMod));
      });
    }
    if (combinedTopicsStr) {
      const targetTops = combinedTopicsStr.split('||').map(t => t.toLowerCase().trim()).filter(Boolean);
      filtered = filtered.filter(q => {
        const canon = getCanonicalTopic(q).toLowerCase();
        const rawT = String(q.Topic || '').toLowerCase();
        return targetTops.some(tt => canon === tt || canon.includes(tt) || rawT === tt);
      });
    }
    const solvingPool = [...filtered.filter(isSolvingQuestion)].sort(() => 0.5 - Math.random());
    const elementPool = [...filtered.filter(q => !isSolvingQuestion(q))].sort(() => 0.5 - Math.random());
    const pickedIds = [...solvingPool.slice(0, solvingCount).map(q => String(q.ID)), ...elementPool.slice(0, elementCount).map(q => String(q.ID))];
    setSpecificQuestionIds(pickedIds);
    window.showToast?.(`Auto-picked ${solvingPool.slice(0, solvingCount).length} Solving + ${elementPool.slice(0, elementCount).length} Element questions!`, 'info');
  };
  const totalRandomQuestions = solvingCount + elementCount;
  const handleSubmit = e => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Quiz title is required.');
      return;
    }
    if (selectionMode === 'manual' && specificQuestionIds.length === 0) {
      setError('Please pick at least 1 specific question for manual selection mode.');
      return;
    }
    if (selectionMode === 'random' && totalRandomQuestions <= 0) {
      setError('Please specify at least 1 Solving Question or Element Question.');
      return;
    }
    if (selectionMode === 'random' && totalRandomQuestions > 500) {
      setError('Total quiz question count cannot exceed 500 questions.');
      return;
    }
    const token = localStorage.getItem('token');
    const url = isEdit ? `${API_BASE}/api/quizzes/${editingQuiz.id}` : `${API_BASE}/api/quizzes`;
    const method = isEdit ? 'PUT' : 'POST';
    const finalSolvingCount = selectionMode === 'manual' ? pickedBreakdown.solving : solvingCount;
    const finalElementCount = selectionMode === 'manual' ? pickedBreakdown.element : elementCount;
    const finalTotalCount = selectionMode === 'manual' ? specificQuestionIds.length : totalRandomQuestions;
    const payload = {
      title,
      description,
      module: combinedModuleStr,
      topics: combinedTopicsStr,
      questionCount: finalTotalCount,
      solvingCount: finalSolvingCount,
      elementCount: finalElementCount,
      durationMins,
      passingScorePct,
      status,
      selectionMode,
      specificQuestionIds: selectionMode === 'manual' ? specificQuestionIds : []
    };
    fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }).then(res => res.json()).then(data => {
      if (data.error) {
        setError(data.error);
        window.showToast?.(data.error, 'error');
      } else {
        window.showToast?.(isEdit ? 'Quiz updated successfully' : 'Quiz created and published', 'success');
        onSaved(data.quiz);
        onClose();
      }
    }).catch(err => {
      setError(err.message);
      window.showToast?.('Error saving quiz: ' + err.message, 'error');
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content glass-card",
    onClick: e => e.stopPropagation(),
    style: {
      maxWidth: '760px',
      width: '94%'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      marginBottom: '1rem',
      textAlign: 'center'
    }
  }, isEdit ? 'Edit Board Evaluation Quiz' : 'Create & Post New Board Quiz'), error && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--danger)',
      marginBottom: '1rem',
      textAlign: 'center'
    }
  }, error), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Quiz Title"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "e.g. Combined Power Plant & Heat Transfer Evaluation Quiz",
    value: title,
    onChange: e => setTitle(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Description / Instructions for Students"), /*#__PURE__*/React.createElement("textarea", {
    rows: "2",
    className: "form-control",
    placeholder: "Instructions for students taking this board examination quiz...",
    value: description,
    onChange: e => setDescription(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      fontWeight: '700',
      marginBottom: '0.4rem',
      display: 'block'
    }
  }, "Question Selection Strategy"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '0.75rem',
      marginBottom: '1rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    onClick: () => setSelectionMode('random'),
    style: {
      padding: '0.85rem',
      cursor: 'pointer',
      borderRadius: 'var(--radius-md)',
      border: selectionMode === 'random' ? '2px solid var(--primary-light)' : '1px solid var(--border-color)',
      background: selectionMode === 'random' ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-input)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '700',
      color: selectionMode === 'random' ? '#ffffff' : 'var(--text-muted)'
    }
  }, "\uD83C\uDFB2 Dynamic Random Sampling"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.78rem',
      color: 'var(--text-dim)',
      marginTop: '0.2rem'
    }
  }, "Specify the exact number of Solving Questions & Element Questions to draw randomly.")), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    onClick: () => setSelectionMode('manual'),
    style: {
      padding: '0.85rem',
      cursor: 'pointer',
      borderRadius: 'var(--radius-md)',
      border: selectionMode === 'manual' ? '2px solid #fbbf24' : '1px solid var(--border-color)',
      background: selectionMode === 'manual' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-input)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '700',
      color: selectionMode === 'manual' ? '#fbbf24' : 'var(--text-muted)'
    }
  }, "\uD83D\uDCCC Manual Question Picker"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.78rem',
      color: 'var(--text-dim)',
      marginTop: '0.2rem'
    }
  }, "Hand-pick or auto-fill specific Solving & Element questions to form a fixed exam paper.")))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem',
      flexWrap: 'wrap',
      gap: '0.4rem'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      margin: 0,
      fontWeight: '700'
    }
  }, "Target Curriculum Modules & Topics per Module"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.2rem 0.6rem',
      fontSize: '0.78rem'
    },
    onClick: selectAllModules
  }, "\u2713 Select All Modules"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.2rem 0.6rem',
      fontSize: '0.78rem'
    },
    onClick: clearAllModules
  }, "\u2715 Clear All"))), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '0.85rem',
      background: 'var(--bg-input)',
      borderRadius: 'var(--radius-md)',
      maxHeight: '260px',
      overflowY: 'auto',
      border: '1px solid var(--border-color)'
    }
  }, selectedModules.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.8rem',
      color: '#fbbf24',
      marginBottom: '0.6rem',
      padding: '0.35rem 0.6rem',
      background: 'rgba(245, 158, 11, 0.12)',
      borderRadius: '6px',
      border: '1px solid rgba(245, 158, 11, 0.3)'
    }
  }, "\u26A1 ", /*#__PURE__*/React.createElement("strong", null, "All Modules Selected (Comprehensive):"), " ", totalAvailable.toLocaleString(), " Total Available (", solvingAvailable.toLocaleString(), " Solving Qs | ", elementAvailable.toLocaleString(), " Element Qs). Check a module or click ", /*#__PURE__*/React.createElement("strong", null, "\"\uD83D\uDCC2 Topics\""), " to choose specific topics.") : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--primary-light)',
      marginBottom: '0.6rem',
      padding: '0.35rem 0.6rem',
      background: 'rgba(56, 189, 248, 0.12)',
      borderRadius: '6px',
      border: '1px solid var(--border-glow)'
    }
  }, "\uD83C\uDFAF ", /*#__PURE__*/React.createElement("strong", null, selectedModules.length, " Module(s)", selectedTopics.length > 0 ? ` & ${selectedTopics.length} Specific Topic(s)` : ' (All Module Topics)', ":"), " ", totalAvailable.toLocaleString(), " Total Available (", solvingAvailable.toLocaleString(), " Solving Qs | ", elementAvailable.toLocaleString(), " Element Qs)."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.45rem'
    }
  }, REAL_MODULES.map(mod => {
    const isChecked = selectedModules.includes(mod.value);
    const isExpanded = expandedModulesForTopics.includes(mod.value);
    const modTopics = getTopicsForModule(mod.value);
    const selectedInModCount = modTopics.filter(t => selectedTopics.includes(t.name)).length;
    return /*#__PURE__*/React.createElement("div", {
      key: mod.value,
      style: {
        borderRadius: '6px',
        border: isChecked ? '1px solid var(--primary-light)' : '1px solid rgba(255,255,255,0.06)',
        background: isChecked ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255,255,255,0.02)',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.42rem 0.7rem',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("label", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        cursor: 'pointer',
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: isChecked,
      onChange: () => toggleModule(mod.value),
      style: {
        width: '16px',
        height: '16px',
        accentColor: 'var(--primary-light)',
        cursor: 'pointer'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.84rem',
        color: isChecked ? '#ffffff' : 'var(--text-muted)',
        fontWeight: isChecked ? '600' : 'normal'
      }
    }, mod.label)), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn-secondary",
      onClick: e => toggleExpandModuleTopics(mod.value, e),
      style: {
        padding: '0.2rem 0.55rem',
        fontSize: '0.73rem',
        borderColor: selectedInModCount > 0 ? '#fbbf24' : 'var(--border-color)',
        color: selectedInModCount > 0 ? '#fbbf24' : 'var(--primary-light)',
        whiteSpace: 'nowrap'
      }
    }, isExpanded ? '▾ Hide Topics' : `▸ Choose Topics (${selectedInModCount > 0 ? `${selectedInModCount}/${modTopics.length}` : modTopics.length})`)), isExpanded && modTopics.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0.55rem 0.75rem 0.65rem 1.85rem',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(15, 23, 42, 0.55)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.4rem',
        flexWrap: 'wrap',
        gap: '0.4rem'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }
    }, selectedInModCount === 0 ? 'All topics in this module included (check specific topics to narrow):' : `${selectedInModCount} specific topic(s) selected in this module:`), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: '0.35rem'
      }
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn-secondary",
      style: {
        padding: '0.12rem 0.45rem',
        fontSize: '0.7rem'
      },
      onClick: e => selectAllTopicsInModule(mod.value, e)
    }, "\u2713 All Topics"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn-secondary",
      style: {
        padding: '0.12rem 0.45rem',
        fontSize: '0.7rem'
      },
      onClick: e => clearTopicsInModule(mod.value, e)
    }, "\u2715 Clear Topics"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem'
      }
    }, modTopics.map(tItem => {
      const tChecked = selectedTopics.includes(tItem.name);
      return /*#__PURE__*/React.createElement("label", {
        key: tItem.name,
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.3rem 0.55rem',
          borderRadius: '5px',
          cursor: 'pointer',
          background: tChecked ? 'rgba(245, 158, 11, 0.16)' : 'rgba(255,255,255,0.02)',
          border: tChecked ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.05)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }
      }, /*#__PURE__*/React.createElement("input", {
        type: "checkbox",
        checked: tChecked,
        onChange: () => toggleQuizTopic(mod.value, tItem.name),
        style: {
          width: '14px',
          height: '14px',
          accentColor: '#fbbf24',
          cursor: 'pointer'
        }
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: '0.8rem',
          color: tChecked ? '#ffffff' : 'var(--text-main)',
          fontWeight: tChecked ? '600' : 'normal'
        }
      }, tItem.name)), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          whiteSpace: 'nowrap'
        }
      }, tItem.total, " Qs (", tItem.solving, " Solving | ", tItem.element, " Element)"));
    }))));
  })))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem',
      flexWrap: 'wrap',
      gap: '0.4rem'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      margin: 0,
      fontWeight: '700'
    }
  }, "Specify Number of Solving Questions & Element Questions"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.78rem',
      color: 'var(--primary-light)',
      fontWeight: '600'
    }
  }, "Available to Add: ", solvingAvailable.toLocaleString(), " Solving Qs | ", elementAvailable.toLocaleString(), " Element Qs")), /*#__PURE__*/React.createElement("div", {
    className: "grid-2col",
    style: {
      gap: '0.85rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '0.85rem',
      background: 'rgba(56, 189, 248, 0.08)',
      border: '1px solid rgba(56, 189, 248, 0.35)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.35rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: '700',
      fontSize: '0.9rem',
      color: 'var(--text-main)'
    }
  }, "\uD83E\uDDEE Solving Questions"), /*#__PURE__*/React.createElement("span", {
    className: "badge badge-status",
    style: {
      fontSize: '0.72rem'
    }
  }, "Can add up to ", solvingAvailable.toLocaleString())), /*#__PURE__*/React.createElement("input", {
    type: "number",
    className: "form-control",
    min: "0",
    max: Math.min(500, solvingAvailable),
    value: solvingCount,
    onChange: e => handleSolvingInput(e.target.value),
    disabled: solvingAvailable === 0,
    style: {
      fontWeight: '700',
      fontSize: '1rem',
      textAlign: 'center',
      marginBottom: '0.45rem'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.3rem',
      flexWrap: 'wrap',
      justifyContent: 'center'
    }
  }, [0, 10, 15, 25, 50].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    type: "button",
    className: "btn-secondary",
    disabled: solvingAvailable === 0 && n > 0,
    onClick: () => handleSolvingInput(n),
    style: {
      padding: '0.16rem 0.45rem',
      fontSize: '0.72rem'
    }
  }, n)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    disabled: solvingAvailable === 0,
    onClick: () => handleSolvingInput(Math.min(100, solvingAvailable)),
    style: {
      padding: '0.16rem 0.45rem',
      fontSize: '0.72rem'
    }
  }, "Max (", Math.min(100, solvingAvailable), ")"))), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '0.85rem',
      background: 'rgba(245, 158, 11, 0.08)',
      border: '1px solid rgba(245, 158, 11, 0.35)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.35rem'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: '700',
      fontSize: '0.9rem',
      color: 'var(--text-main)'
    }
  }, "\uD83D\uDCD8 Element Questions"), /*#__PURE__*/React.createElement("span", {
    className: "badge badge-admin",
    style: {
      fontSize: '0.72rem'
    }
  }, "Can add up to ", elementAvailable.toLocaleString())), /*#__PURE__*/React.createElement("input", {
    type: "number",
    className: "form-control",
    min: "0",
    max: Math.min(500, elementAvailable),
    value: elementCount,
    onChange: e => handleElementInput(e.target.value),
    disabled: elementAvailable === 0,
    style: {
      fontWeight: '700',
      fontSize: '1rem',
      textAlign: 'center',
      marginBottom: '0.45rem'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.3rem',
      flexWrap: 'wrap',
      justifyContent: 'center'
    }
  }, [0, 10, 15, 25, 50].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    type: "button",
    className: "btn-secondary",
    disabled: elementAvailable === 0 && n > 0,
    onClick: () => handleElementInput(n),
    style: {
      padding: '0.16rem 0.45rem',
      fontSize: '0.72rem'
    }
  }, n)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    disabled: elementAvailable === 0,
    onClick: () => handleElementInput(Math.min(100, elementAvailable)),
    style: {
      padding: '0.16rem 0.45rem',
      fontSize: '0.72rem'
    }
  }, "Max (", Math.min(100, elementAvailable), ")")))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '0.65rem',
      padding: '0.6rem 0.85rem',
      borderRadius: '8px',
      background: 'var(--bg-input)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.84rem'
    }
  }, selectionMode === 'manual' ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("strong", null, "Manual Selection Breakdown:"), ' ', /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#fbbf24',
      fontWeight: '700'
    }
  }, pickedBreakdown.total, " Picked"), ' ', /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.8rem'
    }
  }, "(", pickedBreakdown.solving, " Solving + ", pickedBreakdown.element, " Element)")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("strong", null, "Total Quiz Questions:"), ' ', /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--primary-light)',
      fontWeight: '700'
    }
  }, totalRandomQuestions, " Qs"), ' ', /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)',
      fontSize: '0.8rem'
    }
  }, "(", solvingCount, " Solving + ", elementCount, " Element)"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.35rem',
      flexWrap: 'wrap'
    }
  }, selectionMode === 'manual' ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-primary",
    style: {
      padding: '0.25rem 0.65rem',
      fontSize: '0.75rem'
    },
    onClick: handleAutoPickManualCounts
  }, "\u26A1 Auto-Pick ", solvingCount, " Solving + ", elementCount, " Element") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.2rem 0.5rem',
      fontSize: '0.73rem'
    },
    onClick: () => applyQuizPreset(10, 10)
  }, "20 Qs (10+10)"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.2rem 0.5rem',
      fontSize: '0.73rem'
    },
    onClick: () => applyQuizPreset(15, 15)
  }, "30 Qs (15+15)"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.2rem 0.5rem',
      fontSize: '0.73rem'
    },
    onClick: () => applyQuizPreset(25, 25)
  }, "50 Qs (25+25)"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.2rem 0.5rem',
      fontSize: '0.73rem'
    },
    onClick: () => applyQuizPreset(50, 50)
  }, "100 Qs (50+50)"))))), selectionMode === 'manual' && /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.35rem',
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: pickerTypeFilter === 'all' ? 'btn-primary' : 'btn-secondary',
    style: {
      padding: '0.25rem 0.6rem',
      fontSize: '0.75rem'
    },
    onClick: () => setPickerTypeFilter('all')
  }, "All (", totalAvailable.toLocaleString(), ")"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: pickerTypeFilter === 'solving' ? 'btn-primary' : 'btn-secondary',
    style: {
      padding: '0.25rem 0.6rem',
      fontSize: '0.75rem'
    },
    onClick: () => setPickerTypeFilter('solving')
  }, "\uD83E\uDDEE Solving (", solvingAvailable.toLocaleString(), ")"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: pickerTypeFilter === 'element' ? 'btn-primary' : 'btn-secondary',
    style: {
      padding: '0.25rem 0.6rem',
      fontSize: '0.75rem'
    },
    onClick: () => setPickerTypeFilter('element')
  }, "\uD83D\uDCD8 Element (", elementAvailable.toLocaleString(), ")")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "\uD83D\uDD0D Search questions by keyword...",
    className: "form-control",
    style: {
      width: '230px',
      padding: '0.3rem 0.75rem',
      fontSize: '0.8rem'
    },
    value: pickerSearch,
    onChange: e => setPickerSearch(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      padding: '0.85rem',
      background: 'var(--bg-input)',
      borderRadius: 'var(--radius-md)',
      maxHeight: '220px',
      overflowY: 'auto',
      border: '1px solid rgba(245, 158, 11, 0.4)'
    }
  }, pickerLoading ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '1rem',
      color: 'var(--text-muted)',
      fontSize: '0.85rem'
    }
  }, "Loading questions from bank...") : pickerQuestions.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '1rem',
      color: 'var(--text-muted)',
      fontSize: '0.85rem'
    }
  }, "No questions match your filter.") : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }
  }, pickerQuestions.map(qItem => {
    const isPicked = specificQuestionIds.includes(String(qItem.ID));
    const solving = isSolvingQuestion(qItem);
    return /*#__PURE__*/React.createElement("label", {
      key: qItem.ID,
      style: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.6rem 0.75rem',
        borderRadius: '6px',
        cursor: 'pointer',
        background: isPicked ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255,255,255,0.02)',
        border: isPicked ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.05)',
        transition: 'all 0.15s ease'
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: isPicked,
      onChange: () => toggleSpecificQuestion(qItem.ID),
      style: {
        width: '17px',
        height: '17px',
        accentColor: '#fbbf24',
        marginTop: '2px',
        cursor: 'pointer'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        fontSize: '0.85rem'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '0.5rem',
        marginBottom: '0.2rem'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: isPicked ? '#ffffff' : 'var(--text-main)',
        fontWeight: '600'
      }
    }, "Item #", qItem.ID, ": ", qItem.QuestionText), /*#__PURE__*/React.createElement("span", {
      className: `badge ${solving ? 'badge-status' : 'badge-admin'}`,
      style: {
        fontSize: '0.68rem',
        whiteSpace: 'nowrap'
      }
    }, solving ? '🧮 Solving' : '📘 Element')), /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--text-dim)',
        fontSize: '0.75rem',
        display: 'flex',
        gap: '0.75rem',
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("span", null, "Module: ", qItem.Module || 'General'), /*#__PURE__*/React.createElement("span", null, "Topic: ", qItem.Topic || 'N/A'), /*#__PURE__*/React.createElement("span", null, "Correct: ", qItem.CorrectAnswer))));
  })))), /*#__PURE__*/React.createElement("div", {
    className: "grid-2col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Total Question Summary"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    value: selectionMode === 'manual' ? `${pickedBreakdown.total} Qs (${pickedBreakdown.solving} Solving + ${pickedBreakdown.element} Element)` : `${totalRandomQuestions} Qs (${solvingCount} Solving + ${elementCount} Element)`,
    disabled: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Time Limit (Minutes)"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: durationMins,
    onChange: e => setDurationMins(parseInt(e.target.value))
  }, /*#__PURE__*/React.createElement("option", {
    value: "20"
  }, "20 Minutes"), /*#__PURE__*/React.createElement("option", {
    value: "30"
  }, "30 Minutes"), /*#__PURE__*/React.createElement("option", {
    value: "50"
  }, "50 Minutes"), /*#__PURE__*/React.createElement("option", {
    value: "90"
  }, "90 Minutes"), /*#__PURE__*/React.createElement("option", {
    value: "120"
  }, "120 Minutes (2 Hours)")))), /*#__PURE__*/React.createElement("div", {
    className: "grid-2col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Passing Score Percentage (%)"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: passingScorePct,
    onChange: e => setPassingScorePct(parseInt(e.target.value))
  }, /*#__PURE__*/React.createElement("option", {
    value: "60"
  }, "60% Passing"), /*#__PURE__*/React.createElement("option", {
    value: "70"
  }, "70% Passing (Standard PRC Board)"), /*#__PURE__*/React.createElement("option", {
    value: "75"
  }, "75% Passing (Honors Benchmark)"), /*#__PURE__*/React.createElement("option", {
    value: "80"
  }, "80% Passing (Mastery Benchmark)"))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Publish Status"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: status,
    onChange: e => setStatus(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "published"
  }, "Published (Visible to Students)"), /*#__PURE__*/React.createElement("option", {
    value: "draft"
  }, "Draft (Admin Only)")))), /*#__PURE__*/React.createElement("div", {
    className: "glass-card",
    style: {
      marginTop: '1rem',
      padding: '0.9rem 1rem',
      background: 'rgba(56, 189, 248, 0.07)',
      border: '1px solid rgba(56, 189, 248, 0.35)',
      borderRadius: 'var(--radius-md)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.65rem'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: '700',
      fontSize: '0.9rem',
      color: 'var(--text-main)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCC4"), " Move / Export Creating Quiz to Microsoft Word File (.doc)"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.77rem',
      color: 'var(--text-muted)',
      marginTop: '0.15rem'
    }
  }, "Generate a formatted printable Word document from your current quiz setup (", selectionMode === 'manual' ? `${pickedBreakdown.total} picked questions` : `${solvingCount} Solving + ${elementCount} Element questions`, ").")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.45rem 0.85rem',
      fontSize: '0.8rem',
      borderColor: 'var(--primary-light)',
      color: '#38bdf8',
      fontWeight: '600'
    },
    onClick: () => exportQuizToWordFile({
      id: editingQuiz ? editingQuiz.id : undefined,
      title: title || 'ME Board Evaluation Quiz',
      description,
      module: combinedModuleStr,
      topics: combinedTopicsStr,
      questionCount: selectionMode === 'manual' ? specificQuestionIds.length : totalRandomQuestions,
      solvingCount: selectionMode === 'manual' ? pickedBreakdown.solving : solvingCount,
      elementCount: selectionMode === 'manual' ? pickedBreakdown.element : elementCount,
      durationMins,
      passingScorePct,
      selectionMode,
      specificQuestionIds: selectionMode === 'manual' ? specificQuestionIds : []
    }, {
      answerKeyOnly: false
    })
  }, "\uD83D\uDCC4 Download Question Word File (.doc)"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.45rem 0.85rem',
      fontSize: '0.8rem',
      borderColor: 'rgba(16, 185, 129, 0.5)',
      color: '#34d399',
      fontWeight: '600'
    },
    onClick: () => exportQuizToWordFile({
      id: editingQuiz ? editingQuiz.id : undefined,
      title: title || 'ME Board Evaluation Quiz',
      description,
      module: combinedModuleStr,
      topics: combinedTopicsStr,
      questionCount: selectionMode === 'manual' ? specificQuestionIds.length : totalRandomQuestions,
      solvingCount: selectionMode === 'manual' ? pickedBreakdown.solving : solvingCount,
      elementCount: selectionMode === 'manual' ? pickedBreakdown.element : elementCount,
      durationMins,
      passingScorePct,
      selectionMode,
      specificQuestionIds: selectionMode === 'manual' ? specificQuestionIds : []
    }, {
      answerKeyOnly: true
    })
  }, "\uD83D\uDD11 Download Answer Key Word File (.doc)"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      padding: '0.45rem 0.85rem',
      fontSize: '0.8rem',
      borderColor: 'rgba(245, 158, 11, 0.5)',
      color: '#fbbf24',
      fontWeight: '600'
    },
    onClick: () => {
      const draftCfg = {
        id: editingQuiz ? editingQuiz.id : undefined,
        title: title || 'ME Board Evaluation Quiz',
        description,
        module: combinedModuleStr,
        topics: combinedTopicsStr,
        questionCount: selectionMode === 'manual' ? specificQuestionIds.length : totalRandomQuestions,
        solvingCount: selectionMode === 'manual' ? pickedBreakdown.solving : solvingCount,
        elementCount: selectionMode === 'manual' ? pickedBreakdown.element : elementCount,
        durationMins,
        passingScorePct,
        selectionMode,
        specificQuestionIds: selectionMode === 'manual' ? specificQuestionIds : []
      };
      const activeSet = ensureLatestSetForQuiz(draftCfg);
      const stableId = getQuizStableId(draftCfg);
      exportOmrAnswerSheetHtml({
        title: draftCfg.title,
        itemCount: Math.min(100, activeSet && activeSet.itemCount || draftCfg.questionCount || 50),
        subtitle: combinedModuleStr || 'Comprehensive Board Exam',
        quizId: stableId,
        omrQuizCode: activeSet && activeSet.omrQuizCode || getQuizOmrCode(stableId),
        setLetter: activeSet && activeSet.setLetter || 'A'
      });
    }
  }, "\uD83D\uDCDD Generate OMR Answer Sheet")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.75rem',
      marginTop: '1.25rem'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      flex: 1
    },
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn-primary",
    style: {
      flex: 1
    }
  }, isEdit ? 'Save Quiz Changes' : 'Post Quiz to Students')))));
}

// USER PROFILE SETTINGS MODAL
function ProfileModal({
  user,
  setUser,
  onClose
}) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [studentNumber, setStudentNumber] = useState(user.studentNumber || '');
  const [section, setSection] = useState(user.section || '');
  const [school, setSchool] = useState(user.school || '');
  const [targetExamDate, setTargetExamDate] = useState(user.targetExamDate || '2026-10-15');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = e => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fullName,
        studentNumber,
        section,
        school,
        targetExamDate,
        newPassword: newPassword || undefined
      })
    }).then(res => res.json()).then(data => {
      if (data.error) {
        setError(data.error);
        window.showToast?.(data.error, 'error');
      } else {
        setMessage('Profile updated successfully!');
        window.showToast?.('Profile updated successfully!', 'success');
        setUser(data.user);
        setTimeout(() => onClose(), 800);
      }
    }).catch(err => {
      setError(err.message);
      window.showToast?.('Error updating profile: ' + err.message, 'error');
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content glass-card",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      marginBottom: '1rem',
      textAlign: 'center'
    }
  }, "Account Profile Settings"), message && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--success)',
      marginBottom: '1rem',
      textAlign: 'center'
    }
  }, message), error && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--danger)',
      marginBottom: '1rem',
      textAlign: 'center'
    }
  }, error), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Full Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    value: fullName,
    onChange: e => setFullName(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid-2col",
    style: {
      gap: '0.75rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Student Number"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "e.g. 2022-001234",
    maxLength: "60",
    value: studentNumber,
    onChange: e => setStudentNumber(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Student Section"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "e.g. BSME 4A",
    maxLength: "60",
    value: section,
    onChange: e => setSection(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "University / School"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    value: school,
    onChange: e => setSchool(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Target Licensure Board Exam Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    className: "form-control",
    value: targetExamDate,
    onChange: e => setTargetExamDate(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "New Password (leave blank to keep current)"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    className: "form-control",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    value: newPassword,
    onChange: e => setNewPassword(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.75rem',
      marginTop: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      flex: 1
    },
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn-primary",
    style: {
      flex: 1
    }
  }, "Save Changes")))));
}

// ADMIN USER CREATE / EDIT MODAL
function UserModal({
  editingUser,
  onClose,
  onSaved
}) {
  const isEdit = !!editingUser;
  const [fullName, setFullName] = useState(editingUser?.fullName || '');
  const [studentNumber, setStudentNumber] = useState(editingUser?.studentNumber || '');
  const [section, setSection] = useState(editingUser?.section || '');
  const [email, setEmail] = useState(editingUser?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(editingUser?.role || 'student');
  const [status, setStatus] = useState(editingUser?.status || 'active');
  const [school, setSchool] = useState(editingUser?.school || '');
  const [targetExamDate, setTargetExamDate] = useState(editingUser?.targetExamDate || '2026-10-15');
  const [error, setError] = useState('');
  const handleSubmit = e => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = isEdit ? `${API_BASE}/api/users/${editingUser.id}` : `${API_BASE}/api/users`;
    const method = isEdit ? 'PUT' : 'POST';
    const body = {
      fullName,
      studentNumber,
      section,
      role: 'student',
      status,
      school,
      targetExamDate
    };
    if (!isEdit) {
      body.email = email;
      body.password = password;
    }
    fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).then(res => res.json()).then(data => {
      if (data.error) {
        setError(data.error);
        window.showToast?.(data.error, 'error');
      } else {
        window.showToast?.(isEdit ? 'User updated successfully' : 'User account created', 'success');
        onSaved();
        onClose();
      }
    }).catch(err => {
      setError(err.message);
      window.showToast?.('Error saving user: ' + err.message, 'error');
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content glass-card",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      marginBottom: '1rem',
      textAlign: 'center'
    }
  }, isEdit ? 'Edit User Account' : 'Create New Account'), error && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--danger)',
      marginBottom: '1rem'
    }
  }, error), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Full Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    value: fullName,
    onChange: e => setFullName(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid-2col",
    style: {
      gap: '0.75rem'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Student Number"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "e.g. 2022-001234",
    maxLength: "60",
    value: studentNumber,
    onChange: e => setStudentNumber(e.target.value),
    required: !isEdit
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Student Section"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "e.g. BSME 4A",
    maxLength: "60",
    value: section,
    onChange: e => setSection(e.target.value),
    required: !isEdit
  }))), !isEdit && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Email Address"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    className: "form-control",
    value: email,
    onChange: e => setEmail(e.target.value),
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Password"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    className: "form-control",
    value: password,
    onChange: e => setPassword(e.target.value),
    required: true
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid-2col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Role"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    value: "Student (Reviewee)",
    disabled: true,
    style: {
      opacity: 0.85,
      cursor: 'not-allowed'
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Status"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: status,
    onChange: e => setStatus(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "active"
  }, "Active"), /*#__PURE__*/React.createElement("option", {
    value: "pending"
  }, "Pending Approval"), /*#__PURE__*/React.createElement("option", {
    value: "deactivated"
  }, "Deactivated")))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "School / University"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    value: school,
    onChange: e => setSchool(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Target Exam Date"), /*#__PURE__*/React.createElement("input", {
    type: "date",
    className: "form-control",
    value: targetExamDate,
    onChange: e => setTargetExamDate(e.target.value)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.75rem',
      marginTop: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      flex: 1
    },
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn-primary",
    style: {
      flex: 1
    }
  }, isEdit ? 'Update Account' : 'Create Account')))));
}

// ADMIN QUESTION CREATE / EDIT MODAL
function QuestionModal({
  editingQuestion,
  onClose,
  onSaved
}) {
  const isEdit = !!editingQuestion;
  const [formData, setFormData] = useState({
    QuestionText: editingQuestion?.QuestionText || '',
    OptionA: editingQuestion?.OptionA || '',
    OptionB: editingQuestion?.OptionB || '',
    OptionC: editingQuestion?.OptionC || '',
    OptionD: editingQuestion?.OptionD || '',
    CorrectAnswer: editingQuestion?.CorrectAnswer || 'A',
    Module: editingQuestion?.Module || 'Module 1 - Power Plant Elements',
    Topic: editingQuestion?.Topic || 'Power Plant Elements',
    Subtopic: editingQuestion?.Subtopic || '',
    Difficulty: editingQuestion?.Difficulty || 'Medium',
    Explanation: editingQuestion?.Explanation || '',
    References: editingQuestion?.References || '',
    AIReviewStatus: editingQuestion?.AIReviewStatus || 'Verified-No Change'
  });
  const [error, setError] = useState('');
  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleSubmit = e => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = isEdit ? `${API_BASE}/api/questions/${editingQuestion.ID}` : `${API_BASE}/api/questions`;
    const method = isEdit ? 'PUT' : 'POST';
    fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    }).then(res => res.json()).then(data => {
      if (data.error) {
        setError(data.error);
        window.showToast?.(data.error, 'error');
      } else {
        window.showToast?.(isEdit ? `Question #${editingQuestion.ID} updated successfully` : 'Question created and added to bank', 'success');
        onSaved();
        onClose();
      }
    }).catch(err => {
      setError(err.message);
      window.showToast?.('Error saving question: ' + err.message, 'error');
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content modal-content-lg glass-card",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      marginBottom: '1rem',
      textAlign: 'center'
    }
  }, isEdit ? `Edit Question #${editingQuestion.ID}` : 'Add New Question'), error && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--danger)',
      marginBottom: '1rem'
    }
  }, error), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSubmit
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Question Text"), /*#__PURE__*/React.createElement("textarea", {
    name: "QuestionText",
    rows: "3",
    className: "form-control",
    value: formData.QuestionText,
    onChange: handleChange,
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid-2col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Option A"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    name: "OptionA",
    className: "form-control",
    value: formData.OptionA,
    onChange: handleChange,
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Option B"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    name: "OptionB",
    className: "form-control",
    value: formData.OptionB,
    onChange: handleChange,
    required: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Option C"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    name: "OptionC",
    className: "form-control",
    value: formData.OptionC,
    onChange: handleChange
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Option D"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    name: "OptionD",
    className: "form-control",
    value: formData.OptionD,
    onChange: handleChange
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid-2col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Correct Answer"), /*#__PURE__*/React.createElement("select", {
    name: "CorrectAnswer",
    className: "form-control",
    value: formData.CorrectAnswer,
    onChange: handleChange
  }, /*#__PURE__*/React.createElement("option", {
    value: "A"
  }, "A"), /*#__PURE__*/React.createElement("option", {
    value: "B"
  }, "B"), /*#__PURE__*/React.createElement("option", {
    value: "C"
  }, "C"), /*#__PURE__*/React.createElement("option", {
    value: "D"
  }, "D"))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Difficulty"), /*#__PURE__*/React.createElement("select", {
    name: "Difficulty",
    className: "form-control",
    value: formData.Difficulty,
    onChange: handleChange
  }, /*#__PURE__*/React.createElement("option", {
    value: "Easy"
  }, "Easy"), /*#__PURE__*/React.createElement("option", {
    value: "Medium"
  }, "Medium"), /*#__PURE__*/React.createElement("option", {
    value: "Hard"
  }, "Hard")))), /*#__PURE__*/React.createElement("div", {
    className: "grid-2col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Board Exam Module"), /*#__PURE__*/React.createElement("select", {
    name: "Module",
    className: "form-control",
    value: formData.Module,
    onChange: handleChange
  }, MODULE_OPTIONS.filter(o => o.value !== '').map(opt => /*#__PURE__*/React.createElement("option", {
    key: opt.value,
    value: opt.value
  }, opt.label)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Subtopic"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    name: "Subtopic",
    className: "form-control",
    value: formData.Subtopic,
    onChange: handleChange
  }))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "First-Principles Solution / Explanation"), /*#__PURE__*/React.createElement("textarea", {
    name: "Explanation",
    rows: "3",
    className: "form-control",
    value: formData.Explanation,
    onChange: handleChange
  })), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Literature Reference(s)"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    name: "References",
    className: "form-control",
    placeholder: "Marks' Handbook, Cengel Thermodynamics, etc.",
    value: formData.References,
    onChange: handleChange
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.75rem',
      marginTop: '1.5rem'
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-secondary",
    style: {
      flex: 1
    },
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "btn-primary",
    style: {
      flex: 1
    }
  }, isEdit ? 'Save Question Changes' : 'Create Question')))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));