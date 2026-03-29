/**
 * QuestionSidebar.jsx - Component Thanh bên (Sidebar)
 * ======================================================
 * Hiển thị danh sách các câu hỏi dưới dạng lưới hoặc danh sách.
 * Cho phép người dùng chọn nhanh câu hỏi cần làm.
 *
 * Props:
 * - questions: danh sách toàn bộ câu hỏi
 * - currentQuestionIndex: vị trí/index của câu hỏi đang hiển thị (bắt đầu từ 0)
 * - userAnswers: object chứa các đáp án người dùng đã chọn
 * - onSelectQuestion: hàm callback khi người dùng click vào một số câu hỏi
 *
 * Cách sửa đổi:
 * - Đổi layout (lưới sang danh sách): Sửa CSS .sidebar-grid thành display: flex; flex-direction: column;
 * - Thay đổi kích thước nút tròn: Sửa CSS .sidebar-btn (width, height, border-radius)
 * - Thêm icon: Thêm <span> chứa icon emoji bên trong nút
 */

import React from "react";

function QuestionSidebar({ questions, currentQuestionIndex, userAnswers, onSelectQuestion }) {
    return (
        <aside className="quiz-sidebar">
            <h3 className="sidebar-title">Danh sách câu hỏi</h3>

            {/* 
        Danh sách các nút chuyển nhanh câu hỏi (Navigation)
      */}
            <div className="sidebar-grid">
                {questions.map((q, index) => {
                    // Kiểm tra xem câu này đã được trả lời chưa
                    // userAnswers là dạng { [questionId]: "Giá trị đã chọn" }
                    const isAnswered = !!userAnswers[q.id];

                    // Kiểm tra xem câu này có đang là câu hiển thị hiện tại (Active) không
                    const isActive = index === currentQuestionIndex;

                    return (
                        <button
                            key={q.id}
                            onClick={() => onSelectQuestion(index)}
                            // Thêm class tương ứng với trạng thái:
                            // - "active": Câu đang xem (Current Question)
                            // - "answered": Câu đã trả lời (kèm đổi background hoặc viền)
                            className={`sidebar-btn ${isActive ? "active" : ""} ${isAnswered ? "answered" : ""}`}
                        >
                            <span className="btn-number">{index + 1}</span>
                            {/* Hiển thị checkmark nếu đã làm xong */}
                            {isAnswered && <span className="btn-icon">✓</span>}
                        </button>
                    );
                })}
            </div>

            {/* Thông tin thống kê nhỏ giú‌p track tiến độ dễ dàng */}
            <div className="sidebar-stats">
                <p>Đã làm: {Object.keys(userAnswers).length} / {questions.length}</p>
            </div>
        </aside>
    );
}

export default QuestionSidebar;
