"""
database.py - Tầng Dữ liệu (SQLite3)
============================================
Lưu trữ danh sách câu hỏi quiz trong cơ sở dữ liệu SQLite3.

Cách sửa đổi:
- Thêm câu hỏi: INSERT vào bảng questions
- Sửa câu hỏi: UPDATE bảng questions
- Thêm trường mới: tạo mảng migrate bằng cách đổi ALTER TABLE
"""

import sqlite3
import json
import os
from schemas import Question
from typing import List

# Lấy dữ liệu mẫu từ questions.py
from questions import QUESTIONS_DATA

DB_FILE = os.path.join(os.path.dirname(__file__), "quiz.db")

def get_db_connection():
    """Tạo và trả về một kết nối cơ sở dữ liệu."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # Trả về kết quả dưới dạng dictionary thay vì list
    return conn

def init_db():
    """
    Khởi tạo cơ sở dữ liệu và nạp dữ liệu từ questions.py nếu bảng rỗng.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Tạo bảng nếu chưa tồn tại
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY,
            question_text TEXT NOT NULL,
            options TEXT NOT NULL,
            correct_answer TEXT NOT NULL
        )
    ''')
    
    # Kiểm tra xem bảng có dữ liệu chưa
    cursor.execute('SELECT COUNT(*) FROM questions')
    count = cursor.fetchone()[0]
    
    # Nếu chưa có dữ liệu, thêm vào từ biến QUESTIONS_DATA từ module questions
    if count == 0:
        for q in QUESTIONS_DATA:
            # list options chuyển sang dạng JSON string để lưu trữ
            options_json = json.dumps(q["options"], ensure_ascii=False)
            cursor.execute('''
                INSERT INTO questions (id, question_text, options, correct_answer)
                VALUES (?, ?, ?, ?)
            ''', (q["id"], q["question_text"], options_json, q["correct_answer"]))
        conn.commit()
    
    conn.close()

def get_all_questions() -> List[Question]:
    """
    Lấy toàn bộ danh sách câu hỏi từ database.
    
    Trả về: List[Question] - danh sách các đối tượng Question
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, question_text, options, correct_answer FROM questions")
    rows = cursor.fetchall()
    
    questions = []
    for row in rows:
        # Giải mã string dạng JSON trở lại thành list
        options = json.loads(row["options"])
        q = Question(
            id=row["id"],
            question_text=row["question_text"],
            options=options,
            correct_answer=row["correct_answer"]
        )
        questions.append(q)
    
    conn.close()
    return questions

# Chạy tạo bảng và nạp dữ liệu một lần khi file database.py được import
init_db()
