/**
 * QuizCard.jsx - Component Hiển thị Câu hỏi
 * ============================================
 * Phiên bản 4: Hỗ trợ xáo trộn đáp án ngẫu nhiên.
 */

import React, { useMemo } from "react";

function QuizCard({ question, questionIndex, selectedAnswer, onSelectAnswer }) {
    
    // [Feature: Option Shuffling]
    // [RBAC Context]: Việc xáo trộn diễn ra ở frontend. 
    // Backend vẫn nhận 'selected_answer' là text gốc để so khớp đáp án đúng.
    // [No-Auth Modification]: Không thay đổi gì cả, logic UI này độc lập với Auth.
    const shuffledOptions = useMemo(() => {
        if (!question.options) return [];
        // [Feature: Option Shuffling]
        // Copy mảng trước khi xáo trộn để tránh thay đổi prop gốc
        const opts = [...question.options];
        // Thuật toán Fisher-Yates để xáo trộn mảng chuẩn xác
        for (let i = opts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [opts[i], opts[j]] = [opts[j], opts[i]];
        }
        return opts;
    }, [question.id]); // Chỉ xáo trộn lại khi question.id thay đổi

    return (
        <div className="quiz-card">
            <h3 className="question-title">
                Câu {questionIndex + 1}: {question.question_text}
            </h3>

            <div className="options-list">
                {shuffledOptions.map((option, index) => (
                    <label
                        key={index}
                        className={`option-label ${selectedAnswer === option ? "selected" : ""}`}
                    >
                        <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={selectedAnswer === option}
                            onChange={() => onSelectAnswer(question.id, option)}
                        />
                        <span className="option-text">
                            {String.fromCharCode(65 + index)}. {option}
                        </span>
                    </label>
                ))}
            </div>
            
            <div className="question-meta" style={{marginTop: '15px', fontSize: '0.8rem', opacity: 0.7}}>
                <span className="badge badge-category">{question.category}</span>
                <span className={`badge badge-difficulty ${question.difficulty.toLowerCase()}`}>
                    {question.difficulty}
                </span>
            </div>
        </div>
    );
}

export default QuizCard;
