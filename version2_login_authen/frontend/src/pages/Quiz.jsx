import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import QuizCard from "../components/QuizCard";
import ResultView from "../components/ResultView";
import QuestionSidebar from "../components/QuestionSidebar";
import ThemeToggle from "../components/ThemeToggle";
import { useNavigate } from "react-router-dom";

function Quiz({ theme, toggleTheme }) {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [cumulativeScore, setCumulativeScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getQuestions();
      setQuestions(data);
      setCurrentQuestionIndex(0);
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
    setResults(null);
    setUserAnswers({});
    setError(null);
    loadQuestions();
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
                <h1 className="app-title" style={{fontSize: '1.8rem'}}>Quiz App v2</h1>
                <p className="app-subtitle">Chào mừng, {localStorage.getItem("username")}</p>
            </div>
        </div>
        <div className="flex gap-10 align-center">
            {cumulativeScore > 0 && (
                <div className="header-score">
                    Điểm: <strong>{cumulativeScore}</strong>
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
            <p>Đang tải...</p>
          </div>
        )}

        {!loading && results && (
          <div className="result-container">
            <ResultView results={results} cumulativeScore={cumulativeScore} />
            <div className="action-bar" style={{textAlign: 'center', marginTop: '20px'}}>
              <button onClick={handlePlayAgain} className="btn btn-primary">
                Chơi lại
              </button>
            </div>
          </div>
        )}

        {!loading && !results && questions.length > 0 && (
          <div className="quiz-layout">
            <QuestionSidebar
              questions={questions}
              currentQuestionIndex={currentQuestionIndex}
              userAnswers={userAnswers}
              onSelectQuestion={setCurrentQuestionIndex}
            />

            <div className="quiz-content-area">
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
