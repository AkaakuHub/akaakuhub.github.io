import React, { useState, useEffect, useRef } from "react";
import "./index.css";

interface TapEffectProps {
  children: React.ReactNode;
}

interface TapEffect {
  id: number;
  x: number;
  y: number;
  expirationTime: number;
}

const TapEffect: React.FC<TapEffectProps> = ({ children }) => {
  const [tapEffects, setTapEffects] = useState<TapEffect[]>([]);

  const nextIdRef = useRef(0);
  const intervalRef = useRef<number | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const isMouseDownRef = useRef<boolean>(false);
  const nextEffectAvailableTimeRef = useRef<number>(0);

  const intervalTime: number = 200;

  const generateTapEffect = () => {
    const now: number = Date.now();
    if (isMouseDownRef.current && now > nextEffectAvailableTimeRef.current) {
      const newTapEffect: TapEffect = {
        id: nextIdRef.current,
        x: lastMousePosRef.current?.x || 0,
        y: lastMousePosRef.current?.y || 0,
        expirationTime: now + 500, // アニメーションが500msなので固定
      };
      setTapEffects((prevTapEffects) => [...prevTapEffects, newTapEffect]);
      nextIdRef.current += 1;
      nextEffectAvailableTimeRef.current = now + intervalTime;
    }
    setTapEffects((prevTapEffects) =>
      prevTapEffects.filter((effect) => effect.expirationTime > now)
    );
  };

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      isMouseDownRef.current = true;
      generateTapEffect();
    };

    const handleTouchStart = (e: TouchEvent) => {
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      isMouseDownRef.current = true;
      generateTapEffect();
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
      nextEffectAvailableTimeRef.current = Date.now();
    };

    const handleTouchEnd = () => {
      isMouseDownRef.current = false;
      nextEffectAvailableTimeRef.current = Date.now();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseDownRef.current) {
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isMouseDownRef.current) {
        lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("dragend", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchmove", handleTouchMove);


    // intervalRef.current = window.setInterval(() => {
    //   generateTapEffect();
    // }, 0);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("dragend", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);

      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchmove", handleTouchMove);

      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const animate = () => {
      generateTapEffect();
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return (
    <div className="tap-effect-container">
      {tapEffects.map((effect) => (
        <div
          key={effect.id}
          className="tap-effect"
          style={{
            left: `${effect.x - 25}px`,
            top: `${effect.y - 25}px`,
          }}
        />
      ))}
      {children}
    </div>
  );
};

export default TapEffect;