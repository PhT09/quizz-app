"""
schemas.py - Tầng Schemas (Pydantic Models) - Version 3
============================================
Định nghĩa cấu trúc dữ liệu bao gồm: 
- Authentication & Admin.
- Category & Difficulty cho câu hỏi.
"""

from pydantic import BaseModel
from typing import List, Optional, Literal


# ============================================================
# MODEL AUTHENTICATION & USER
# ============================================================

class User(BaseModel):
    id: Optional[int] = None
    username: str
    role: str

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

class QuestionBase(BaseModel):
    question_text: str
    options: List[str]
    category: str
    difficulty: Literal["Low", "Medium", "High"]

class Question(QuestionBase):
    id: int
    correct_answer: str

class QuestionCreate(QuestionBase):
    correct_answer: str

class QuestionUpdate(BaseModel):
    question_text: Optional[str] = None
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[Literal["Low", "Medium", "High"]] = None


class QuestionOut(QuestionBase):
    id: int


# ============================================================
# MODEL CÂU TRẢ LỜI CỦA NGƯỜI DÙNG (UserAnswer)
# ============================================================

class UserAnswer(BaseModel):
    question_id: int
    selected_answer: str


class SubmitRequest(BaseModel):
    answers: List[UserAnswer]


# ============================================================
# MODEL KẾT QUẢ (Results)
# ============================================================

class QuestionResult(BaseModel):
    question_id: int
    question_text: str
    selected_answer: str
    correct_answer: str
    is_correct: bool


class Results(BaseModel):
    score: int
    total: int
    details: List[QuestionResult]
