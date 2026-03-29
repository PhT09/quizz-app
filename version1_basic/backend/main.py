"""
main.py - Tầng Route (API Endpoints)
======================================
Xử lý các endpoint của API và cấu hình CORS.
Đây là file chính để chạy ứng dụng FastAPI.

Cách chạy:
    cd backend
    uvicorn main:app --reload --port 8000

Cách sửa đổi:
- Thêm endpoint mới: thêm hàm mới với decorator @app.get() hoặc @app.post()
- Đổi port: thay đổi trong lệnh chạy hoặc thêm vào uvicorn.run()
- Thêm middleware: thêm app.add_middleware(...) sau CORS
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List

# Import từ các tầng khác trong ứng dụng
from schemas import QuestionOut, SubmitRequest, Results
from database import get_all_questions
from services import calculate_results


# ============================================================
# KHỞI TẠO ỨNG DỤNG FASTAPI
# ============================================================
# title: tên hiển thị trên trang docs (http://localhost:8000/docs)
# description: mô tả API
# version: phiên bản hiện tại

app = FastAPI(
    title="Quiz App API",
    description="API cho ứng dụng Quiz đơn giản",
    version="1.0.0"
)


# ============================================================
# CẤU HÌNH CORS (Cross-Origin Resource Sharing)
# ============================================================
# CORS cho phép Frontend (chạy trên port 5173) gọi API Backend (port 8000).
# Nếu không có CORS, trình duyệt sẽ chặn các request từ frontend.
#
# Cách sửa đổi:
# - Thêm domain mới: thêm URL vào danh sách allow_origins
# - Cho phép tất cả: đổi allow_origins=["*"] (KHÔNG nên dùng trong production)
# - Triển khai production: thay "http://localhost:5173" bằng domain thật

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",    # Vite dev server (mặc định)
        "http://127.0.0.1:5173",   # Localhost dạng IP
    ],
    allow_credentials=True,         # Cho phép gửi cookie
    allow_methods=["*"],            # Cho phép tất cả HTTP methods (GET, POST, ...)
    allow_headers=["*"],            # Cho phép tất cả headers
)


# ============================================================
# ENDPOINT: LẤY DANH SÁCH CÂU HỎI
# ============================================================

@app.get(
    "/questions",
    response_model=List[QuestionOut],
    summary="Lấy danh sách câu hỏi",
    description="Trả về tất cả câu hỏi quiz. Đáp án đúng sẽ KHÔNG được gửi về client."
)
def get_questions():
    """
    Endpoint GET /questions
    
    Lấy tất cả câu hỏi từ database và trả về cho client.
    QUAN TRỌNG: Sử dụng QuestionOut (không có correct_answer)
    để tránh lộ đáp án cho người dùng.
    
    Cách hoạt động:
    1. Gọi get_all_questions() từ tầng database
    2. Chuyển đổi sang QuestionOut (tự động loại bỏ correct_answer)
    3. Trả về danh sách câu hỏi dưới dạng JSON
    
    Cách sửa đổi:
    - Giới hạn số câu: thêm parameter ?limit=5 và slice danh sách
    - Xáo trộn câu hỏi: import random, dùng random.shuffle()
    - Lọc theo chủ đề: thêm parameter ?category=python và filter
    """
    # Lấy danh sách câu hỏi đầy đủ (có đáp án)
    questions = get_all_questions()
    
    # Chuyển sang QuestionOut để loại bỏ trường correct_answer
    # model_dump() chuyển Pydantic model thành dict, rồi tạo QuestionOut từ dict
    return [
        QuestionOut(**q.model_dump(exclude={"correct_answer"}))
        for q in questions
    ]


# ============================================================
# ENDPOINT: NỘP BÀI VÀ CHẤM ĐIỂM
# ============================================================

@app.post(
    "/submit",
    response_model=Results,
    summary="Nộp bài và nhận kết quả",
    description="Gửi danh sách câu trả lời, nhận về điểm số và chi tiết từng câu."
)
def submit_answers(request: SubmitRequest):
    """
    Endpoint POST /submit
    
    Nhận câu trả lời từ client, chấm điểm và trả về kết quả.
    
    Tham số:
    - request: SubmitRequest chứa danh sách UserAnswer
    
    Cách hoạt động:
    1. Lấy danh sách câu hỏi (có đáp án) từ database
    2. Gọi service calculate_results() để chấm điểm
    3. Trả về Results (điểm + chi tiết)
    
    Cách sửa đổi:
    - Lưu kết quả vào DB: thêm code save vào database sau khi tính điểm
    - Thêm thời gian làm bài: nhận thêm trường time từ request
    - Giới hạn số lần nộp: kiểm tra session/IP trước khi chấm
    """
    # Lấy câu hỏi đầy đủ (bao gồm đáp án đúng) để so sánh
    questions = get_all_questions()
    
    # Gọi tầng service để tính toán kết quả
    results = calculate_results(questions, request.answers)
    
    return results
