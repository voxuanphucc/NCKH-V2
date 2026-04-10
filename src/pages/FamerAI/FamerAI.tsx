import { useState, useEffect } from "react";

const LOGO_SRC = "https://i.imgur.com/placeholder-logo.png"; // replaced below via inline SVG

// ─── Inline base64 images loaded from uploaded files ───
// We reference them by public path since this runs in the artifact renderer
const IMAGES = {
  logo: "src/assets/avatars/tải_xuống-removebg-preview 1.png",
  bg: "./src/assets/avatars/Copilot_20260319_180448_1.png",
  cornPlant: "src/assets/avatars/Copilot_20260319_193116 2.png",
  cornCobs: "src/assets/avatars/image 2.png",
  seedling: "src/assets/avatars/noto_seedling.png",
};

const NAV_ITEMS = ["Trang Chủ", "Dịch vụ", "Tin tức", "Triển khai", "Kế Hoạch"];

const styles = {
  // ── Google Fonts inject ──
  "@import": `@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&display=swap');`,
};

export default function FamerAI() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .fai-root {
          font-family: 'Roboto', sans-serif;
          background: #000;
          overflow: hidden;
        }

        /* ── Keyframes ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .anim-0 { animation: fadeUp 0.65s 0.0s ease both; }
        .anim-1 { animation: fadeUp 0.65s 0.15s ease both; }
        .anim-2 { animation: fadeUp 0.65s 0.28s ease both; }
        .anim-3 { animation: fadeUp 0.75s 0.42s ease both; }
        .anim-nav { animation: fadeIn 0.5s 0s ease both; }

        /* ── NAVBAR ── */
        .fai-nav {
          position: absolute;
          top: 0; left: 0; right: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 48px;
        }
        .fai-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          cursor: pointer;
        }
        .fai-logo-img {
          width: 44px;
          height: 44px;
          object-fit: contain;
        }
        .fai-logo-text {
          font-family: 'Roboto', sans-serif;
          font-weight: 700;
          font-size: 22px;
          color: #e8d44d;
          letter-spacing: 0.4px;
        }
        .fai-nav-links {
          display: flex;
          align-items: center;
          gap: 2px;
          list-style: none;
        }
        .fai-nav-links li a {
          font-family: 'Roboto', sans-serif;
          font-size: 15px;
          font-weight: 500;
          color: #e8d44d;
          text-decoration: none;
          padding: 8px 14px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: background 0.2s;
        }
        .fai-nav-links li a:hover { background: rgba(255,255,255,0.13); }
        .fai-chevron { font-size: 10px; opacity: 0.85; }

        .fai-btn-register {
          font-family: 'Roboto', sans-serif;
          font-weight: 700;
          font-size: 15px;
          background: #e8d44d;
          color: #1a1a1a;
          border: none;
          padding: 13px 26px;
          border-radius: 9px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
          white-space: nowrap;
        }
        .fai-btn-register:hover { background: #f5e050; transform: translateY(-1px); }

        /* ── HERO ── */
        .fai-hero {
          position: relative;
          width: 100%;
          height: 100vh;
          min-height: 620px;
          overflow: hidden;
        }
        .fai-hero-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
        .fai-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            108deg,
            rgba(160,145,15,0.42) 0%,
            rgba(90,130,20,0.22) 55%,
            transparent 100%
          );
        }

        /* ── HERO CONTENT ── */
        .fai-hero-content {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          padding: 0 64px;
        }
        .fai-hero-left {
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        /* Headline row */
        .fai-headline-row {
          display: flex;
          align-items: center;
          gap: 0;
        }

        /* Giant AI */
        .fai-big-ai {
          font-family: 'Playfair Display', serif;
          font-size: clamp(130px, 16vw, 220px);
          font-weight: 900;
          color: rgba(232, 218, 130, 0.82);
          line-height: 0.85;
          letter-spacing: -3px;
          position: relative;
          flex-shrink: 0;
          user-select: none;
        }

        /* Water drop icon above the dot of "i" */
        .fai-waterdrop {
          position: absolute;
          top: 6px;
          right: 10px;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fai-waterdrop svg { width: 22px; height: 22px; }

        /* Divider */
        .fai-divider {
          width: 3px;
          height: 150px;
          background: rgba(235,220,130,0.72);
          margin: 0 28px 0 18px;
          flex-shrink: 0;
        }

        /* Sub headline */
        .fai-subhead {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .fai-subhead-line {
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px, 5.2vw, 70px);
          font-weight: 700;
          color: #ffffff;
          line-height: 1.08;
          letter-spacing: 2px;
          text-shadow: 0 2px 14px rgba(0,0,0,0.32);
        }

        /* CTA button */
        .fai-btn-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(215,196,48,0.9);
          color: #1a1a1a;
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          padding: 15px 32px;
          border-radius: 40px;
          text-decoration: none;
          width: fit-content;
          border: none;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          box-shadow: 0 4px 22px rgba(0,0,0,0.28);
        }
        .fai-btn-cta:hover { background: #f0dc50; transform: translateY(-2px); }
        .fai-btn-cta img { width: 22px; height: 22px; object-fit: contain; }

        /* ── Corn plant deco bottom-center ── */
        .fai-corn-deco {
          position: absolute;
          bottom: -24px;
          left: 50%;
          transform: translateX(-50%);
          width: clamp(170px, 17vw, 240px);
          object-fit: contain;
          pointer-events: none;
          filter: drop-shadow(0 10px 24px rgba(0,0,0,0.38));
        }

        /* ── Floating card right ── */
        .fai-card {
          position: absolute;
          right: 60px;
          bottom: 90px;
          width: clamp(250px, 21vw, 330px);
          background: rgba(205,195,130,0.42);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.22);
        }
        .fai-card-img {
          width: 100%;
          height: 200px;
          object-fit: contain;
          padding: 14px 14px 0;
          display: block;
        }
        .fai-card-label {
          font-family: 'Playfair Display', serif;
          font-size: clamp(18px, 1.9vw, 26px);
          font-weight: 700;
          color: #ffffff;
          text-align: center;
          padding: 18px 16px 24px;
          text-shadow: 0 1px 8px rgba(0,0,0,0.28);
          line-height: 1.3;
        }
      `}</style>

      <div className="fai-root">
        <section className="fai-hero">

          {/* Background */}
          <img
            className="fai-hero-bg"
            src={IMAGES.bg}
            alt="Corn field"
          />
          <div className="fai-hero-overlay" />

          {/* ── Navbar ── */}
          <nav className="fai-nav anim-nav">
            <a className="fai-logo" href="#">
              <img className="fai-logo-img" src={IMAGES.logo} alt="FamerAI logo" />
              <span className="fai-logo-text">FamerAI</span>
            </a>

            <ul className="fai-nav-links">
              {NAV_ITEMS.map((item) => (
                <li key={item}>
                  <a href="#">
                    {item} <span className="fai-chevron">▾</span>
                  </a>
                </li>
              ))}
            </ul>

            <a className="fai-btn-register" href="#">
              Tạo Tài Khoản <span style={{ fontSize: 16 }}>↗</span>
            </a>
          </nav>

          {/* ── Hero Content ── */}
          <div className="fai-hero-content">
            <div className="fai-hero-left">

              {/* Headline */}
              <div className="fai-headline-row anim-1">
                <div className="fai-big-ai">
                  AI
                  {/* Water drop over the i-dot */}
                  <span className="fai-waterdrop">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 2C12 2 5 10.5 5 15a7 7 0 0014 0C19 10.5 12 2 12 2Z"
                        fill="rgba(232,210,60,0.92)"
                        stroke="rgba(255,240,100,0.5)"
                        strokeWidth="0.5"
                      />
                    </svg>
                  </span>
                </div>

                <div className="fai-divider" />

                <div className="fai-subhead">
                  <span className="fai-subhead-line">MÙA VỤ</span>
                  <span className="fai-subhead-line">KHỞI SẮC</span>
                </div>
              </div>

              {/* CTA */}
              <button className="fai-btn-cta anim-2">
                <img src={IMAGES.seedling} alt="seedling" />
                Tạo mùa vụ ngay&nbsp; ↗
              </button>

            </div>
          </div>

          {/* Corn plant deco */}
          <img
            className="fai-corn-deco anim-3"
            src={IMAGES.cornPlant}
            alt="Corn plants"
          />

          {/* Floating card */}
          <div className="fai-card anim-3">
            <img className="fai-card-img" src={IMAGES.cornCobs} alt="Corn cobs" />
            <div className="fai-card-label">
              Nông dân<br />vươn mình
            </div>
          </div>

        </section>
      </div>
    </>
  );
}