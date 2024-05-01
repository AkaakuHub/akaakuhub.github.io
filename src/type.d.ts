export type SVGPropsType = {
  style?: CSSProperties;
  color?: string;
};

export type modalNameType = "menu" | "message1"

export type modalMessageType = {
  "title": string
  "text": string
  "button1": string
}

export type modalArrayType = {
  name: modalNameType
  message?: modalMessageType
}

export type modalArrayPropsType = {
  modalArray: modalArrayType[];
  setModalArray: React.Dispatch<React.SetStateAction<modalArrayType[]>>;
};