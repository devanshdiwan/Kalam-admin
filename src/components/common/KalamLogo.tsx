import React from 'react';

interface KalamLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  subtitle?: string;
}

export const KalamLogo: React.FC<KalamLogoProps> = ({ 
  size = 48, 
  className = '', 
  showText = false,
  subtitle = 'Admin Panel'
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div 
        className="relative flex items-center justify-center shrink-0 drop-shadow-md transition-transform duration-200 hover:scale-105"
        style={{ width: size, height: size }}
      >
        <svg 
          viewBox="0 0 200 200" 
          width={size} 
          height={size} 
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="35%" stopColor="#F59E0B" />
              <stop offset="70%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
            
            <linearGradient id="innerBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2E1065" />
              <stop offset="50%" stopColor="#1E1B4B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            <path id="kalamTopArc" d="M 32 100 A 68 68 0 0 1 168 100" fill="none" />
            <path id="kalamBottomArc" d="M 166 100 A 66 66 0 0 1 34 100" fill="none" />
            
            <clipPath id="centerPortraitClip">
              <circle cx="100" cy="100" r="52" />
            </clipPath>
          </defs>

          {/* Outer Scalloped / Beaded Border */}
          <circle cx="100" cy="100" r="97" fill="#1E293B" stroke="url(#goldGradient)" strokeWidth="4" />
          <circle cx="100" cy="100" r="92" fill="none" stroke="#FDE68A" strokeWidth="1" strokeDasharray="3,3" />

          {/* Golden Ring for Text */}
          <circle cx="100" cy="100" r="88" fill="url(#goldGradient)" />

          {/* Curved Text KALAM LIBRARY */}
          <text 
            fill="#1E1B4B" 
            fontSize="18" 
            fontWeight="900" 
            letterSpacing="2.5" 
            fontFamily="'Plus Jakarta Sans', sans-serif"
          >
            <textPath href="#kalamTopArc" startOffset="50%" textAnchor="middle">
              KALAM LIBRARY
            </textPath>
          </text>

          {/* Left Red Badge Dot */}
          <circle cx="28" cy="100" r="7.5" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
          <circle cx="28" cy="100" r="2.5" fill="#FCA5A5" />

          {/* Right Red Badge Dot */}
          <circle cx="172" cy="100" r="7.5" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
          <circle cx="172" cy="100" r="2.5" fill="#FCA5A5" />

          {/* Curved Text GURSARAI */}
          <text 
            fill="#1E1B4B" 
            fontSize="18" 
            fontWeight="900" 
            letterSpacing="3.5" 
            fontFamily="'Plus Jakarta Sans', sans-serif"
          >
            <textPath href="#kalamBottomArc" startOffset="50%" textAnchor="middle">
              GURSARAI
            </textPath>
          </text>

          {/* Inner Navy Ring Border */}
          <circle cx="100" cy="100" r="60" fill="url(#innerBg)" stroke="#FEF08A" strokeWidth="3" />

          {/* Center Portrait Representation of Dr. A.P.J. Abdul Kalam */}
          <g clipPath="url(#centerPortraitClip)">
            {/* Soft Ambient glow behind Dr. Kalam */}
            <circle cx="100" cy="95" r="48" fill="#3B0764" />
            <ellipse cx="100" cy="78" rx="28" ry="32" fill="#E2E8F0" opacity="0.1" />

            {/* Dr. Kalam Hair (Iconic grey silver curved wings) */}
            <path d="M 68 85 C 64 65, 75 52, 100 50 C 125 52, 136 65, 132 85 C 138 90, 136 100, 130 102 C 124 100, 126 80, 122 75 C 114 62, 86 62, 78 75 C 74 80, 76 100, 70 102 C 64 100, 62 90, 68 85 Z" fill="#E2E8F0" />
            <path d="M 75 75 C 80 62, 95 60, 100 62 C 105 60, 120 62, 125 75 C 120 72, 110 70, 100 70 C 90 70, 80 72, 75 75 Z" fill="#CBD5E1" />

            {/* Face */}
            <ellipse cx="100" cy="92" rx="23" ry="26" fill="#FDBA74" />
            {/* Forehead & Highlights */}
            <ellipse cx="100" cy="85" rx="18" ry="12" fill="#FED7AA" opacity="0.6" />

            {/* Eyebrows */}
            <path d="M 87 84 Q 93 82 96 85" stroke="#475569" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M 104 85 Q 107 82 113 84" stroke="#475569" strokeWidth="1.8" fill="none" strokeLinecap="round" />

            {/* Eyes */}
            <ellipse cx="91" cy="89" rx="3.2" ry="2" fill="#334155" />
            <ellipse cx="109" cy="89" rx="3.2" ry="2" fill="#334155" />

            {/* Nose */}
            <path d="M 100 87 L 98 97 L 102 97" stroke="#EA580C" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />

            {/* Signature gentle smile */}
            <path d="M 92 104 Q 100 110 108 104" stroke="#9A3412" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* High Bandhgala Collar (White / Light Blue) */}
            <path d="M 78 126 L 86 116 Q 100 118 114 116 L 122 126 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
            {/* Dr. Kalam Suit Jacket */}
            <path d="M 55 160 L 78 124 L 122 124 L 145 160 Z" fill="#E2E8F0" />
            {/* Center placket and collar button */}
            <line x1="100" y1="116" x2="100" y2="155" stroke="#94A3B8" strokeWidth="1.5" />
            <circle cx="100" cy="120" r="1.5" fill="#475569" />
            <circle cx="100" cy="132" r="1.5" fill="#475569" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-amber-400 tracking-wider text-base uppercase font-['Plus_Jakarta_Sans',sans-serif]">
              KALAM LIBRARY
            </span>
            <span className="text-[10px] font-bold tracking-widest bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
              GURSARAI
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium tracking-wide">
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
};
