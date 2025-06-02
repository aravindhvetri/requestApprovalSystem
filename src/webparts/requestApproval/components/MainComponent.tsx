//Default Imports:
import * as React from "react";
//Styles Imports:
import "../../../External/style.css";
import HeaderComponent from "./HeaderComponent/HeaderComponent";
const MainComponent = ({ context }) => {
  return (
    <>
      <HeaderComponent context={context} />
    </>
  );
};
export default MainComponent;
