import React, { useEffect, useState } from "react";

declare global {
  interface BatteryManager {
    charging: boolean;
    level: number;
    chargingTime: number;
    dischargingTime: number;
    onchargingchange: ((this: BatteryManager, ev: Event) => any) | null;
    onchargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
    ondischargingtimechange: ((this: BatteryManager, ev: Event) => any) | null;
    onlevelchange: ((this: BatteryManager, ev: Event) => any) | null;
  }
  interface Navigator {
    getBattery(): Promise<BatteryManager>;
  }
}

const Header: React.FC = () => {
  const [date, setDate] = useState(new Date());
  const [battery, setBattery] = useState({ level: 0, charging: false });

  useEffect(() => {
    const timerID = setInterval(() => setDate(new Date()), 1000);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (!isIOS) {
      navigator.getBattery().then((bat) => {
        setBattery({ level: bat.level, charging: bat.charging });
        bat.onlevelchange = () => setBattery({ level: bat.level, charging: bat.charging });
        bat.onchargingchange = () => setBattery({ level: bat.level, charging: bat.charging });
      });
    }
    return function cleanup() {
      clearInterval(timerID);
    };
  }, []);

  return (
    <div>
      <div className="header">
        <p>現在時刻(時): {date.getHours()}</p>
        <p>現在時刻(分): {date.getMinutes()}</p>
        <p>バッテリー残量: {(battery.level * 100).toFixed(0)}%</p>
        <p>充電状態: {battery.charging ? "充電中" : "充電していない"}</p>
      </div>
      l9
    </div>
  );
};

export default Header;
