import React from 'react';

// BTW 方块 logo：圆角渐变方块 + "BTW" 字样
export const Logo: React.FC<{ size?: number; radius?: number }> = ({ size = 72, radius }) => {
  const r = radius ?? size * 0.22;
  return (
    <div
      className="btw-logo"
      style={{
        width: size,
        height: size,
        borderRadius: r,
        fontSize: size * 0.34,
      }}
    >
      BTW
    </div>
  );
};
