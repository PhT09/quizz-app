/**
 * QuizCard.jsx - Component Hiển thị Câu hỏi
 * ============================================
 * Hiển thị MỘT câu hỏi quiz với các lựa chọn dạng radio button.
 * Component này là "presentational" - chỉ hiển thị, không quản lý state.
 *
 * Props:
 * - question: object câu hỏi { id, question_text, options }
 * - questionIndex: số thứ tự câu hỏi (bắt đầu từ 0)
 * - selectedAnswer: đáp án đang được chọn (string hoặc undefined)
 * - onSelectAnswer: hàm callback khi user chọn đáp án
 *
 * Cách sửa đổi:
 * - Đổi layout: sửa className và CSS tương ứng
 * - Thêm hình ảnh: thêm <img> vào trong card
 * - Đổi từ radio sang checkbox: đổi type="checkbox" (cần sửa logic state)
 * - Thêm giải thích: thêm phần explanation bên dưới options
 */

import React from "react";

function QuizCard({ question, questionIndex, selectedAnswer, onSelectAnswer }) {
    return (
        // Container chính của card câu hỏi
        // className "quiz-card" được style trong App.css
        <div className="quiz-card">
            {/* 
        Tiêu đề câu hỏi: "Câu X: nội dung câu hỏi"
        questionIndex + 1 vì index bắt đầu từ 0 nhưng hiển thị từ 1
      */}
            <h3 className="question-title">
                Câu {questionIndex + 1}: {question.question_text}
            </h3>

            {/* 
        Danh sách các lựa chọn
        Dùng .map() để render từng option thành một radio button
        
        Cách sửa đổi:
        - Đổi sang button: thay <label> bằng <button onClick={...}>
        - Thêm icon: thêm emoji hoặc icon trước text option
        - Đổi layout: thêm className và CSS grid/flex
      */}
            <div className="options-list">
                {question.options.map((option, index) => (
                    <label
                        key={index}
                        // Thêm class "selected" khi option này đang được chọn
                        // Giúp CSS highlight option đã chọn
                        className={`option-label ${selectedAnswer === option ? "selected" : ""}`}
                    >
                        {/* 
              Radio button ẩn (được style bằng CSS)
              - name: nhóm các radio cùng câu hỏi (chỉ chọn 1)
              - value: giá trị của option
              - checked: true nếu option này đang được chọn
              - onChange: gọi callback khi user chọn
            */}
                        <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={selectedAnswer === option}
                            onChange={() => onSelectAnswer(question.id, option)}
                        />
                        {/* Ký tự đầu (A, B, C, D) + nội dung option */}
                        <span className="option-text">
                            {String.fromCharCode(65 + index)}. {option}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
}

export default QuizCard;
