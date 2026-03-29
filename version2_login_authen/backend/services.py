"""
services.py - Tầng Dịch vụ (Business Logic)
=============================================
Chứa logic nghiệp vụ: chấm điểm, so sánh đáp án.
Tách riêng khỏi route để dễ test và tái sử dụng.

Cách sửa đổi:
- Thay đổi cách tính điểm: sửa trong hàm calculate_results()
- Thêm logic mới (ví dụ: tính điểm theo độ khó): tạo hàm mới
- Thêm validation: kiểm tra dữ liệu đầu vào trước khi xử lý
"""

from typing import List
from schemas import Question, UserAnswer, QuestionResult, Results


def calculate_results(
    questions: List[Question], 
    user_answers: List[UserAnswer]
) -> Results:
    """
    Chấm điểm bài quiz dựa trên đáp án người dùng.
    
    Tham số:
    - questions: danh sách câu hỏi (có đáp án đúng)
    - user_answers: danh sách câu trả lời của người dùng
    
    Trả về: Results chứa điểm số và chi tiết từng câu
    
    Logic hoạt động:
    1. Tạo dict ánh xạ question_id -> Question để tra cứu nhanh
    2. Duyệt qua từng câu trả lời của người dùng
    3. So sánh đáp án người dùng với đáp án đúng
    4. Đếm số câu đúng và tạo danh sách kết quả chi tiết
    
    Cách sửa đổi:
    - Tính điểm theo trọng số: nhân is_correct với hệ số (ví dụ: câu khó x2)
    - Thêm phần trăm: thêm trường percentage = score / total * 100
    - Bỏ qua câu chưa trả lời: kiểm tra selected_answer != "" trước khi so sánh
    """
    
    # Bước 1: Tạo dictionary để tra cứu câu hỏi theo id
    # Giúp tìm câu hỏi nhanh O(1) thay vì duyệt list O(n)
    question_map = {q.id: q for q in questions}
    
    # Bước 2: Khởi tạo biến đếm điểm và danh sách kết quả
    score = 0
    details = []
    
    # Bước 3: Duyệt qua từng câu trả lời và chấm điểm
    for answer in user_answers:
        # Tìm câu hỏi tương ứng trong question_map
        question = question_map.get(answer.question_id)
        
        # Bỏ qua nếu không tìm thấy câu hỏi (phòng trường hợp lỗi dữ liệu)
        if not question:
            continue
        
        # So sánh đáp án (strip() để loại bỏ khoảng trắng thừa)
        is_correct = answer.selected_answer.strip() == question.correct_answer.strip()
        
        # Cộng điểm nếu đúng
        if is_correct:
            score += 1
        
        # Thêm kết quả chi tiết cho câu hỏi này
        details.append(QuestionResult(
            question_id=question.id,
            question_text=question.question_text,
            selected_answer=answer.selected_answer,
            correct_answer=question.correct_answer,
            is_correct=is_correct
        ))
    
    # Bước 4: Trả về kết quả tổng hợp
    return Results(
        score=score,
        total=len(questions),
        details=details
    )
