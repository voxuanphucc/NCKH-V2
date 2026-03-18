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
        // Get token from URL query parameters
        // Backend returns: ?token=jwt_token hoặc ?access_token=jwt_token
        const token = searchParams.get('token');
        const accessToken = searchParams.get('access_token');
        const finalToken = token || accessToken;

        if (!finalToken) {
          showErrorToast('Không nhận được token từ OAuth provider');
          navigate('/login');
          return;
        }

        // Validate token format (should be JWT)
        if (!finalToken.includes('.')) {
          showErrorToast('Token không hợp lệ');
          navigate('/login');
          return;
        }

        // Store the token in localStorage
        localStorage.setItem('accessToken', finalToken);

        // The login() function will call getMe() API to fetch full user info
        try {
          await login({ accessToken: finalToken, tokenType: 'Bearer' } as any);
          // Redirect to dashboard after successful login
          navigate('/dashboard');
        } catch (err) {
          console.error('Error fetching user info:', err);
          // Clear token if user fetch fails
          localStorage.removeItem('accessToken');
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
