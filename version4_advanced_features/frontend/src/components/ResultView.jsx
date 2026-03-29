/**
 * ResultView.jsx - Component Hiển thị Kết quả
 * ==============================================
 * Phiên bản 4: Hỗ trợ Export kết quả ra file .txt.
 */

import React from "react";

function ResultView({ results, cumulativeScore }) {
    const percentage = Math.round((results.score / results.total) * 100);

    // [Feature: Export Results]
    // [RBAC Context]: Dữ liệu 'results' đã được backend chứng thực quyền 'player' mới có được.
    // Việc export diễn ra tại client dựa trên dữ liệu an toàn từ memory.
    // [No-Auth Modification]: Logic export không đổi, vì nó chỉ xử lý dữ liệu đang hiển thị.
    const downloadResults = () => {
        let content = `KẾT QUẢ BÀI THI QUIZ\n`;
        content += `========================\n`;
        content += `Người chơi: ${localStorage.getItem("username") || "Ẩn danh"}\n`;
        content += `Điểm số: ${results.score}/${results.total} (${percentage}%)\n`;
        content += `Điểm tích lũy: ${cumulativeScore}\n\n`;
        content += `CHI TIẾT CÂU HỎI:\n`;
        
        results.details.forEach((d, i) => {
            content += `${i + 1}. ${d.question_text}\n`;
            content += `   - Bạn chọn: ${d.selected_answer}\n`;
            content += `   - Đáp án đúng: ${d.correct_answer}\n`;
            content += `   - Kết quả: ${d.is_correct ? 'ĐÚNG' : 'SAI'}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `quiz_results_${new Date().getTime()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
            <div className="result-summary">
                <div className="result-emoji">{getEmoji()}</div>
                <h2 className="result-title">{getMessage()}</h2>

                <div className="score-display">
                    <div className="score-circle">
                        <span className="score-number">{results.score}</span>
                        <span className="score-divider">/</span>
                        <span className="score-total">{results.total}</span>
                    </div>
                    <p className="score-percentage">{percentage}% đúng</p>
                </div>

                <div className="cumulative-score">
                    <span className="cumulative-label">Điểm tích lũy:</span>
                    <span className="cumulative-value">{cumulativeScore}</span>
                </div>
                
                {/* Nút Download Results */}
                <div style={{marginTop: '20px'}}>
                    <button onClick={downloadResults} className="btn btn-outline btn-block">
                        📥 Tải kết quả bài thi (.txt)
                    </button>
                </div>
            </div>

            <div className="result-details">
                <h3 className="details-title">Chi tiết kết quả</h3>

                {results.details.map((detail, index) => (
                    <div
                        key={detail.question_id}
                        className={`detail-item ${detail.is_correct ? "correct" : "incorrect"}`}
                    >
                        <div className="detail-header">
                            <span className="detail-number">Câu {index + 1}</span>
                            <span className="detail-icon">
                                {detail.is_correct ? "✅" : "❌"}
                            </span>
                        </div>

                        <p className="detail-question">{detail.question_text}</p>
                        <p className="detail-answer">
                            <strong>Bạn chọn:</strong> {detail.selected_answer}
                        </p>

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
