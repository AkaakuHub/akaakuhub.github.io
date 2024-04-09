import React, { useState, useEffect, useRef } from "react";
import "./index.css";

const TapEffect = () => {
  const [showEffect, setShowEffect] = useState(false);
  const [effectPosition, setEffectPosition] = useState({ x: 0, y: 0 });
  const effectTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (effectTimeoutRef.current !== null) {
        clearTimeout(effectTimeoutRef.current);
      }
    };
  }, []);

  const handleTouchStart = (e) => {
    setShowEffect(true);
    setEffectPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    effectTimeoutRef.current = setTimeout(() => {
      setShowEffect(false);
    }, 500); // アニメーション時間(500ms)
  };

  const handleTouchEnd = () => {
    clearTimeout(effectTimeoutRef.current);
  };

  const handleMouseDown = (e) => {
    setShowEffect(true);
    setEffectPosition({ x: e.clientX, y: e.clientY });
    effectTimeoutRef.current = setTimeout(() => {
      setShowEffect(false);
    }, 500); // アニメーション時間(500ms)
  };

  const handleMouseUp = () => {
    clearTimeout(effectTimeoutRef.current);
  };

  return (
    <div
      className="tap-effect-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {showEffect && (
        <div
          className="tap-effect"
          style={{
            left: `${effectPosition.x - 25}px`,
            top: `${effectPosition.y - 25}px`,
          }}
        />
      )}
      {/* その他のコンテンツ */}
    </div>
  );
};


export default TapEffect;