import React, { useEffect, useState } from "react";
import "./index.css";

import { Battery1, Battery2, Battery3, Battery_null } from "../../../lib/SVGlibrary";
import { SVGPropsType } from "../../../type";

const Battery_charging = (props: SVGPropsType & { level: number }) => {
  return (
    <svg width="31" height="17" viewBox="0 0 31 17" fill="none" xmlns="http://www.w3.org/2000/svg" style={props.style ? props.style : undefined} >
      <path fillRule="evenodd" clipRule="evenodd"
        d="M3 0C1.34315 0 0 1.34315 0 3V14C0 15.6569 1.34315 17 3 17H26C27.6569 17 29 15.6569 29 14V12.9999C29.0043 13 29.0085 13 29.0128 13C30.1103 13 31 10.9853 31 8.5C31 6.01472 30.1103 4 29.0128 4C29.0085 4 29.0043 4.00003 29 4.00009V3C29 1.34315 27.6569 0 26 0H3Z"
        fill="black" />
      <rect x="1" y="1" width="27" height="15" rx="2" fill="white" />
      <rect x="2" y="2" width={props.level * 25} height="13" rx="2" fill="#00FF75" />
      <path fillRule="evenodd" clipRule="evenodd" transform="translate(9.5,3)"
        d="M7.7327 6.48215L9.259 4.89999H4.84259L4.84426 4.8971L4.83344 4.89955L6.58302 0.00388336L6.57927 0L2.2209 4.51786H2.21664L0.699997 6.09H5.10754L5.10587 6.09289L5.11669 6.09044L3.3643 10.994L3.37006 11L7.72843 6.48215H7.7327Z"
        fill="white"
        stroke="black"
        strokeWidth={0.5}
      />
    </svg>
  );
};

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
      return <Battery_charging style={iconStyle} level={level} />;
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
