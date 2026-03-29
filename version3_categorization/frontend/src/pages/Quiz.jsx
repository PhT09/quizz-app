import React, { useState, useEffect } from "react";
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
    difficulty: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const cats = await apiService.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    }
  }
  
  async function handleStartQuiz() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getQuestions(filters.category, filters.difficulty);
      if (data.length === 0) {
        setError("Không tìm thấy câu hỏi nào phù hợp với tiêu chí của bạn.");
      } else {
        setQuestions(data);
        setCurrentQuestionIndex(0);
        setIsStarted(true);
        setUserAnswers({});
        setResults(null);
      }
    } catch (err) {
      setError("Không thể tải câu hỏi. " + err.message);
      if (err.message === "Unauthorized") navigate("/login");
    } finally {
      setLoading(false);
    }
  }

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

  async function handleSubmit() {
    if (Object.keys(userAnswers).length === 0) {
      setError("Vui lòng chọn ít nhất một đáp án trước khi nộp bài!");
      return;
    }
    setLoading(true);
    setError(null);

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
    } catch (err) {
      setError("Không thể nộp bài. " + err.message);
    } finally {
      setLoading(false);
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
      <header className="app-header flex justify-between align-center">
        <div className="flex gap-10 align-center">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            <div>
                <h1 className="app-title" style={{fontSize: '1.8rem'}}>Quiz App v3</h1>
                <p className="app-subtitle">Chào mừng, {localStorage.getItem("username")}</p>
            </div>
        </div>
        <div className="flex gap-10 align-center">
            {cumulativeScore > 0 && (
                <div className="header-score">
                    Tổng điểm: <strong>{cumulativeScore}</strong>
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
            <p>Đang tải dữ liệu...</p>
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
            <div className="form-group">
              <label>Độ khó (Difficulty):</label>
              <select 
                className="input-field"
                value={filters.difficulty}
                onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
              >
                <option value="">-- Tất cả độ khó --</option>
                <option value="Low">Low (Dễ)</option>
                <option value="Medium">Medium (Trung bình)</option>
                <option value="High">High (Khó)</option>
              </select>
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
            <div className="action-bar text-center" style={{marginTop: '20px'}}>
              <button onClick={handlePlayAgain} className="btn btn-primary">
                Làm bài khác
              </button>
            </div>
          </div>
        )}

        {/* QUIZ INTERFACE */}
        {!loading && isStarted && !results && questions.length > 0 && (
          <div className="quiz-layout">
            <QuestionSidebar
              questions={questions}
              currentQuestionIndex={currentQuestionIndex}
              userAnswers={userAnswers}
              onSelectQuestion={setCurrentQuestionIndex}
            />

            <div className="quiz-content-area">
                <div style={{marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                        <span className="badge badge-category">{questions[currentQuestionIndex].category}</span>
                        <span className={`badge badge-difficulty ${questions[currentQuestionIndex].difficulty.toLowerCase()}`}>
                            {questions[currentQuestionIndex].difficulty}
                        </span>
                    </div>
                </div>

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
                    onClick={handleSubmit}
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
