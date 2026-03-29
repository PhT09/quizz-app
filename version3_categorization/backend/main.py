"""
main.py - Tầng Route (API Endpoints) - Version 3
================================================
Bổ sung:
- Filtering theo Category và Difficulty cho Player.
- CRUD hỗ trợ các trường mới cho Admin.
- Endpoint lấy danh sách Category.
"""

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
    title="Quiz App API v3 - Categorization",
    description="API hỗ trợ Phân loại và Độ khó",
    version="3.0.0"
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
# AUTH & REGISTER
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
    response_model=List[QuestionOut],
    summary="Lấy danh sách câu hỏi có lọc",
    dependencies=[Depends(check_player_role)]
)
def get_questions(
    category: Optional[str] = Query(None, description="Lọc theo chủ đề"),
    difficulty: Optional[str] = Query(None, description="Lọc theo độ khó")
):
    """
    Hỗ trợ lọc câu hỏi theo category và difficulty.
    """
    questions = get_all_questions(category=category, difficulty=difficulty)
    return [
        QuestionOut(**q.model_dump(exclude={"correct_answer"}))
        for q in questions
    ]

@app.get("/categories", response_model=List[str], summary="Lấy danh sách các chủ đề hiện có")
def get_categories():
    return get_all_categories()


@app.post(
    "/submit",
    response_model=Results,
    summary="Nộp bài",
    dependencies=[Depends(check_player_role)]
)
def submit_answers(request: SubmitRequest):
    questions = get_all_questions()
    results = calculate_results(questions, request.answers)
    return results


# ============================================================
# ADMIN ROUTES
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
