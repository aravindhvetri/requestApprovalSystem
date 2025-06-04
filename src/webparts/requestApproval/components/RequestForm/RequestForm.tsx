//Common imports:
import * as React from "react";
import { useEffect, useState } from "react";
//Style imports:
import "../../../../External/style.css";
import "./RequestForm.css";
import formStyles from "./RequestFormStyles.module.scss";
//PrimeReact Imports:
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import SPServices from "../../../../CommonServices/SPServices";
import { InputTextarea } from "primereact/inputtextarea";
import { FileUpload } from "primereact/fileupload";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Label } from "office-ui-fabric-react";
//Common Service imports:
import { Config } from "../../../../CommonServices/Config";
import {
  PeoplePicker,
  PrincipalType,
} from "@pnp/spfx-controls-react/lib/PeoplePicker";
import {
  IApprovalFlowValidation,
  IApprovalHistory,
  IBasicDropdown,
  IPatchRequestDetails,
  IPeoplePickerDetails,
  IRequestDetails,
  IStage,
  IStageApprover,
} from "../../../../CommonServices/interface";
import {
  multiplePeoplePickerTemplate,
  peoplePickerTemplate,
  statusTemplate,
} from "../../../../CommonServices/CommonTemplate";
import * as moment from "moment";

const RequestForm = ({ context, setOpenRequestForm, openRequestForm }) => {
  //States:
  const [requestDetailsDataTable, setRequestDetailsDataTable] = useState<
    IRequestDetails[]
  >([]);
  const [requestTypesChoice, setRequestTypesChoice] = useState<
    IBasicDropdown[]
  >(Config.dropdownConfig.requestTypesChoice);
  const [deparmentsChoice, setDepartmentChoices] = useState<IBasicDropdown[]>(
    Config.dropdownConfig.deparmentsChoice
  );
  const [requestDetails, setRequestDetails] = useState<IPatchRequestDetails>({
    ...Config.requestDetailsConfig,
  });
  const [approvalType, setApprovalType] = useState<IBasicDropdown[]>([
    ...Config.dropdownConfig.approvalType,
  ]);
  const [getApprovalHistoryDetails, setGetApprovalHistoryDetails] = useState<
    IApprovalHistory[]
  >([]);
  const [selectedStage, setSelectedStage] = useState({});
  const [validation, setValidation] = useState<IApprovalFlowValidation>({
    ...Config.ApprovalFlowValidation,
  });
  console.log(getApprovalHistoryDetails, " Approval History Details");

  //Initial Render:
  useEffect(() => {
    getRequestApprovalDetails();
    getChoices("RequestType");
    getChoices("Department");
  }, []);

  //States for Approval Json:
  useEffect(() => {
    stagesDataTable();
  }, [validation, selectedStage]);
  useEffect(() => {
    if (openRequestForm?.RequestForm) {
      setSelectedStage({
        stage: 1,
        approvalType: null,
        approver: [],
      });
    }
  }, [openRequestForm?.RequestForm]);

  //Function to get request approval details
  const getRequestApprovalDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.RequestDetails,
      Orderby: "Modified",
      Orderbydecorasc: false,
      Select: "*,Author/ID,Author/Title,Author/EMail",
      Expand: "Author",
      Filter: [
        {
          FilterKey: "IsDelete",
          Operator: "eq",
          FilterValue: "false",
        },
      ],
    })
      .then((response: any) => {
        const tempRequestDetails: IRequestDetails[] = [];
        const tempAuthorDetails: IPeoplePickerDetails[] = [];
        response.forEach((item) => {
          const author: IPeoplePickerDetails = item?.Author
            ? {
                id: item.Author.ID,
                name: item.Author.Title,
                email: item.Author.EMail,
              }
            : null;
          tempRequestDetails.push({
            ID: item?.ID,
            RequestID: item?.RequestID,
            RequestType: item?.RequestType,
            Department: item?.Department,
            Status: item?.Status,
            Amount: item?.Amount,
            Description: item?.Notes,
            ApprovalJson: item?.ApprovalJson
              ? JSON.parse(item.ApprovalJson)
              : [],
            Author: author,
            IsDelete: item?.IsDelete,
          });
        });
        setRequestDetailsDataTable([...tempRequestDetails]);
      })
      .catch((err) => {
        console.log("Error fetching request approval details:", err);
      });
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
        setRequestTypesChoice([...tempArrChoices]);
      } else if (columnName === "Department") {
        setDepartmentChoices([...tempArrChoices]);
      }
    } catch {
      (err: any) => console.log("getChoices err", err);
    }
  };

  //Onchange handle:
  const onChangeHandle = (key, value) => {
    requestDetails[key] = value;
    setRequestDetails({ ...requestDetails });
  };

  //Add request details:
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
      setOpenRequestForm({
        ...Config.DialogConfig,
        RequestForm: false,
      });
    } catch {
      (err) => console.log("addRequestDetails err", err);
    }
  };

  //Render Status Column:
  const renderStatusColumn = (rowData: IRequestDetails) => {
    return <div>{statusTemplate(rowData?.Status)}</div>;
  };

  //Render Stages Column:
  const renderStagesColumn = (rowData: IRequestDetails) => {
    const stages = rowData?.ApprovalJson?.flatMap(
      (approvalObj) => approvalObj?.TotalStages
    );
    return <div>Stage {stages}</div>;
  };

  //Render Approvers Column:
  const renderApprovers = (rowData: IRequestDetails) => {
    const approvers: IPeoplePickerDetails[] = rowData?.ApprovalJson?.flatMap(
      (approvalObj) =>
        approvalObj?.stages?.flatMap((stage) =>
          stage?.approvers?.map((approver) => ({
            id: approver?.id,
            name: approver?.name,
            email: approver?.email,
          }))
        )
    );
    return (
      <div>
        {approvers.length > 1
          ? multiplePeoplePickerTemplate(approvers)
          : peoplePickerTemplate(approvers[0])}
      </div>
    );
  };

  //Render Approved User Column:
  const renderApprovedUserColumn = (rowData: IRequestDetails) => {
    const approvers: IPeoplePickerDetails[] = rowData?.ApprovalJson?.flatMap(
      (approvalObj) =>
        approvalObj?.stages?.flatMap((stage) =>
          stage?.approvers
            ?.filter((approver) => approver?.statusCode === 1)
            .map((approver) => ({
              id: approver?.id,
              name: approver?.name,
              email: approver?.email,
            }))
        )
    );
    return (
      <div>
        {approvers.length > 1
          ? multiplePeoplePickerTemplate(approvers)
          : peoplePickerTemplate(approvers[0])}
      </div>
    );
  };

  //Render Action Column:
  const renderActionColumn = (rowData: IRequestDetails) => {
    return (
      <div className="actionIcons">
        <div>
          <i className="EditIcon pi pi-pencil"></i>
        </div>
        <div>
          <i className="ViewIcon pi pi-eye"></i>
        </div>
        <div>
          <i className="DeleteIcon pi pi-trash"></i>
        </div>
        <div>
          <i
            onClick={() => getApprovalHistory(rowData?.ID)}
            className="HistoryIcon pi pi-history"
          ></i>
        </div>
      </div>
    );
  };

  //Get Approval History:
  const getApprovalHistory = (clickingID: number) => {
    SPServices.SPReadItems({
      Listname: Config.ListNames?.ApprovalHistory,
      Orderby: "Modified",
      Orderbydecorasc: false,
      Select:
        "*,RequestID/ID,RequestID/RequestID,Approver/ID,Approver/Title,Approver/EMail",
      Expand: "RequestID,Approver",
    })
      .then((response: any) => {
        const approvalHistory = response.filter(
          (item: any) => item.RequestID.ID === clickingID
        );
        const tempApprovalHistory: IApprovalHistory[] = [];
        approvalHistory.forEach((item) => {
          tempApprovalHistory.push({
            ID: item?.ID,
            RequestID: item?.RequestID?.RequestID,
            Approver: {
              id: item?.Approver?.ID,
              name: item?.Approver?.Title,
              email: item?.Approver?.EMail,
            },
            Status: item?.Status,
            Comments: item?.Comments,
            Date: moment(item?.Created).format("DD-MM-YYYY"),
          });
        });
        setGetApprovalHistoryDetails([...tempApprovalHistory]);
        setOpenRequestForm({
          ...Config.DialogConfig,
          ApprovalHistory: true,
        });
      })
      .catch((err) => {
        console.log("Error fetching approval history:", err);
      });
  };

  //Render Rejection Name:
  const renderRejectionName = (data) => {
    return (
      <div className="categoryName">
        <>
          <div className="categoryNameTag">
            {data === 1
              ? "Anyone can approve"
              : data === 2
              ? "Everyone should approve"
              : ""}
          </div>
        </>
      </div>
    );
  };

  //Validation
  const validRequiredField = async (action) => {
    if (action === "addStage" || action === "submit" || action === "") {
      if (requestDetails?.ApprovalJson[0]?.stages.length > 0) {
        const tempSatgeErr = requestDetails?.ApprovalJson[0]?.stages
          ?.map((e, index) =>
            e.approvalType === null || e.approvers.length === 0 ? index : -1
          )
          .filter((e) => e !== -1);
        if (tempSatgeErr.length > 0) {
          validation["stageErrIndex"] = [...tempSatgeErr];
          validation["stageValidation"] = "People and type are required";
        } else if (tempSatgeErr.length === 0) {
          validation["stageErrIndex"] = [];
          validation["stageValidation"] = "";
        }
      } else {
        validation["stageErrIndex"] = [];
        validation["stageValidation"] = "";
      }
    }
    await setValidation({ ...validation });
    finalValidation(action);
  };

  // Final validation
  const finalValidation = (action) => {
    if (!validation?.stageValidation) {
      if (action === "addStage") {
        addStage();
      } else if (action === "submit") {
        addRequestDetails();
      }
    }
  };

  //Add stage
  const addStage = () => {
    const tempStage: IStage[] = requestDetails?.ApprovalJson[0]?.stages.slice();
    tempStage.push({
      stage: requestDetails?.ApprovalJson[0]?.stages?.length + 1,
      approvalType: null,
      stageStatusCode: 0,
      approvers: [],
    });
    requestDetails["ApprovalJson"][0]["stages"] = [...tempStage];
    requestDetails["ApprovalJson"][0]["TotalStages"] = tempStage?.length;
    setRequestDetails({
      ...requestDetails,
    });
    setSelectedStage({
      stage: requestDetails?.ApprovalJson[0]?.stages?.length,
      approvalType: null,
      approver: [],
    });
  };

  //Remove stage
  const removeStage = (stageIndex) => {
    var newStages = requestDetails?.ApprovalJson[0]?.stages?.slice();
    newStages.splice(stageIndex, 1)[0];
    const orderedStage: IStage[] = [];
    newStages.forEach((e, i) =>
      orderedStage.push({
        stage: i + 1,
        approvalType: e?.approvalType,
        approvers: e?.approvers,
        stageStatusCode: e?.stageStatusCode,
      })
    );
    requestDetails["ApprovalJson"][0]["stages"] = [...orderedStage];
    requestDetails["ApprovalJson"][0]["TotalStages"] = orderedStage?.length;
    setRequestDetails({
      ...requestDetails,
    });
    if (selectedStage?.["stage"] === stageIndex + 1) {
      setSelectedStage(
        orderedStage.find(
          (e) => e.stage === (stageIndex === 0 ? 1 : stageIndex)
        )
      );
    }
    // setValidation({ ...Config.ApprovalFlowValidation });
  };

  //Render Approvers column
  const renderApproversColumn = (rowData) => {
    console.log("rowdata", rowData);
    const approvers: IPeoplePickerDetails[] = rowData?.approvers?.map(
      ({ statusCode, ...rest }) => rest
    );
    return (
      <div>
        {approvers?.length > 1
          ? multiplePeoplePickerTemplate(approvers)
          : peoplePickerTemplate(approvers[0])}
      </div>
    );
  };

  //Update stage
  const updateStage = (index: number, key: keyof IStage, value: any) => {
    const tempUpdateStage: IStage[] = [
      ...requestDetails?.ApprovalJson[0].stages,
    ];
    var keyValue;
    if (tempUpdateStage[index]) {
      if (key === "approvers") {
        const tempApproverArr: IStageApprover[] = [];
        value.map((e) =>
          tempApproverArr.push({
            id: e?.id,
            name: e?.text,
            email: e?.secondaryText,
            statusCode: 0,
          })
        );
        keyValue = [...tempApproverArr];
      } else {
        keyValue = value;
      }
      tempUpdateStage[index] = { ...tempUpdateStage[index], [key]: keyValue }; // Update the specific key
    }
    requestDetails["ApprovalJson"][0]["stages"] = tempUpdateStage;
    setRequestDetails({
      ...requestDetails,
    });
  };

  //Stages data table
  const stagesDataTable = () => {
    return (
      <DataTable
        value={requestDetails?.ApprovalJson[0].stages}
        // className="custom-card-table"
        selectionMode="single"
        selection={selectedStage}
        scrollable
        scrollHeight="150px"
        onSelectionChange={(e) => {
          e.value && setSelectedStage(e.value);
        }}
        emptyMessage={<p style={{ textAlign: "center" }}>No Records Found</p>}
      >
        <Column
          body={(rowData, row) => (
            <>
              <div
                className="requestCardStage"
                style={
                  selectedStage?.["stage"] === rowData?.stage
                    ? { backgroundColor: "#f3f3f3bd", borderColor: "#0000005c" }
                    : {}
                }
              >
                <div className="requestCardHeader">
                  <div className="requestId">
                    <h3 className="requestIdTitle">
                      {`Stage ${rowData?.stage} approval`}
                    </h3>
                  </div>
                  {rowData?.approvalType &&
                    renderRejectionName(rowData?.approvalType)}
                </div>
                <div className="requestCardBody">
                  {renderApproversColumn(rowData)}
                </div>
              </div>
              <div style={{ marginBottom: "10px" }}>
                {validation?.stageErrIndex.some(
                  (e) =>
                    e ===
                    requestDetails?.ApprovalJson[0]?.stages.findIndex(
                      (e) => e.stage === rowData?.stage
                    )
                ) && (
                  <div>
                    <span className="errorMsg">
                      {validation?.stageValidation}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        />
      </DataTable>
    );
  };

  return (
    <>
      <div>
        <DataTable
          paginator
          rows={5}
          value={requestDetailsDataTable}
          tableStyle={{ minWidth: "50rem" }}
          emptyMessage={
            <>
              <p style={{ textAlign: "center" }}>No Records Found</p>
            </>
          }
        >
          <Column field="RequestID" header="Request id"></Column>
          <Column field="RequestType" header="Request type"></Column>
          <Column
            field="Stages"
            header="Stages"
            body={renderStagesColumn}
          ></Column>
          <Column
            field="Approvers"
            header="Need to approved"
            body={renderApprovers}
          ></Column>
          <Column
            field="Approvers"
            header="Approved user"
            body={renderApprovedUserColumn}
          ></Column>
          <Column field="Department" header="Department"></Column>
          <Column
            field="Status"
            header="Status"
            body={renderStatusColumn}
          ></Column>
          <Column field="Amount" header="Amount"></Column>
          <Column
            field="Action"
            header="Action"
            body={renderActionColumn}
          ></Column>
        </DataTable>
      </div>
      <Dialog
        header="Add new request"
        visible={openRequestForm?.RequestForm}
        style={{ width: "50vw" }}
        onHide={() => {
          setOpenRequestForm({
            ...Config.DialogConfig,
            RequestForm: false,
          });
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
          </div>
          <div className={`${formStyles.approvalConfigContainer}`}>
            <div className={`${formStyles.approvalSubContainer}`}>
              <div className={`${formStyles.approvalStagesContainer}`}>
                <Label className={`${formStyles.label}`}>Approval Stages</Label>
                <div className="stageTable">{stagesDataTable()}</div>
                <div className={`${formStyles.addStageButton}`}>
                  <Button
                    style={{ width: "100%", display: "flow" }}
                    // visible={isEdit}
                    label="Add Stage"
                    onClick={() => {
                      validRequiredField("addStage");
                    }}
                  />
                </div>
              </div>
              <div className={`${formStyles.stageConfigContainer}`}>
                <Label className={`${formStyles.label}`}>
                  Stage Configuration
                </Label>
                <div className={`${formStyles.stageFormContainer}`}>
                  <div className={`${formStyles.deleteStageButton}`}>
                    <Label className={`${formStyles.stageConfigHeader}`}>
                      {`Stage ${selectedStage?.["stage"]}`}
                    </Label>
                    {requestDetails?.ApprovalJson[0]?.stages.length > 1 && (
                      <Button
                        icon="pi pi-trash"
                        label="Remove"
                        // visible={isEdit}
                        className="closeButton"
                        onClick={() => {
                          removeStage(
                            requestDetails?.ApprovalJson[0]?.stages.findIndex(
                              (e) => e.stage === selectedStage?.["stage"]
                            )
                          );
                        }}
                      />
                    )}
                  </div>
                  <div>
                    <Label className={`${formStyles.label}`}>
                      People<span className="required">*</span>
                    </Label>
                    <PeoplePicker
                      context={context}
                      personSelectionLimit={3}
                      groupName={""}
                      showtooltip={true}
                      tooltipMessage="Search and select persons here"
                      // disabled={!isEdit}
                      ensureUser={true}
                      defaultSelectedUsers={requestDetails?.ApprovalJson[0]?.stages[
                        requestDetails?.ApprovalJson[0]?.stages.findIndex(
                          (e) => e.stage === selectedStage?.["stage"]
                        )
                      ]?.approvers.map((approver) => approver.email)}
                      onChange={async (items) => {
                        await updateStage(
                          requestDetails?.ApprovalJson[0]?.stages.findIndex(
                            (e) => e.stage === selectedStage?.["stage"]
                          ),
                          "approvers",
                          items
                        );
                        setValidation({ ...Config.ApprovalFlowValidation });
                      }}
                      principalTypes={[PrincipalType.User]}
                      resolveDelay={1000}
                    />
                  </div>
                  <div className="approvalTypeStyle">
                    <Label className={`${formStyles.label}`}>
                      Type<span className="required">*</span>
                    </Label>
                    <Dropdown
                      width={"100%"}
                      // disabled={!isEdit}
                      value={approvalType?.find(
                        (e) =>
                          e?.id ===
                          requestDetails?.ApprovalJson[0]?.stages[
                            requestDetails?.ApprovalJson[0]?.stages.findIndex(
                              (e) => e.stage === selectedStage?.["stage"]
                            )
                          ]?.approvalType
                      )}
                      options={approvalType}
                      optionLabel="name"
                      onChange={async (e) => {
                        await updateStage(
                          requestDetails?.ApprovalJson[0]?.stages.findIndex(
                            (e) => e.stage === selectedStage?.["stage"]
                          ),
                          "approvalType",
                          e.value?.id
                        );
                        setValidation({ ...Config.ApprovalFlowValidation });
                      }}
                      placeholder="Select Type of Workflow"
                      style={{ marginTop: "0.5rem" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={formStyles.buttonsContainer}>
            <Button
              className="closeButton"
              label="Close"
              onClick={() =>
                setOpenRequestForm({
                  ...Config.DialogConfig,
                  RequestForm: false,
                })
              }
            />
            <Button
              onClick={() => validRequiredField("submit")}
              label="Submit"
            />
          </div>
        </div>
      </Dialog>
      <Dialog
        header="Approval History"
        visible={openRequestForm?.ApprovalHistory}
        style={{ width: "50vw" }}
        onHide={() => {
          setOpenRequestForm({
            ...Config.DialogConfig,
            ApprovalHistory: false,
          });
        }}
      >
        <DataTable
          paginator
          rows={5}
          value={getApprovalHistoryDetails}
          tableStyle={{ minWidth: "40rem" }}
          emptyMessage={
            <>
              <p style={{ textAlign: "center" }}>No Records Found</p>
            </>
          }
        >
          <Column field="RequestID" header="Request id"></Column>
          <Column
            field="Approvers"
            header="Approver Name"
            body={(rowData) => peoplePickerTemplate(rowData?.Approver)}
          ></Column>
          <Column field="Date" header="Date"></Column>
          <Column
            field="Status"
            header="Status"
            body={renderStatusColumn}
          ></Column>
          <Column field="Comments" header="Comments"></Column>
        </DataTable>
      </Dialog>
    </>
  );
};
export default RequestForm;
