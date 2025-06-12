//Common imports
import * as React from "react";
//Style Imports
import "../../../External/style.css";

const Loader = ({ showLoader }) => {
  console.log("showLoader", showLoader);
  return showLoader ? (
    <div className="loader-container">
      <span className="loader"></span>
    </div>
  ) : (
    <></>
  );
};
export default Loader;
