"""
database.py - Tầng Dữ liệu (SQLite3) - Version 2
============================================
Hỗ trợ cả bảng 'questions' và 'users'.
"""

import sqlite3
import json
import os
from schemas import Question, UserInDB, QuestionCreate, QuestionUpdate
from typing import List, Optional

# Lấy dữ liệu mẫu từ questions.py (cho version 2)
from questions import QUESTIONS_DATA

DB_FILE = os.path.join(os.path.dirname(__file__), "quiz_v2.db")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """
    Khởi tạo cơ sở dữ liệu v2: bảng questions và bảng users.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Tạo bảng questions
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_text TEXT NOT NULL,
            options TEXT NOT NULL,
            correct_answer TEXT NOT NULL
        )
    ''')
    
    # Tạo bảng users
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    ''')
    
    # Nạp dữ liệu mẫu cho questions nếu bảng rỗng
    cursor.execute('SELECT COUNT(*) FROM questions')
    if cursor.fetchone()[0] == 0:
        for q in QUESTIONS_DATA:
            options_json = json.dumps(q["options"], ensure_ascii=False)
            cursor.execute('''
                INSERT INTO questions (question_text, options, correct_answer)
                VALUES (?, ?, ?)
            ''', (q["question_text"], options_json, q["correct_answer"]))
        conn.commit()

    # Nạp dummy users nếu bảng rỗng
    # Lưu ý: Cần import hashing ở đây hoặc dùng passlib trực tiếp
    from auth import get_password_hash
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        dummy_users = [
            ("admin", get_password_hash("admin123"), "admin"),
            ("player", get_password_hash("player123"), "player")
        ]
        cursor.executemany('''
            INSERT INTO users (username, hashed_password, role)
            VALUES (?, ?, ?)
        ''', dummy_users)
        conn.commit()
    
    conn.close()

# --- QUESTION CRUD ---

def get_all_questions() -> List[Question]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, question_text, options, correct_answer FROM questions")
    rows = cursor.fetchall()
    
    questions = []
    for row in rows:
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

def create_question(q: QuestionCreate) -> Question:
    conn = get_db_connection()
    cursor = conn.cursor()
    options_json = json.dumps(q.options, ensure_ascii=False)
    cursor.execute('''
        INSERT INTO questions (question_text, options, correct_answer)
        VALUES (?, ?, ?)
    ''', (q.question_text, options_json, q.correct_answer))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return Question(id=new_id, **q.model_dump())

def update_question(q_id: int, q_update: QuestionUpdate) -> Optional[Question]:
    conn = get_db_connection()
    cursor = conn.cursor()
    # Lấy dữ liệu hiện tại
    cursor.execute("SELECT * FROM questions WHERE id = ?", (q_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    
    # Ghép dữ liệu mới
    q_data = dict(row)
    q_data["options"] = json.loads(q_data["options"])
    
    if q_update.question_text is not None:
        q_data["question_text"] = q_update.question_text
    if q_update.options is not None:
        q_data["options"] = q_update.options
    if q_update.correct_answer is not None:
        q_data["correct_answer"] = q_update.correct_answer
    
    options_json = json.dumps(q_data["options"], ensure_ascii=False)
    cursor.execute('''
        UPDATE questions 
        SET question_text = ?, options = ?, correct_answer = ?
        WHERE id = ?
    ''', (q_data["question_text"], options_json, q_data["correct_answer"], q_id))
    conn.commit()
    conn.close()
    return Question(**q_data)

def delete_question(q_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM questions WHERE id = ?", (q_id,))
    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success

# --- USER FUNCTIONS ---

def get_user_by_username(username: str) -> Optional[UserInDB]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return UserInDB(**dict(row))
    return None

def create_user(username: str, hashed_password: str, role: str = "player"):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO users (username, hashed_password, role)
            VALUES (?, ?, ?)
        ''', (username, hashed_password, role))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

# Chạy init khi file được import (giữ nguyên logic v1 nhưng cập nhật bảng/data mới)
init_db()
