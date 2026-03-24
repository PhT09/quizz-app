"""
schemas.py - Tầng Schemas (Pydantic Models)
============================================
Định nghĩa cấu trúc dữ liệu cho toàn bộ ứng dụng.
Pydantic giúp validate dữ liệu tự động và tạo docs cho API.

Cách sửa đổi:
- Thêm trường mới: thêm attribute vào class tương ứng (ví dụ: thêm "difficulty" vào Question)
- Thay đổi kiểu dữ liệu: đổi type annotation (ví dụ: str -> int)
- Thêm model mới: tạo class mới kế thừa BaseModel
"""

from pydantic import BaseModel
from typing import List


# ============================================================
# MODEL CÂU HỎI (Question)
# ============================================================

class Question(BaseModel):
    """
    Model đầy đủ cho một câu hỏi quiz.
    Dùng nội bộ trong backend (có chứa đáp án đúng).
    
    Các trường:
    - id: mã định danh câu hỏi (số nguyên)
    - question_text: nội dung câu hỏi
    - options: danh sách các lựa chọn (A, B, C, D)
    - correct_answer: đáp án đúng (phải khớp với 1 trong các options)
    
    Cách thêm trường mới (ví dụ: độ khó):
        difficulty: str = "easy"  # Giá trị mặc định là "easy"
    """
    id: int
    question_text: str
    options: List[str]
    correct_answer: str


class QuestionOut(BaseModel):
    """
    Model câu hỏi gửi cho client (KHÔNG chứa đáp án đúng).
    Dùng cho endpoint GET /questions để tránh lộ đáp án.
    
    Lưu ý: Model này giống Question nhưng bỏ trường correct_answer.
    Nếu thêm trường mới vào Question, cân nhắc có cần hiển thị cho client không.
    """
    id: int
    question_text: str
    options: List[str]


# ============================================================
# MODEL CÂU TRẢ LỜI CỦA NGƯỜI DÙNG (UserAnswer)
# ============================================================

class UserAnswer(BaseModel):
    """
    Model cho một câu trả lời của người dùng.
    
    Các trường:
    - question_id: mã câu hỏi mà người dùng trả lời
    - selected_answer: đáp án người dùng chọn
    
    Cách mở rộng (ví dụ: thêm thời gian trả lời):
        time_taken_seconds: float = 0.0
    """
    question_id: int
    selected_answer: str


class SubmitRequest(BaseModel):
    """
    Model cho request gửi đáp án (POST /submit).
    Chứa danh sách tất cả câu trả lời của người dùng.
    
    Lưu ý: Frontend gửi một lần duy nhất khi nhấn nút "Nộp bài".
    """
    answers: List[UserAnswer]


# ============================================================
# MODEL KẾT QUẢ (Results)
# ============================================================

class QuestionResult(BaseModel):
    """
    Model kết quả chi tiết cho MỘT câu hỏi.
    Dùng để hiển thị đáp án đúng/sai cho từng câu.
    
    Các trường:
    - question_id: mã câu hỏi
    - question_text: nội dung câu hỏi (hiển thị lại cho user)
    - selected_answer: đáp án user đã chọn
    - correct_answer: đáp án đúng
    - is_correct: True nếu trả lời đúng
    """
    question_id: int
    question_text: str
    selected_answer: str
    correct_answer: str
    is_correct: bool


class Results(BaseModel):
    """
    Model kết quả tổng hợp sau khi chấm bài.
    
    Các trường:
    - score: số câu trả lời đúng
    - total: tổng số câu hỏi
    - details: danh sách kết quả chi tiết từng câu
    
    Cách mở rộng (ví dụ: thêm phần trăm):
        percentage: float  # Tính = score / total * 100
    """
    score: int
    total: int
    details: List[QuestionResult]
