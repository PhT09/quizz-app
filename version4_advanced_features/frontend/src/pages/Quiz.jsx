import React, { useState, useEffect, useCallback, useRef } from "react";
import { apiService } from "../services/api";
import QuizCard from "../components/QuizCard";
import ResultView from "../components/ResultView";
import QuestionSidebar from "../components/QuestionSidebar";
import ThemeToggle from "../components/ThemeToggle";
import { useNavigate } from "react-router-dom";

function Quiz({ theme, toggleTheme }) {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [cumulativeScore, setCumulativeScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const [isStarted, setIsStarted] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    limit: 5 // Default limit
  });

  // [Feature: Countdown Timer]
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
    return () => clearInterval(timerRef.current);
  }, []);

  async function fetchInitialData() {
    try {
      const cats = await apiService.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  }
  
  const handleSubmit = useCallback(async (auto = false) => {
    // [RBAC Context]: Hàm nộp bài gửi JWT token qua apiService để backend thẩm định user.
    // Nếu auto=true (hết giờ), ta nộp ngay cả khi user chưa chọn đủ.
    if (!auto && Object.keys(userAnswers).length === 0) {
      setError("Vui lòng chọn ít nhất một đáp án trước khi nộp bài!");
      return;
    }
    
    setLoading(true);
    setError(null);
    clearInterval(timerRef.current);

    try {
      const answersArray = Object.entries(userAnswers).map(
        ([questionId, selectedAnswer]) => ({
          question_id: parseInt(questionId),
          selected_answer: selectedAnswer,
        })
      );
      const data = await apiService.submitQuiz(answersArray);
      setResults(data);
      setCumulativeScore((prev) => prev + data.score);
      setIsStarted(false);
    } catch (err) {
      setError("Không thể nộp bài. " + err.message);
    } finally {
      setLoading(false);
    }
  }, [userAnswers, apiService]);

  // [Feature: Auto-Submit Effect]
  useEffect(() => {
    if (isStarted && timeLeft === 0 && questions.length > 0) {
      handleSubmit(true);
    }
  }, [timeLeft, isStarted, questions.length, handleSubmit]);

  async function handleStartQuiz() {
    // [RBAC Context]: Gửi yêu cầu lấy câu hỏi kèm limit và filter. 
    // Backend sẽ check role 'player' trước khi xử lý random/limit.
    // [No-Auth Modification]: Backend sẽ bỏ qua bước check role và xử lý trả về data public.
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getQuestions(filters.category, filters.difficulty, filters.limit);
      if (data.length === 0) {
        setError("Không tìm thấy câu hỏi nào phù hợp.");
      } else {
        setQuestions(data);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setResults(null);
        setIsStarted(true);
        
        // [Feature: Global Timer Calculation]
        // Quy tắc: 1 phút (60s) cho mỗi câu hỏi.
        const totalSeconds = data.length * 60;
        setTimeLeft(totalSeconds);
        
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);
      }
    } catch (err) {
      setError("Lỗi: " + err.message);
      if (err.message === "Unauthorized") navigate("/login");
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  function handleSelectAnswer(questionId, answer) {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  }

  function handleNext() {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }

  function handlePrev() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }

  function handlePlayAgain() {
    setIsStarted(false);
    setResults(null);
    setUserAnswers({});
    setError(null);
    fetchInitialData();
  }

  const handleLogout = () => {
    apiService.logout();
    navigate("/login");
  };

  const answeredCount = Object.keys(userAnswers).length;
  const totalCount = questions.length;

  return (
    <div className="app">
      <header className="app-header flex justify-between align-center sticky-header">
        <div className="flex gap-10 align-center">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            <div className="text-left">
                <h1 className="app-title" style={{fontSize: '1.8rem'}}>Quiz App v4</h1>
                <p className="app-subtitle">Chào mừng, {localStorage.getItem("username")}</p>
            </div>
        </div>
        
        {isStarted && (
            <div className={`timer-display ${timeLeft < 30 ? 'timer-urgent' : ''}`}>
               ⏳ {formatTime(timeLeft)}
            </div>
        )}

        <div className="flex gap-10 align-center">
            {cumulativeScore > 0 && (
                <div className="header-score">
                    🏆 <strong>{cumulativeScore}</strong>
                </div>
            )}
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">Đăng xuất</button>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="error-close">✕</button>
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Đang xử lý...</p>
          </div>
        )}

        {/* SETUP SCREEN */}
        {!loading && !isStarted && !results && (
          <div className="quiz-setup-container card">
            <h2 className="text-center" style={{marginBottom: '20px'}}>Cấu hình bài thi</h2>
            <div className="form-group">
              <label>Chủ đề (Category):</label>
              <select 
                className="input-field" 
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
              >
                <option value="">-- Tất cả chủ đề --</option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-2-cols gap-10">
                <div className="form-group">
                <label>Độ khó:</label>
                <select 
                    className="input-field"
                    value={filters.difficulty}
                    onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
                >
                    <option value="">-- Tất cả --</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                </select>
                </div>
                <div className="form-group">
                <label>Số câu (Limit):</label>
                <input 
                    type="number" 
                    className="input-field"
                    min="1" max="50"
                    value={filters.limit}
                    onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value)})}
                />
                </div>
            </div>
            <button 
              onClick={handleStartQuiz} 
              className="btn btn-primary btn-block"
              style={{marginTop: '20px'}}
            >
              Bắt đầu làm bài
            </button>
          </div>
        )}

        {/* RESULT VIEW */}
        {!loading && results && (
          <div className="result-container">
            <ResultView results={results} cumulativeScore={cumulativeScore} />
            <div className="action-bar text-center" style={{marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center'}}>
              <button onClick={handlePlayAgain} className="btn btn-primary">
                Làm bài khác
              </button>
            </div>
          </div>
        )}

        {/* QUIZ INTERFACE */}
        {!loading && isStarted && questions.length > 0 && (
          <div className="quiz-layout">
            <QuestionSidebar
              questions={questions}
              currentQuestionIndex={currentQuestionIndex}
              userAnswers={userAnswers}
              onSelectQuestion={setCurrentQuestionIndex}
            />

            <div className="quiz-content-area shadow-card">
              <div className="progress-bar-container">
                <div className="progress-info">
                  <span>Tiến độ: {answeredCount}/{totalCount}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${totalCount > 0 ? (answeredCount / totalCount) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="active-question-wrapper">
                {questions[currentQuestionIndex] && (
                  <QuizCard
                    question={questions[currentQuestionIndex]}
                    questionIndex={currentQuestionIndex}
                    selectedAnswer={userAnswers[questions[currentQuestionIndex].id]}
                    onSelectAnswer={handleSelectAnswer}
                  />
                )}
              </div>

              <div className="navigation-bar">
                <button
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  className="btn btn-outline"
                >
                  ◀ Trước
                </button>

                <div className="right-actions">
                  {currentQuestionIndex < questions.length - 1 ? (
                    <button onClick={handleNext} className="btn btn-primary">
                      Tiếp ▶
                    </button>
                  ) : (
                    <span></span>
                  )}

                  <button
                    onClick={() => handleSubmit(false)}
                    className="btn btn-submit"
                    disabled={answeredCount === 0}
                  >
                    Nộp bài
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Quiz;
