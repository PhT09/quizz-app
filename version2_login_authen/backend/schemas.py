"""
schemas.py - Tầng Schemas (Pydantic Models) - Version 2
============================================
Định nghĩa cấu trúc dữ liệu cho toàn bộ ứng dụng bao gồm Authentication và Admin.
"""

from pydantic import BaseModel
from typing import List, Optional


# ============================================================
# MODEL AUTHENTICATION & USER
# ============================================================

class User(BaseModel):
    id: Optional[int] = None
    username: str
    role: str # 'admin' or 'player'

    class Config:
        from_attributes = True

class UserInDB(User):
    hashed_password: str

class UserRegister(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


# ============================================================
# MODEL CÂU HỎI (Question)
# ============================================================

class Question(BaseModel):
    """
    Model đầy đủ cho một câu hỏi quiz.
    Dùng nội bộ trong backend (có chứa đáp án đúng).
    """
    id: int
    question_text: str
    options: List[str]
    correct_answer: str

class QuestionCreate(BaseModel):
    """
    Dùng cho Admin khi thêm câu hỏi mới.
    """
    question_text: str
    options: List[str]
    correct_answer: str

class QuestionUpdate(BaseModel):
    """
    Dùng cho Admin khi cập nhật câu hỏi.
    """
    question_text: Optional[str] = None
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None


class QuestionOut(BaseModel):
    """
    Model câu hỏi gửi cho client (KHÔNG chứa đáp án đúng).
    Dùng cho endpoint GET /questions để tránh lộ đáp án.
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
    """
    question_id: int
    selected_answer: str


class SubmitRequest(BaseModel):
    """
    Model cho request gửi đáp án (POST /submit).
    """
    answers: List[UserAnswer]


# ============================================================
# MODEL KẾT QUẢ (Results)
# ============================================================

class QuestionResult(BaseModel):
    """
    Model kết quả chi tiết cho MỘT câu hỏi.
    """
    question_id: int
    question_text: str
    selected_answer: str
    correct_answer: str
    is_correct: bool


class Results(BaseModel):
    """
    Model kết quả tổng hợp sau khi chấm bài.
    """
    score: int
    total: int
    details: List[QuestionResult]
