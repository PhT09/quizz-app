/**
 * App.jsx - Tầng Quản lý State (State Management)
 * ==================================================
 * File chính của ứng dụng React. Quản lý toàn bộ state và luồng ưu tiên.
 * Chứa logic Layout Sidebar + Content.
 */

import React, { useState, useEffect } from "react";
import { fetchQuestions, submitAnswers } from "./services/api";
import QuizCard from "./components/QuizCard";
import ResultView from "./components/ResultView";
import QuestionSidebar from "./components/QuestionSidebar";
import "./App.css";

function App() {
  // ============================================================
  // KHAI BÁO STATE
  // ============================================================

  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [cumulativeScore, setCumulativeScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * STATE ĐIỀU CHỈNH LAYOUT: currentQuestionIndex
   * Quản lý trạng thái "Câu hỏi hiện tại" đang hiển thị trên Content Area.
   * 
   * Giải thích logic navigation (Điều hướng):
   * - Khi người dùng bấm 1 số trong Sidebar (ví dụ: bấm số 3), onSelectQuestion(2) sẽ chạy (do index bắt đầu từ 0).
   * - currentQuestionIndex đổi thành 2.
   * - Render lại: QuizCard sẽ lấy question ở questions[2] để render ra màn hình.
   */
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // ============================================================
  // LOAD CÂU HỎI KHI COMPONENT MOUNT
  // ============================================================

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchQuestions();
      setQuestions(data);
      // Khi load mới hoặc chơi lại, nhớ reset về câu 1 (index 0)
      setCurrentQuestionIndex(0);
    } catch (err) {
      setError("Không thể tải câu hỏi. Hãy kiểm tra backend đang chạy!");
      console.error("Lỗi tải câu hỏi:", err);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // XỬ LÝ CHỌN ĐÁP ÁN (GIỮ NGUYÊN SO VỚI BẢN TRƯỚC)
  // ============================================================

  function handleSelectAnswer(questionId, answer) {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  }

  // ============================================================
  // KIỂM SOÁT NAVIGATION - NEXT / PREVIOUS (Tùy chọn cho bài thi)
  // ============================================================

  /**
   * Hướng dẫn thêm nút "Next/Previous":
   * Đây là logic hàm cho nút "Câu tiếp theo" và "Câu trước đó".
   * Nếu bài thi yêu cầu bấm Nút để chuyển, bạn gọi `handleNext()` hoặc `handlePrev()`.
   */
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

  // ============================================================
  // XỬ LÝ NỘP BÀI
  // ============================================================

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
      console.error("Lỗi nộp bài:", err);
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
      {/* ====== HEADER ====== */}
      <header className="app-header">
        <h1 className="app-title">🧠 Quiz App</h1>
        <p className="app-subtitle">Kiểm tra kiến thức của bạn!</p>
        {cumulativeScore > 0 && (
          <div className="header-score">
            🏅 Tổng điểm tích lũy: <strong>{cumulativeScore}</strong>
          </div>
        )}
      </header>

      {/* ====== NỘI DUNG CHÍNH ====== */}
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
            <div className="action-bar">
              <button onClick={handlePlayAgain} className="btn btn-primary">
                🔄 Chơi lại
              </button>
            </div>
          </div>
        )}

        {/* 
          LAYOUT CHO GIAO DIỆN LÀM BÀI 
          Sử dụng `quiz-layout` (Flexbox 2 cột):
          - Cột trái: QuestionSidebar (~25% width)
          - Cột phải: Content Area hiển thị 1 câu (~75% width)
        */}
        {!loading && !results && questions.length > 0 && (
          <div className="quiz-layout">

            {/* COMPONENT SIDEBAR */}
            <QuestionSidebar
              questions={questions}
              currentQuestionIndex={currentQuestionIndex}
              userAnswers={userAnswers}
              onSelectQuestion={setCurrentQuestionIndex}
            />

            {/* MAIN CONTENT AREA */}
            <div className="quiz-content-area">

              {/* Thanh hiển thị tiến độ (đã sửa đổi giao diện một chút) */}
              <div className="progress-bar-container">
                <div className="progress-info">
                  <span>Đã trả lời: {answeredCount}/{totalCount}</span>
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

              {/* LẤY CÂU HỎI HIỆN TẠI VÀ CHỈ HIỂN THỊ MỘT (1) QUIZCARD */}
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

              {/* NÚT THAO TÁC (Tùy chọn: Chuyển câu & Nộp bài) */}
              <div className="navigation-bar">
                {/* Nút Previous (chỉ hiện khi chưa ở câu đầu) */}
                <button
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  className="btn btn-outline"
                >
                  ◀ Câu trước
                </button>

                {/* Nút Next hoặc Nộp Bài */}
                <div className="right-actions">
                  {currentQuestionIndex < questions.length - 1 ? (
                    <button onClick={handleNext} className="btn btn-primary">
                      Câu tiếp theo ▶
                    </button>
                  ) : (
                    <span>{/* Khoảng trống nếu cần ghi chú */}</span>
                  )}

                  {/* Nút Submit giữ nguyên để người dùng luôn ấn được */}
                  <button
                    onClick={handleSubmit}
                    className="btn btn-submit"
                    disabled={answeredCount === 0}
                  >
                    📝 Nộp bài ({answeredCount}/{totalCount})
                  </button>
                </div>
              </div>

            </div> {/* Kết thúc .quiz-content-area */}
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Quiz App © 2026 — Được xây dựng với FastAPI + React</p>
      </footer>
    </div>
  );
}

export default App;
