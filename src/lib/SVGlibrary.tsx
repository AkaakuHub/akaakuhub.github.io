import { CSSProperties } from "react";
import React from "react";

interface PropsType {
  style?: CSSProperties;
  color?: string;
}

const ArrowBackIcon = (props: PropsType) => {
  return (
    <svg width="30" height="23" viewBox="0 0 30 23" fill="none" xmlns="http://www.w3.org/2000/svg" style={props.style ? props.style : undefined} >
      <path fill-rule="evenodd" clip-rule="evenodd" d="M2.13654 8.94705C0.237328 10.1192 0.237324 12.8808 2.13653 14.0529L15.1744 22.0995C17.1731 23.333 19.75 21.8952 19.75 19.5465V13H28.5C29.3284 13 30 12.3284 30 11.5C30 10.6716 29.3284 10 28.5 10H19.75V3.45346C19.75 1.10475 17.1731 -0.333028 15.1744 0.900508L2.13654 8.94705Z" fill={props.color ? props.color : '#AFAEB3'} />
    </svg>
  );
};

const CloseIcon = (props: PropsType) => {
  return (
    <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" style={props.style ? props.style : undefined} >
      <path fill-rule="evenodd" clip-rule="evenodd" d="M3.18198 1.06065C2.5962 0.474861 1.64645 0.474861 1.06066 1.06065C0.474876 1.64645 0.474876 2.59618 1.06066 3.18197L8.48529 10.6066L1.06066 18.0312C0.474876 18.617 0.474876 19.5667 1.06066 20.1525C1.64645 20.7383 2.59619 20.7383 3.18198 20.1525L10.6066 12.7279L18.0312 20.1525C18.617 20.7383 19.5668 20.7383 20.1525 20.1525C20.7383 19.5667 20.7383 18.617 20.1525 18.0312L12.7279 10.6066L20.1525 3.18198C20.7383 2.5962 20.7383 1.64645 20.1525 1.06066C19.5668 0.474876 18.617 0.474876 18.0312 1.06066L10.6066 8.48527L3.18198 1.06065Z" fill={props.color ? props.color : '#AFAEB3'} />
    </svg>
  );
};

const HamburgerMenuIcon = (props: PropsType) => {
  return (
    <svg width="27" height="17" viewBox="0 0 27 17" fill="none" xmlns="http://www.w3.org/2000/svg" style={props.style ? props.style : undefined} >
      <path fill-rule="evenodd" clip-rule="evenodd" d="M0 1.5C0 0.67157 0.671574 0 1.5 0H25.5C26.3284 0 27 0.67157 27 1.5C27 2.32843 26.3284 3 25.5 3H1.5C0.671574 3 0 2.32843 0 1.5ZM0 8.5C0 7.67157 0.671574 7 1.5 7H25.5C26.3284 7 27 7.67157 27 8.5C27 9.32843 26.3284 10 25.5 10H1.5C0.671574 10 0 9.32843 0 8.5ZM1.5 14C0.671574 14 0 14.6716 0 15.5C0 16.3284 0.671574 17 1.5 17H25.5C26.3284 17 27 16.3284 27 15.5C27 14.6716 26.3284 14 25.5 14H1.5Z" fill={props.color ? props.color : '#AFAEB3'} />
    </svg>
  );
};

const HomeIcon = (props: PropsType) => {
  return (
    <svg width="24" height="22" viewBox="0 0 24 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={props.style ? props.style : undefined} >
      <path fill-rule="evenodd" clip-rule="evenodd" d="M11.5832 0.191085C11.8478 0.0697686 12.1522 0.0697687 12.4168 0.191085L22.5587 4.84099C23.5346 5.28845 23.2156 6.75 22.1419 6.75H20.517C20.9135 7.37091 21.1433 8.10858 21.1433 8.89991V17.8999C21.1433 20.1091 19.3524 21.8999 17.1433 21.8999H7.14329C4.93415 21.8999 3.14329 20.1091 3.14329 17.8999V8.89991C3.14329 8.10858 3.37309 7.37091 3.76959 6.75H1.85808C0.784431 6.75 0.465354 5.28845 1.44132 4.84099L11.5832 0.191085ZM10.1433 9.89991C9.59101 9.89991 9.14329 10.3476 9.14329 10.8999V14.8999C9.14329 15.4522 9.59101 15.8999 10.1433 15.8999H14.1433C14.6956 15.8999 15.1433 15.4522 15.1433 14.8999V10.8999C15.1433 10.3476 14.6956 9.89991 14.1433 9.89991H10.1433Z" fill={props.color ? props.color : '#AFAEB3'} />
    </svg>
  );
};

const Battery3 = (props: PropsType) => {
  return (
    <svg width="31" height="17" viewBox="0 0 31 17" fill="none" xmlns="http://www.w3.org/2000/svg" style={props.style ? props.style : undefined} >
      <path fill-rule="evenodd" clip-rule="evenodd"
        d="M3 0C1.34315 0 0 1.34315 0 3V14C0 15.6569 1.34315 17 3 17H26C27.6569 17 29 15.6569 29 14V12.9999C29.0043 13 29.0085 13 29.0128 13C30.1103 13 31 10.9853 31 8.5C31 6.01472 30.1103 4 29.0128 4C29.0085 4 29.0043 4.00003 29 4.00009V3C29 1.34315 27.6569 0 26 0H3Z"
        fill="black" />
      <rect x="1" y="1" width="27" height="15" rx="2" fill="white" />
      <rect x="2" y="2" width="7" height="13" rx="2" fill="#00FF75" />
      <rect x="11" y="2" width="7" height="13" rx="2" fill="#00FF75" />
      <rect x="20" y="2" width="7" height="13" rx="2" fill="#00FF75" />
    </svg>
  );
};

const Battery2 = (props: PropsType) => {
  return (
    <svg width="31" height="17" viewBox="0 0 31 17" fill="none" xmlns="http://www.w3.org/2000/svg" style={props.style ? props.style : undefined} >
      <path fill-rule="evenodd" clip-rule="evenodd"
        d="M3 0C1.34315 0 0 1.34315 0 3V14C0 15.6569 1.34315 17 3 17H26C27.6569 17 29 15.6569 29 14V12.9999C29.0043 13 29.0085 13 29.0128 13C30.1103 13 31 10.9853 31 8.5C31 6.01472 30.1103 4 29.0128 4C29.0085 4 29.0043 4.00003 29 4.00009V3C29 1.34315 27.6569 0 26 0H3Z"
        fill="black" />
      <rect x="1" y="1" width="27" height="15" rx="2" fill="white" />
      <rect x="2" y="2" width="7" height="13" rx="2" fill="#FFE500" />
      <rect x="11" y="2" width="7" height="13" rx="2" fill="#FFE500" />
    </svg>
  );
};

const Battery1 = (props: PropsType) => {
  return (
    <svg width="31" height="17" viewBox="0 0 31 17" fill="none" xmlns="http://www.w3.org/2000/svg" style={props.style ? props.style : undefined} >
      <path fill-rule="evenodd" clip-rule="evenodd"
        d="M3 0C1.34315 0 0 1.34315 0 3V14C0 15.6569 1.34315 17 3 17H26C27.6569 17 29 15.6569 29 14V12.9999C29.0043 13 29.0085 13 29.0128 13C30.1103 13 31 10.9853 31 8.5C31 6.01472 30.1103 4 29.0128 4C29.0085 4 29.0043 4.00003 29 4.00009V3C29 1.34315 27.6569 0 26 0H3Z"
        fill="black" />
      <rect x="1" y="1" width="27" height="15" rx="2" fill="white" />
      <rect x="2" y="2" width="7" height="13" rx="2" fill="#FF0F00" />
    </svg>
  );
};

const Battery_charging = (props: PropsType) => {
  return (
    <svg width="31" height="17" viewBox="0 0 31 17" fill="none" xmlns="http://www.w3.org/2000/svg" style={props.style ? props.style : undefined} >
      <path fill-rule="evenodd" clip-rule="evenodd"
        d="M3 0C1.34315 0 0 1.34315 0 3V14C0 15.6569 1.34315 17 3 17H26C27.6569 17 29 15.6569 29 14V12.9999C29.0043 13 29.0085 13 29.0128 13C30.1103 13 31 10.9853 31 8.5C31 6.01472 30.1103 4 29.0128 4C29.0085 4 29.0043 4.00003 29 4.00009V3C29 1.34315 27.6569 0 26 0H3Z"
        fill="black" />
      <rect x="1" y="1" width="27" height="15" rx="2" fill="white" />
      <rect x="2" y="2" width="25" height="13" rx="2" fill="#00FF75" />
      <path fill-rule="evenodd" clip-rule="evenodd" transform="translate(9.5,3)"
        d="M7.7327 6.48215L9.259 4.89999H4.84259L4.84426 4.8971L4.83344 4.89955L6.58302 0.00388336L6.57927 0L2.2209 4.51786H2.21664L0.699997 6.09H5.10754L5.10587 6.09289L5.11669 6.09044L3.3643 10.994L3.37006 11L7.72843 6.48215H7.7327Z"
        fill="white" />
    </svg>
  );
};

const Battery_null = (props: PropsType) => {
  return (
    <svg width="31" height="17" viewBox="0 0 31 17" fill="none" xmlns="http://www.w3.org/2000/svg" style={props.style ? props.style : undefined} >
      <path fill-rule="evenodd" clip-rule="evenodd"
        d="M3 0C1.34315 0 0 1.34315 0 3V14C0 15.6569 1.34315 17 3 17H26C27.6569 17 29 15.6569 29 14V12.9999C29.0043 13 29.0085 13 29.0128 13C30.1103 13 31 10.9853 31 8.5C31 6.01472 30.1103 4 29.0128 4C29.0085 4 29.0043 4.00003 29 4.00009V3C29 1.34315 27.6569 0 26 0H3Z"
        fill="black" />
      <rect x="1" y="1" width="27" height="15" rx="2" fill="white" />
      <path transform="translate(11,3)"
        d="M3.594 7.396C3.41667 7.396 3.26733 7.34467 3.146 7.242C3.034 7.13 2.978 6.99933 2.978 6.85C2.978 6.43 3.05267 6.06133 3.202 5.744C3.35133 5.42667 3.524 5.16533 3.72 4.96C3.92533 4.74533 4.196 4.50267 4.532 4.232C4.88667 3.952 5.148 3.70933 5.316 3.504C5.484 3.29867 5.568 3.06533 5.568 2.804C5.568 1.78667 4.90067 1.278 3.566 1.278C3.23933 1.278 2.91733 1.32 2.6 1.404C2.292 1.47867 2.01667 1.59067 1.774 1.74C1.662 1.81467 1.54533 1.852 1.424 1.852C1.27467 1.852 1.144 1.796 1.032 1.684C0.92 1.572 0.864 1.44133 0.864 1.292C0.864 1.07733 0.980667 0.899999 1.214 0.76C1.59667 0.517333 1.984 0.344666 2.376 0.242C2.768 0.139333 3.202 0.0879999 3.678 0.0879999C4.63 0.0879999 5.39067 0.326 5.96 0.802C6.53867 1.278 6.828 1.922 6.828 2.734C6.828 3.098 6.76267 3.42 6.632 3.7C6.50133 3.97067 6.34267 4.204 6.156 4.4C5.96933 4.58667 5.722 4.80133 5.414 5.044C5.01267 5.36133 4.70933 5.65067 4.504 5.912C4.308 6.164 4.21 6.47667 4.21 6.85C4.21 6.99933 4.14933 7.13 4.028 7.242C3.90667 7.34467 3.762 7.396 3.594 7.396ZM3.566 10.056C3.342 10.056 3.146 9.97667 2.978 9.818C2.81933 9.65 2.74 9.44933 2.74 9.216C2.74 8.992 2.81933 8.80067 2.978 8.642C3.146 8.474 3.342 8.39 3.566 8.39C3.79933 8.39 3.99533 8.474 4.154 8.642C4.322 8.80067 4.406 8.992 4.406 9.216C4.406 9.44933 4.322 9.65 4.154 9.818C3.99533 9.97667 3.79933 10.056 3.566 10.056Z"
        fill="black" />
    </svg>
  );
};

export { ArrowBackIcon, CloseIcon, HamburgerMenuIcon, HomeIcon, Battery3, Battery2, Battery1, Battery_charging, Battery_null };
// 必ずsvgタグにstyleとcolorを指定すること