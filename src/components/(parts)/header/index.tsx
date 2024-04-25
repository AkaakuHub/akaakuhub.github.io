import React, { useEffect, useState } from "react";
import "./index.css";

import { Battery1, Battery2, Battery3, Battery_charging, Battery_null } from "../../../lib/SVGlibrary";

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
    try {
      navigator.getBattery().then((bat) => {
        setBattery({ level: bat.level, charging: bat.charging });
        bat.onlevelchange = () => setBattery({ level: bat.level, charging: bat.charging });
        bat.onchargingchange = () => setBattery({ level: bat.level, charging: bat.charging });
      });
    } catch (e) { // iOSなどではnavigator.getBattery()が使えない
      // console.log(e);
    }
    return function cleanup() {
      clearInterval(timerID);
    };
  }, []);

  const ChooseBattery: React.FC = () => {
    const level: number = battery.level;
    const isCharging: boolean = battery.charging;

    const iconSize = 60;
    const iconStyle = { width: `${iconSize}px`, height: `${iconSize}px` };

    if (isCharging) {
      return <Battery_charging style={iconStyle} />;
    } else if (level > 0.5) {
      return <Battery3 style={iconStyle} />;
    } else if (level > 0.2) {
      return <Battery2 style={iconStyle} />;
    } else if (level > 0) {
      return <Battery1 style={iconStyle} />;
    } else { // level === 0
      return <Battery_null style={iconStyle} />;
    }
  };

  return (
    <div>
      <div className="header">
        <div className="info-container">
          <div className="time-container">
            {date.getHours()}:{String(date.getMinutes()).padStart(2, '0')}
          </div>
          <div className="battery-container">
            <ChooseBattery />
          </div>
        </div>
        <div className="profile-container">
          <div className="lv-container">
            000
          </div>
          <div className="name-container">
            name_temp
          </div>
        </div>
        <div className="currency-container">
          <p>C 0</p>
        </div>
      </div>
    </div>
  );
};

export default Header;
