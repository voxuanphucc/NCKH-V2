import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  SaveIcon,
  LoaderIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon } from
'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { showSuccessToast } from '../../utils/validation';
import type { Gender } from '../../types/common';
export function ProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  // Profile form
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [gender, setGender] = useState<Gender>(user?.gender || 'MALE');
  const [dob, setDob] = useState(user?.dateOfBirth || '');
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  // Password form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwError, setPwError] = useState('');

  // Sync tab with URL hash so sidebar links don't "stick" together
  useEffect(() => {
    const hash = (location.hash || '').toLowerCase();
    if (hash === '#password') setActiveTab('password');
    else setActiveTab('profile');
  }, [location.hash]);
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileError('');
    try {
      await userService.updateMe({
        firstName,
        lastName,
        phoneNumber: phone,
        gender,
        dateOfBirth: dob,
        avatarUrl: user?.avatarUrl || ''
      });
      await refreshUser();
      showSuccessToast('Cập nhật thông tin thành công!');
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (newPassword !== confirmPassword) {
      setPwError('Mật khẩu xác nhận không khớp');
      return;
    }
    setChangingPw(true);
    try {
      await userService.changePassword({
        oldPassword,
        newPassword,
        confirmPassword
      });
      showSuccessToast('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'Đổi mật khẩu thất bại');
    } finally {
      setChangingPw(false);
    }
  };
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-heading text-3xl font-bold text-warm-800 mb-2">
        Hồ sơ cá nhân
      </h1>
      <p className="text-warm-500 mb-8">Quản lý thông tin tài khoản của bạn</p>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-warm-200/60 overflow-hidden mb-6">
        <div className="h-24 bg-gradient-to-br from-warm-700 to-warm-800 relative">
          <div className="absolute -bottom-8 left-6">
            <div className="w-16 h-16 rounded-2xl border-4 border-white bg-warm-100 flex items-center justify-center shadow-lg">
              {user?.avatarUrl ?
              <img
                src={user.avatarUrl}
                alt=""
                className="w-16 h-16 rounded-2xl object-cover" /> :


              <UserIcon className="w-7 h-7 text-warm-400" />
              }
            </div>
          </div>
        </div>
        <div className="pt-12 px-6 pb-4">
          <h2 className="font-heading text-xl font-bold text-warm-800">
            {user?.fullName || user?.userName}
          </h2>
          <div className="flex items-center gap-4 mt-1 text-sm text-warm-400">
            <span className="flex items-center gap-1">
              <MailIcon className="w-3.5 h-3.5" />
              {user?.email}
            </span>
            {user?.phoneNumber &&
            <span className="flex items-center gap-1">
                <PhoneIcon className="w-3.5 h-3.5" />
                {user.phoneNumber}
              </span>
            }
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-warm-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => {
            setActiveTab('profile');
            navigate('/profile');
          }}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'profile' ? 'bg-white text-warm-800 shadow-sm' : 'text-warm-500 hover:text-warm-700'}`}>
          
          Thông tin
        </button>
        <button
          onClick={() => {
            setActiveTab('password');
            navigate('/profile#password');
          }}
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'password' ? 'bg-white text-warm-800 shadow-sm' : 'text-warm-500 hover:text-warm-700'}`}>
          
          Đổi mật khẩu
        </button>
      </div>

      {activeTab === 'profile' ?
      <form
        onSubmit={handleSaveProfile}
        className="bg-white rounded-2xl border border-warm-200/60 p-6 space-y-5">
        
          {profileError &&
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {profileError}
            </div>
        }

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                Họ
              </label>
              <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all" />
            
            </div>
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                Tên
              </label>
              <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all" />
            
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Số điện thoại
            </label>
            <div className="relative">
              <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all" />
            
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1.5">
                Giới tính
              </label>
              <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
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
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all" />
            
            </div>
          </div>

          <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-warm-800 text-cream font-medium rounded-xl hover:bg-warm-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          
            {saving ?
          <LoaderIcon className="w-4 h-4 animate-spin" /> :

          <SaveIcon className="w-4 h-4" />
          }
            Lưu thay đổi
          </button>
        </form> :

      <form
        onSubmit={handleChangePassword}
        className="bg-white rounded-2xl border border-warm-200/60 p-6 space-y-5">
        
          {pwError &&
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {pwError}
            </div>
        }

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
              type={showOld ? 'text' : 'password'}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full pl-11 pr-12 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all" />
            
              <button
              type="button"
              onClick={() => setShowOld(!showOld)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-warm-400">
              
                {showOld ?
              <EyeOffIcon className="w-4 h-4" /> :

              <EyeIcon className="w-4 h-4" />
              }
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Mật khẩu mới
            </label>
            <div className="relative">
              <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full pl-11 pr-12 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all" />
            
              <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-warm-400">
              
                {showNew ?
              <EyeOffIcon className="w-4 h-4" /> :

              <EyeIcon className="w-4 h-4" />
              }
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all" />
            
            </div>
          </div>

          <button
          type="submit"
          disabled={changingPw}
          className="w-full py-3 bg-warm-800 text-cream font-medium rounded-xl hover:bg-warm-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          
            {changingPw ?
          <LoaderIcon className="w-4 h-4 animate-spin" /> :

          <LockIcon className="w-4 h-4" />
          }
            Đổi mật khẩu
          </button>
        </form>
      }
    </div>);

}