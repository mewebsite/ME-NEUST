const {
  useState,
  useEffect
} = React;
const API_BASE = '';
const MODULE_OPTIONS = [{
  value: '',
  label: 'All Curriculum Modules (Comprehensive Mixed)'
}, {
  value: 'Module 1 - Power Plant Elements',
  label: 'Module 1: Power Plant Elements (1,111 Qs)'
}, {
  value: 'Module 2 - Power Plant Design',
  label: 'Module 2: Power Plant Design (790 Qs)'
}, {
  value: 'Module 3 - Industrial Plant Engineering',
  label: 'Module 3: Industrial Plant Engineering (313 Qs)'
}, {
  value: 'Module 4 - Industrial Plant Design',
  label: 'Module 4: Industrial Plant Design (295 Qs)'
}, {
  value: 'Module 5 - Refrigeration Engineering',
  label: 'Module 5: Refrigeration Engineering (392 Qs)'
}, {
  value: 'Module 6 - Air Conditioning',
  label: 'Module 6: Air Conditioning (157 Qs)'
}, {
  value: 'Unclassified',
  label: 'Unclassified / General (48 Qs)'
}];

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

  // App state
  const [stats, setStats] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [quizzesList, setQuizzesList] = useState([]);
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
    fetch(`${API_BASE}/api/questions/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken || token}`
      }
    }).then(res => res.json()).then(data => setStats(data)).catch(console.error);
  };
  const loadQuestions = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    fetch(`${API_BASE}/api/questions?${query}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => res.json()).then(data => {
      setQuestions(data.questions || []);
      setTotalQuestionsCount(data.total || 0);
      setTotalPagesCount(data.totalPages || 1);
    }).catch(console.error);
  };
  const loadQuizzes = () => {
    fetch(`${API_BASE}/api/quizzes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => res.json()).then(data => {
      setQuizzesList(data.quizzes || []);
      setMyAttempts(data.myAttempts || []);
    }).catch(console.error);
  };
  const loadAttempts = () => {
    fetch(`${API_BASE}/api/attempts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => res.json()).then(data => setAttemptsList(data.attempts || [])).catch(console.error);
  };
  const loadUsers = () => {
    fetch(`${API_BASE}/api/users/full`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then(res => res.json()).then(data => setUsersList(data.users || [])).catch(console.error);
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

    // Refresh immediately when window or tab becomes active
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadQuizzes();
        loadStats(token);
        if (user && user.role === 'admin') {
          loadUsers();
          loadAttempts();
        }
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
    }).catch(() => {
      generateClientCSV();
    });
  };
  const startPracticeMode = ({
    moduleVal,
    batchVal,
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
    const targetLimit = parseInt(limitVal) || 50;
    const queryObj = {
      limit: targetLimit,
      random: 'true'
    };
    if (moduleVal) queryObj.module = moduleVal;
    if (batchVal) queryObj.batch = batchVal;
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
    const targetCount = parseInt(quiz.questionCount) || 50;
    if (quiz.specificQuestionIds && quiz.specificQuestionIds.length > 0) {
      queryUrl = `${API_BASE}/api/questions?ids=${encodeURIComponent(quiz.specificQuestionIds.join(','))}`;
    } else {
      const queryObj = {
        limit: targetCount,
        random: 'true'
      };
      if (quiz.module) queryObj.module = quiz.module;
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
    }).catch(err => alert('Error launching diagnostic benchmark: ' + err.message));
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
    }).catch(err => alert('Error launching smart quiz: ' + err.message));
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
    }).catch(err => alert('Error launching board simulation: ' + err.message));
  };
  const recordQuizAttempt = (score, total, pct, passed, timeSpentSecs) => {
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
          questionDetails: questions
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
          questionDetails: questions
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
          targetModule: activeQuiz.targetModule
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
        moduleBreakdown
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
  const deleteQuiz = id => {
    if (confirm('Are you sure you want to permanently delete this board quiz?')) {
      setQuizzesList(prev => prev.filter(q => q.id !== id));
      fetch(`${API_BASE}/api/quizzes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => res.json()).then(data => {
        if (data.error) alert('Error: ' + data.error);
        loadQuizzes();
      }).catch(err => {
        console.error('Delete quiz error:', err);
        loadQuizzes();
      });
    }
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
        alert(data.error || 'Authentication failed');
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
      }
    }).catch(err => alert('Network error: ' + err.message));
  };
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
    className: "badge badge-admin"
  }, "Admin Portal")), /*#__PURE__*/React.createElement("button", {
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
    }
  }, "\uD83D\uDEE1\uFE0F Admin Portal"), /*#__PURE__*/React.createElement("button", {
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
  }) : /*#__PURE__*/React.createElement("div", null, view === 'dashboard' && /*#__PURE__*/React.createElement(DashboardView, {
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
    statusFilter: statusFilter,
    setStatusFilter: setStatusFilter,
    downloadReviewedCSV: downloadReviewedCSV
  }), view === 'admin' && user.role === 'admin' && /*#__PURE__*/React.createElement(AdminView, {
    stats: stats,
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
    toggleQuizStatus: toggleQuizStatus
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
    deleteQuiz: deleteQuiz
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
  }, "Official Licensure Board Examination Preparation Platform & Solved 3,105 Item Question Bank Repository."), setDeviceMode && /*#__PURE__*/React.createElement("div", {
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
  }, "Comprehensive question bank of 3,105 solved items covering Power Plant Engineering, Industrial Plant Design, Heat Transfer, Refrigeration & Air Conditioning, and ME Design."), /*#__PURE__*/React.createElement("div", {
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
  }, "\u26A1 3,105 Solved Questions"), /*#__PURE__*/React.createElement("p", {
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
  const totalCount = stats ? stats.totalQuestions : 3105;
  const reviewedCount = stats ? stats.reviewedQuestions : 3105;
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
    className: "btn-success",
    onClick: downloadReviewedCSV
  }, "\uD83D\uDCE5 Export Live CSV"), /*#__PURE__*/React.createElement("button", {
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
  const [selectedBatch, setSelectedBatch] = useState('');
  const [questionLimit, setQuestionLimit] = useState(50);
  const handleStart = () => {
    onStart({
      moduleVal: selectedModule,
      batchVal: selectedBatch,
      limitVal: questionLimit
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
      marginBottom: '0.5rem',
      textAlign: 'center'
    }
  }, "\uD83D\uDCD6 Practice & Study Mode"), /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: 'center',
      color: 'var(--text-muted)',
      marginBottom: '1.5rem',
      fontSize: '0.9rem'
    }
  }, "Self-paced practice with instant step-by-step engineering solutions and literature references."), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Select Curriculum Module to Practice"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: selectedModule,
    onChange: e => {
      setSelectedModule(e.target.value);
      setSelectedBatch('');
    }
  }, MODULE_OPTIONS.map(opt => /*#__PURE__*/React.createElement("option", {
    key: opt.value,
    value: opt.value
  }, opt.label)))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Or Select Specific Review Batch (Batches 1 to 63)"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: selectedBatch,
    onChange: e => {
      setSelectedBatch(e.target.value);
      setSelectedModule('');
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "All Batches (Randomized Practice Set)"), Array.from({
    length: 63
  }, (_, i) => i + 1).map(b => /*#__PURE__*/React.createElement("option", {
    key: b,
    value: b
  }, "Batch ", b, " (50 Solved Questions)")))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Number of Questions"), /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: questionLimit,
    onChange: e => setQuestionLimit(parseInt(e.target.value))
  }, /*#__PURE__*/React.createElement("option", {
    value: "20"
  }, "20 Questions (Quick Review)"), /*#__PURE__*/React.createElement("option", {
    value: "50"
  }, "50 Questions (Full Block Practice)"), /*#__PURE__*/React.createElement("option", {
    value: "100"
  }, "100 Questions (Marathon Study Set)"))), /*#__PURE__*/React.createElement("div", {
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
    type: "button",
    className: "btn-primary",
    style: {
      flex: 1
    },
    onClick: handleStart
  }, "\uD83D\uDE80 Start Practice Session"))));
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
  deleteQuiz
}) {
  const isAdmin = user && user.role === 'admin';
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
      gap: '0.5rem'
    }
  }, isAdmin && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
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
  }, "\u2715 Close"))), quizzes.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'center',
      padding: '2rem',
      color: 'var(--text-muted)'
    }
  }, "No quizzes are currently published by faculty administrators.") : /*#__PURE__*/React.createElement("div", {
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
    }, qz.questionCount, " Questions | \u23F0 ", qz.durationMins, " Mins"), hasAttempted && /*#__PURE__*/React.createElement("span", {
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
        alignItems: 'center'
      }
    }, isAdmin && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
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
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, !isStudent && /*#__PURE__*/React.createElement("th", null, "Student Name"), !isStudent && /*#__PURE__*/React.createElement("th", null, "School / University"), /*#__PURE__*/React.createElement("th", null, "Assessment / Quiz Title"), /*#__PURE__*/React.createElement("th", null, "Score"), /*#__PURE__*/React.createElement("th", null, "Percentage"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", null, "Time Taken"), /*#__PURE__*/React.createElement("th", null, "Submitted At"))), /*#__PURE__*/React.createElement("tbody", null, filteredAttempts.map(att => /*#__PURE__*/React.createElement("tr", {
    key: att.id
  }, !isStudent && /*#__PURE__*/React.createElement("td", {
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
  }, att.submittedAt))))))));
}

// ADMIN COMPLETE USER MASTER DATA & ACADEMIC RECORD MODAL
function UserDetailModal({
  user,
  attemptsList = [],
  onClose
}) {
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
      maxHeight: '35vh',
      overflowY: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "data-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Quiz Title"), /*#__PURE__*/React.createElement("th", null, "Score"), /*#__PURE__*/React.createElement("th", null, "Percentage"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", null, "Time Taken"), /*#__PURE__*/React.createElement("th", null, "Submitted At"))), /*#__PURE__*/React.createElement("tbody", null, attempts.map(att => /*#__PURE__*/React.createElement("tr", {
    key: att.id
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
  }, att.submittedAt))))))));
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
  }, "Access 3,105 Solved Mechanical Engineering Licensure Questions"), /*#__PURE__*/React.createElement("div", {
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
  }, "Sign Up")), /*#__PURE__*/React.createElement("form", {
    onSubmit: e => handleAuthSubmit(e, authModal, 'student')
  }, authModal === 'signup' && /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Full Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    name: "fullName",
    className: "form-control",
    placeholder: "Engr. Juan Dela Cruz",
    required: true
  })), /*#__PURE__*/React.createElement("div", {
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
  statusFilter,
  setStatusFilter,
  downloadReviewedCSV
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const fetchFilteredPage = (page = 1) => {
    setCurrentPage(page);
    loadQuestions({
      search: searchQuery,
      module: moduleFilter,
      batch: batchFilter,
      page,
      limit: 20
    });
  };
  useEffect(() => {
    fetchFilteredPage(1);
  }, [moduleFilter, batchFilter]);
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
  }, "Question Bank Explorer (3,105 Items)"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: 'var(--text-muted)'
    }
  }, "Independently solved, fact-checked, and enhanced questions with academic textbook references and review-tracking metadata across 63 batches.")), /*#__PURE__*/React.createElement("button", {
    className: "btn-success",
    onClick: downloadReviewedCSV
  }, "\uD83D\uDCE5 Export Live CSV")), /*#__PURE__*/React.createElement("div", {
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
      minWidth: '220px'
    },
    value: searchQuery,
    onChange: e => setSearchQuery(e.target.value),
    onKeyDown: e => e.key === 'Enter' && fetchFilteredPage(1)
  }), /*#__PURE__*/React.createElement("select", {
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
      minWidth: '150px'
    },
    value: batchFilter,
    onChange: e => setBatchFilter(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "All Batches (1-63)"), Array.from({
    length: 63
  }, (_, i) => i + 1).map(b => /*#__PURE__*/React.createElement("option", {
    key: b,
    value: b
  }, "Batch ", b))), /*#__PURE__*/React.createElement("button", {
    className: "btn-primary",
    onClick: () => fetchFilteredPage(1)
  }, "Filter Bank")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }
  }, questions.map(q => /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "badge badge-student",
    style: {
      marginRight: '0.5rem'
    }
  }, "ID: #", q.ID), /*#__PURE__*/React.createElement("span", {
    className: "badge badge-admin",
    style: {
      marginRight: '0.5rem'
    }
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
      marginTop: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      fontSize: '0.95rem'
    }
  }, "\uD83D\uDCDD Solution & Concept Explanation:"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.9rem',
      color: 'var(--text-main)',
      marginBottom: '0.5rem'
    }
  }, q.Explanation), q.References && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.85rem',
      color: 'var(--primary-light)'
    }
  }, /*#__PURE__*/React.createElement("strong", null, "Reference:"), " ", q.References))))), /*#__PURE__*/React.createElement("div", {
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

// ADMIN DASHBOARD, USER MASTER BOARD, QUIZ & RESULTS MANAGEMENT VIEW
function AdminView({
  stats,
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
  toggleQuizStatus
}) {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'quizzes', 'results', 'questions'
  const [currentPage, setCurrentPage] = useState(1);
  const [adminSearch, setAdminSearch] = useState('');

  // Filters for User Data Board
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const fetchAdminQuestions = (page = 1) => {
    setCurrentPage(page);
    loadQuestions({
      search: adminSearch,
      page,
      limit: 20
    });
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
    }).then(() => loadUsers());
  };
  const deleteUser = u => {
    if (u.role === 'admin') {
      alert('System Protection: Administrator accounts cannot be deleted directly to maintain platform stability.');
      return;
    }
    if (confirm(`Are you sure you want to permanently delete user account: ${u.fullName || u.email}? This will erase their user record and quiz history.`)) {
      fetch(`${API_BASE}/api/users/${u.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => res.json()).then(data => {
        if (data.error) alert(data.error);
        loadUsers();
      }).catch(err => alert(err.message));
    }
  };
  const deleteQuestion = id => {
    if (confirm('Are you sure you want to delete question #' + id + '?')) {
      fetch(`${API_BASE}/api/questions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(() => fetchAdminQuestions(currentPage));
    }
  };

  // User Board Analytics Calculations
  const totalUsersCount = usersList.length;
  const activeStudentsCount = usersList.filter(u => u.role === 'student' && u.status === 'active').length;
  const activeAdminsCount = usersList.filter(u => u.role === 'admin').length;
  const schoolsSet = new Set(usersList.map(u => u.school).filter(Boolean));
  const uniqueSchoolsCount = schoolsSet.size;
  const filteredUsers = usersList.filter(u => {
    if (userRoleFilter && u.role !== userRoleFilter) return false;
    if (userStatusFilter && u.status !== userStatusFilter) return false;
    if (userSearchTerm) {
      const term = userSearchTerm.toLowerCase().trim();
      const matchName = u.fullName && u.fullName.toLowerCase().includes(term);
      const matchEmail = u.email && u.email.toLowerCase().includes(term);
      const matchSchool = u.school && u.school.toLowerCase().includes(term);
      const matchId = u.id && u.id.toLowerCase().includes(term);
      return matchName || matchEmail || matchSchool || matchId;
    }
    return true;
  });
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
    onClick: () => {
      loadUsers();
      loadAttempts();
      loadQuizzes();
    },
    title: "Force Live Sync from Cloud"
  }, "\uD83D\uDD04 Refresh Live Data"), /*#__PURE__*/React.createElement("button", {
    className: "btn-success",
    onClick: downloadReviewedCSV
  }, "\uD83D\uDCE5 Export Live CSV"))), /*#__PURE__*/React.createElement("div", {
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
  }, "\uD83D\uDCDD Question Bank (", stats ? stats.totalQuestions : totalQuestionsCount, ")")), activeTab === 'users' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
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
  }, "\uD83C\uDFDB\uFE0F"))), /*#__PURE__*/React.createElement("div", {
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
    placeholder: "Search name, email, school, user ID...",
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
    }, u.email), /*#__PURE__*/React.createElement("span", {
      className: "badge badge-student",
      style: {
        fontSize: '0.7rem',
        marginTop: '0.2rem'
      }
    }, u.id)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
        alignItems: 'flex-start'
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: `badge ${u.role === 'admin' ? 'badge-admin' : 'badge-student'}`
    }, u.role), /*#__PURE__*/React.createElement("span", {
      className: `badge ${u.status === 'active' ? 'badge-status' : 'badge-admin'}`
    }, u.status))), /*#__PURE__*/React.createElement("td", {
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
    }, /*#__PURE__*/React.createElement("button", {
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
    }, "Edit"), /*#__PURE__*/React.createElement("button", {
      className: "btn-secondary",
      style: {
        padding: '0.35rem 0.65rem',
        fontSize: '0.8rem'
      },
      onClick: () => toggleUserStatus(u)
    }, u.status === 'active' ? 'Deactivate' : 'Activate'), u.role !== 'admin' && /*#__PURE__*/React.createElement("button", {
      className: "btn-danger",
      style: {
        padding: '0.35rem 0.65rem',
        fontSize: '0.8rem'
      },
      onClick: () => deleteUser(u)
    }, "\uD83D\uDDD1\uFE0F Delete"))));
  })))))), activeTab === 'quizzes' && /*#__PURE__*/React.createElement("div", {
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
  }, qz.module ? qz.module.substring(0, 12) + '...' : 'Mixed')), /*#__PURE__*/React.createElement("td", null, qz.questionCount, " Qs"), /*#__PURE__*/React.createElement("td", null, qz.durationMins, " Mins"), /*#__PURE__*/React.createElement("td", null, qz.passingScorePct || 70, "%"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: `badge ${qz.status === 'published' ? 'badge-status' : 'badge-student'}`
  }, qz.status)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '0.4rem',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("button", {
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
    onClick: () => deleteQuiz(qz.id)
  }, "Delete"))))))))), activeTab === 'results' && /*#__PURE__*/React.createElement("div", {
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
    onClick: loadAttempts
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
  }, att.submittedAt))))))), activeTab === 'questions' && /*#__PURE__*/React.createElement("div", {
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
      gap: '0.75rem'
    }
  }, /*#__PURE__*/React.createElement("input", {
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
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "ID"), /*#__PURE__*/React.createElement("th", null, "Module"), /*#__PURE__*/React.createElement("th", null, "Question Text"), /*#__PURE__*/React.createElement("th", null, "Correct Ans"), /*#__PURE__*/React.createElement("th", null, "AI Review Status"), /*#__PURE__*/React.createElement("th", null, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, questions.map(q => /*#__PURE__*/React.createElement("tr", {
    key: q.ID
  }, /*#__PURE__*/React.createElement("td", null, "#", q.ID), /*#__PURE__*/React.createElement("td", null, q.Module), /*#__PURE__*/React.createElement("td", {
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
  }, "Next \u2192")))));
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
  const [title, setTitle] = useState(editingQuiz?.title || '');
  const [description, setDescription] = useState(editingQuiz?.description || '');
  const [selectedModules, setSelectedModules] = useState(parseInitialModules);
  const [questionCount, setQuestionCount] = useState(editingQuiz?.questionCount || 50);
  const [durationMins, setDurationMins] = useState(editingQuiz?.durationMins || 50);
  const [passingScorePct, setPassingScorePct] = useState(editingQuiz?.passingScorePct || 70);
  const [status, setStatus] = useState(editingQuiz?.status || 'published');

  // Question Selection Mode: 'random' (Dynamic Random Sampling) vs 'manual' (Manual Specific Question Picker)
  const [selectionMode, setSelectionMode] = useState(editingQuiz?.selectionMode || 'random');
  const [specificQuestionIds, setSpecificQuestionIds] = useState(editingQuiz?.specificQuestionIds || []);

  // Manual Picker Search state
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerQuestions, setPickerQuestions] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [error, setError] = useState('');

  // Load questions for manual picker when picker search or selected modules change
  useEffect(() => {
    if (selectionMode === 'manual') {
      setPickerLoading(true);
      const token = localStorage.getItem('token');
      const queryObj = {
        limit: 100
      };
      if (selectedModules.length > 0) queryObj.module = selectedModules.join(',');
      if (pickerSearch) queryObj.search = pickerSearch;
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
  }, [selectionMode, selectedModules, pickerSearch]);
  const toggleModule = modValue => {
    if (selectedModules.includes(modValue)) {
      setSelectedModules(selectedModules.filter(m => m !== modValue));
    } else {
      setSelectedModules([...selectedModules, modValue]);
    }
  };
  const selectAllModules = () => {
    setSelectedModules(REAL_MODULES.map(m => m.value));
  };
  const clearAllModules = () => {
    setSelectedModules([]);
  };
  const toggleSpecificQuestion = qId => {
    const strId = String(qId);
    if (specificQuestionIds.includes(strId)) {
      setSpecificQuestionIds(specificQuestionIds.filter(id => id !== strId));
    } else {
      setSpecificQuestionIds([...specificQuestionIds, strId]);
    }
  };
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

    // Combine selected modules into a clean comma-separated string
    const combinedModuleStr = selectedModules.length === 0 ? '' : selectedModules.length === REAL_MODULES.length ? '' : selectedModules.join(', ');
    const token = localStorage.getItem('token');
    const url = isEdit ? `${API_BASE}/api/quizzes/${editingQuiz.id}` : `${API_BASE}/api/quizzes`;
    const method = isEdit ? 'PUT' : 'POST';
    const payload = {
      title,
      description,
      module: combinedModuleStr,
      questionCount: selectionMode === 'manual' ? specificQuestionIds.length : questionCount,
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
      } else {
        onSaved(data.quiz);
        onClose();
      }
    }).catch(err => setError(err.message));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content glass-card",
    onClick: e => e.stopPropagation(),
    style: {
      maxWidth: '720px',
      width: '92%'
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
  }, "System draws random questions from target curriculum module(s) for each test taker.")), /*#__PURE__*/React.createElement("div", {
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
  }, "Hand-pick specific questions from the 3,105 item bank to form a fixed exam paper.")))), /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      margin: 0,
      fontWeight: '700'
    }
  }, "Target Curriculum Modules (Check to Combine)"), /*#__PURE__*/React.createElement("div", {
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
  }, "\u2713 Select All"), /*#__PURE__*/React.createElement("button", {
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
      maxHeight: '180px',
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
  }, "\u26A1 ", /*#__PURE__*/React.createElement("strong", null, "All Modules Selected (Comprehensive):"), " Sampling from all 3,105 items across the full curriculum repository.") : /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: '0.8rem',
      color: 'var(--primary-light)',
      marginBottom: '0.6rem',
      padding: '0.35rem 0.6rem',
      background: 'rgba(56, 189, 248, 0.12)',
      borderRadius: '6px',
      border: '1px solid var(--border-glow)'
    }
  }, "\uD83C\uDFAF ", /*#__PURE__*/React.createElement("strong", null, "Combining ", selectedModules.length, " Module(s):"), " Questions will be filtered by checked curriculum modules."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem'
    }
  }, REAL_MODULES.map(mod => {
    const isChecked = selectedModules.includes(mod.value);
    return /*#__PURE__*/React.createElement("label", {
      key: mod.value,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.4rem 0.75rem',
        borderRadius: '6px',
        cursor: 'pointer',
        background: isChecked ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.02)',
        border: isChecked ? '1px solid var(--primary-light)' : '1px solid rgba(255,255,255,0.05)',
        transition: 'all 0.15s ease'
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
        fontSize: '0.85rem',
        color: isChecked ? '#ffffff' : 'var(--text-muted)',
        fontWeight: isChecked ? '600' : 'normal'
      }
    }, mod.label));
  })))), selectionMode === 'manual' && /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem'
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      margin: 0,
      fontWeight: '700',
      color: '#fbbf24'
    }
  }, "\uD83D\uDCCC Pick Specific Questions (", specificQuestionIds.length, " Selected)"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "\uD83D\uDD0D Search questions by keyword...",
    className: "form-control",
    style: {
      width: '240px',
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
      maxHeight: '240px',
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
        color: isPicked ? '#ffffff' : 'var(--text-main)',
        fontWeight: '600',
        marginBottom: '0.2rem'
      }
    }, "Item #", qItem.ID, ": ", qItem.QuestionText), /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--text-dim)',
        fontSize: '0.75rem',
        display: 'flex',
        gap: '0.75rem'
      }
    }, /*#__PURE__*/React.createElement("span", null, "Module: ", qItem.Module || 'General'), /*#__PURE__*/React.createElement("span", null, "Topic: ", qItem.Topic || 'N/A'), /*#__PURE__*/React.createElement("span", null, "Correct: ", qItem.CorrectAnswer))));
  })))), /*#__PURE__*/React.createElement("div", {
    className: "grid-2col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-group"
  }, /*#__PURE__*/React.createElement("label", null, "Question Count"), selectionMode === 'manual' ? /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    value: `${specificQuestionIds.length} Picked Questions`,
    disabled: true
  }) : /*#__PURE__*/React.createElement("select", {
    className: "form-control",
    value: questionCount,
    onChange: e => setQuestionCount(parseInt(e.target.value))
  }, /*#__PURE__*/React.createElement("option", {
    value: "20"
  }, "20 Questions"), /*#__PURE__*/React.createElement("option", {
    value: "30"
  }, "30 Questions"), /*#__PURE__*/React.createElement("option", {
    value: "50"
  }, "50 Questions (Standard Block)"), /*#__PURE__*/React.createElement("option", {
    value: "100"
  }, "100 Questions (Comprehensive)"))), /*#__PURE__*/React.createElement("div", {
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
  }, isEdit ? 'Save Quiz Changes' : 'Post Quiz to Students')))));
}

// USER PROFILE SETTINGS MODAL
function ProfileModal({
  user,
  setUser,
  onClose
}) {
  const [fullName, setFullName] = useState(user.fullName || '');
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
        school,
        targetExamDate,
        newPassword: newPassword || undefined
      })
    }).then(res => res.json()).then(data => {
      if (data.error) {
        setError(data.error);
      } else {
        setMessage('Profile updated successfully!');
        setUser(data.user);
        setTimeout(() => onClose(), 1200);
      }
    }).catch(err => setError(err.message));
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
      } else {
        onSaved();
        onClose();
      }
    }).catch(err => setError(err.message));
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
  })), !isEdit && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
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
      } else {
        onSaved();
        onClose();
      }
    }).catch(err => setError(err.message));
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