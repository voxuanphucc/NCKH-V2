
import { useNavigate } from 'react-router-dom';
import { introduceImage, mapImage } from "@/assets/avatars";

// Import Google Fonts Roboto
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

// Custom Arrow SVG Component
const CustomArrowIcon = ({ className = "w-5 h-5", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 640"
    className={className}
    fill="currentColor"
    {...props}
  >
    <path d="M471.1 297.4C483.6 309.9 483.6 330.2 471.1 342.7L279.1 534.7C266.6 547.2 246.3 547.2 233.8 534.7C221.3 522.2 221.3 501.9 233.8 489.4L403.2 320L233.9 150.6C221.4 138.1 221.4 117.8 233.9 105.3C246.4 92.8 266.7 92.8 279.2 105.3L471.2 297.3z" />
  </svg>
);

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="w-full relative min-h-screen"
      style={{
        background: "linear-gradient(to right, #FFF1D2, #D0D6FF)",
        fontFamily: '"Roboto", sans-serif',
        fontSmooth: "antialiased",
      }}
    >
      {/* Map Background Overlay */}
       <div className="absolute inset-0">
        <img
          src={mapImage}
          alt="Map Background"
          className="w-full h-full object-cover"
        />
      </div>
      

      {/* Hero Section */}
      <div className="h-screen relative z-10">
        {/* Top Navbar Overlay */}
        <header className="absolute top-0 inset-x-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="relative flex items-center justify-between">
              {/* Brand */}
              <div className="flex items-center">
                <span className="text-base font-medium text-gray-800 drop-shadow tracking-wide">
                  Hệ thống cây gia phả gia đình
                </span>
              </div>

              {/* Centered title overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-800 drop-shadow text-center leading-tight tracking-wide">
                  <span className="block">Bắt đầu</span>
                  <span className="block">kết nối các thế hệ</span>
                </span>
              </div>

              {/* Nav actions */}
              <nav className="flex items-center gap-2 sm:gap-3 bg-white/30 backdrop-blur-md rounded-full px-2 py-1 shadow-lg">
                <button
                  onClick={() => navigate('/login')}
                  className="text-gray-800 hover:text-gray-900 hover:bg-white/30 px-4 py-2 rounded-md transition-colors cursor-pointer"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="text-gray-800 hover:text-gray-900 hover:bg-white/30 px-4 py-2 rounded-md transition-colors cursor-pointer"
                >
                  Đăng ký
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* Introduce Image + Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full mx-auto flex items-center justify-center">
            <img
              src={introduceImage}
              alt="Family Tree Introduction"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Text and "Buttons" Overlay - giữ style nhưng tĩnh */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10 pointer-events-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 max-w-6xl w-full px-2">
              {/* Left - Xây dựng lịch sử gia phả */}
              <div className="text-center">
                <h3 className="text-3xl lg:text-4xl font-bold text-black drop-shadow mb-6 leading-snug tracking-wide">
                  <span className="block">Xây dựng</span>
                  <span className="block">lịch sử gia phả</span>
                </h3>

                <div className="mb-[150px] lg:mt-[-14px]">
                  <button
                    type="button"
                    className="bg-orange-500 hover:bg-orange-600 text-white text-base font-medium px-8 py-4 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 tracking-wide cursor-default opacity-90"
                    disabled
                  >
                    Bắt đầu ngay
                    <CustomArrowIcon className="w-5 h-5 ml-2 inline" />
                  </button>
                </div>
              </div>

              {/* Right - Phục chế ảnh */}
              <div className="text-center">
                <h3 className="text-3xl lg:text-4xl font-bold text-black drop-shadow mb-6 leading-snug tracking-wide">
                  <span className="block">Phục chế ảnh</span>
                  <span className="block">nhờ công nghệ AI</span>
                </h3>

                <div className="mb-[150px] lg:mt-[-14px]">
                  <button
                    type="button"
                    className="bg-purple-500 hover:bg-purple-600 text-white text-base font-medium px-8 py-4 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 tracking-wide cursor-default opacity-90"
                    disabled
                  >
                    Bắt đầu ngay
                    <CustomArrowIcon className="w-5 h-5 ml-2 inline" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Introduction Section */}
      <section id="introduction-section" className="relative z-10 py-16">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ... (phần này giữ nguyên như cũ, không có button tương tác) ... */}

          {/* Phần cuối - Bắt đầu ngay hôm nay */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 leading-tight tracking-wide">
                Tại sao chọn hệ thống của chúng tôi?
              </h3>
              {/* nội dung giữ nguyên */}
            </div>

            <div className="bg-gradient-to-br from-white/90 to-blue-50/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
              <h4 className="text-xl font-bold text-gray-900 mb-4 leading-tight tracking-wide">
                Bắt đầu ngay hôm nay
              </h4>
              <p className="text-base text-gray-700 mb-6 leading-relaxed font-normal">
                Tham gia cùng hàng nghìn gia đình đã tin tưởng sử dụng hệ thống của chúng tôi để xây dựng và bảo tồn lịch sử gia đình.
              </p>
              <div className="space-y-3 pointer-events-none">
                <button
                  type="button"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg font-medium text-base tracking-wide py-3 rounded-md cursor-default opacity-90"
                  disabled
                >
                  Tạo tài khoản miễn phí
                </button>
                <button
                  type="button"
                  className="w-full border border-gray-400 bg-white/70 hover:bg-white/90 shadow-md font-medium text-base tracking-wide py-3 rounded-md cursor-default opacity-90"
                  disabled
                >
                  Xem demo trước
                </button>
              </div>
            </div>
          </div>

          {/* Statistics - giữ nguyên */}
        </div>
      </section>
    </div>
  );
};

