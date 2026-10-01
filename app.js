const { useState, useEffect } = React;

const API_BASE = '';

const MODULE_OPTIONS = [
  { value: '', label: 'All Curriculum Modules (Comprehensive Mixed)' },
  { value: 'Module 1 - Power Plant Elements', label: 'Module 1: Power Plant Elements (1,111 Qs)' },
  { value: 'Module 2 - Power Plant Design', label: 'Module 2: Power Plant Design (790 Qs)' },
  { value: 'Module 3 - Industrial Plant Engineering', label: 'Module 3: Industrial Plant Engineering (313 Qs)' },
  { value: 'Module 4 - Industrial Plant Design', label: 'Module 4: Industrial Plant Design (295 Qs)' },
  { value: 'Module 5 - Refrigeration Engineering', label: 'Module 5: Refrigeration Engineering (392 Qs)' },
  { value: 'Module 6 - Air Conditioning', label: 'Module 6: Air Conditioning (157 Qs)' },
  { value: 'Unclassified', label: 'Unclassified / General (48 Qs)' }
];

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

  // Check current session
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          loadStats(token);
        } else {
          logout();
        }
      })
      .catch(() => logout());
    }
  }, [token]);

  const loadStats = (authToken) => {
    fetch(`${API_BASE}/api/questions/stats`, {
      headers: { 'Authorization': `Bearer ${authToken || token}` }
    })
    .then(res => res.json())
    .then(data => setStats(data))
    .catch(console.error);
  };

  const loadQuestions = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    fetch(`${API_BASE}/api/questions?${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setQuestions(data.questions || []);
      setTotalQuestionsCount(data.total || 0);
      setTotalPagesCount(data.totalPages || 1);
    })
    .catch(console.error);
  };

  const loadQuizzes = () => {
    fetch(`${API_BASE}/api/quizzes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setQuizzesList(data.quizzes || []);
      setMyAttempts(data.myAttempts || []);
    })
    .catch(console.error);
  };

  const loadAttempts = () => {
    fetch(`${API_BASE}/api/attempts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setAttemptsList(data.attempts || []))
    .catch(console.error);
  };

  const loadUsers = () => {
    fetch(`${API_BASE}/api/users/full`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setUsersList(data.users || []))
    .catch(console.error);
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

    // Auto-refresh every 5 seconds so any changes made on admin automatically reflect on all student accounts
    const pollInterval = setInterval(() => {
      loadQuizzes();
      loadStats(token);
      if (user.role === 'admin') {
        loadUsers();
        loadAttempts();
      }
    }, 5000);

    // Refresh immediately when window or tab becomes active
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadQuizzes();
        loadStats(token);
        if (user.role === 'admin') {
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
    };
  }, [token, user ? user.role : null]);

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('token');
    setView('dashboard');
  };

  const downloadReviewedCSV = () => {
    fetch(`${API_BASE}/api/download/csv`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('CSV file unavailable on server');
      return res.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'QuestionBank_Reviewed.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    })
    .catch(err => alert('Error downloading CSV: ' + err.message));
  };

  const startPracticeMode = ({ moduleVal, batchVal, limitVal = 50 }) => {
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
    const queryObj = { limit: targetLimit, random: 'true' };
    if (moduleVal) queryObj.module = moduleVal;
    if (batchVal) queryObj.batch = batchVal;

    const query = new URLSearchParams(queryObj).toString();

    fetch(`${API_BASE}/api/questions?${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      let qList = data.questions || [];
      if (qList.length > targetLimit) {
        qList = qList.slice(0, targetLimit);
      }
      setQuestions(qList);
      setView('exam');
    })
    .catch(console.error);
  };

  const launchPostedQuiz = (quiz) => {
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
      const queryObj = { limit: targetCount, random: 'true' };
      if (quiz.module) queryObj.module = quiz.module;
      queryUrl = `${API_BASE}/api/questions?${new URLSearchParams(queryObj).toString()}`;
    }

    fetch(queryUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      let qList = data.questions || [];
      if (qList.length > targetCount) {
        qList = qList.slice(0, targetCount);
      }
      setQuestions(qList);
      setView('exam');
      setExamTimer((quiz.durationMins || 50) * 60);
      setTimerActive(true);
    })
    .catch(console.error);
  };

  const startDiagnosticBenchmark = () => {
    fetch(`${API_BASE}/api/adaptive/diagnostic/start`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
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
    })
    .catch(err => alert('Error launching diagnostic benchmark: ' + err.message));
  };

  const startAdaptiveSmartQuiz = () => {
    fetch(`${API_BASE}/api/adaptive/smart-quiz`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
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
    })
    .catch(err => alert('Error launching smart quiz: ' + err.message));
  };

  const startBoardSimulation = () => {
    fetch(`${API_BASE}/api/adaptive/simulation/start`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
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
    })
    .catch(err => alert('Error launching board simulation: ' + err.message));
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
      })
      .then(res => res.json())
      .then(data => {
        console.log('Diagnostic benchmark recorded:', data);
        loadStats();
      })
      .catch(console.error);
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
      })
      .then(res => res.json())
      .then(data => {
        console.log('Board simulation attempt recorded:', data);
        loadStats();
      })
      .catch(console.error);
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
      })
      .then(res => res.json())
      .then(data => {
        console.log('Smart Quiz attempt recorded & statistics updated:', data);
        loadStats();
      })
      .catch(console.error);
      return;
    }

    const moduleBreakdown = {};
    questions.forEach(qItem => {
      const mod = qItem.Module || 'Module 1 - Power Plant Elements';
      if (!moduleBreakdown[mod]) moduleBreakdown[mod] = { total: 0, correct: 0 };
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
        totalQuestions: total,
        percentage: pct,
        passed,
        timeSpentSeconds: timeSpentSecs,
        moduleBreakdown
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log('Quiz attempt recorded successfully:', data);
      loadStats();
    })
    .catch(console.error);
  };

  const toggleQuizStatus = (qz) => {
    const newStatus = qz.status === 'published' ? 'draft' : 'published';
    fetch(`${API_BASE}/api/quizzes/${qz.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    }).then(() => loadQuizzes());
  };

  const deleteQuiz = (id) => {
    if (confirm('Are you sure you want to permanently delete this board quiz?')) {
      setQuizzesList(prev => prev.filter(q => q.id !== id));
      fetch(`${API_BASE}/api/quizzes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) alert('Error: ' + data.error);
        loadQuizzes();
      })
      .catch(err => {
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(res => res.json().then(data => ({ status: res.status, data })))
    .then(({ status, data }) => {
      if (status >= 400) {
        alert(data.error || 'Authentication failed');
      } else {
        setToken(data.token);
        localStorage.setItem('token', data.token);
        setUser(data.user);
        setAuthModal(null);
        loadStats(data.token);
      }
    })
    .catch(err => alert('Network error: ' + err.message));
  };



  return (
    <div className="app-container">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="nav-brand" onClick={() => setView('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="images/neust_coe_seal.png" alt="NEUST COE Seal" style={{ width: '38px', height: '38px', objectFit: 'contain' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', lineHeight: '1.1' }}>
              ME <span className="gradient-text">BoardPrep</span>
            </span>
            <span style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: '600', letterSpacing: '0.03em' }}>
              NEUST College of Engineering
            </span>
          </div>
        </div>

        <nav className="nav-items">
          <button className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>Dashboard</button>
          
          {user && (
            <>
              <button className={`nav-btn ${view === 'audit' ? 'active' : ''}`} onClick={() => {
                loadQuestions({ page: 1, limit: 20 });
                setView('audit');
              }}>Question Explorer</button>

              <button className="nav-btn" onClick={() => setPracticeModalOpen(true)}>
                📖 Practice Mode
              </button>

              <button className="nav-btn" onClick={() => {
                loadQuizzes();
                setQuizListModalOpen(true);
              }}>
                ⏱️ Board Quizzes
              </button>
            </>
          )}

          {user && user.role === 'admin' && (
            <button className={`nav-btn ${view === 'admin' ? 'active' : ''}`} onClick={() => {
              loadUsers();
              loadQuestions({ page: 1, limit: 20 });
              loadQuizzes();
              loadAttempts();
              setView('admin');
            }}>
              <span className="badge badge-admin">Admin Portal</span>
            </button>
          )}

          <button className="nav-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-student'}`}>
                {user.fullName} ({user.role})
              </span>
              <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => setProfileModalOpen(true)}>
                ⚙️ Profile
              </button>
              <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={logout}>Logout</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={() => setAuthModal('login')}>Login</button>
              <button className="btn-primary" onClick={() => setAuthModal('signup')}>Sign Up</button>
            </div>
          )}
        </nav>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        {!user ? (
          <HeroSection onLoginClick={() => setAuthModal('login')} onSignupClick={() => setAuthModal('signup')} />
        ) : (
          <div>
            {view === 'dashboard' && (
              <DashboardView 
                token={token}
                user={user} 
                stats={stats} 
                openPracticeModal={() => setPracticeModalOpen(true)}
                openQuizListModal={() => {
                  loadQuizzes();
                  setQuizListModalOpen(true);
                }}
                startDiagnosticBenchmark={startDiagnosticBenchmark}
                startAdaptiveSmartQuiz={startAdaptiveSmartQuiz}
                startBoardSimulation={startBoardSimulation}
                setView={setView} 
                loadQuestions={loadQuestions}
                downloadReviewedCSV={downloadReviewedCSV} 
              />
            )}

            {view === 'exam' && (
              <ExamView 
                questions={questions} 
                activeQuiz={activeQuiz}
                activeIdx={activeQuestionIndex} 
                setActiveIdx={setActiveQuestionIndex}
                userAnswers={userAnswers}
                setUserAnswers={setUserAnswers}
                showExplanation={showExplanation}
                setShowExplanation={setShowExplanation}
                examMode={examMode}
                examTimer={examTimer}
                examSubmitted={examSubmitted}
                setExamSubmitted={setExamSubmitted}
                recordQuizAttempt={recordQuizAttempt}
                startBoardSimulation={startBoardSimulation}
                startAdaptiveSmartQuiz={startAdaptiveSmartQuiz}
                onFinish={() => setView('dashboard')}
              />
            )}

            {view === 'audit' && (
              <BatchAuditView 
                questions={questions} 
                loadQuestions={loadQuestions}
                totalQuestionsCount={totalQuestionsCount}
                totalPagesCount={totalPagesCount}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                moduleFilter={moduleFilter}
                setModuleFilter={setModuleFilter}
                batchFilter={batchFilter}
                setBatchFilter={setBatchFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                downloadReviewedCSV={downloadReviewedCSV}
              />
            )}

            {view === 'admin' && user.role === 'admin' && (
              <AdminView 
                stats={stats}
                usersList={usersList}
                loadUsers={loadUsers}
                questions={questions}
                loadQuestions={loadQuestions}
                quizzesList={quizzesList}
                loadQuizzes={loadQuizzes}
                attemptsList={attemptsList}
                loadAttempts={loadAttempts}
                totalQuestionsCount={totalQuestionsCount}
                totalPagesCount={totalPagesCount}
                openUserModal={(userToEdit) => {
                  setEditingUser(userToEdit);
                  setUserModalOpen(true);
                }}
                openQuestionModal={(qToEdit) => {
                  setEditingQuestion(qToEdit);
                  setQuestionModalOpen(true);
                }}
                openQuizEditorModal={(qzToEdit) => {
                  setEditingQuiz(qzToEdit);
                  setQuizEditorModalOpen(true);
                }}
                openQuizResultsModal={(qzFilter) => {
                  setSelectedQuizFilterForResults(qzFilter);
                  loadAttempts();
                  setQuizResultsModalOpen(true);
                }}
                openUserDetailModal={(uDetail) => {
                  setSelectedUserDetail(uDetail);
                  setUserDetailModalOpen(true);
                }}
                downloadReviewedCSV={downloadReviewedCSV}
              />
            )}
          </div>
        )}
      </main>

      {/* AUTH MODAL */}
      {authModal && (
        <AuthModal 
          authModal={authModal} 
          setAuthModal={setAuthModal} 
          handleAuthSubmit={handleAuthSubmit} 
        />
      )}

      {/* PRACTICE MODE MODAL */}
      {practiceModalOpen && (
        <PracticeConfigModal 
          onClose={() => setPracticeModalOpen(false)}
          onStart={startPracticeMode}
        />
      )}

      {/* POSTED QUIZZES LIBRARY MODAL FOR STUDENTS & ADMINS */}
      {quizListModalOpen && (
        <QuizListModal 
          quizzes={quizzesList}
          myAttempts={myAttempts}
          onClose={() => setQuizListModalOpen(false)}
          onLaunch={launchPostedQuiz}
          user={user}
          openQuizEditorModal={(qzToEdit) => {
            setEditingQuiz(qzToEdit);
            setQuizEditorModalOpen(true);
          }}
          openQuizResultsModal={(qzFilter) => {
            setSelectedQuizFilterForResults(qzFilter);
            loadAttempts();
            setQuizResultsModalOpen(true);
          }}
          toggleQuizStatus={toggleQuizStatus}
          deleteQuiz={deleteQuiz}
        />
      )}

      {/* ADMIN QUIZ RESULTS & STUDENT SCORES LOG MODAL */}
      {quizResultsModalOpen && (
        <QuizResultsModal 
          attempts={attemptsList}
          quizzes={quizzesList}
          selectedQuizFilter={selectedQuizFilterForResults}
          setSelectedQuizFilter={setSelectedQuizFilterForResults}
          onClose={() => setQuizResultsModalOpen(false)}
        />
      )}

      {/* ADMIN FULL USER DETAIL & ACADEMIC RECORD MODAL */}
      {userDetailModalOpen && selectedUserDetail && (
        <UserDetailModal 
          user={selectedUserDetail} 
          onClose={() => {
            setUserDetailModalOpen(false);
            setSelectedUserDetail(null);
          }} 
        />
      )}

      {/* USER PROFILE MODAL */}
      {profileModalOpen && (
        <ProfileModal 
          user={user} 
          setUser={setUser} 
          onClose={() => setProfileModalOpen(false)} 
        />
      )}

      {/* ADMIN USER EDIT MODAL */}
      {userModalOpen && (
        <UserModal 
          editingUser={editingUser} 
          onClose={() => {
            setUserModalOpen(false);
            setEditingUser(null);
          }} 
          onSaved={() => loadUsers()} 
        />
      )}

      {/* ADMIN QUESTION MODAL */}
      {questionModalOpen && (
        <QuestionModal 
          editingQuestion={editingQuestion} 
          onClose={() => {
            setQuestionModalOpen(false);
            setEditingQuestion(null);
          }} 
          onSaved={() => loadQuestions({ page: 1, limit: 20 })} 
        />
      )}

      {/* ADMIN QUIZ EDITOR MODAL */}
      {quizEditorModalOpen && (
        <QuizEditorModal 
          editingQuiz={editingQuiz} 
          onClose={() => {
            setQuizEditorModalOpen(false);
            setEditingQuiz(null);
          }} 
          onSaved={() => loadQuizzes()} 
        />
      )}

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

// INSTITUTIONAL CREATOR ATTRIBUTION BANNER
function CreatorAttributionBanner() {
  return (
    <div className="creator-banner">
      <div className="creator-seals">
        <img src="images/neust_seal.png" alt="NEUST University Seal" className="creator-seal-img" />
        <img src="images/neust_coe_seal.png" alt="NEUST College of Engineering Seal" className="creator-seal-img" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#fbbf24', fontWeight: '800', fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
          🏛️ Institutional Developer & Platform Creator
        </div>
        <h3 style={{ fontSize: '1.25rem', color: '#ffffff', marginBottom: '0.2rem' }}>
          Nueva Ecija University of Science and Technology (NEUST)
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>
          College of Engineering — Department of Mechanical Engineering (Est. 1968 / Centennial 1908-2008). Built exclusively for Mechanical Engineering Board Exam Reviewees.
        </p>
      </div>
    </div>
  );
}

// SHARED INSTITUTIONAL FOOTER
function Footer() {
  return (
    <footer style={{ marginTop: '4rem', padding: '2.5rem 1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', background: 'rgba(15, 23, 42, 0.75)', position: 'relative', zIndex: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem' }}>
        <img src="images/neust_seal.png" alt="NEUST Seal" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
        <img src="images/neust_coe_seal.png" alt="NEUST COE Seal" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
      </div>
      <p style={{ fontWeight: '800', color: '#ffffff', fontSize: '1.05rem' }}>
        Nueva Ecija University of Science and Technology (NEUST)
      </p>
      <p style={{ color: '#fbbf24', fontWeight: '600', fontSize: '0.9rem', marginTop: '0.2rem' }}>
        College of Engineering — Department of Mechanical Engineering (Est. 1968)
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem', maxWidth: '650px', margin: '0.5rem auto 0' }}>
        Official Licensure Board Examination Preparation Platform & Solved 3,105 Item Question Bank Repository.
      </p>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '1.25rem' }}>
        © 2026 NEUST BS Mechanical Engineering. All Rights Reserved. Powered by First-Principles Solutions.
      </div>
    </footer>
  );
}

// ADAPTIVE LEARNING & KNOWLEDGE GAP ANALYTICS WIDGET (5-STEP MODEL)
function AdaptiveAnalyticsWidget({ token, user, stats, startDiagnosticBenchmark, startAdaptiveSmartQuiz, startBoardSimulation }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = () => {
    fetch(`${API_BASE}/api/adaptive/analytics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setAnalytics(data);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token, stats]);

  if (loading) return <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading Adaptive Learning analytics...</div>;
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

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      {/* 5-STEP PROGRESSION TIMELINE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className={`adaptive-step-card ${diagnosticCompleted ? 'completed' : 'active'}`} style={{ padding: '1rem' }}>
          <span className="step-number-badge">Step 1</span>
          <div style={{ fontWeight: '700', fontSize: '0.85rem', marginTop: '0.3rem' }}>Diagnostic Benchmark</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {diagnosticCompleted ? '✓ Completed (100 Items)' : '100-Item Baseline'}
          </div>
        </div>

        <div className={`adaptive-step-card ${diagnosticCompleted ? 'completed' : ''}`} style={{ padding: '1rem' }}>
          <span className="step-number-badge">Step 2</span>
          <div style={{ fontWeight: '700', fontSize: '0.85rem', marginTop: '0.3rem' }}>Knowledge Gap Analysis</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {diagnosticCompleted ? '✓ Analytics Active' : 'Data-Driven Matrix'}
          </div>
        </div>

        <div className={`adaptive-step-card ${diagnosticCompleted ? 'completed' : ''}`} style={{ padding: '1rem' }}>
          <span className="step-number-badge">Step 3</span>
          <div style={{ fontWeight: '700', fontSize: '0.85rem', marginTop: '0.3rem' }}>Adaptive Targeted Practice</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weak Spot Smart-Quizzes</div>
        </div>

        <div className={`adaptive-step-card ${simulationUnlocked ? (simulationPassed ? 'completed' : 'active') : ''}`} style={{ padding: '1rem' }}>
          <span className="step-number-badge">Step 4</span>
          <div style={{ fontWeight: '700', fontSize: '0.85rem', marginTop: '0.3rem' }}>Simulated Board Exam</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {simulationPassed ? '✓ Simulation Passed' : (simulationUnlocked ? 'Unlocked (100 Items)' : 'Locked until Practice')}
          </div>
        </div>

        <div className={`adaptive-step-card ${isReadyForBoard ? 'completed' : (needsRemediation ? 'warning' : '')}`} style={{ padding: '1rem' }}>
          <span className="step-number-badge">Step 5</span>
          <div style={{ fontWeight: '700', fontSize: '0.85rem', marginTop: '0.3rem' }}>Readiness Loop</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isReadyForBoard ? '🟢 Green Light Ready' : (needsRemediation ? '⚠️ Remediation Active' : 'Guaranteed Path')}
          </div>
        </div>
      </div>

      {/* STEP 5: EXAM READINESS GREEN LIGHT BANNER (UNLOCKED WHEN SIMULATION PASSED) */}
      {isReadyForBoard ? (
        <div className="green-light-banner">
          <div style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>🟢 🎓 🏆</div>
          <h2 style={{ fontSize: '2rem', color: 'var(--success)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Congratulations, you are now ready to take the board exam.
          </h2>
          <p style={{ color: 'var(--text-main)', fontSize: '1.1rem', maxWidth: '750px', margin: '0 auto 1.25rem' }}>
            You have successfully completed the <strong>Guaranteed Readiness Path</strong>! Passed the 100-item Simulated Board Exam with a mastery score of <strong>{lastSimulationScore}%</strong> in a real-world testing environment across all subjects.
          </p>
          <div style={{ display: 'inline-flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span className="badge badge-status" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
              ✓ Real-World Simulation Passed ({lastSimulationScore}%)
            </span>
            <span className="badge badge-admin" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
              ✓ All 6 Curriculum Modules Mastered
            </span>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.75rem', border: '1px solid var(--border-glow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="step-number-badge">5-Step Guaranteed Readiness Engine</span>
              <h3 style={{ fontSize: '1.4rem' }}>Adaptive Board Readiness Index: <span className="gradient-text">{readinessIndex}%</span></h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                <strong>Status:</strong> {readinessStatus}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {!diagnosticCompleted ? (
                <button className="btn-primary" onClick={startDiagnosticBenchmark}>
                  🚀 Step 1: Start Diagnostic Benchmark (100 Items)
                </button>
              ) : simulationUnlocked ? (
                <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} onClick={startBoardSimulation}>
                  🏛️ Step 4: Launch Simulated Board Exam (100 Items)
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="badge badge-admin" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', borderColor: 'var(--warning)', padding: '0.5rem 0.8rem', fontSize: '0.82rem' }}>
                    🔒 Step 4 Locked (Target: 75% Readiness)
                  </span>
                  <button className="btn-primary" onClick={startAdaptiveSmartQuiz}>
                    ⚡ Step 3: Launch Smart-Quiz (Current: {readinessIndex}%)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* STEP 5: CONTINUOUS FEEDBACK LOOP & UNLIMITED REMEDIATION ALERT BOX */}
          {needsRemediation && (
            <div style={{ padding: '1rem 1.25rem', background: 'rgba(245, 158, 11, 0.12)', borderLeft: '4px solid var(--warning)', borderRadius: '8px', margin: '1rem 0 1.25rem' }}>
              <div style={{ color: 'var(--warning)', fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                🔄 Continuous Feedback Loop & Remediation Active
              </div>
              <p style={{ color: 'var(--text-main)', fontSize: '0.88rem', margin: 0 }}>
                Your last Simulated Board Exam score was <strong>{lastSimulationScore}%</strong>. Your Adaptive Board Readiness Index has been reset to <strong>{readinessIndex}%</strong>. Complete targeted Smart-Quizzes to rebuild your readiness index back to <strong>75%</strong> to unlock the Simulated Board Exam retake!
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button className="btn-primary" style={{ fontSize: '0.85rem' }} onClick={startAdaptiveSmartQuiz}>
                  🎯 Launch Targeted Smart-Quiz (Current: {readinessIndex}%, Target: 75%)
                </button>
              </div>
            </div>
          )}

          <div className="readiness-progress-bar">
            <div 
              className="readiness-progress-fill" 
              style={{ 
                width: `${readinessIndex}%`, 
                background: readinessIndex >= 75 ? 'var(--success)' : 'linear-gradient(90deg, var(--warning), var(--primary-light))' 
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <span>0% Baseline</span>
            <span>Step 3 Practice Target (75%)</span>
            <span>100% Comprehensive Mastery</span>
          </div>
        </div>
      )}

      {/* STEP 2: KNOWLEDGE GAP ANALYSIS GRID */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="step-number-badge">Step 2: Knowledge Gap Analysis</span>
            <h3 style={{ fontSize: '1.3rem' }}>Curriculum Module Proficiency & Weak Spot Map</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-secondary" style={{ fontSize: '0.85rem' }} onClick={startAdaptiveSmartQuiz}>
              🎯 Targeted Practice on Weak Spots
            </button>
            <button className="btn-secondary" style={{ fontSize: '0.85rem', borderColor: 'var(--primary-light)' }} onClick={startBoardSimulation}>
              🏛️ Simulated Board Exam
            </button>
          </div>
        </div>

        <div className="grid-2col" style={{ gap: '1.25rem' }}>
          {Object.keys(moduleMastery || {}).map(mod => {
            const data = moduleMastery[mod];
            const pct = data.percentage || 0;
            const isStrength = pct >= 75;

            return (
              <div key={mod} className="mastery-bar-container">
                <div className="mastery-bar-header">
                  <span>{mod}</span>
                  <span style={{ color: isStrength ? 'var(--success)' : 'var(--warning)', fontWeight: '700' }}>
                    {pct}% {isStrength ? '✓ Strength' : '⚠️ Focus Area'}
                  </span>
                </div>
                <div className="readiness-progress-bar" style={{ height: '8px', margin: '0.25rem 0' }}>
                  <div 
                    className="readiness-progress-fill" 
                    style={{ 
                      width: `${pct}%`, 
                      background: isStrength ? 'var(--success)' : 'var(--warning)' 
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {data.totalAttempts > 0 ? `${data.correctCount}/${data.totalAttempts} questions correct` : 'No items attempted yet'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// HERO SECTION FOR PUBLIC VISITORS
function HeroSection({ onLoginClick, onSignupClick }) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
      <CreatorAttributionBanner />

      <div className="badge badge-admin" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>
        Verified Mechanical Engineering Question Bank & AI Review System
      </div>
      <h1 style={{ fontSize: '3.2rem', marginBottom: '1.5rem', maxWidth: '900px', margin: '0 auto 1.5rem' }}>
        Master the Mechanical Engineer Board Exam with <span className="gradient-text">First-Principles Solutions</span>
      </h1>
      <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '750px', margin: '0 auto 2.5rem' }}>
        Comprehensive question bank of 3,105 solved items covering Power Plant Engineering, Industrial Plant Design, Heat Transfer, Refrigeration & Air Conditioning, and ME Design.
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3.5rem' }}>
        <button className="btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1.1rem' }} onClick={onSignupClick}>
          Create Free Student Account
        </button>
        <button className="btn-secondary" style={{ padding: '0.85rem 2rem', fontSize: '1.1rem' }} onClick={onLoginClick}>
          Log In
        </button>
      </div>

      {/* Feature Highlights Grid */}
      <div className="stats-grid" style={{ marginTop: '2rem' }}>
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '0.75rem', color: 'var(--primary-light)' }}>📖 Self-Paced Practice</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Study questions by curriculum module or batch with instant step-by-step solutions, governing equations, and academic citations.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '2rem', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '0.75rem', color: 'var(--accent-light)' }}>⏱️ Admin-Posted Quizzes</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Attempt official timed quizzes created, posted, and managed exclusively by faculty administrators under simulated licensure exam conditions.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '2rem', textAlign: 'left' }}>
          <h3 style={{ marginBottom: '0.75rem', color: 'var(--success)' }}>⚡ 3,105 Solved Questions</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            100% verified question bank across 63 review batches covering all 6 board exam modules.
          </p>
        </div>
      </div>

      {/* HOW IT WORKS: 5-STEP GUARANTEED READINESS PATH */}
      <div style={{ marginTop: '3.5rem', textAlign: 'left' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="badge badge-admin" style={{ marginBottom: '0.75rem' }}>Guaranteed Readiness Path</span>
          <h2 style={{ fontSize: '2.2rem' }}>Study Smarter, Not Harder: Your Personalized Path to Passing</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '750px', margin: '0.5rem auto 0' }}>
            Don’t waste time studying what you already know. Our Adaptive Learning System pinpoints exactly what you need to focus on, and our realistic mock exams ensure you can walk into your board exam with absolute confidence.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div className="adaptive-step-card">
            <span className="step-number-badge">Step 1</span>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--primary-light)' }}>The Diagnostic Benchmark</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              When you create an account, you'll start with a 100-item comprehensive assessment covering all essential exam modules to establish your baseline.
            </p>
          </div>

          <div className="adaptive-step-card">
            <span className="step-number-badge">Step 2</span>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--accent-light)' }}>Knowledge Gap Analysis</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Instantly receive data-driven analytics that highlight your specific strengths and pinpoint exactly where you need to focus.
            </p>
          </div>

          <div className="adaptive-step-card">
            <span className="step-number-badge">Step 3</span>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--warning)' }}>Adaptive Targeted Practice</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Our Smart-Quiz System takes over, generating custom quizzes specifically designed to challenge your weak spots until you turn them into strengths.
            </p>
          </div>

          <div className="adaptive-step-card">
            <span className="step-number-badge">Step 4</span>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#10b981' }}>The Board Exam Simulation</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Unlock the <strong>Simulated Board Exam</strong>—a 100-item comprehensive randomized assessment spanning all subjects in a real-world testing environment.
            </p>
          </div>

          <div className="adaptive-step-card">
            <span className="step-number-badge">Step 5</span>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--success)' }}>The Readiness Loop</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Pass the simulation to unlock: <strong>"Congratulations, you are now ready to take the board exam."</strong> Fall short? Our continuous feedback loop & unlimited remediation let you review and retake until ready!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// STUDENT & MAIN DASHBOARD VIEW
function DashboardView({ token, user, stats, openPracticeModal, openQuizListModal, startDiagnosticBenchmark, startAdaptiveSmartQuiz, startBoardSimulation, setView, loadQuestions, downloadReviewedCSV }) {
  const totalCount = stats ? stats.totalQuestions : 3105;
  const reviewedCount = stats ? stats.reviewedQuestions : 3105;
  const totalBatches = stats ? stats.totalBatchesCompleted : 63;
  const postedQuizzes = stats ? stats.publishedQuizzesCount : 4;
  const totalAttempts = stats ? (stats.totalAttemptsCount || 0) : 0;

  return (
    <div>
      <CreatorAttributionBanner />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem' }}>Welcome back, {user.fullName}!</h2>
          <p style={{ color: 'var(--text-muted)' }}>Target Exam Date: {user.targetExamDate || 'October 2026 Board Exam'} | School: {user.school || 'NEUST College of Engineering'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-success" onClick={downloadReviewedCSV}>
            📥 Export Live CSV
          </button>
          <button className="btn-primary" onClick={openPracticeModal}>
            📖 Practice Mode
          </button>
          <button className="btn-secondary" style={{ borderColor: 'var(--accent-light)', color: 'var(--accent-light)' }} onClick={openQuizListModal}>
            ⏱️ Posted Quizzes ({postedQuizzes})
          </button>
        </div>
      </div>

      {/* ADAPTIVE LEARNING & KNOWLEDGE GAP WIDGET */}
      <AdaptiveAnalyticsWidget 
        token={token} 
        user={user} 
        stats={stats}
        startDiagnosticBenchmark={startDiagnosticBenchmark} 
        startAdaptiveSmartQuiz={startAdaptiveSmartQuiz} 
        startBoardSimulation={startBoardSimulation}
      />

      {/* STATS OVERVIEW CARDS */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div>
            <div className="stat-value gradient-text">{totalCount}</div>
            <div className="stat-label">Total Verified Questions</div>
          </div>
          <div className="stat-icon">📚</div>
        </div>

        <div className="glass-card stat-card">
          <div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{reviewedCount}</div>
            <div className="stat-label">100% Fact-Checked & Solved</div>
          </div>
          <div className="stat-icon">✅</div>
        </div>

        <div className="glass-card stat-card">
          <div>
            <div className="stat-value" style={{ color: 'var(--primary-light)' }}>{postedQuizzes}</div>
            <div className="stat-label">Faculty-Posted Board Quizzes</div>
          </div>
          <div className="stat-icon">📋</div>
        </div>

        <div className="glass-card stat-card">
          <div>
            <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{totalAttempts}</div>
            <div className="stat-label">Total Student Quiz Attempts</div>
          </div>
          <div className="stat-icon">📈</div>
        </div>
      </div>

      {/* MODULE SELECTION & QUICK EXPLORER */}
      <h3 style={{ marginBottom: '1rem', marginTop: '2rem' }}>Board Exam Curriculum Modules</h3>
      <div className="stats-grid">
        <div className="glass-card" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => {
          loadQuestions({ module: 'Module 1', page: 1, limit: 20 });
          setView('audit');
        }}>
          <h4 style={{ color: 'var(--primary-light)', marginBottom: '0.5rem' }}>Module 1: Power Plant Elements</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Thermodynamics, Heat Transfer, Fluid Mechanics, Boilers, Combustion, Steam Turbines, Gas Turbines.
          </p>
          <span className="badge badge-student">1,111 Questions Available</span>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => {
          loadQuestions({ module: 'Module 2', page: 1, limit: 20 });
          setView('audit');
        }}>
          <h4 style={{ color: 'var(--accent-light)', marginBottom: '0.5rem' }}>Module 2: Power Plant Design</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Thermal cycles, Hydroelectric plants, Diesel power plants, Chimney design, Energy balances.
          </p>
          <span className="badge badge-student">790 Questions Available</span>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => {
          loadQuestions({ module: 'Module 3', page: 1, limit: 20 });
          setView('audit');
        }}>
          <h4 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Module 3: Industrial Plant Engg</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Piping networks, Conveyors, Compressors, Pumps, Fans, Blowers, Plant Safety.
          </p>
          <span className="badge badge-status">313 Questions Available</span>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => {
          loadQuestions({ module: 'Module 4', page: 1, limit: 20 });
          setView('audit');
        }}>
          <h4 style={{ color: 'var(--primary-light)', marginBottom: '0.5rem' }}>Module 4: Industrial Plant Design</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Heat Exchangers, Evaporators, Cooling Towers, Refrigerant systems, Piping.
          </p>
          <span className="badge badge-student">295 Questions Available</span>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => {
          loadQuestions({ module: 'Module 5', page: 1, limit: 20 });
          setView('audit');
        }}>
          <h4 style={{ color: 'var(--accent-light)', marginBottom: '0.5rem' }}>Module 5: Refrigeration Engg</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Vapor compression, Absorption refrigeration, Refrigerants, COP calculation, Compressors.
          </p>
          <span className="badge badge-student">392 Questions Available</span>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', cursor: 'pointer' }} onClick={() => {
          loadQuestions({ module: 'Module 6', page: 1, limit: 20 });
          setView('audit');
        }}>
          <h4 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Module 6: Air Conditioning</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Psychrometric processes, Cooling load calculations, Duct design, Air handlers.
          </p>
          <span className="badge badge-status">157 Questions Available</span>
        </div>
      </div>
    </div>
  );
}

// DEDICATED PRACTICE STUDY MODE MODAL
function PracticeConfigModal({ onClose, onStart }) {
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>📖 Practice & Study Mode</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Self-paced practice with instant step-by-step engineering solutions and literature references.
        </p>

        <div className="form-group">
          <label>Select Curriculum Module to Practice</label>
          <select className="form-control" value={selectedModule} onChange={e => { setSelectedModule(e.target.value); setSelectedBatch(''); }}>
            {MODULE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Or Select Specific Review Batch (Batches 1 to 63)</label>
          <select className="form-control" value={selectedBatch} onChange={e => { setSelectedBatch(e.target.value); setSelectedModule(''); }}>
            <option value="">All Batches (Randomized Practice Set)</option>
            {Array.from({ length: 63 }, (_, i) => i + 1).map(b => (
              <option key={b} value={b}>Batch {b} (50 Solved Questions)</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Number of Questions</label>
          <select className="form-control" value={questionLimit} onChange={e => setQuestionLimit(parseInt(e.target.value))}>
            <option value="20">20 Questions (Quick Review)</option>
            <option value="50">50 Questions (Full Block Practice)</option>
            <option value="100">100 Questions (Marathon Study Set)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={handleStart}>
            🚀 Start Practice Session
          </button>
        </div>
      </div>
    </div>
  );
}

// POSTED QUIZZES LIBRARY MODAL FOR STUDENTS & FACULTY
function QuizListModal({ quizzes, myAttempts = [], onClose, onLaunch, user, openQuizEditorModal, openQuizResultsModal, toggleQuizStatus, deleteQuiz }) {
  const isAdmin = user && user.role === 'admin';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-lg glass-card" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem' }}>⏱️ Faculty-Posted Board Quizzes</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {isAdmin ? 'Manage, compose, publish, or view student attempt logs.' : 'Attempt official quizzes posted by administrators under timed exam conditions. (1 Attempt Limit per Quiz)'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isAdmin && (
              <>
                <button className="btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', borderColor: 'var(--accent-light)', color: 'var(--accent-light)' }} onClick={() => openQuizResultsModal(null)}>
                  📊 Student Scores
                </button>
                <button className="btn-success" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }} onClick={() => openQuizEditorModal(null)}>
                  + Create & Post Quiz
                </button>
              </>
            )}
            <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={onClose}>✕ Close</button>
          </div>
        </div>

        {quizzes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No quizzes are currently published by faculty administrators.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
            {quizzes.map(qz => {
              const userAttempt = myAttempts.find(a => a.quizId === qz.id);
              const hasAttempted = !isAdmin && !!userAttempt;

              return (
                <div key={qz.id} className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)' }}>{qz.title}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="badge badge-admin" title={qz.module || 'All Modules'}>
                        {!qz.module 
                          ? 'Comprehensive (All Modules)' 
                          : (qz.module.includes(',') 
                              ? `🎯 Combined (${qz.module.split(',').length} Modules)` 
                              : qz.module)}
                      </span>
                      <span className="badge badge-status">{qz.questionCount} Questions | ⏰ {qz.durationMins} Mins</span>
                      {hasAttempted && (
                        <span className={`badge ${userAttempt.passed ? 'badge-status' : 'badge-admin'}`}>
                          Completed ({userAttempt.percentage}%)
                        </span>
                      )}
                      {isAdmin && (
                        <span className={`badge ${qz.status === 'published' ? 'badge-status' : 'badge-student'}`}>
                          {qz.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    {qz.description || 'Official licensure board prep evaluation assessment.'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      <strong>Posted By:</strong> {qz.createdBy || 'Faculty Admin'} | <strong>Passing Score:</strong> {qz.passingScorePct || 70}%
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {isAdmin && (
                        <>
                          <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => openQuizResultsModal(qz.id)}>
                            📊 Results
                          </button>
                          <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => openQuizEditorModal(qz)}>
                            Edit
                          </button>
                          <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => toggleQuizStatus(qz)}>
                            {qz.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                          <button className="btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => deleteQuiz(qz.id)}>
                            Delete
                          </button>
                        </>
                      )}

                      {hasAttempted ? (
                        <button className="btn-secondary" disabled style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem', opacity: 0.75, cursor: 'not-allowed' }}>
                          Completed (1 Attempt Max)
                        </button>
                      ) : (
                        <button className="btn-primary" style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem' }} onClick={() => onLaunch(qz)}>
                          ⚡ Start Quiz
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ADMIN QUIZ RESULTS & STUDENT SCORE LOGS MODAL
function QuizResultsModal({ attempts, quizzes, selectedQuizFilter, setSelectedQuizFilter, onClose }) {
  const filteredAttempts = selectedQuizFilter
    ? attempts.filter(a => a.quizId === selectedQuizFilter)
    : attempts;

  const totalAttempts = filteredAttempts.length;
  const passedAttempts = filteredAttempts.filter(a => a.passed).length;
  const passRate = totalAttempts > 0 ? ((passedAttempts / totalAttempts) * 100).toFixed(1) : '0.0';

  const avgScore = totalAttempts > 0 
    ? (filteredAttempts.reduce((acc, a) => acc + parseFloat(a.percentage || 0), 0) / totalAttempts).toFixed(1)
    : '0.0';

  const formatTime = (secs) => {
    if (!secs) return 'N/A';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-lg glass-card" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem' }}>📊 Student Quiz Performance & Score Logs</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Real-time audit log of all student quiz submissions, test scores, passing rates, and completion times.
            </p>
          </div>
          <button className="btn-secondary" onClick={onClose}>✕ Close</button>
        </div>

        {/* SUMMARY CARDS */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="glass-card stat-card" style={{ padding: '1rem 1.25rem' }}>
            <div>
              <div className="stat-value gradient-text" style={{ fontSize: '1.8rem' }}>{totalAttempts}</div>
              <div className="stat-label">Total Student Attempts</div>
            </div>
          </div>
          <div className="glass-card stat-card" style={{ padding: '1rem 1.25rem' }}>
            <div>
              <div className="stat-value" style={{ fontSize: '1.8rem', color: 'var(--primary-light)' }}>{avgScore}%</div>
              <div className="stat-label">Average Score</div>
            </div>
          </div>
          <div className="glass-card stat-card" style={{ padding: '1.25rem' }}>
            <div>
              <div className="stat-value" style={{ fontSize: '1.8rem', color: 'var(--success)' }}>{passRate}%</div>
              <div className="stat-label">Overall Pass Rate</div>
            </div>
          </div>
        </div>

        {/* QUIZ FILTER DROPDOWN */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label>Filter Log by Quiz</label>
          <select 
            className="form-control" 
            value={selectedQuizFilter || ''} 
            onChange={e => setSelectedQuizFilter(e.target.value || null)}
          >
            <option value="">All Faculty Quizzes ({attempts.length} attempts recorded)</option>
            {quizzes.map(qz => (
              <option key={qz.id} value={qz.id}>{qz.title}</option>
            ))}
          </select>
        </div>

        {/* ATTEMPTS TABLE */}
        {filteredAttempts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No student attempt records recorded for this quiz yet.
          </div>
        ) : (
          <div style={{ maxHeight: '45vh', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>School / University</th>
                  <th>Quiz Title</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Time Taken</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.map(att => (
                  <tr key={att.id}>
                    <td style={{ fontWeight: '600' }}>
                      {att.studentName}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{att.studentEmail}</div>
                    </td>
                    <td>{att.school || 'Mapúa University'}</td>
                    <td style={{ maxWidth: '240px', fontSize: '0.85rem' }}>{att.quizTitle}</td>
                    <td style={{ fontWeight: '700' }}>{att.score} / {att.totalQuestions}</td>
                    <td style={{ fontWeight: '700', color: att.passed ? 'var(--success)' : 'var(--danger)' }}>
                      {att.percentage}%
                    </td>
                    <td>
                      <span className={`badge ${att.passed ? 'badge-status' : 'badge-admin'}`}>
                        {att.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td>{formatTime(att.timeSpentSeconds)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{att.submittedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ADMIN COMPLETE USER MASTER DATA & ACADEMIC RECORD MODAL
function UserDetailModal({ user, onClose }) {
  const stats = user.stats || { totalAttempts: 0, passedCount: 0, failedCount: 0, avgScore: 0 };
  const attempts = user.attempts || [];
  const passRate = stats.totalAttempts > 0 ? ((stats.passedCount / stats.totalAttempts) * 100).toFixed(1) : '0.0';

  const formatTime = (secs) => {
    if (!secs) return 'N/A';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-lg glass-card" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
              <h2 style={{ fontSize: '1.6rem' }}>{user.fullName}</h2>
              <span className={`badge ${user.role === 'admin' ? 'badge-admin' : 'badge-student'}`}>{user.role.toUpperCase()}</span>
              <span className={`badge ${user.status === 'active' ? 'badge-status' : 'badge-admin'}`}>{user.status.toUpperCase()}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Master User Profile & Academic Examination History
            </p>
          </div>
          <button className="btn-secondary" onClick={onClose}>✕ Close</button>
        </div>

        {/* USER PROFILE MASTER DETAILS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Account ID</div>
            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.id}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Email Address</div>
            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.email}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>University / School</div>
            <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--primary-light)' }}>{user.school || 'Mapúa University'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Target PRC Exam Date</div>
            <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--accent-light)' }}>{user.targetExamDate || '2026-10-15'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Account Registration Date</div>
            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user.createdDate || '2026-07-27'}</div>
          </div>
        </div>

        {/* PERFORMANCE STATS OVERVIEW */}
        <h4 style={{ marginBottom: '0.75rem' }}>📈 Student Academic Performance Summary</h4>
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="glass-card stat-card" style={{ padding: '1rem' }}>
            <div>
              <div className="stat-value gradient-text" style={{ fontSize: '1.6rem' }}>{stats.totalAttempts}</div>
              <div className="stat-label">Total Quizzes Attempted</div>
            </div>
          </div>
          <div className="glass-card stat-card" style={{ padding: '1rem' }}>
            <div>
              <div className="stat-value" style={{ fontSize: '1.6rem', color: 'var(--primary-light)' }}>{stats.avgScore}%</div>
              <div className="stat-label">Average Score</div>
            </div>
          </div>
          <div className="glass-card stat-card" style={{ padding: '1rem' }}>
            <div>
              <div className="stat-value" style={{ fontSize: '1.6rem', color: 'var(--success)' }}>{stats.passedCount}</div>
              <div className="stat-label">Quizzes Passed</div>
            </div>
          </div>
          <div className="glass-card stat-card" style={{ padding: '1rem' }}>
            <div>
              <div className="stat-value" style={{ fontSize: '1.6rem', color: 'var(--danger)' }}>{stats.failedCount}</div>
              <div className="stat-label">Quizzes Failed</div>
            </div>
          </div>
        </div>

        {/* USER ATTEMPTS LOG TABLE */}
        <h4 style={{ marginBottom: '0.75rem' }}>📋 Student Quiz Attempt History ({attempts.length})</h4>
        {attempts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
            This student has not attempted any faculty board quizzes yet.
          </div>
        ) : (
          <div style={{ maxHeight: '35vh', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Quiz Title</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Time Taken</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map(att => (
                  <tr key={att.id}>
                    <td style={{ fontWeight: '600' }}>{att.quizTitle}</td>
                    <td style={{ fontWeight: '700' }}>{att.score} / {att.totalQuestions}</td>
                    <td style={{ fontWeight: '700', color: att.passed ? 'var(--success)' : 'var(--danger)' }}>
                      {att.percentage}%
                    </td>
                    <td>
                      <span className={`badge ${att.passed ? 'badge-status' : 'badge-admin'}`}>
                        {att.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td>{formatTime(att.timeSpentSeconds)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{att.submittedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// AUTH MODAL COMPONENT
function AuthModal({ authModal, setAuthModal, handleAuthSubmit }) {
  return (
    <div className="modal-overlay" onClick={() => setAuthModal(null)}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>
          {authModal === 'login' ? 'Welcome Back' : 'Create Student Account'}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Access 3,105 Solved Mechanical Engineering Licensure Questions
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button className={`btn-secondary ${authModal === 'login' ? 'btn-primary' : ''}`} style={{ flex: 1 }} onClick={() => setAuthModal('login')}>Login</button>
          <button className={`btn-secondary ${authModal === 'signup' ? 'btn-primary' : ''}`} style={{ flex: 1 }} onClick={() => setAuthModal('signup')}>Sign Up</button>
        </div>

        <form onSubmit={(e) => handleAuthSubmit(e, authModal, 'student')}>
          {authModal === 'signup' && (
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="fullName" className="form-control" placeholder="Engr. Juan Dela Cruz" required />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" name="email" className="form-control" placeholder="user@me-boardprep.edu" required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" className="form-control" placeholder="••••••••" required />
          </div>

          {authModal === 'signup' && (
            <div className="form-group">
              <label>University / School</label>
              <input type="text" name="school" className="form-control" placeholder="Mapúa / UP / UST / NEUST / TUP" />
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
            {authModal === 'login' ? 'Sign In to Account' : 'Register Student Account'}
          </button>
        </form>

      </div>
    </div>
  );
}

// EXAM & PRACTICE SIMULATOR VIEW
function ExamView({ questions, activeQuiz, activeIdx, setActiveIdx, userAnswers, setUserAnswers, showExplanation, setShowExplanation, examMode, examTimer, examSubmitted, setExamSubmitted, recordQuizAttempt, startBoardSimulation, startAdaptiveSmartQuiz, onFinish }) {
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'incorrect', 'correct'
  const [hasRecorded, setHasRecorded] = useState(false);
  const [startTime] = useState(Date.now());

  if (!questions || questions.length === 0) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading examination questions...</div>;
  }

  const q = questions[activeIdx] || questions[0];
  const selectedOption = userAnswers[q.ID];

  const handleSelectOption = (letter) => {
    if (examSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [q.ID]: letter }));
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

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const scorePct = ((calculateScore() / questions.length) * 100).toFixed(1);
  const passingScorePct = activeQuiz ? (activeQuiz.passingScorePct || 70) : 70;
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

  return (
    <div>
      {/* EXAM BAR */}
      <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className={`badge ${examMode === 'mock' ? 'badge-admin' : 'badge-student'}`} style={{ marginRight: '0.75rem' }}>
            {examMode === 'mock' ? (activeQuiz ? `⏱️ Quiz: ${activeQuiz.title.substring(0, 30)}...` : '⏱️ Timed Quiz') : '📖 Practice Mode'}
          </span>
          <strong style={{ fontSize: '1.1rem' }}>Question {activeIdx + 1} of {questions.length}</strong>
        </div>

        {examMode === 'mock' && (
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: examTimer < 300 ? 'var(--danger)' : 'var(--accent-light)' }}>
            ⏰ Remaining Time: {formatTime(examTimer)}
          </div>
        )}

        <div>
          {!examSubmitted ? (
            <button 
              className="btn-primary" 
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '0.6rem 1.25rem', fontWeight: '700' }}
              onClick={handleSubmitQuiz}
            >
              ✅ Submit Quiz & Update Readiness Index
            </button>
          ) : (
            <button className="btn-secondary" onClick={onFinish}>Return to Dashboard</button>
          )}
        </div>
      </div>

      {examSubmitted && (
        <div 
          className="glass-card" 
          style={{ 
            padding: '2.25rem 2rem', 
            marginBottom: '2rem', 
            textAlign: 'center', 
            border: isPassed ? '2px solid var(--success)' : '2px solid var(--warning)',
            background: isPassed 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(5, 150, 105, 0.28))' 
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.25))',
            boxShadow: isPassed ? '0 0 35px rgba(16, 185, 129, 0.3)' : '0 0 25px rgba(245, 158, 11, 0.2)'
          }}
        >
          {isPassed ? (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🟢 🎓 🏆</div>
              <h2 style={{ fontSize: '2.2rem', color: 'var(--success)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Congratulations, you are now ready to take the board exam.
              </h2>
              <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', margin: '0.5rem 0' }}>
                Final Score: {calculateScore()} / {questions.length} ({scorePct}%)
              </p>
              <p style={{ color: 'var(--text-main)', fontSize: '1.05rem', maxWidth: '750px', margin: '0.5rem auto 1.5rem' }}>
                🎉 You satisfied the <strong>{passingScorePct}%</strong> passing threshold! Your green-light readiness status is unlocked on your student dashboard.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>🔄 ⚠️ 📚</div>
              <h2 style={{ fontSize: '1.9rem', color: 'var(--warning)', marginBottom: '0.5rem' }}>
                Simulated Board Exam Evaluation Completed
              </h2>
              <p style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--warning)', margin: '0.5rem 0' }}>
                Score: {calculateScore()} / {questions.length} ({scorePct}%)
              </p>
              <div style={{ padding: '1rem 1.25rem', background: 'rgba(15, 23, 42, 0.6)', borderLeft: '4px solid var(--warning)', borderRadius: '8px', maxWidth: '750px', margin: '1rem auto 1.5rem', textAlign: 'left' }}>
                <div style={{ color: 'var(--warning)', fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  🔄 Continuous Feedback Loop & Remediation Active
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                  You scored <strong>{scorePct}%</strong>. Your Adaptive Board Readiness Index has been reset to 0%. Complete targeted Smart-Quizzes to build your readiness index back up to <strong>75%</strong> to unlock the Simulated Board Exam retake!
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {startAdaptiveSmartQuiz && (
                  <button className="btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }} onClick={startAdaptiveSmartQuiz}>
                    ⚡ Step 3: Launch Smart-Quiz (Target: 75% Readiness)
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <button className={`btn-secondary ${filterMode === 'all' ? 'btn-primary' : ''}`} onClick={() => setFilterMode('all')}>
              Show All Questions ({questions.length})
            </button>
            <button className={`btn-secondary ${filterMode === 'incorrect' ? 'btn-primary' : ''}`} onClick={() => setFilterMode('incorrect')}>
              Incorrect Answers ({questions.length - calculateScore()})
            </button>
            <button className={`btn-secondary ${filterMode === 'correct' ? 'btn-primary' : ''}`} onClick={() => setFilterMode('correct')}>
              Correct Answers ({calculateScore()})
            </button>
          </div>
        </div>
      )}

      {/* QUESTION CARD & SIDEBAR */}
      <div className="exam-container">
        <div className="glass-card question-card">
          <div className="question-header">
            <div>
              <span className="badge badge-admin" style={{ marginRight: '0.5rem' }}>{q.Module}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: #{q.ID} | {q.Subtopic || q.Topic}</span>
            </div>
            {q.AIReviewStatus && (
              <span className="badge badge-status">AI Status: {q.AIReviewStatus}</span>
            )}
          </div>

          <div className="question-text">{q.QuestionText}</div>

          <div className="options-grid">
            {['A', 'B', 'C', 'D'].map(letter => {
              const text = q[`Option${letter}`];
              if (!text) return null;
              
              const isQuizMode = examMode === 'mock';
              const showAnswersNow = isQuizMode ? examSubmitted : (showExplanation && selectedOption);

              let optClass = '';
              if (selectedOption === letter) optClass += ' selected';
              if (showAnswersNow) {
                if (letter === q.CorrectAnswer) optClass += ' correct';
                else if (selectedOption === letter && letter !== q.CorrectAnswer) optClass += ' incorrect';
              }

              return (
                <button key={letter} className={`option-btn ${optClass}`} onClick={() => handleSelectOption(letter)}>
                  <div className="option-letter">{letter}</div>
                  <div style={{ flex: 1 }}>{text}</div>
                </button>
              );
            })}
          </div>

          {/* EXPLANATION BOX */}
          {((examMode === 'mock' && examSubmitted) || (examMode === 'practice' && showExplanation)) && q.Explanation && (
            <div className="explanation-box">
              <h4>🔬 First-Principles Engineering Solution & Explanation</h4>
              <p style={{ fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '1rem' }}>{q.Explanation}</p>
              
              {q.References && (
                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <strong>📖 Standard Academic Reference:</strong> {q.References}
                </div>
              )}
            </div>
          )}

          {/* NAVIGATION BUTTONS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button className="btn-secondary" disabled={activeIdx === 0} onClick={() => setActiveIdx(i => i - 1)}>
              ← Previous Question
            </button>
            
            {examMode === 'practice' && (
              <button className="btn-secondary" onClick={() => setShowExplanation(e => !e)}>
                {showExplanation ? 'Hide Solution' : 'Show Solution'}
              </button>
            )}

            <button className="btn-primary" disabled={activeIdx === questions.length - 1} onClick={() => setActiveIdx(i => i + 1)}>
              Next Question →
            </button>
          </div>
        </div>

        {/* QUESTION PALETTE GRID SIDEBAR */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>Question Navigator</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', maxHeight: '420px', overflowY: 'auto' }}>
            {questions.map((item, idx) => {
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

              return (
                <button key={item.ID} style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: isCurr ? '2px solid var(--primary-light)' : '1px solid var(--border-color)',
                  background: bg,
                  color: isCurr ? 'white' : 'var(--text-main)',
                  fontWeight: '700',
                  cursor: 'pointer'
                }} onClick={() => setActiveIdx(idx)}>
                  {idx + 1}
                </button>
              );
            })}
          </div>
          {!examSubmitted && (
            <button 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '1.25rem', background: 'linear-gradient(135deg, #10b981, #059669)', justifyContent: 'center', fontWeight: '700' }}
              onClick={handleSubmitQuiz}
            >
              ✅ Submit Quiz & Update Readiness Index
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// QUESTION EXPLORER VIEW
function BatchAuditView({ questions, loadQuestions, totalQuestionsCount, totalPagesCount, searchQuery, setSearchQuery, moduleFilter, setModuleFilter, batchFilter, setBatchFilter, statusFilter, setStatusFilter, downloadReviewedCSV }) {
  const [currentPage, setCurrentPage] = useState(1);

  const fetchFilteredPage = (page = 1) => {
    setCurrentPage(page);
    loadQuestions({ search: searchQuery, module: moduleFilter, batch: batchFilter, page, limit: 20 });
  };

  useEffect(() => {
    fetchFilteredPage(1);
  }, [moduleFilter, batchFilter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Question Bank Explorer (3,105 Items)</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Independently solved, fact-checked, and enhanced questions with academic textbook references and review-tracking metadata across 63 batches.
          </p>
        </div>
        <button className="btn-success" onClick={downloadReviewedCSV}>
          📥 Export Live CSV
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Search text, topic, subtopic, ID..." 
          style={{ flex: 2, minWidth: '220px' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchFilteredPage(1)}
        />

        <select className="form-control" style={{ flex: 1.5, minWidth: '200px' }} value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
          {MODULE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select className="form-control" style={{ flex: 1, minWidth: '150px' }} value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
          <option value="">All Batches (1-63)</option>
          {Array.from({ length: 63 }, (_, i) => i + 1).map(b => (
            <option key={b} value={b}>Batch {b}</option>
          ))}
        </select>

        <button className="btn-primary" onClick={() => fetchFilteredPage(1)}>
          Filter Bank
        </button>
      </div>

      {/* QUESTIONS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {questions.map(q => (
          <div key={q.ID} className="glass-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span className="badge badge-student" style={{ marginRight: '0.5rem' }}>ID: #{q.ID}</span>
                <span className="badge badge-admin" style={{ marginRight: '0.5rem' }}>{q.Module}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Batch: {q.BatchNumber || 'N/A'} | Subtopic: {q.Subtopic || 'General'}</span>
              </div>
              <span className="badge badge-status">Status: {q.AIReviewStatus || 'Verified'}</span>
            </div>

            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', fontWeight: '600' }}>{q.QuestionText}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.65rem', background: q.CorrectAnswer === 'A' ? 'var(--success-bg)' : 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: q.CorrectAnswer === 'A' ? '1px solid var(--success)' : '1px solid var(--border-color)' }}>
                <strong>A:</strong> {q.OptionA}
              </div>
              <div style={{ padding: '0.65rem', background: q.CorrectAnswer === 'B' ? 'var(--success-bg)' : 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: q.CorrectAnswer === 'B' ? '1px solid var(--success)' : '1px solid var(--border-color)' }}>
                <strong>B:</strong> {q.OptionB}
              </div>
              <div style={{ padding: '0.65rem', background: q.CorrectAnswer === 'C' ? 'var(--success-bg)' : 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: q.CorrectAnswer === 'C' ? '1px solid var(--success)' : '1px solid var(--border-color)' }}>
                <strong>C:</strong> {q.OptionC}
              </div>
              <div style={{ padding: '0.65rem', background: q.CorrectAnswer === 'D' ? 'var(--success-bg)' : 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: q.CorrectAnswer === 'D' ? '1px solid var(--success)' : '1px solid var(--border-color)' }}>
                <strong>D:</strong> {q.OptionD}
              </div>
            </div>

            <div className="explanation-box" style={{ marginTop: '0.5rem' }}>
              <h4 style={{ fontSize: '0.95rem' }}>📝 Solution & Concept Explanation:</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>{q.Explanation}</p>
              {q.References && (
                <div style={{ fontSize: '0.85rem', color: 'var(--primary-light)' }}>
                  <strong>Reference:</strong> {q.References}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION BAR */}
      <div className="pagination-bar">
        <div className="pagination-info">
          Showing Page <strong>{currentPage}</strong> of <strong>{totalPagesCount}</strong> ({totalQuestionsCount} verified questions)
        </div>
        <div className="pagination-controls">
          <button className="btn-secondary" disabled={currentPage <= 1} onClick={() => fetchFilteredPage(currentPage - 1)}>
            ← Previous
          </button>
          <button className="btn-secondary" disabled={currentPage >= totalPagesCount} onClick={() => fetchFilteredPage(currentPage + 1)}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

// ADMIN DASHBOARD, USER MASTER BOARD, QUIZ & RESULTS MANAGEMENT VIEW
function AdminView({ stats, usersList, loadUsers, questions, loadQuestions, quizzesList, loadQuizzes, attemptsList, loadAttempts, totalQuestionsCount, totalPagesCount, openUserModal, openQuestionModal, openQuizEditorModal, openQuizResultsModal, openUserDetailModal, downloadReviewedCSV }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'quizzes', 'results', 'questions'
  const [currentPage, setCurrentPage] = useState(1);
  const [adminSearch, setAdminSearch] = useState('');

  // Filters for User Data Board
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  const fetchAdminQuestions = (page = 1) => {
    setCurrentPage(page);
    loadQuestions({ search: adminSearch, page, limit: 20 });
  };

  const toggleUserStatus = (u) => {
    const newStatus = u.status === 'active' ? 'deactivated' : 'active';
    fetch(`${API_BASE}/api/users/${u.id}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ status: newStatus })
    }).then(() => loadUsers());
  };

  const deleteUser = (u) => {
    if (u.role === 'admin') {
      alert('System Protection: Administrator accounts cannot be deleted directly to maintain platform stability.');
      return;
    }
    if (confirm(`Are you sure you want to permanently delete user account: ${u.fullName || u.email}? This will erase their user record and quiz history.`)) {
      fetch(`${API_BASE}/api/users/${u.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) alert(data.error);
        loadUsers();
      })
      .catch(err => alert(err.message));
    }
  };

  const deleteQuestion = (id) => {
    if (confirm('Are you sure you want to delete question #' + id + '?')) {
      fetch(`${API_BASE}/api/questions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      }).then(() => fetchAdminQuestions(currentPage));
    }
  };

  const toggleQuizStatus = (qz) => {
    const newStatus = qz.status === 'published' ? 'draft' : 'published';
    fetch(`${API_BASE}/api/quizzes/${qz.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    }).then(() => loadQuizzes());
  };

  const deleteQuiz = (id) => {
    if (confirm('Are you sure you want to permanently delete this board quiz?')) {
      fetch(`${API_BASE}/api/quizzes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.error) alert('Error: ' + data.error);
        loadQuizzes();
      })
      .catch(err => {
        console.error('Delete quiz error:', err);
        loadQuizzes();
      });
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Administrator Master Control Board</h2>
          <p style={{ color: 'var(--text-muted)' }}>Complete user directory, student academic records, quiz management, and question bank administration.</p>
        </div>
        <button className="btn-success" onClick={downloadReviewedCSV}>
          📥 Export Live CSV
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button className={`btn-secondary ${activeTab === 'users' ? 'btn-primary' : ''}`} onClick={() => { setActiveTab('users'); loadUsers(); }}>
          👥 Master User Data Board ({usersList.length})
        </button>
        <button className={`btn-secondary ${activeTab === 'quizzes' ? 'btn-primary' : ''}`} onClick={() => { setActiveTab('quizzes'); loadQuizzes(); }}>
          ⏱️ Quiz Management ({quizzesList.length})
        </button>
        <button className={`btn-secondary ${activeTab === 'results' ? 'btn-primary' : ''}`} onClick={() => { setActiveTab('results'); loadAttempts(); }}>
          📊 Student Quiz Scores ({attemptsList.length})
        </button>
        <button className={`btn-secondary ${activeTab === 'questions' ? 'btn-primary' : ''}`} onClick={() => { setActiveTab('questions'); fetchAdminQuestions(1); }}>
          📝 Question Bank ({stats ? stats.totalQuestions : totalQuestionsCount})
        </button>
      </div>

      {activeTab === 'users' && (
        <div>
          {/* USER BOARD STATS CARDS */}
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="glass-card stat-card">
              <div>
                <div className="stat-value gradient-text">{totalUsersCount}</div>
                <div className="stat-label">Total Registered Accounts</div>
              </div>
              <div className="stat-icon">👥</div>
            </div>

            <div className="glass-card stat-card">
              <div>
                <div className="stat-value" style={{ color: 'var(--success)' }}>{activeStudentsCount}</div>
                <div className="stat-label">Active Student Reviewees</div>
              </div>
              <div className="stat-icon">🎓</div>
            </div>

            <div className="glass-card stat-card">
              <div>
                <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{activeAdminsCount}</div>
                <div className="stat-label">Faculty Administrators</div>
              </div>
              <div className="stat-icon">🔑</div>
            </div>

            <div className="glass-card stat-card">
              <div>
                <div className="stat-value" style={{ color: 'var(--primary-light)' }}>{uniqueSchoolsCount}</div>
                <div className="stat-label">Universities Represented</div>
              </div>
              <div className="stat-icon">🏛️</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3>Master User Directory & Academic Records</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Inspect complete user profile data, university credentials, PRC exam target dates, and detailed quiz performance records.
                </p>
              </div>
              <button className="btn-primary" onClick={() => openUserModal(null)}>+ Register New Account</button>
            </div>

            {/* SEARCH & FILTER BAR */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search name, email, school, user ID..." 
                style={{ flex: 2, minWidth: '220px' }}
                value={userSearchTerm}
                onChange={e => setUserSearchTerm(e.target.value)}
              />

              <select className="form-control" style={{ flex: 1, minWidth: '160px' }} value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)}>
                <option value="">All Account Roles</option>
                <option value="student">Student Reviewees</option>
                <option value="admin">Administrators</option>
              </select>

              <select className="form-control" style={{ flex: 1, minWidth: '160px' }} value={userStatusFilter} onChange={e => setUserStatusFilter(e.target.value)}>
                <option value="">All Account Statuses</option>
                <option value="active">Active Accounts</option>
                <option value="deactivated">Deactivated Accounts</option>
              </select>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>User Profile Info</th>
                  <th>Role & Status</th>
                  <th>University / School</th>
                  <th>Target Exam Date</th>
                  <th>Exam History Stats</th>
                  <th>Actions & Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const uStats = u.stats || { totalAttempts: 0, passedCount: 0, failedCount: 0, avgScore: 0 };
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{u.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        <span className="badge badge-student" style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>{u.id}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
                          <span className={`badge ${u.role === 'admin' ? 'badge-admin' : 'badge-student'}`}>{u.role}</span>
                          <span className={`badge ${u.status === 'active' ? 'badge-status' : 'badge-admin'}`}>{u.status}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: '500', color: 'var(--primary-light)' }}>{u.school || 'Mapúa University'}</td>
                      <td style={{ fontSize: '0.85rem' }}>{u.targetExamDate || '2026-10-15'}</td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                          Attempts: {uStats.totalAttempts} | Avg: {uStats.avgScore}%
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          Passed: <strong style={{ color: 'var(--success)' }}>{uStats.passedCount}</strong> | Failed: <strong style={{ color: 'var(--danger)' }}>{uStats.failedCount}</strong>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button 
                            className="btn-primary" 
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} 
                            onClick={() => openUserDetailModal(u)}
                          >
                            👁️ View All Data
                          </button>
                          <button className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }} onClick={() => openUserModal(u)}>
                            Edit
                          </button>
                          <button className="btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }} onClick={() => toggleUserStatus(u)}>
                            {u.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          {u.role !== 'admin' && (
                            <button className="btn-danger" style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }} onClick={() => deleteUser(u)}>
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'quizzes' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3>Faculty-Posted Board Quizzes</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Only administrators have permission to create, edit, post, publish, and view student attempt logs.
              </p>
            </div>
            <button className="btn-primary" onClick={() => openQuizEditorModal(null)}>+ Create & Post New Quiz</button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Quiz Title</th>
                <th>Module</th>
                <th>Questions</th>
                <th>Time Limit</th>
                <th>Passing Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizzesList.map(qz => (
                <tr key={qz.id}>
                  <td style={{ fontWeight: '600', maxWidth: '280px' }}>{qz.title}</td>
                  <td>
                    <span className="badge badge-admin">{qz.module ? qz.module.substring(0, 12) + '...' : 'Mixed'}</span>
                  </td>
                  <td>{qz.questionCount} Qs</td>
                  <td>{qz.durationMins} Mins</td>
                  <td>{qz.passingScorePct || 70}%</td>
                  <td>
                    <span className={`badge ${qz.status === 'published' ? 'badge-status' : 'badge-student'}`}>{qz.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderColor: 'var(--accent-light)', color: 'var(--accent-light)' }} onClick={() => openQuizResultsModal(qz.id)}>
                        📊 Results
                      </button>
                      <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => openQuizEditorModal(qz)}>
                        Edit
                      </button>
                      <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => toggleQuizStatus(qz)}>
                        {qz.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button className="btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => deleteQuiz(qz.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3>Student Quiz Attempt Records & Score Logs</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Complete breakdown of student scores, pass/fail status, schools, and attempt completion times.
              </p>
            </div>
            <button className="btn-secondary" onClick={loadAttempts}>🔄 Refresh Logs</button>
          </div>

          {attemptsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No student quiz attempt records found.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>School / University</th>
                  <th>Quiz Title</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {attemptsList.map(att => (
                  <tr key={att.id}>
                    <td style={{ fontWeight: '600' }}>
                      {att.studentName}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{att.studentEmail}</div>
                    </td>
                    <td>{att.school || 'Mapúa University'}</td>
                    <td style={{ maxWidth: '240px', fontSize: '0.85rem' }}>{att.quizTitle}</td>
                    <td style={{ fontWeight: '700' }}>{att.score} / {att.totalQuestions}</td>
                    <td style={{ fontWeight: '700', color: att.passed ? 'var(--success)' : 'var(--danger)' }}>
                      {att.percentage}%
                    </td>
                    <td>
                      <span className={`badge ${att.passed ? 'badge-status' : 'badge-admin'}`}>
                        {att.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{att.submittedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3>Question Bank Database</h3>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Search questions..." 
                style={{ width: '240px' }} 
                value={adminSearch} 
                onChange={e => setAdminSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchAdminQuestions(1)}
              />
              <button className="btn-primary" onClick={() => fetchAdminQuestions(1)}>Search</button>
              <button className="btn-success" onClick={() => openQuestionModal(null)}>+ Add Question</button>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Module</th>
                <th>Question Text</th>
                <th>Correct Ans</th>
                <th>AI Review Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map(q => (
                <tr key={q.ID}>
                  <td>#{q.ID}</td>
                  <td>{q.Module}</td>
                  <td style={{ maxWidth: '380px' }}>{q.QuestionText ? q.QuestionText.substring(0, 80) : ''}...</td>
                  <td style={{ fontWeight: '700', color: 'var(--success)' }}>{q.CorrectAnswer}</td>
                  <td>
                    <span className="badge badge-status">{q.AIReviewStatus || 'Verified'}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => openQuestionModal(q)}>
                        Edit
                      </button>
                      <button className="btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => deleteQuestion(q.ID)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINATION BAR */}
          <div className="pagination-bar">
            <div className="pagination-info">
              Showing Page <strong>{currentPage}</strong> of <strong>{totalPagesCount}</strong> ({totalQuestionsCount} questions)
            </div>
            <div className="pagination-controls">
              <button className="btn-secondary" disabled={currentPage <= 1} onClick={() => fetchAdminQuestions(currentPage - 1)}>
                ← Previous
              </button>
              <button className="btn-secondary" disabled={currentPage >= totalPagesCount} onClick={() => fetchAdminQuestions(currentPage + 1)}>
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ADMIN QUIZ CREATE / EDIT MODAL
function QuizEditorModal({ editingQuiz, onClose, onSaved }) {
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
      const queryObj = { limit: 100 };
      if (selectedModules.length > 0) queryObj.module = selectedModules.join(',');
      if (pickerSearch) queryObj.search = pickerSearch;

      fetch(`${API_BASE}/api/questions?${new URLSearchParams(queryObj).toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setPickerQuestions(data.questions || []);
        setPickerLoading(false);
      })
      .catch(err => {
        console.error(err);
        setPickerLoading(false);
      });
    }
  }, [selectionMode, selectedModules, pickerSearch]);

  const toggleModule = (modValue) => {
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

  const toggleSpecificQuestion = (qId) => {
    const strId = String(qId);
    if (specificQuestionIds.includes(strId)) {
      setSpecificQuestionIds(specificQuestionIds.filter(id => id !== strId));
    } else {
      setSpecificQuestionIds([...specificQuestionIds, strId]);
    }
  };

  const handleSubmit = (e) => {
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
    const combinedModuleStr = selectedModules.length === 0 
      ? '' 
      : (selectedModules.length === REAL_MODULES.length ? '' : selectedModules.join(', '));

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
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        setError(data.error);
      } else {
        onSaved();
        onClose();
      }
    })
    .catch(err => setError(err.message));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px', width: '92%' }}>
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>
          {isEdit ? 'Edit Board Evaluation Quiz' : 'Create & Post New Board Quiz'}
        </h2>
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Quiz Title</label>
            <input type="text" className="form-control" placeholder="e.g. Combined Power Plant & Heat Transfer Evaluation Quiz" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Description / Instructions for Students</label>
            <textarea rows="2" className="form-control" placeholder="Instructions for students taking this board examination quiz..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          {/* QUESTION SELECTION MODE TABS */}
          <div className="form-group">
            <label style={{ fontWeight: '700', marginBottom: '0.4rem', display: 'block' }}>
              Question Selection Strategy
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div 
                className="glass-card" 
                onClick={() => setSelectionMode('random')}
                style={{
                  padding: '0.85rem',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-md)',
                  border: selectionMode === 'random' ? '2px solid var(--primary-light)' : '1px solid var(--border-color)',
                  background: selectionMode === 'random' ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-input)'
                }}
              >
                <div style={{ fontWeight: '700', color: selectionMode === 'random' ? '#ffffff' : 'var(--text-muted)' }}>
                  🎲 Dynamic Random Sampling
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  System draws random questions from target curriculum module(s) for each test taker.
                </div>
              </div>

              <div 
                className="glass-card" 
                onClick={() => setSelectionMode('manual')}
                style={{
                  padding: '0.85rem',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-md)',
                  border: selectionMode === 'manual' ? '2px solid #fbbf24' : '1px solid var(--border-color)',
                  background: selectionMode === 'manual' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-input)'
                }}
              >
                <div style={{ fontWeight: '700', color: selectionMode === 'manual' ? '#fbbf24' : 'var(--text-muted)' }}>
                  📌 Manual Question Picker
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  Hand-pick specific questions from the 3,105 item bank to form a fixed exam paper.
                </div>
              </div>
            </div>
          </div>

          {/* MULTI-SELECT TARGET CURRICULUM MODULE COMBINATION BOX */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ margin: 0, fontWeight: '700' }}>
                Target Curriculum Modules (Check to Combine)
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem' }} onClick={selectAllModules}>
                  ✓ Select All
                </button>
                <button type="button" className="btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.78rem' }} onClick={clearAllModules}>
                  ✕ Clear All
                </button>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
              {selectedModules.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#fbbf24', marginBottom: '0.6rem', padding: '0.35rem 0.6rem', background: 'rgba(245, 158, 11, 0.12)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  ⚡ <strong>All Modules Selected (Comprehensive):</strong> Sampling from all 3,105 items across the full curriculum repository.
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--primary-light)', marginBottom: '0.6rem', padding: '0.35rem 0.6rem', background: 'rgba(56, 189, 248, 0.12)', borderRadius: '6px', border: '1px solid var(--border-glow)' }}>
                  🎯 <strong>Combining {selectedModules.length} Module(s):</strong> Questions will be filtered by checked curriculum modules.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {REAL_MODULES.map(mod => {
                  const isChecked = selectedModules.includes(mod.value);
                  return (
                    <label key={mod.value} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', background: isChecked ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.02)', border: isChecked ? '1px solid var(--primary-light)' : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.15s ease' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => toggleModule(mod.value)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary-light)', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.85rem', color: isChecked ? '#ffffff' : 'var(--text-muted)', fontWeight: isChecked ? '600' : 'normal' }}>
                        {mod.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* MANUAL QUESTION PICKER BROWSER */}
          {selectionMode === 'manual' && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ margin: 0, fontWeight: '700', color: '#fbbf24' }}>
                  📌 Pick Specific Questions ({specificQuestionIds.length} Selected)
                </label>
                <input 
                  type="text" 
                  placeholder="🔍 Search questions by keyword..." 
                  className="form-control" 
                  style={{ width: '240px', padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                />
              </div>

              <div className="glass-card" style={{ padding: '0.85rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', maxHeight: '240px', overflowY: 'auto', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                {pickerLoading ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading questions from bank...</div>
                ) : pickerQuestions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No questions match your filter.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {pickerQuestions.map(qItem => {
                      const isPicked = specificQuestionIds.includes(String(qItem.ID));
                      return (
                        <label key={qItem.ID} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: '6px', cursor: 'pointer', background: isPicked ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255,255,255,0.02)', border: isPicked ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.15s ease' }}>
                          <input 
                            type="checkbox" 
                            checked={isPicked} 
                            onChange={() => toggleSpecificQuestion(qItem.ID)}
                            style={{ width: '17px', height: '17px', accentColor: '#fbbf24', marginTop: '2px', cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1, fontSize: '0.85rem' }}>
                            <div style={{ color: isPicked ? '#ffffff' : 'var(--text-main)', fontWeight: '600', marginBottom: '0.2rem' }}>
                              Item #{qItem.ID}: {qItem.QuestionText}
                            </div>
                            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'flex', gap: '0.75rem' }}>
                              <span>Module: {qItem.Module || 'General'}</span>
                              <span>Topic: {qItem.Topic || 'N/A'}</span>
                              <span>Correct: {qItem.CorrectAnswer}</span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid-2col">
            <div className="form-group">
              <label>Question Count</label>
              {selectionMode === 'manual' ? (
                <input type="text" className="form-control" value={`${specificQuestionIds.length} Picked Questions`} disabled />
              ) : (
                <select className="form-control" value={questionCount} onChange={e => setQuestionCount(parseInt(e.target.value))}>
                  <option value="20">20 Questions</option>
                  <option value="30">30 Questions</option>
                  <option value="50">50 Questions (Standard Block)</option>
                  <option value="100">100 Questions (Comprehensive)</option>
                </select>
              )}
            </div>

            <div className="form-group">
              <label>Time Limit (Minutes)</label>
              <select className="form-control" value={durationMins} onChange={e => setDurationMins(parseInt(e.target.value))}>
                <option value="20">20 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="50">50 Minutes</option>
                <option value="90">90 Minutes</option>
                <option value="120">120 Minutes (2 Hours)</option>
              </select>
            </div>
          </div>

          <div className="grid-2col">
            <div className="form-group">
              <label>Passing Score Percentage (%)</label>
              <select className="form-control" value={passingScorePct} onChange={e => setPassingScorePct(parseInt(e.target.value))}>
                <option value="60">60% Passing</option>
                <option value="70">70% Passing (Standard PRC Board)</option>
                <option value="75">75% Passing (Honors Benchmark)</option>
                <option value="80">80% Passing (Mastery Benchmark)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Publish Status</label>
              <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="published">Published (Visible to Students)</option>
                <option value="draft">Draft (Admin Only)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              {isEdit ? 'Save Quiz Changes' : 'Post Quiz to Students'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// USER PROFILE SETTINGS MODAL
function ProfileModal({ user, setUser, onClose }) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [school, setSchool] = useState(user.school || '');
  const [targetExamDate, setTargetExamDate] = useState(user.targetExamDate || '2026-10-15');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fullName, school, targetExamDate, newPassword: newPassword || undefined })
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        setError(data.error);
      } else {
        setMessage('Profile updated successfully!');
        setUser(data.user);
        setTimeout(() => onClose(), 1200);
      }
    })
    .catch(err => setError(err.message));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Account Profile Settings</h2>
        {message && <div style={{ color: 'var(--success)', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" className="form-control" value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>University / School</label>
            <input type="text" className="form-control" value={school} onChange={e => setSchool(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Target Licensure Board Exam Date</label>
            <input type="date" className="form-control" value={targetExamDate} onChange={e => setTargetExamDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>New Password (leave blank to keep current)</label>
            <input type="password" className="form-control" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ADMIN USER CREATE / EDIT MODAL
function UserModal({ editingUser, onClose, onSaved }) {
  const isEdit = !!editingUser;
  const [fullName, setFullName] = useState(editingUser?.fullName || '');
  const [email, setEmail] = useState(editingUser?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(editingUser?.role || 'student');
  const [status, setStatus] = useState(editingUser?.status || 'active');
  const [school, setSchool] = useState(editingUser?.school || '');
  const [targetExamDate, setTargetExamDate] = useState(editingUser?.targetExamDate || '2026-10-15');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const url = isEdit ? `${API_BASE}/api/users/${editingUser.id}` : `${API_BASE}/api/users`;
    const method = isEdit ? 'PUT' : 'POST';

    const body = { fullName, role, status, school, targetExamDate };
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
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        setError(data.error);
      } else {
        onSaved();
        onClose();
      }
    })
    .catch(err => setError(err.message));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>{isEdit ? 'Edit User Account' : 'Create New Account'}</h2>
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" className="form-control" value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          {!isEdit && (
            <>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </>
          )}
          <div className="grid-2col">
            <div className="form-group">
              <label>Role <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Max 4 Admins Allowed)</span></label>
              <select className="form-control" value={role} onChange={e => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="admin">Administrator (Max 4 Limit)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>School / University</label>
            <input type="text" className="form-control" value={school} onChange={e => setSchool(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Target Exam Date</label>
            <input type="date" className="form-control" value={targetExamDate} onChange={e => setTargetExamDate(e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>{isEdit ? 'Update Account' : 'Create Account'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ADMIN QUESTION CREATE / EDIT MODAL
function QuestionModal({ editingQuestion, onClose, onSaved }) {
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
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
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        setError(data.error);
      } else {
        onSaved();
        onClose();
      }
    })
    .catch(err => setError(err.message));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-lg glass-card" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>{isEdit ? `Edit Question #${editingQuestion.ID}` : 'Add New Question'}</h2>
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Question Text</label>
            <textarea name="QuestionText" rows="3" className="form-control" value={formData.QuestionText} onChange={handleChange} required />
          </div>

          <div className="grid-2col">
            <div className="form-group">
              <label>Option A</label>
              <input type="text" name="OptionA" className="form-control" value={formData.OptionA} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Option B</label>
              <input type="text" name="OptionB" className="form-control" value={formData.OptionB} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Option C</label>
              <input type="text" name="OptionC" className="form-control" value={formData.OptionC} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Option D</label>
              <input type="text" name="OptionD" className="form-control" value={formData.OptionD} onChange={handleChange} />
            </div>
          </div>

          <div className="grid-2col">
            <div className="form-group">
              <label>Correct Answer</label>
              <select name="CorrectAnswer" className="form-control" value={formData.CorrectAnswer} onChange={handleChange}>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
            <div className="form-group">
              <label>Difficulty</label>
              <select name="Difficulty" className="form-control" value={formData.Difficulty} onChange={handleChange}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid-2col">
            <div className="form-group">
              <label>Board Exam Module</label>
              <select name="Module" className="form-control" value={formData.Module} onChange={handleChange}>
                {MODULE_OPTIONS.filter(o => o.value !== '').map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Subtopic</label>
              <input type="text" name="Subtopic" className="form-control" value={formData.Subtopic} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>First-Principles Solution / Explanation</label>
            <textarea name="Explanation" rows="3" className="form-control" value={formData.Explanation} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Literature Reference(s)</label>
            <input type="text" name="References" className="form-control" placeholder="Marks' Handbook, Cengel Thermodynamics, etc." value={formData.References} onChange={handleChange} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>{isEdit ? 'Save Question Changes' : 'Create Question'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
