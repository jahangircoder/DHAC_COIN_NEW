import React from 'react';

interface Coin3DProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'poster';
  tier?: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | 'Starter' | 'Zero';
  amount?: number | string;
  animate?: boolean;
  className?: string;
  showAmount?: boolean;
  symbol?: string;
}

export const Coin3D: React.FC<Coin3DProps> = ({
  size = 'md',
  tier = 'Gold',
  amount,
  animate = false,
  className = '',
  showAmount = false,
  symbol = '$',
}) => {
  const pixelSizes = {
    xs: 18,
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64,
    '2xl': 84,
    poster: 110,
  };

  const px = pixelSizes[size] || 32;

  // Color profiles for different coin tiers
  const tierThemes = {
    Diamond: {
      outerRim: 'from-[#c084fc] via-[#f0abfc] to-[#6366f1]',
      bevel: 'border-[#e9d5ff] shadow-[0_4px_16px_rgba(168,85,247,0.5)]',
      face: 'from-[#9333ea] via-[#7e22ce] to-[#4338ca]',
      innerRing: 'border-[#f5d0fe]/70 shadow-[#581c87]/60',
      text: 'text-[#fae8ff] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]',
      glow: 'shadow-[0_0_25px_rgba(168,85,247,0.45)]',
    },
    Gold: {
      outerRim: 'from-[#fef08a] via-[#f59e0b] to-[#b45309]',
      bevel: 'border-[#fef9c3] shadow-[0_6px_20px_rgba(217,119,6,0.5)]',
      face: 'from-[#fbbf24] via-[#f59e0b] to-[#d97706]',
      innerRing: 'border-[#fef08a]/80 shadow-[#92400e]/60',
      text: 'text-[#78350f] drop-shadow-[0_2px_3px_rgba(254,240,138,0.7)]',
      glow: 'shadow-[0_0_28px_rgba(245,158,11,0.5)]',
    },
    Silver: {
      outerRim: 'from-[#f8fafc] via-[#cbd5e1] to-[#64748b]',
      bevel: 'border-[#ffffff] shadow-[0_4px_16px_rgba(148,163,184,0.4)]',
      face: 'from-[#e2e8f0] via-[#cbd5e1] to-[#94a3b8]',
      innerRing: 'border-[#ffffff]/80 shadow-[#475569]/50',
      text: 'text-[#1e293b] drop-shadow-[0_2px_3px_rgba(255,255,255,0.7)]',
      glow: 'shadow-[0_0_20px_rgba(203,213,225,0.4)]',
    },
    Bronze: {
      outerRim: 'from-[#fed7aa] via-[#ea580c] to-[#9a3412]',
      bevel: 'border-[#ffedd5] shadow-[0_4px_16px_rgba(194,65,12,0.4)]',
      face: 'from-[#fb923c] via-[#ea580c] to-[#c2410c]',
      innerRing: 'border-[#fed7aa]/70 shadow-[#7c2d12]/50',
      text: 'text-[#431407] drop-shadow-[0_2px_3px_rgba(254,215,170,0.7)]',
      glow: 'shadow-[0_0_18px_rgba(234,88,12,0.4)]',
    },
    Starter: {
      outerRim: 'from-[#e2e8f0] via-[#94a3b8] to-[#475569]',
      bevel: 'border-[#f1f5f9] shadow-sm',
      face: 'from-[#cbd5e1] via-[#94a3b8] to-[#64748b]',
      innerRing: 'border-[#f1f5f9]/60',
      text: 'text-[#0f172a]',
      glow: 'shadow-xs',
    },
    Zero: {
      outerRim: 'from-[#e2e8f0] via-[#94a3b8] to-[#475569]',
      bevel: 'border-[#f1f5f9] shadow-sm',
      face: 'from-[#cbd5e1] via-[#94a3b8] to-[#64748b]',
      innerRing: 'border-[#f1f5f9]/60',
      text: 'text-[#0f172a]',
      glow: 'shadow-xs',
    },
  };

  const currentTheme = tierThemes[tier] || tierThemes.Gold;

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      {/* 3D Embossed Heavy Coin Frame */}
      <div
        className={`relative rounded-full flex items-center justify-center p-[3px] bg-gradient-to-tr ${currentTheme.outerRim} ${currentTheme.bevel} ${currentTheme.glow} transition-transform duration-200 hover:scale-105 ${
          animate ? 'animate-bounce' : ''
        }`}
        style={{ width: `${px}px`, height: `${px}px` }}
      >
        {/* Coin Beveled Face */}
        <div
          className={`w-full h-full rounded-full bg-gradient-to-b ${currentTheme.face} flex items-center justify-center relative overflow-hidden border border-white/40 shadow-inner`}
        >
          {/* Diagonal Specular Reflection Sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-transparent -rotate-45 pointer-events-none transform -translate-x-full animate-[shimmer_3.5s_infinite]" />

          {/* Embossed Ring */}
          <div
            className={`w-[80%] h-[80%] rounded-full border-2 border-dashed ${currentTheme.innerRing} flex items-center justify-center relative`}
          >
            {/* Inner Depth Shadow */}
            <div className="absolute inset-0 rounded-full bg-black/10 shadow-inner pointer-events-none" />

            {/* Embossed Currency Symbol (like in the poster) */}
            <span
              className={`font-black font-sans ${currentTheme.text} leading-none tracking-tight select-none`}
              style={{
                fontSize: `${Math.round(px * 0.46)}px`,
                textShadow: '0 2px 4px rgba(0,0,0,0.4), 0 -1px 2px rgba(255,255,255,0.6)',
              }}
            >
              {symbol}
            </span>
          </div>

          {/* Top Edge Specular Glint */}
          <div className="absolute top-1 left-1/4 w-1/2 h-1.5 rounded-full bg-white/50 blur-[0.8px] pointer-events-none" />
        </div>
      </div>

      {/* Optional Amount Display */}
      {showAmount && amount !== undefined && (
        <span className="font-mono font-extrabold tracking-tight tabular-nums">
          {amount}
        </span>
      )}
    </div>
  );
};

export const CoinStack: React.FC<{ count?: number; tier?: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' }> = ({
  count = 3,
  tier = 'Gold',
}) => {
  return (
    <div className="relative inline-flex items-center h-8 w-12">
      <div className="absolute left-0 bottom-0">
        <Coin3D size="sm" tier={tier} />
      </div>
      <div className="absolute left-2.5 bottom-1 z-10">
        <Coin3D size="sm" tier={tier} />
      </div>
      <div className="absolute left-5 bottom-2 z-20">
        <Coin3D size="sm" tier={tier} />
      </div>
    </div>
  );
};
