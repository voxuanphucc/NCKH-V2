import { useEffect, useState } from 'react';
import { XIcon, UserIcon, MailIcon, PhoneIcon, CalendarIcon, LoaderIcon } from 'lucide-react';
import { userService } from '../../services/userService';
import type { User } from '../../types/user';

interface ViewUserInfoPanelProps {
  userId: string;
  onClose: () => void;
}

export function ViewUserInfoPanel({ userId, onClose }: ViewUserInfoPanelProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await userService.getUser(userId);
        if (res.success) {
          setUser(res.data);
        } else {
          setError(res.message || 'Không thể tải thông tin người dùng');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const formatDate = (date?: string) => {
    if (!date) return 'Chưa cập nhật';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-warm-900/50 animate-fade-in"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden animate-fade-in-up flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-warm-100">
          <h2 className="font-heading text-lg font-semibold text-warm-800">
            Thông tin người dùng
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <LoaderIcon className="w-8 h-8 text-heritage-gold animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          ) : user ? (
            <div className="space-y-6">
              {/* Avatar & Basic Info */}
              <div className="text-center pb-4 border-b border-warm-100">
                <div className="w-20 h-20 rounded-full border-4 border-heritage-gold/30 bg-warm-100 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-10 h-10 text-warm-400" />
                  )}
                </div>
                <h3 className="font-heading text-xl font-semibold text-warm-900">
                  {user.fullName}
                </h3>
                <p className="text-sm text-warm-500 mt-1">@{user.userName}</p>
                {user.role && (
                  <div className="mt-2">
                    <span className="inline-block px-3 py-1 bg-heritage-gold/10 text-heritage-gold text-xs font-medium rounded-full">
                      {user.role}
                    </span>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-warm-900 text-sm">Thông tin liên hệ</h4>

                <div className="flex items-start gap-3">
                  <MailIcon className="w-5 h-5 text-heritage-gold mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-warm-500 font-medium">Email</p>
                    <p className="text-warm-900 text-sm mt-1 break-all">{user.email}</p>
                  </div>
                </div>

                {user.phoneNumber && (
                  <div className="flex items-start gap-3">
                    <PhoneIcon className="w-5 h-5 text-heritage-gold mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-warm-500 font-medium">Điện thoại</p>
                      <p className="text-warm-900 text-sm mt-1">{user.phoneNumber}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-warm-900 text-sm">Thông tin cá nhân</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-warm-50 rounded-lg">
                    <p className="text-xs text-warm-500 font-medium mb-1">Giới tính</p>
                    <p className="text-warm-900 text-sm font-medium">
                      {user.gender === 'MALE'
                        ? 'Nam'
                        : user.gender === 'FEMALE'
                          ? 'Nữ'
                          : 'Khác'}
                    </p>
                  </div>

                  {user.dateOfBirth && (
                    <div className="p-3 bg-warm-50 rounded-lg">
                      <p className="text-xs text-warm-500 font-medium mb-1">Ngày sinh</p>
                      <p className="text-warm-900 text-sm font-medium">
                        {formatDate(user.dateOfBirth)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Account Status */}
              <div className="space-y-4 pt-4 border-t border-warm-100">
                <h4 className="font-semibold text-warm-900 text-sm">Trạng thái tài khoản</h4>

                <div className="flex items-center justify-between p-3 bg-warm-50 rounded-lg">
                  <p className="text-sm text-warm-700">Trạng thái</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      user.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {user.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </div>

                {user.createdAt && (
                  <div className="flex items-start gap-3 p-3 bg-warm-50 rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-heritage-gold mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs text-warm-500 font-medium">Ngày tham gia</p>
                      <p className="text-warm-900 text-sm mt-1 font-medium">
                        {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
