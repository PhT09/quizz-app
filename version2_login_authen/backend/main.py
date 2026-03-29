"""
main.py - Tầng Route (API Endpoints) - Version 2
================================================
Bổ sung:
1. Xác thực (Authentication)
2. Phân quyền (RBAC) cho Player và Admin
3. CRUD API cho Admin
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from typing import List

from schemas import (
    Token, User, QuestionCreate, QuestionUpdate, Question, UserRegister,
    QuestionOut, SubmitRequest, Results
)
from database import (
    get_all_questions, get_user_by_username, 
    create_question, update_question, delete_question, create_user
)
from services import calculate_results
from auth import (
    authenticate_user, create_access_token, 
    get_current_user, check_admin_role, check_player_role, get_password_hash
)

app = FastAPI(
    title="Quiz App API v2 - Auth & RBAC",
    description="API với chức năng Đăng nhập và Phân quyền",
    version="2.0.0"
)

# CORS (Cập nhật cho version 2 nếu cần)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép tất cả trong dev mode v2
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# LOGIN ENDPOINT
# ============================================================

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Endpoint chuẩn FastAPI cho việc lấy JWT Token.
    """
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
    """
    Tạo tài khoản người chơi mới.
    """
    hashed_pw = get_password_hash(user.password)
    success = create_user(user.username, hashed_pw, role="player")
    if not success:
        raise HTTPException(status_code=400, detail="Username already exists")
    return {"message": "User created successfully"}


# ============================================================
# ENDPOINT: PLAYER ROUTES (AUTH REQUIRED)
# ============================================================

@app.get(
    "/questions",
    response_model=List[QuestionOut],
    summary="Lấy danh sách câu hỏi (Yêu cầu đăng nhập)",
    dependencies=[Depends(check_player_role)]
)
def get_questions():
    """
    Chỉ cho phép user đã đăng nhập (player hoặc admin) xem câu hỏi.
    """
    questions = get_all_questions()
    return [
        QuestionOut(**q.model_dump(exclude={"correct_answer"}))
        for q in questions
    ]


@app.post(
    "/submit",
    response_model=Results,
    summary="Nộp bài và nhận kết quả (Yêu cầu đăng nhập)",
    dependencies=[Depends(check_player_role)]
)
def submit_answers(request: SubmitRequest):
    questions = get_all_questions()
    results = calculate_results(questions, request.answers)
    return results


# ============================================================
# ENDPOINT: ADMIN CRUD ROUTES (ADMIN ONLY)
# ============================================================

@app.get(
    "/admin/questions",
    response_model=List[Question],
    summary="Lấy toàn bộ câu hỏi bao gồm đáp án (Chỉ Admin)",
    dependencies=[Depends(check_admin_role)]
)
def admin_get_questions():
    """Admin có quyền xem đáp án đúng để quản lý."""
    return get_all_questions()


@app.post(
    "/questions",
    response_model=Question,
    summary="Thêm câu hỏi mới (Chỉ Admin)",
    dependencies=[Depends(check_admin_role)]
)
def admin_create_question(q: QuestionCreate):
    return create_question(q)


@app.put(
    "/questions/{q_id}",
    response_model=Question,
    summary="Cập nhật câu hỏi (Chỉ Admin)",
    dependencies=[Depends(check_admin_role)]
)
def admin_update_question(q_id: int, q_update: QuestionUpdate):
    updated = update_question(q_id, q_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Question not found")
    return updated


@app.delete(
    "/questions/{q_id}",
    summary="Xóa câu hỏi (Chỉ Admin)",
    dependencies=[Depends(check_admin_role)]
)
def admin_delete_question(q_id: int):
    success = delete_question(q_id)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Question deleted successfully"}
