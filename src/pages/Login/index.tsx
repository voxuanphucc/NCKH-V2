import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TreesIcon, EyeIcon, EyeOffIcon, LoaderIcon } from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { showSuccessToast } from '../../utils/validation';
import type { Gender } from '../../types/common';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Login fields
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  // Register fields
  const [regUserName, setRegUserName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGender, setRegGender] = useState<Gender>('MALE');
  const [regDob, setRegDob] = useState('');
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login({
        userName,
        password
      });
      if (res.success) {
        showSuccessToast('Đăng nhập thành công');
        await login(res.data);  // Wait for user data to be fetched
        navigate('/dashboard');
      } else {
        setError(res.message || 'Đăng nhập thất bại');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ?
        err.message :
        'Đăng nhập thất bại. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (regPassword !== regConfirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.register({
        userName: regUserName,
        password: regPassword,
        email: regEmail,
        firstName: regFirstName,
        lastName: regLastName,
        phoneNumber: regPhone,
        gender: regGender,
        dateOfBirth: regDob
      });
      if (res.success) {
        showSuccessToast('Đăng ký thành công');
        await login(res.data);  // Wait for user data to be fetched
        navigate('/dashboard');
      } else {
        setError(res.message || 'Đăng ký thất bại');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ?
        err.message :
        'Đăng ký thất bại. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen w-full bg-cream texture-overlay flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-warm-800 relative overflow-hidden flex-col justify-center items-center p-12">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="tree-pattern"
                x="0"
                y="0"
                width="120"
                height="120"
                patternUnits="userSpaceOnUse">
                
                <circle cx="60" cy="20" r="3" fill="#C49A3C" />
                <line
                  x1="60"
                  y1="23"
                  x2="60"
                  y2="50"
                  stroke="#C49A3C"
                  strokeWidth="1.5" />
                
                <line
                  x1="60"
                  y1="50"
                  x2="35"
                  y2="75"
                  stroke="#C49A3C"
                  strokeWidth="1" />
                
                <line
                  x1="60"
                  y1="50"
                  x2="85"
                  y2="75"
                  stroke="#C49A3C"
                  strokeWidth="1" />
                
                <circle cx="35" cy="78" r="2.5" fill="#C49A3C" />
                <circle cx="85" cy="78" r="2.5" fill="#C49A3C" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tree-pattern)" />
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-heritage-gold/20 flex items-center justify-center">
            <TreesIcon className="w-10 h-10 text-heritage-gold" />
          </div>
          <h1 className="font-heading text-4xl font-bold text-cream mb-4 leading-tight">
            Gìn giữ giá trị
            <br />
            gia đình
          </h1>
          <p className="text-warm-300 text-lg leading-relaxed">
            Xây dựng và lưu giữ cây gia phả của gia đình bạn. Kết nối thế hệ,
            truyền thừa giá trị.
          </p>
          <div className="mt-12 flex items-center justify-center gap-8 text-warm-400">
            <div className="text-center">
              <p className="text-2xl font-bold text-heritage-gold-light font-heading">
                ∞
              </p>
              <p className="text-xs mt-1">Thế hệ</p>
            </div>
            <div className="w-px h-10 bg-warm-600" />
            <div className="text-center">
              <p className="text-2xl font-bold text-heritage-gold-light font-heading">
                ∞
              </p>
              <p className="text-xs mt-1">Thành viên</p>
            </div>
            <div className="w-px h-10 bg-warm-600" />
            <div className="text-center">
              <p className="text-2xl font-bold text-heritage-gold-light font-heading">
                ∞
              </p>
              <p className="text-xs mt-1">Ký ức</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-warm-800 flex items-center justify-center">
              <TreesIcon className="w-7 h-7 text-heritage-gold" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-warm-800">
              Gia Phả
            </h1>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-warm-100 rounded-xl p-1 mb-8">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isLogin ? 'bg-white text-warm-800 shadow-sm' : 'text-warm-500 hover:text-warm-700'}`}>
              
              Đăng nhập
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${!isLogin ? 'bg-white text-warm-800 shadow-sm' : 'text-warm-500 hover:text-warm-700'}`}>
              
              Đăng ký
            </button>
          </div>

          {error &&
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 animate-fade-in-up">
              {error}
            </div>
          }

          {isLogin ?
          <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Tên đăng nhập
                </label>
                <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all"
                placeholder="Nhập tên đăng nhập" />
              
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all pr-12"
                  placeholder="Nhập mật khẩu" />
                
                  <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-warm-400 hover:text-warm-600 transition-colors"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                  
                    {showPassword ?
                  <EyeOffIcon className="w-5 h-5" /> :

                  <EyeIcon className="w-5 h-5" />
                  }
                  </button>
                </div>
              </div>

              <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-warm-800 text-cream font-medium rounded-xl hover:bg-warm-700 focus:outline-none focus:ring-2 focus:ring-warm-800/50 focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              
                {loading && <LoaderIcon className="w-4 h-4 animate-spin" />}
                Đăng nhập
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-warm-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-cream px-3 text-sm text-warm-400">
                    hoặc
                  </span>
                </div>
              </div>

              <button
              type="button"
              onClick={() =>
              window.location.href = authService.googleAuthUrl()
              }
              className="w-full py-3 bg-white border border-warm-200 text-warm-700 font-medium rounded-xl hover:bg-warm-50 focus:outline-none focus:ring-2 focus:ring-warm-300/50 transition-all flex items-center justify-center gap-3">
              
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4" />
                
                  <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853" />
                
                  <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05" />
                
                  <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335" />
                
                </svg>
                Đăng nhập bằng Google
              </button>
            </form> :

          <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    Họ
                  </label>
                  <input
                  type="text"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all"
                  placeholder="Nguyễn" />
                
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    Tên
                  </label>
                  <input
                  type="text"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all"
                  placeholder="Văn A" />
                
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Tên đăng nhập
                </label>
                <input
                type="text"
                value={regUserName}
                onChange={(e) => setRegUserName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all"
                placeholder="nguyenvana" />
              
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Email
                </label>
                <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all"
                placeholder="email@example.com" />
              
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Số điện thoại
                </label>
                <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all"
                placeholder="0901234567" />
              
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    Giới tính
                  </label>
                  <select
                  value={regGender}
                  onChange={(e) => setRegGender(e.target.value as Gender)}
                  className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all">
                  
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">
                    Ngày sinh
                  </label>
                  <input
                  type="date"
                  value={regDob}
                  onChange={(e) => setRegDob(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all" />
                
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Mật khẩu
                </label>
                <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all"
                placeholder="Tối thiểu 6 ký tự" />
              
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">
                  Xác nhận mật khẩu
                </label>
                <input
                type="password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all"
                placeholder="Nhập lại mật khẩu" />
              
              </div>

              <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-warm-800 text-cream font-medium rounded-xl hover:bg-warm-700 focus:outline-none focus:ring-2 focus:ring-warm-800/50 focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              
                {loading && <LoaderIcon className="w-4 h-4 animate-spin" />}
                Tạo tài khoản
              </button>
            </form>
          }
        </div>
      </div>
    </div>);

}