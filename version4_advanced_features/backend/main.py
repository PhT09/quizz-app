"""
main.py - Tầng Route (API Endpoints) - Version 4
================================================
Bổ sung:
- Randomization và Limit cho danh sách câu hỏi.
- Countdown timer và Export kết quả (Frontend).
"""

import random
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Optional

from schemas import (
    Token, User, QuestionCreate, QuestionUpdate, Question, UserRegister,
    QuestionOut, SubmitRequest, Results
)
from database import (
    get_all_questions, get_user_by_username, 
    create_question, update_question, delete_question, create_user,
    get_all_categories
)
from services import calculate_results
from auth import (
    authenticate_user, create_access_token, 
    get_current_user, check_admin_role, check_player_role, get_password_hash
)

app = FastAPI(
    title="Quiz App API v4 - Advanced Features",
    description="API hỗ trợ Random, Timer và Export",
    version="4.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# LOGIN & REGISTER
# ============================================================

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@app.post("/register", summary="Đăng ký người chơi mới")
async def register_user(user: UserRegister):
    hashed_pw = get_password_hash(user.password)
    success = create_user(user.username, hashed_pw, role="player")
    if not success:
        raise HTTPException(status_code=400, detail="Username already exists")
    return {"message": "User created successfully"}


# ============================================================
# PLAYER ROUTES
# ============================================================

@app.get(
    "/questions",
    # [RBAC Context]: Endpoint này yêu cầu 'check_player_role' để đảm bảo chỉ user đã 
    # đăng nhập mới có thể lấy câu hỏi. 
    # [No-Auth Modification]: Nếu không dùng Auth, chỉ cần bỏ dependency 'check_player_role'.
    response_model=List[QuestionOut],
    summary="Lấy danh sách câu hỏi có lọc và giới hạn",
    dependencies=[Depends(check_player_role)]
)
def get_questions(
    category: Optional[str] = Query(None, description="Lọc theo chủ đề"),
    difficulty: Optional[str] = Query(None, description="Lọc theo độ khó"),
    limit: Optional[int] = Query(None, description="Số lượng câu hỏi tối đa")
):
    """
    Lấy câu hỏi, hỗ trợ lọc, xáo trộn ngẫu nhiên và giới hạn số lượng.
    """
    # 1. Lấy toàn bộ câu hỏi thỏa mãn filter (Category/Difficulty)
    questions = get_all_questions(category=category, difficulty=difficulty)
    
    # [Feature: Randomization & Limit]
    # Logic: Nếu có yêu cầu limit hoặc chỉ muốn xáo trộn để tăng tính thử thách:
    if limit is not None:
        random.shuffle(questions)
        questions = questions[:limit]
    
    return [
        QuestionOut(**q.model_dump(exclude={"correct_answer"}))
        for q in questions
    ]

@app.get("/categories", response_model=List[str], summary="Lấy danh sách các chủ đề hiện có")
def get_categories():
    return get_all_categories()


@app.post(
    "/submit",
    # [RBAC Context]: Bảo vệ bằng 'check_player_role' để tính điểm cho đúng account.
    # [No-Auth Modification]: Bỏ check role, endpoint trở thành public để bất kỳ ai cũng nộp bài được.
    response_model=Results,
    summary="Nộp bài",
    dependencies=[Depends(check_player_role)]
)
def submit_answers(request: SubmitRequest):
    # Lấy toàn bộ data để so khớp ID (Security: backend kiểm tra đáp án, không tin tưởng frontend)
    questions = get_all_questions()
    results = calculate_results(questions, request.answers)
    return results


# ============================================================
# ADMIN ROUTES (RESTRICTED)
# ============================================================

@app.get(
    "/admin/questions",
    response_model=List[Question],
    summary="Quản lý câu hỏi (Admin)",
    dependencies=[Depends(check_admin_role)]
)
def admin_get_questions(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None)
):
    return get_all_questions(category=category, difficulty=difficulty)


@app.post(
    "/questions",
    response_model=Question,
    summary="Thêm câu hỏi mới",
    dependencies=[Depends(check_admin_role)]
)
def admin_create_question(q: QuestionCreate):
    return create_question(q)


@app.put(
    "/questions/{q_id}",
    response_model=Question,
    summary="Cập nhật câu hỏi",
    dependencies=[Depends(check_admin_role)]
)
def admin_update_question(q_id: int, q_update: QuestionUpdate):
    updated = update_question(q_id, q_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Question not found")
    return updated


@app.delete(
    "/questions/{q_id}",
    summary="Xóa câu hỏi",
    dependencies=[Depends(check_admin_role)]
)
def admin_delete_question(q_id: int):
    success = delete_question(q_id)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Question deleted successfully"}
