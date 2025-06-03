//Common imports
import * as React from "react";
import { useEffect, useState } from "react";
//Style imports
import "../../../../External/style.css";
import HeaderStyles from "./HeaderStyles.module.scss";
import { Persona } from "@fluentui/react";
import { Button } from "primereact/button";

//Child components import
import RequestForm from "../RequestForm/RequestForm";

const HeaderComponent = ({ context }) => {
  const [openRequestForm, setOpenRequestForm] = useState(false);
  console.log("openRequestForm", openRequestForm);
  return (
    <>
      <div className={HeaderStyles.mainContainer}>
        <div className={HeaderStyles.profileHeader}>
          <Persona
            imageUrl={`/_layouts/15/userphoto.aspx?size=S&username=${context._pageContext._user.email}`}
          />

          <div className={HeaderStyles.profileTitle}>
            <h1>Good morning, {context._pageContext._user.displayName}!</h1>
            <label>Have a great day on your management</label>
          </div>
        </div>
        <div className={HeaderStyles.headerTitle}>
          <label>My Request</label>
        </div>
        <div className={HeaderStyles.headerFilters}>
          <Button
            onClick={() => setOpenRequestForm(true)}
            label="Add request"
          />
        </div>
      </div>
      <RequestForm
        context={context}
        openRequestForm={openRequestForm}
        setOpenRequestForm={setOpenRequestForm}
      />
    </>
  );
};
export default HeaderComponent;
