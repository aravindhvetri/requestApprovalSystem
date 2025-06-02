//Common imports
import * as React from "react";
import { useEffect, useState } from "react";
//Style imports
import "../../../../External/style.css";
import formStyles from "./RequestFormStyles.module.scss";

const RequestForm = ({ setOpenRequestForm }) => {
  return (
    <>
      <div
        className={formStyles.mainContainer}
        onClick={() => setOpenRequestForm(false)}
      ></div>
    </>
  );
};
export default RequestForm;
