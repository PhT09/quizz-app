import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

const Register = ({ theme, toggleTheme }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
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
      alert('Đăng ký thành công! Hãy đăng nhập.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Lỗi khi đăng ký');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container card">
      <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
         <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
         <div style={{textAlign: 'right'}}>
            <h2 style={{margin: 0}}>Đăng ký</h2>
            <p style={{margin: 0, fontSize: '0.9rem'}}>Tạo tài khoản người chơi</p>
         </div>
      </header>
      
      <form onSubmit={handleRegister} className="login-form">
        <div className="form-group">
          <label htmlFor="username">Tên đăng nhập:</label>
          <input
            type="text"
            id="username"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
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
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Xác nhận mật khẩu:</label>
          <input
            type="password"
            id="confirmPassword"
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
      
      <div className="login-footer text-center">
        <p>Đã có tài khoản? <Link to="/login" style={{ color: 'var(--primary-light)' }}>Đăng nhập</Link></p>
      </div>
    </div>
  );
};

export default Register;
