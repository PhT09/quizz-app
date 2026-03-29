/**
 * ResultView.jsx - Component Hiển thị Kết quả
 * ==============================================
 * Hiển thị kết quả sau khi nộp bài: điểm tổng, điểm tích lũy,
 * và chi tiết đúng/sai từng câu.
 *
 * Props:
 * - results: object kết quả { score, total, details }
 * - cumulativeScore: điểm tích lũy qua các lượt chơi
 *
 * Cách sửa đổi:
 * - Thêm biểu đồ: import thư viện chart và hiển thị pie chart
 * - Thêm nhận xét: dựa vào tỷ lệ đúng để đưa ra feedback
 * - Thêm nút chia sẻ: thêm button gọi Web Share API
 * - Đổi layout: sửa CSS grid/flex trong App.css
 */

import React from "react";

function ResultView({ results, cumulativeScore }) {
    /**
     * Tính phần trăm đúng để hiển thị và đánh giá.
     * Dùng Math.round() để làm tròn (ví dụ: 66.666... -> 67)
     */
    const percentage = Math.round((results.score / results.total) * 100);

    /**
     * Hàm trả về nhận xét dựa trên phần trăm đúng.
     * 
     * Cách sửa đổi:
     * - Thêm mức đánh giá: thêm else if mới
     * - Đổi emoji: thay đổi emoji trong chuỗi trả về
     * - Đa ngôn ngữ: dùng i18n library thay vì hardcode text
     */
    function getEmoji() {
        if (percentage === 100) return "🏆";
        if (percentage >= 80) return "🌟";
        if (percentage >= 60) return "👍";
        if (percentage >= 40) return "💪";
        return "📚";
    }

    function getMessage() {
        if (percentage === 100) return "Xuất sắc! Bạn trả lời đúng tất cả!";
        if (percentage >= 80) return "Tuyệt vời! Bạn làm rất tốt!";
        if (percentage >= 60) return "Khá tốt! Cố gắng thêm nhé!";
        if (percentage >= 40) return "Được rồi, hãy ôn tập thêm!";
        return "Cần cố gắng hơn! Hãy thử lại nhé!";
    }

    return (
        <div className="result-view">
            {/* ====== PHẦN TỔNG HỢP ĐIỂM ====== */}
            <div className="result-summary">
                {/* Emoji và thông điệp động */}
                <div className="result-emoji">{getEmoji()}</div>
                <h2 className="result-title">{getMessage()}</h2>

                {/* 
          Hiển thị điểm số lượt này
          Cách sửa đổi: thêm animation đếm số bằng useEffect
        */}
                <div className="score-display">
                    <div className="score-circle">
                        <span className="score-number">{results.score}</span>
                        <span className="score-divider">/</span>
                        <span className="score-total">{results.total}</span>
                    </div>
                    <p className="score-percentage">{percentage}% đúng</p>
                </div>

                {/* 
          Điểm tích lũy: cộng dồn qua các lượt chơi
          Chỉ reset khi reload trang (lưu trong state, không lưu localStorage)
          
          Cách sửa đổi để lưu vĩnh viễn:
          - Dùng localStorage: localStorage.setItem("cumScore", score)
          - Dùng backend: gửi API lưu điểm vào database
        */}
                <div className="cumulative-score">
                    <span className="cumulative-label">Điểm tích lũy:</span>
                    <span className="cumulative-value">{cumulativeScore}</span>
                </div>
            </div>

            {/* ====== PHẦN CHI TIẾT TỪNG CÂU ====== */}
            <div className="result-details">
                <h3 className="details-title">Chi tiết kết quả</h3>

                {/* 
          Duyệt qua danh sách kết quả từng câu
          Mỗi item chứa: question_text, selected_answer, correct_answer, is_correct
          
          Cách sửa đổi:
          - Thêm giải thích: hiển thị explanation nếu có trong data
          - Thêm link tham khảo: hiển thị link bên dưới mỗi câu sai
          - Ẩn câu đúng: chỉ hiển thị câu sai bằng .filter(d => !d.is_correct)
        */}
                {results.details.map((detail, index) => (
                    <div
                        key={detail.question_id}
                        // Class động: "correct" (xanh) hoặc "incorrect" (đỏ)
                        className={`detail-item ${detail.is_correct ? "correct" : "incorrect"}`}
                    >
                        {/* Số thứ tự và icon đúng/sai */}
                        <div className="detail-header">
                            <span className="detail-number">Câu {index + 1}</span>
                            <span className="detail-icon">
                                {detail.is_correct ? "✅" : "❌"}
                            </span>
                        </div>

                        {/* Nội dung câu hỏi */}
                        <p className="detail-question">{detail.question_text}</p>

                        {/* Đáp án của người dùng */}
                        <p className="detail-answer">
                            <strong>Bạn chọn:</strong> {detail.selected_answer}
                        </p>

                        {/* Hiển thị đáp án đúng nếu trả lời sai */}
                        {!detail.is_correct && (
                            <p className="detail-correct">
                                <strong>Đáp án đúng:</strong> {detail.correct_answer}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ResultView;
