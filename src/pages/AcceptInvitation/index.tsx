import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, LoaderIcon, HomeIcon } from 'lucide-react';
import { invitationService } from '../../services/invitationService';
import { showErrorToast } from '../../utils/validation';

export function AcceptInvitationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    acceptInvitation();
  }, []);

  const acceptInvitation = async () => {
    try {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('Token lời mời không hợp lệ');
        return;
      }

      const res = await invitationService.acceptInvitation(token);
      if (res.success) {
        setStatus('success');
        setMessage('Bạn đã chấp nhận lời mời thành công!');
        
        // Redirect sau 2 giây
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err: unknown) {
      setStatus('error');
      setMessage(
        err instanceof Error
          ? err.message
          : 'Có lỗi xảy ra khi chấp nhận lời mời. Vui lòng thử lại.'
      );
      showErrorToast(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 to-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
          {/* Icon */}
          {status === 'loading' && (
            <div className="inline-flex items-center justify-center">
              <LoaderIcon className="w-16 h-16 text-heritage-gold animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="inline-flex items-center justify-center">
              <CheckCircleIcon className="w-16 h-16 text-green-500" />
            </div>
          )}
          {status === 'error' && (
            <div className="inline-flex items-center justify-center">
              <XCircleIcon className="w-16 h-16 text-red-500" />
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl font-bold text-warm-800 font-heading">
            {status === 'loading' && 'Đang xử lý lời mời...'}
            {status === 'success' && 'Chấp nhận thành công!'}
            {status === 'error' && 'Có lỗi xảy ra'}
          </h1>

          {/* Message */}
          <p className="text-warm-600">
            {message}
          </p>

          {/* Status Details */}
          {status === 'success' && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-sm text-green-700">
                🎉 Bạn đã được thêm vào cây gia phả. Sẽ chuyển hướng sau ít giây...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <p className="text-sm text-red-700">
                ❌ Link lời mời có thể hết hạn hoặc không hợp lệ. Vui lòng liên hệ người gửi lời mời.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 bg-heritage-gold text-white font-medium rounded-xl hover:bg-heritage-gold/90 transition-colors flex items-center justify-center gap-2">
              <HomeIcon className="w-4 h-4" />
              Về Trang chủ
            </button>
          </div>

          {/* Footer */}
          <p className="text-xs text-warm-400">
            Nếu bạn gặp vấn đề, vui lòng liên hệ người quản lý cây gia phả.
          </p>
        </div>
      </div>
    </div>
  );
}
