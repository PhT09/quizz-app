"""
database.py - Tầng Dữ liệu (SQLite3) - Version 3
============================================
Hỗ trợ:
- Bảng 'questions' (thêm category, difficulty)
- Bảng 'users'
- Filtering cho questions.
- Lấy danh sách category duy nhất.
"""

import sqlite3
import json
import os
from schemas import Question, UserInDB, QuestionCreate, QuestionUpdate
from typing import List, Optional

# Lấy dữ liệu mẫu từ questions.py
from questions import QUESTIONS_DATA

DB_FILE = os.path.join(os.path.dirname(__file__), "quiz_v3.db")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Tạo bảng questions với category và difficulty
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question_text TEXT NOT NULL,
            options TEXT NOT NULL,
            correct_answer TEXT NOT NULL,
            category TEXT NOT NULL,
            difficulty TEXT NOT NULL
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
            cat = q.get("category", "General")
            diff = q.get("difficulty", "Medium")
            
            cursor.execute('''
                INSERT INTO questions (question_text, options, correct_answer, category, difficulty)
                VALUES (?, ?, ?, ?, ?)
            ''', (q["question_text"], options_json, q["correct_answer"], cat, diff))
        conn.commit()

    # Nạp dummy users
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

def get_all_questions(category: Optional[str] = None, difficulty: Optional[str] = None) -> List[Question]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM questions WHERE 1=1"
    params = []
    
    if category:
        query += " AND category = ?"
        params.append(category)
    if difficulty:
        query += " AND difficulty = ?"
        params.append(difficulty)
        
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    questions = []
    for row in rows:
        options = json.loads(row["options"])
        q = Question(
            id=row["id"],
            question_text=row["question_text"],
            options=options,
            correct_answer=row["correct_answer"],
            category=row["category"],
            difficulty=row["difficulty"]
        )
        questions.append(q)
    conn.close()
    return questions

def get_all_categories() -> List[str]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT category FROM questions ORDER BY category ASC")
    rows = cursor.fetchall()
    categories = [row["category"] for row in rows]
    conn.close()
    return categories

def create_question(q: QuestionCreate) -> Question:
    conn = get_db_connection()
    cursor = conn.cursor()
    options_json = json.dumps(q.options, ensure_ascii=False)
    cursor.execute('''
        INSERT INTO questions (question_text, options, correct_answer, category, difficulty)
        VALUES (?, ?, ?, ?, ?)
    ''', (q.question_text, options_json, q.correct_answer, q.category, q.difficulty))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return Question(id=new_id, **q.model_dump())

def update_question(q_id: int, q_update: QuestionUpdate) -> Optional[Question]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM questions WHERE id = ?", (q_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    
    q_data = dict(row)
    q_data["options"] = json.loads(q_data["options"])
    
    update_fields = q_update.model_dump(exclude_unset=True)
    for key, value in update_fields.items():
        q_data[key] = value
    
    options_json = json.dumps(q_data["options"], ensure_ascii=False)
    cursor.execute('''
        UPDATE questions 
        SET question_text = ?, options = ?, correct_answer = ?, category = ?, difficulty = ?
        WHERE id = ?
    ''', (q_data["question_text"], options_json, q_data["correct_answer"], q_data["category"], q_data["difficulty"], q_id))
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

# Initialize DB on import
init_db()
