import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            await apiService.register(username, password);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.message || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container card">
            <div className="card-header text-center">
                <h2>Đăng ký tài khoản</h2>
                <p>Tham gia Quiz App ngay hôm nay</p>
            </div>
            
            {success ? (
                <div className="success-message text-center" style={{ color: 'var(--success-color)', margin: '20px 0' }}>
                    <p>Đăng ký thành công! Đang chuyển hướng đến trang đăng nhập...</p>
                </div>
            ) : (
                <form onSubmit={handleRegister} className="login-form">
                    <div className="form-group">
                        <label>Tên đăng nhập:</label>
                        <input
                            type="text"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Mật khẩu:</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Xác nhận mật khẩu:</label>
                        <input
                            type="password"
                            className="input-field"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    {error && <div className="error-message">{error}</div>}
                    
                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="btn btn-primary btn-block" 
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : 'Đăng ký'}
                        </button>
                    </div>
                </form>
            )}
            
            <div className="login-footer text-center">
                <p>Đã có tài khoản? <Link to="/login" style={{ color: 'var(--primary-light)' }}>Đăng nhập ngay</Link></p>
            </div>
        </div>
    );
};

export default Register;
