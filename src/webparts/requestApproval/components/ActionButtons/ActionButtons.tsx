//Common imports
import * as React from "react";
import { useEffect, useRef, useState } from "react";
//Style imports
import styles from "./ActionButtons.module.scss";
import "../../../../External/style.css";
import { Button } from "primereact/button";
import { IApprovalPatch } from "../../../../CommonServices/interface";
import { update } from "@microsoft/sp-lodash-subset";
import { InputTextarea } from "primereact/inputtextarea";
import { Config } from "../../../../CommonServices/Config";
import SPServices from "../../../../CommonServices/SPServices";
import Loader from "../Loader";

const ActionButtons = ({
  showLoaderinForm,
  setShowLoaderinForm,
  validRequiredField,
  formMode,
  setOpenRequestForm,
  context,
  currentRecord,
  setUserStatusUpdate,
  activeTab,
  updateFilesbyApprovalForm,
  userStatusUpdate,
}) => {
  const loginUser = context._pageContext._user.email;
  const [approvalPatch, setApprovalPatch] = useState<IApprovalPatch>({
    status: "",
    approvalJson: currentRecord?.ApprovalJson,
    comments: "",
  });
  const [approverValidation, setApproverValidation] = useState("");
  // UseEffect
  //Call Update function
  useEffect(() => {
    if (userStatusUpdate?.status) {
      validRequiredField("submit");
    }
  }, [userStatusUpdate]);
  //Validation
  const approverValidationCheck = () => {
    if (!(approvalPatch?.comments).trim()) {
      setApproverValidation("* Approver comments is mandatory");
    } else {
      setApproverValidation("");
      updateStatusByApprover(currentRecord, loginUser, 2);
    }
  };
  //Update Status by approver
  const updateStatusByApprover = async (data, email, newStatusCode) => {
    setShowLoaderinForm(true);
    var updateStage = null;
    var statusUpdate = data?.Status;
    const tempArr: IApprovalPatch = {
      approvalJson: data?.ApprovalJson?.map((approvalFlow) => ({
        ...approvalFlow,
        stages: approvalFlow.stages.map((stage) => {
          if (approvalFlow.Currentstage === stage.stage) {
            // First, update the approvers' status codes
            const updatedApprovers = stage.approvers.map((approver) =>
              approver.email === email
                ? { ...approver, statusCode: newStatusCode }
                : approver
            );
            // Then, check if all approvers have statusCode === 1
            const allApproved =
              stage.approvalType === 2
                ? updatedApprovers.every(
                    (approver) => approver.statusCode === 1
                  )
                : stage.approvalType === 1 &&
                  updatedApprovers.some(
                    (approver) => approver.statusCode === 1
                  );
            // Then, check if anyone approvers have statusCode === 2
            const anyoneRejected = updatedApprovers.some(
              (approver) => approver.statusCode === 2
            );
            // Update CurrentStage
            const updateStageVal = allApproved
              ? approvalFlow.Currentstage === approvalFlow.TotalStages
                ? ((statusUpdate = "Approved"),
                  (updateStage = approvalFlow.Currentstage))
                : (updateStage = approvalFlow.Currentstage + 1)
              : ((updateStage = approvalFlow.Currentstage),
                anyoneRejected
                  ? (statusUpdate = "Rejected")
                  : (statusUpdate = statusUpdate));

            return {
              ...stage,
              approvers: updatedApprovers,
              stageStatusCode: allApproved
                ? 1
                : anyoneRejected
                ? 2
                : stage.stageStatusCode,
            };
          } else {
            return { ...stage };
          }
        }),
        Currentstage: updateStage,
      })),
      status: statusUpdate,
      comments: approvalPatch?.comments,
    };
    updateReqListbyApprover({ ...tempArr }, newStatusCode);
  };
  //Update RequestDetails list by approver
  const updateReqListbyApprover = async (PatchDetails, newStatusCode) => {
    try {
      const res = await SPServices.SPUpdateItem({
        Listname: Config.ListNames.RequestDetails,
        ID: currentRecord?.ID,
        RequestJSON: {
          Status: PatchDetails?.status,
          ApprovalJson: JSON.stringify(PatchDetails?.approvalJson),
        },
      });
      addApprovalHistory(newStatusCode);
    } catch {
      (err) => console.log("updateReqListbyApprover err", err);
    }
  };
  //Add Approval History
  const addApprovalHistory = async (newStatusCode) => {
    const user: any = await SPServices.getCurrentUsers();
    try {
      const res = await SPServices.SPAddItem({
        Listname: Config.ListNames.ApprovalHistory,
        RequestJSON: {
          RequestIDId: currentRecord?.ID,
          ApproverId: user?.Id,
          Status: newStatusCode === 1 ? "Approved" : "Rejected",
          Comments: approvalPatch?.comments,
        },
      });
      updateFilesbyApprovalForm();
    } catch {
      (err) => console.log("addApprovalHistory err", err);
    }
  };

  //Update status by user
  const updateStatusByUser = async (data, email, newStatusCode) => {
    //Update status and ApprovalJson
    const tempArr: IApprovalPatch = {
      status: data?.Status === "Rejected" ? "Resubmited" : data?.Status,
      approvalJson: data?.ApprovalJson.map((approvalFlow) => ({
        ...approvalFlow,
        Currentstage: 1,
        stages: approvalFlow.stages.map((stage) => {
          //Update approvers
          const stageApproversByUser = stage.approvers?.map((approver) => ({
            ...approver,
            statusCode: newStatusCode,
          }));
          return {
            ...stage,
            approvers: stageApproversByUser,
            stageStatusCode: newStatusCode,
          };
        }),
      })),
      comments: "",
    };
    await setUserStatusUpdate({ ...tempArr });
  };
  return (
    <>
      <Loader showLoader={showLoaderinForm} />
      {activeTab == `${Config.TabNames?.Approval}` && formMode?.edit && (
        <>
          <label className={styles.contentTitle}>APPROVER COMMENTS</label>
          <InputTextarea
            style={{
              width: "100%",
              margin: "10px 0px",
              height: "60px",
              resize: "none",
            }}
            onChange={async (e) => {
              const value = e.target.value;
              setApprovalPatch((prev) => ({
                ...prev,
                comments: value,
              }));
              value.trim() && setApproverValidation("");
            }}
            value={approvalPatch?.comments}
            rows={5}
          />
        </>
      )}
      <div className={styles.buttonContainer}>
        <span className="errorMsg">{approverValidation}</span>
        <Button
          className="closeButton"
          label="Close"
          onClick={() => {
            setOpenRequestForm({
              ...Config.DialogConfig,
              RequestForm: false,
            });
          }}
        />
        {activeTab === Config.TabNames?.Request && (
          <Button
            visible={formMode?.edit || formMode?.add}
            onClick={() =>
              formMode?.edit
                ? updateStatusByUser(currentRecord, loginUser, 0)
                : validRequiredField("submit")
            }
            label={
              formMode?.edit && currentRecord?.Status === "Rejected"
                ? "Re-Submit"
                : "Submit"
            }
          />
        )}
        {activeTab == `${Config.TabNames?.Approval}` && formMode?.edit && (
          <>
            <Button
              className={"approveButton"}
              onClick={() =>
                updateStatusByApprover(currentRecord, loginUser, 1)
              }
              label="Approve"
            ></Button>
            <Button
              className={"rejectButton"}
              onClick={() => approverValidationCheck()}
              label="Reject"
            ></Button>
          </>
        )}
      </div>
    </>
  );
};
export default ActionButtons;
