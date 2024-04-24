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

export { ArrowBackIcon, CloseIcon, HamburgerMenuIcon, HomeIcon };