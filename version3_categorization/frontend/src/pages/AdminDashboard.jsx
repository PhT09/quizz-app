import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const AdminDashboard = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(null);
    const [formData, setFormData] = useState({
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: '',
        category: 'General',
        difficulty: 'Medium'
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const data = await apiService.adminGetAllQuestions();
            setQuestions(data);
            setError(null);
        } catch (err) {
            setError(err.message || 'Lỗi khi tải dữ liệu');
            if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (e, index) => {
        if (e.target.name === 'options') {
            const newOptions = [...formData.options];
            newOptions[index] = e.target.value;
            setFormData({ ...formData, options: newOptions });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await apiService.updateQuestion(isEditing, formData);
            } else {
                await apiService.createQuestion(formData);
            }
            fetchQuestions();
            resetForm();
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
            try {
                await apiService.deleteQuestion(id);
                fetchQuestions();
            } catch (err) {
                alert('Lỗi: ' + err.message);
            }
        }
    };

    const startEdit = (q) => {
        setIsEditing(q.id);
        const options = Array.isArray(q.options) ? q.options : JSON.parse(q.options);
        setFormData({
            question_text: q.question_text,
            options: options,
            correct_answer: q.correct_answer,
            category: q.category || 'General',
            difficulty: q.difficulty || 'Medium'
        });
        window.scrollTo(0, 0);
    };

    const resetForm = () => {
        setIsEditing(null);
        setFormData({
            question_text: '',
            options: ['', '', '', ''],
            correct_answer: '',
            category: 'General',
            difficulty: 'Medium'
        });
    };

    const handleLogout = () => {
        apiService.logout();
        navigate('/login');
    };

    if (loading) return <div>Đang tải dữ liệu...</div>;
    if (error) return <div>Lỗi: {error}</div>;

    return (
        <div className="admin-dashboard container">
            <header className="admin-header flex justify-between align-center card">
                <h1>Admin Dashboard v3</h1>
                <button onClick={handleLogout} className="btn btn-secondary">Đăng xuất</button>
            </header>

            {/* FORM THÊM / SỬA */}
            <section className="card form-card">
                <h2>{isEditing ? 'Sửa câu hỏi ID: ' + isEditing : 'Thêm câu hỏi mới'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Câu hỏi:</label>
                        <textarea 
                            name="question_text" 
                            className="input-field"
                            value={formData.question_text} 
                            onChange={handleFormChange} 
                            required 
                        />
                    </div>
                    
                    <div className="grid grid-2-cols gap-10">
                        <div className="form-group">
                            <label>Chủ đề (Category):</label>
                            <input 
                                type="text"
                                name="category"
                                className="input-field"
                                value={formData.category}
                                onChange={handleFormChange}
                                placeholder="Ví dụ: Python, Văn hóa..."
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Độ khó (Difficulty):</label>
                            <select 
                                name="difficulty"
                                className="input-field"
                                value={formData.difficulty}
                                onChange={handleFormChange}
                                required
                            >
                                <option value="Low">Low (Dễ)</option>
                                <option value="Medium">Medium (Trung bình)</option>
                                <option value="High">High (Khó)</option>
                            </select>
                        </div>
                    </div>

                    <div className="options-grid grid grid-2-cols">
                        {formData.options.map((opt, i) => (
                            <div key={i} className="form-group">
                                <label>Lựa chọn {i + 1}:</label>
                                <input 
                                    type="text" 
                                    name="options" 
                                    className="input-field"
                                    value={opt} 
                                    onChange={(e) => handleFormChange(e, i)} 
                                    required 
                                />
                            </div>
                        ))}
                    </div>
                    
                    <div className="form-group">
                        <label>Đáp án đúng:</label>
                        <input 
                            type="text" 
                            name="correct_answer" 
                            className="input-field"
                            value={formData.correct_answer} 
                            onChange={handleFormChange} 
                            required 
                        />
                    </div>
                    
                    <div className="form-actions flex gap-10">
                        <button type="submit" className="btn btn-primary">{isEditing ? 'Cập nhật' : 'Thêm mới'}</button>
                        {isEditing && <button type="button" onClick={resetForm} className="btn btn-secondary">Hủy</button>}
                    </div>
                </form>
            </section>

            {/* DANH SÁCH CÂU HỎI */}
            <section className="card list-card">
                <h2>Danh sách câu hỏi ({questions.length})</h2>
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Câu hỏi</th>
                                <th>Chủ đề / Độ khó</th>
                                <th>Đáp án đúng</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {questions.map((q) => (
                                <tr key={q.id}>
                                    <td>{q.id}</td>
                                    <td>
                                        <div style={{ maxWidth: '300px' }}>{q.question_text}</div>
                                    </td>
                                    <td>
                                        <span className="badge badge-category">{q.category}</span>
                                        <span className={`badge badge-difficulty ${q.difficulty.toLowerCase()}`}>
                                            {q.difficulty}
                                        </span>
                                    </td>
                                    <td><strong>{q.correct_answer}</strong></td>
                                    <td>
                                        <div className="flex gap-5">
                                            <button onClick={() => startEdit(q)} className="btn btn-outline btn-sm">Sửa</button>
                                            <button onClick={() => handleDelete(q.id)} className="btn btn-danger btn-sm">Xóa</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default AdminDashboard;
