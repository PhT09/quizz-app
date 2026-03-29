/**
 * App.jsx - Tầng Quản lý State (State Management)
 * ==================================================
 * Version 1 + Theme Support
 */

import React, { useState, useEffect } from "react";
import { fetchQuestions, submitAnswers } from "./services/api";
import QuizCard from "./components/QuizCard";
import ResultView from "./components/ResultView";
import QuestionSidebar from "./components/QuestionSidebar";
import "./App.css";

function App() {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [cumulativeScore, setCumulativeScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // [Theme Support]
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    localStorage.setItem("theme", theme);
    if (theme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchQuestions();
      setQuestions(data);
      setCurrentQuestionIndex(0);
    } catch (err) {
      setError("Không thể tải câu hỏi. Hãy kiểm tra backend đang chạy!");
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
      const data = await submitAnswers(answersArray);
      setResults(data);
      setCumulativeScore((prev) => prev + data.score);
    } catch (err) {
      setError("Không thể nộp bài. Vui lòng thử lại!");
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

  const answeredCount = Object.keys(userAnswers).length;
  const totalCount = questions.length;

  return (
    <div className="app">
      <header className="app-header" style={{position: 'relative'}}>
        <button 
           onClick={toggleTheme} 
           className="btn btn-outline btn-sm"
           style={{position: 'absolute', top: '10px', right: '10px', fontSize: '1.2rem'}}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <h1 className="app-title">Quiz App v1</h1>
        <p className="app-subtitle">Kiểm tra kiến thức của bạn!</p>
        {cumulativeScore > 0 && (
          <div className="header-score">
            Tổng điểm: <strong>{cumulativeScore}</strong>
          </div>
        )}
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
                  ◀ Câu trước
                </button>

                <div className="right-actions">
                  {currentQuestionIndex < questions.length - 1 ? (
                    <button onClick={handleNext} className="btn btn-primary">
                      Câu tiếp theo ▶
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

export default App;
