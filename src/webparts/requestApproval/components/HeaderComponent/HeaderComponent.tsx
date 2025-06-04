//Common imports
import * as React from "react";
import { useEffect, useState } from "react";
//Style imports
import "../../../../External/style.css";
import HeaderStyles from "./HeaderStyles.module.scss";
import { Persona } from "@fluentui/react";
//Child components import
import RequestForm from "../RequestForm/RequestForm";
import MyApproval from "../ApprovalComponent/MyApproval";
//PrimeReact Imports:
import { Button } from "primereact/button";
//Common Services Imports:
import { Config } from "../../../../CommonServices/Config";

const HeaderComponent = ({ context }) => {
  //Current User Details:
  const currentUserEmail = context._pageContext._user.email;
  const currentUserName = context._pageContext._user.displayName;
  //States:
  const [activeTab, setActiveTab] = useState(`${Config.TabNames.Request}`);
  const [openRequestForm, setOpenRequestForm] = useState({
    ...Config.DialogConfig,
  });

  return (
    <>
      <div className={HeaderStyles.mainContainer}>
        <div className={`profileHeader ${HeaderStyles.profileHeader}`}>
          <Persona
            imageUrl={`/_layouts/15/userphoto.aspx?size=S&username=${currentUserEmail}`}
          />
          <div className={HeaderStyles.profileTitle}>
            <h1>Good morning, {currentUserName}!</h1>
            <label>Have a great day on your management</label>
          </div>
        </div>
        <div className="tab-container">
          <Button
            className={
              activeTab === `${Config.TabNames?.Request}` ? "tab active" : "tab"
            }
            onClick={() => setActiveTab(`${Config.TabNames?.Request}`)}
          >
            My request
          </Button>
          <Button
            className={
              activeTab === `${Config.TabNames?.Approval}`
                ? "tab active"
                : "tab"
            }
            onClick={() => setActiveTab(`${Config.TabNames?.Approval}`)}
          >
            My approval
          </Button>
        </div>
        {activeTab == `${Config.TabNames?.Request}` ? (
          <div className={HeaderStyles.headerFilters}>
            <Button
              onClick={() =>
                setOpenRequestForm({
                  ...Config.DialogConfig,
                  RequestForm: true,
                })
              }
              label="Add request"
            />
          </div>
        ) : (
          ""
        )}
      </div>

      <div>
        {activeTab == `${Config.TabNames?.Request}` ? (
          <>
            <RequestForm
              context={context}
              openRequestForm={openRequestForm}
              setOpenRequestForm={setOpenRequestForm}
            />
          </>
        ) : (
          <>
            {activeTab == `${Config.TabNames?.Approval}` ? (
              <MyApproval context={context} />
            ) : (
              ""
            )}
          </>
        )}
      </div>
    </>
  );
};
export default HeaderComponent;
