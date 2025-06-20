//Common imports
import * as React from "react";
import { useEffect, useRef, useState } from "react";
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
import {
  getSpGroupMembers,
  toastNotify,
} from "../../../../CommonServices/CommonTemplate";
import { Toast } from "primereact/toast";
import {
  IBasicDropdown,
  IDropdownDetails,
  IFilterSelected,
  IFormMode,
} from "../../../../CommonServices/interface";
import { Dropdown } from "primereact/dropdown";
import SPServices from "../../../../CommonServices/SPServices";
import { InputText } from "primereact/inputtext";

const HeaderComponent = ({ context }) => {
  //Current User Details:
  const currentUserEmail = context._pageContext._user.email;
  const currentUserName = context._pageContext._user.displayName;
  //States:
  const [activeTab, setActiveTab] = useState(`${Config.TabNames.Request}`);
  const [openRequestForm, setOpenRequestForm] = useState({
    ...Config.DialogConfig,
  });
  const [formMode, setFormMode] = useState<IFormMode>({
    ...Config.FormModeConfig,
  });
  const [getChoicesColumn, setGetChoicesColumn] = useState<IDropdownDetails>({
    ...Config.dropdownConfig,
  });
  const [filterSelected, setFilterSelected] = useState<IFilterSelected>({
    ...Config.filterSelectedConfig,
  });
  const [isApprover, setIsApprover] = useState<boolean>(false);
  const toast = useRef(null);
  useEffect(() => {
    getChoices("RequestType");
    getChoices("Department");
    getChoices("Status");
    getSpGroupMembers(Config.SpGroupNames.RequestApprovers).then(
      async (res) => {
        if (res?.some((e) => e?.email === currentUserEmail)) {
          await setIsApprover(true);
        } else {
          false;
        }
      }
    );
  }, []);
  //Toast Notification
  const callToastNotify = (msg) => {
    toast.current?.show({
      severity: "success",
      summary: "Success",
      content: (prop) =>
        toastNotify({
          iconName: "pi-exclamation-triangle",
          ClsName: "toast-imgcontainer-success",
          type: "Success",
          msg: `Request ${msg} successfully`,
          image: require("../../../../../src/webparts/requestApproval/assets/check.gif"),
        }),
      life: 3000,
    });
  };
  //On change handle
  const onChangeHandle = (key: keyof IFilterSelected, value: string) => {
    setFilterSelected((prev) => ({ ...prev, [key]: value }));
  };
  //Get Choices
  const getChoices = async (columnName) => {
    try {
      const res: any = await SPServices.SPGetChoices({
        Listname: Config.ListNames.RequestDetails,
        FieldName: columnName,
      });
      let tempArrChoices: IBasicDropdown[] = [];
      res?.Choices.forEach((element) => {
        tempArrChoices.push({ name: element, id: null });
      });
      if (columnName === "RequestType") {
        setGetChoicesColumn((prev) => ({
          ...prev,
          requestTypesChoice: [...tempArrChoices],
        }));
      } else if (columnName === "Department") {
        setGetChoicesColumn((prev) => ({
          ...prev,
          deparmentsChoice: [...tempArrChoices],
        }));
      } else if (columnName === "Status") {
        setGetChoicesColumn((prev) => ({
          ...prev,
          StatusChoices: [...tempArrChoices],
        }));
      }
    } catch {
      (err: any) => console.log("getChoices err", err);
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <div className={HeaderStyles.mainContainer}>
        <div className={`profileHeader ${HeaderStyles.profileHeader}`}>
          <Persona
            imageUrl={`/_layouts/15/userphoto.aspx?size=S&username=${currentUserEmail}`}
          />
          <div className={HeaderStyles.profileTitle}>
            <h1>Welcome back, {currentUserName}!</h1>
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
          {isApprover && (
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
          )}
        </div>
        <div className={HeaderStyles.headerFilters}>
          <div className={HeaderStyles.filtersBar}>
            <InputText
              onChange={(e) =>
                onChangeHandle("globalSearchValue", e.target.value)
              }
              value={filterSelected?.globalSearchValue}
              placeholder="Search here"
            />
            <Dropdown
              value={getChoicesColumn?.StatusChoices?.find(
                (e) => e.name === filterSelected?.statusSelected
              )}
              onChange={(e) => onChangeHandle("statusSelected", e.value?.name)}
              options={getChoicesColumn?.StatusChoices}
              optionLabel="name"
              placeholder="Status"
              disabled={formMode?.view}
              className="w-full md:w-14rem"
            />
            <Dropdown
              value={getChoicesColumn?.requestTypesChoice?.find(
                (e) => e.name === filterSelected?.requestSelected
              )}
              onChange={(e) => onChangeHandle("requestSelected", e.value?.name)}
              options={getChoicesColumn?.requestTypesChoice}
              optionLabel="name"
              placeholder="Request Type"
              disabled={formMode?.view}
              className="w-full md:w-14rem"
            />
            <Dropdown
              value={getChoicesColumn?.deparmentsChoice?.find(
                (e) => e.name === filterSelected?.departmentSelected
              )}
              onChange={(e) =>
                onChangeHandle("departmentSelected", e.value?.name)
              }
              options={getChoicesColumn?.deparmentsChoice}
              optionLabel="name"
              placeholder="Departments"
              disabled={formMode?.view}
              className="w-full md:w-14rem"
            />
            <div className="tooltip">
              <Button
                style={{ width: "fit-content", padding: "6px" }}
                icon="pi pi-undo"
                onClick={() =>
                  setFilterSelected({ ...Config.filterSelectedConfig })
                }
              />
              <span className="tooltiptext">Reset filters</span>
            </div>
          </div>
          {activeTab == `${Config.TabNames?.Request}` ? (
            <Button
              onClick={() => {
                setFormMode({ ...Config.FormModeConfig, add: true });
                setOpenRequestForm({
                  ...Config.DialogConfig,
                  RequestForm: true,
                });
              }}
              label="Add request"
            />
          ) : (
            ""
          )}
        </div>
      </div>

      <div>
        {activeTab == `${Config.TabNames?.Request}` ? (
          <>
            <RequestForm
              filterSelected={filterSelected}
              requestTypesChoice={getChoicesColumn?.requestTypesChoice}
              deparmentsChoice={getChoicesColumn?.deparmentsChoice}
              context={context}
              openRequestForm={openRequestForm}
              activeTab={activeTab}
              formMode={formMode}
              setFormMode={setFormMode}
              setOpenRequestForm={setOpenRequestForm}
              callToastNotify={callToastNotify}
            />
          </>
        ) : (
          <>
            {activeTab == `${Config.TabNames?.Approval}` ? (
              <MyApproval
                filterSelected={filterSelected}
                openRequestForm={openRequestForm}
                setOpenRequestForm={setOpenRequestForm}
                activeTab={activeTab}
                callToastNotify={callToastNotify}
                context={context}
              />
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
