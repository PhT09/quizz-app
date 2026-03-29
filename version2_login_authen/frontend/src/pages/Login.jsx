import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await apiService.login(username, password);
      // Chuyển hướng theo role
      if (data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/quiz');
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container card">
      <div className="card-header text-center">
        <h2>Quiz App v2</h2>
        <p>Vui lòng đăng nhập để tiếp tục</p>
      </div>
      
      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label htmlFor="username">Tên đăng nhập:</label>
          <input
            type="text"
            id="username"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Mật khẩu:</label>
          <input
            type="password"
            id="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary btn-block" 
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </div>
      </form>
      
      <div className="login-footer text-center">
        <p>Chưa có tài khoản? <Link to="/register" style={{ color: 'var(--primary-light)' }}>Đăng ký ngay</Link></p>
        <p style={{ marginTop: '10px' }}>Gợi ý: admin/admin123 hoặc player/player123</p>
      </div>
    </div>
  );
};

export default Login;
