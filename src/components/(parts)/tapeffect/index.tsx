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
  const lastEffectTimeRef = useRef<number>(0);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
  const isMouseDownRef = useRef<boolean>(false);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      isMouseDownRef.current = true;
      // console.log("mousedown");
    };

    const handleTouchStart = (e: TouchEvent) => {
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      isMouseDownRef.current = true;
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
      // console.log("mouseup");
    };

    const handleTouchEnd = () => {
      isMouseDownRef.current = false;
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

    const intervalTime: number = 100;

    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      if (isMouseDownRef.current && now - lastEffectTimeRef.current > intervalTime) {
        const newTapEffect: TapEffect = {
          id: nextIdRef.current,
          x: lastMousePosRef.current?.x || 0,
          y: lastMousePosRef.current?.y || 0,
          expirationTime: now + 500,
        };
        setTapEffects((prevTapEffects) => [...prevTapEffects, newTapEffect]);
        nextIdRef.current += 1;
        lastEffectTimeRef.current = now;
      }
      setTapEffects((prevTapEffects) =>
        prevTapEffects.filter((effect) => effect.expirationTime > now)
      );
    }, intervalTime);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);

      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchmove", handleTouchMove);

      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
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