//Common imports
import * as React from "react";
import { useEffect, useState } from "react";
//Style imports
import "../../../../External/style.css";
import formStyles from "./RequestFormStyles.module.scss";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import SPServices from "../../../../CommonServices/SPServices";
import { InputTextarea } from "primereact/inputtextarea";
import { FileUpload } from "primereact/fileupload";
import { Label } from "office-ui-fabric-react";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";
//Child components import
import { Config } from "../../../../CommonServices/Config";
import {
  IBasicDropdown,
  IPatchRequestDetails,
  IRequestDetails,
} from "../../../../CommonServices/interface";
import { Button } from "primereact/button";

const RequestForm = ({ context, setOpenRequestForm, openRequestForm }) => {
  //usestates
  const [requestTypesChoice, setRequestTypesChoice] = useState<
    IBasicDropdown[]
  >(Config.dropdownConfig.requestTypesChoice);
  const [deparmentsChoice, setDepartmentChoices] = useState<IBasicDropdown[]>(
    Config.dropdownConfig.deparmentsChoice
  );
  const [requestDetails, setRequestDetails] = useState<IPatchRequestDetails>({
    ...Config.requestDetailsConfig,
  });
  const [approvalType, setApprovalType] = useState<IBasicDropdown[]>({
    ...Config.dropdownConfig.approvalType,
  });
  console.log("requestDetails", requestDetails);
  //Get Choices
  const getChoices = async (columnName) => {
    try {
      const res: any = await SPServices.SPGetChoices({
        Listname: Config.ListNames.RequestDetails,
        FieldName: columnName,
      });
      let tempArrChoices: IBasicDropdown[] = [];
      res?.Choices.forEach((element) => {
        tempArrChoices.push({ name: element });
      });
      console.log("tempArrChoices", tempArrChoices);
      if (columnName === "RequestType") {
        setRequestTypesChoice([...tempArrChoices]);
      } else if (columnName === "Department") {
        setDepartmentChoices([...tempArrChoices]);
      }
    } catch {
      (err) => console.log("getChoices err", err);
    }
  };

  //Onchange handle
  const onChangeHandle = (key, value) => {
    requestDetails[key] = value;
    setRequestDetails({ ...requestDetails });
  };

  //Add request details
  const addRequestDetails = async () => {
    try {
      const res = await SPServices.SPAddItem({
        Listname: Config.ListNames.RequestDetails,
        RequestJSON: {
          RequestID: requestDetails?.RequestID,
          RequestType: requestDetails?.RequestType,
          Department: requestDetails?.Department,
          Amount: requestDetails?.Amount,
          Notes: requestDetails?.Notes,
          ApprovalJson: JSON.stringify(requestDetails?.ApprovalJson),
        },
      });
      setOpenRequestForm(false);
    } catch {
      (err) => console.log("addRequestDetails err", err);
    }
  };

  //useEffect
  useEffect(() => {
    getChoices("RequestType");
    getChoices("Department");
  }, []);
  useEffect(() => {
    if (requestDetails?.ApprovalJson[0]?.stages.length === 0) {
      requestDetails["ApprovalJson"] = [
        {
          ...requestDetails["ApprovalJson"][0],
          TotalStages: 1,
          stages: [
            { stage: 1, ApprovalType: null, stageStatusCode: 0, approvers: [] },
          ],
        },
      ];
    }
  }, [requestDetails]);
  return (
    <>
      <Dialog
        header="Add new request"
        visible={openRequestForm}
        style={{ width: "50vw" }}
        onHide={() => {
          setOpenRequestForm(false);
        }}
      >
        <div className={formStyles.dialogContentStyles}>
          <label className={formStyles.contentTitle}>BASIC DETAILS</label>
          <div className={formStyles.contentData}>
            <InputText
              onChange={(e) => onChangeHandle("RequestID", e.target.value)}
              value={requestDetails?.RequestID}
              placeholder="Request Id"
            />
            <Dropdown
              value={requestTypesChoice?.find(
                (e) => e.name === requestDetails?.RequestType
              )}
              onChange={(e) => onChangeHandle("RequestType", e.value?.name)}
              options={requestTypesChoice}
              optionLabel="name"
              placeholder="Request type"
              className="w-full md:w-14rem"
            />
            <Dropdown
              value={deparmentsChoice?.find(
                (e) => e.name === requestDetails?.Department
              )}
              onChange={(e) => onChangeHandle("Department", e.value?.name)}
              options={deparmentsChoice}
              optionLabel="name"
              placeholder="Departments"
              className="w-full md:w-14rem"
            />
            <InputText
              value={requestDetails?.Amount?.toString()}
              onChange={(e) => onChangeHandle("Amount", e.target.value)}
              placeholder="Amount"
              keyfilter="num"
            />
          </div>
          <label className={formStyles.contentTitle}>NOTES</label>
          <InputTextarea
            style={{
              width: "100%",
              margin: "10px 0px",
              height: "60px",
              resize: "none",
            }}
            onChange={(e) => onChangeHandle("Notes", e.target.value)}
            placeholder=""
            value={requestDetails?.Notes}
            rows={5}
          />
          <FileUpload
            name="demo[]"
            url={"/api/upload"}
            multiple
            chooseLabel="Browse"
            accept="image/*"
            onSelect={(e) => console.log("file", e)}
            emptyTemplate={
              <p className="fileUploadEmptyMsg">
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <img
                    style={{ height: "40px", width: "40px" }}
                    src={require("../../assets/upload.png")}
                  />
                </div>
                Click or drag file to this area to upload.
              </p>
            }
          />
          <div className={formStyles.appproversHeader}>
            <label className={formStyles.contentTitle}>Approvers</label>
            <Button label="Add" />
          </div>
          <div className={formStyles.buttonsContainer}>
            <Button
              className="closeButton"
              label="Close"
              onClick={() => setOpenRequestForm(false)}
            />
            <Button onClick={() => addRequestDetails()} label="Submit" />
          </div>
        </div>
      </Dialog>
    </>
  );
};
export default RequestForm;
