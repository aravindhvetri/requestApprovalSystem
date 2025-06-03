//Default Imports:
import * as React from "react";
//Styles Imports:
import CommonStyles from "../External/commonStyle.module.scss";
//React Icons Imports:
import { FaRegCheckCircle } from "react-icons/fa";
import { FaRegTimesCircle } from "react-icons/fa";
import { LuClock9 } from "react-icons/lu";
import { MdTransitEnterexit } from "react-icons/md";

//Status Common Template Styeles:
export const statusTemplate = (status: string) => {
  return (
    <div
      className={CommonStyles.statusItem}
      style={{
        backgroundColor: getColors(status)?.bgColor,
        color: getColors(status)?.color,
        borderColor: getColors(status)?.borderColor,
      }}
    >
      <div>{status}</div>
    </div>
  );
};

//Status Common Template Colors:
const getColors = (status: string) => {
  let colors = {
    bgColor: "",
    color: "",
    borderColor: "",
  };
  switch (status) {
    case "Pending":
      colors.bgColor = "#eaf1f6";
      colors.color = "#2a6d9c";
      break;
    case "Approved":
      colors.bgColor = "#e8f6ed";
      colors.color = "#16a34a";
      break;
    case "Rejected":
      colors.bgColor = "#f6e8e8";
      colors.color = "#b23d3f";
      break;
    case "Resubmited":
      colors.bgColor = "#e2cb3242";
      colors.color = "#af9a0b";
      break;
    default:
      return null;
  }
  return colors;
};
