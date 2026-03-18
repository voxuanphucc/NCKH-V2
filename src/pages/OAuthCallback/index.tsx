import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoaderIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { showErrorToast } from '../../utils/validation';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get the token from URL query parameters
        const token = searchParams.get('token');
        const accessToken = searchParams.get('access_token');
        const finalToken = token || accessToken;

        if (!finalToken) {
          showErrorToast('Không nhận được token từ OAuth provider');
          navigate('/login');
          return;
        }

        // Store the token in localStorage
        localStorage.setItem('accessToken', finalToken);

        // Parse the token to get user info if JWT (optional)
        // The login() function will call getMe() API to get full user info
        try {
          await login({ accessToken: finalToken, tokenType: 'Bearer' } as any);
          navigate('/dashboard');
        } catch (err) {
          showErrorToast('Không thể tải thông tin người dùng');
          navigate('/login');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        showErrorToast('Đăng nhập Google thất bại');
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-cream">
      <div className="text-center">
        <LoaderIcon className="w-12 h-12 text-heritage-gold animate-spin mx-auto mb-4" />
        <p className="text-warm-700 font-medium">Đang xử lý đăng nhập...</p>
        <p className="text-warm-500 text-sm mt-2">Vui lòng chờ một chút</p>
      </div>
    </div>
  );
}
