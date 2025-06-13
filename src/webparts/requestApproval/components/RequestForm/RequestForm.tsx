//Common imports:
import * as React from "react";
import { useEffect, useRef, useState } from "react";
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
  IFormMode,
  IDelModal,
  IPatchRequestDetails,
  IPeoplePickerDetails,
  IRequestDetails,
  IStage,
  IStageApprover,
  IApprovalPatch,
} from "../../../../CommonServices/interface";
import {
  deepClone,
  viewFiles,
  generateRequestID,
  getFileIcon,
  multiplePeoplePickerTemplate,
  peoplePickerTemplate,
  statusTemplate,
  toastNotify,
  DownloadFiles,
} from "../../../../CommonServices/CommonTemplate";
import * as moment from "moment";
import { sp, View } from "@pnp/sp/presets/all";
import { Toast } from "primereact/toast";
import ActionButtons from "../ActionButtons/ActionButtons";
import Loader from "../Loader";

const RequestForm = ({
  context,
  setOpenRequestForm,
  filterSelected,
  openRequestForm,
  callToastNotify,
  formMode,
  activeTab,
  deparmentsChoice,
  requestTypesChoice,
  setFormMode,
}) => {
  const loginUser = context._pageContext._user.email;
  //States:
  const serverRelativeUrl = context?._pageContext?._site?.serverRelativeUrl;
  const [requestDetailsDataTable, setRequestDetailsDataTable] = useState<
    IRequestDetails[]
  >([]);
  const cloneRequestDetails: IPatchRequestDetails = deepClone(
    Config.requestDetailsConfig
  );
  const [requestDetails, setRequestDetails] =
    useState<IPatchRequestDetails>(cloneRequestDetails);
  const [userStatusUpdate, setUserStatusUpdate] = useState<IApprovalPatch>({
    status: "",
    approvalJson: [],
    comments: "",
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
  const [alreadyExistingFiles, setAlreadyExistingFiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [updateItem, setUpdateItem] = useState<IRequestDetails>({
    ...Config.RequestDetails,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [delModal, setDelModal] = useState<IDelModal>({
    ...Config.initialdelModal,
  });
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [showLoaderinForm, setShowLoaderinForm] = useState<boolean>(false);
  //useref
  const clearFiles = useRef(null);
  const toast = useRef(null);
  //Initial Render:
  useEffect(() => {
    if (requestDetailsDataTable.length === 0) {
      setShowLoader(true);
    }
    getRequestApprovalDetails();
  }, [filterSelected]);
  //States for Approval Json:
  useEffect(() => {
    if (openRequestForm?.RequestForm) {
      if (updateItem?.ID) {
        setRequestDetails({
          RequestID: updateItem?.RequestID,
          RequestType: updateItem?.RequestType,
          Department: updateItem?.Department,
          Amount: updateItem?.Amount,
          Notes: updateItem?.Description,
          ApprovalJson: updateItem?.ApprovalJson,
        });
        LoadExistingFiles(updateItem?.ID);
      } else {
        requestDetails["RequestID"] = generateRequestID(
          requestDetailsDataTable
        );
        setRequestDetails({ ...requestDetails });
      }
      setSelectedStage({
        stage: 1,
        approvalType: null,
        approver: [],
      });
    } else if (!openRequestForm?.RequestForm) {
      setFiles([]);
      setFormMode({ ...Config.FormModeConfig });
      setUpdateItem({ ...Config.RequestDetails });
      setRequestDetails(cloneRequestDetails);
      setUserStatusUpdate({
        status: "",
        approvalJson: [],
        comments: "",
      });
      getRequestApprovalDetails();
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
            Created: item?.Created,
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
        filterCondition(tempRequestDetails);
      })
      .catch((err) => {
        console.log("Error fetching request approval details:", err);
      });
  };
  //Filter Data
  const filterCondition = async (tempRequestDetails) => {
    const tempFilterValue: IRequestDetails[] = tempRequestDetails?.filter(
      (res) => res?.Author?.email === loginUser
    );
    const finalFilterData = tempFilterValue.filter(
      (res) =>
        (filterSelected?.requestSelected
          ? filterSelected?.requestSelected === res?.RequestType
          : true) &&
        (filterSelected?.statusSelected
          ? filterSelected?.statusSelected === res?.Status
          : true) &&
        (filterSelected?.departmentSelected
          ? filterSelected?.departmentSelected === res?.Department
          : true) &&
        (filterSelected?.globalSearchValue
          ? res?.RequestID.toLowerCase().includes(
              filterSelected?.globalSearchValue.toLowerCase()
            ) ||
            res?.ApprovalJson[0]?.stages?.filter((e) =>
              e?.approvers.some(
                (approver) =>
                  approver?.name
                    .toLowerCase()
                    .includes(
                      filterSelected?.globalSearchValue.toLowerCase()
                    ) ||
                  approver?.email
                    .toLowerCase()
                    .includes(filterSelected?.globalSearchValue.toLowerCase())
              )
            ).length > 0
          : true)
    );
    console.log("finalFilterData", finalFilterData);
    await setRequestDetailsDataTable([...finalFilterData]);
    setShowLoader(false);
  };

  //Get Attachments
  const LoadExistingFiles = async (id) => {
    const requestId = `${id}`;
    sp.web.lists
      .getByTitle(Config.libraryNamesConfig?.RequestAttachments)
      .items.select(
        "*,FileLeafRef,FileRef,FileDirRef,Author/ID,Author/Title,Author/EMail"
      )
      .filter(`RequestID eq '${requestId}' and IsDelete eq false`)
      .expand("File,Author")
      .orderBy("Modified", false)
      .get()
      .then((res: any) => {
        let tempData = [];
        if (res?.length) {
          res?.forEach((val: any) => {
            tempData.push({
              id: val?.ID,
              name: val?.File?.Name || "",
              ulr: val?.File?.ServerRelativeUrl || "",
              createdDate: val?.Created ? new Date(val?.Created) : null,
              author: val?.Author,
            });
          });
        }
        setFiles([...tempData]);
        setAlreadyExistingFiles([...tempData]);
      })
      .catch((err: any) => {
        SPServices.ErrFunction("Get attachments err", err);
      });
  };
  //Check attachments on library
  const checkFiles = async () => {
    let uploadFiles = files?.filter((e) => e?.objectURL);
    let oldfiles = files?.filter((e) => e?.id)?.map((e) => e?.id);
    let deletedFiles = alreadyExistingFiles?.filter(
      (res) => !oldfiles.includes(res?.id)
    );
    if (uploadFiles.length > 0) {
      await updateAttachments(uploadFiles);
    }
    if (deletedFiles.length > 0) {
      await isDeleteFiles(deletedFiles);
    }
    setFiles([]);
    setOpenRequestForm({
      ...Config.DialogConfig,
      RequestForm: false,
    });
    setShowLoaderinForm(false);
    callToastNotify("updated");
  };
  //Add Datas From Attachment Library Requestors:
  const updateAttachments = async (currentFiles) => {
    try {
      const folderPath = `${serverRelativeUrl}/${Config.libraryNamesConfig?.RequestAttachments}/Requestors`;
      const requestId = `${updateItem?.ID}`;

      for (const file of currentFiles) {
        const fileBuffer = await file.arrayBuffer();
        const uploadResult = await sp.web
          .getFolderByServerRelativeUrl(folderPath)
          .files.add(file.name, fileBuffer, true);

        await uploadResult.file.listItemAllFields.get().then(async (item) => {
          await sp.web.lists
            .getByTitle(Config.libraryNamesConfig?.RequestAttachments)
            .items.getById(item.Id)
            .update({
              RequestIDId: requestId,
            });
        });
      }
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  //IsDelete Attachment files
  const isDeleteFiles = async (currentFiles) => {
    try {
      for (const file of currentFiles) {
        await sp.web.lists
          .getByTitle(Config.libraryNamesConfig?.RequestAttachments)
          .items.getById(file?.id)
          .update({
            IsDelete: true,
          });
      }
    } catch (error) {
      console.error("isDelete files err:", error);
    }
  };

  //Onchange handle:
  const onChangeHandle = (key, value) => {
    requestDetails[key] = value;
    setRequestDetails({ ...requestDetails });
  };
  //Update Request details
  const updateRequestDetails = async () => {
    try {
      const res = await SPServices.SPUpdateItem({
        Listname: Config.ListNames.RequestDetails,
        RequestJSON: {
          RequestID: requestDetails?.RequestID,
          RequestType: requestDetails?.RequestType,
          Department: requestDetails?.Department,
          Amount: requestDetails?.Amount,
          Notes: requestDetails?.Notes,
          Status: userStatusUpdate?.status,
          ApprovalJson: JSON.stringify(userStatusUpdate?.approvalJson),
        },
        ID: updateItem?.ID,
      });
      checkFiles();
    } catch {
      (err) => console.log("update request details err", err);
    }
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
      addFiles(res);
    } catch {
      (err) => console.log("addRequestDetails err", err);
    }
  };

  //Add Files in Library
  const addFiles = async (item) => {
    try {
      const folderPath = `${serverRelativeUrl}/${Config.libraryNamesConfig?.RequestAttachments}/Requestors`;
      const requestId = `${item?.data?.ID}`;

      for (const file of files) {
        const fileBuffer = await file.arrayBuffer();
        const uploadResult = await sp.web
          .getFolderByServerRelativeUrl(folderPath)
          .files.add(file.name, fileBuffer, true);
        await uploadResult.file.listItemAllFields.get().then(async (item) => {
          try {
            await sp.web.lists
              .getByTitle(Config.libraryNamesConfig?.RequestAttachments)
              .items.getById(item.Id)
              .update({
                RequestIDId: requestId,
              });
          } catch {
            (err) => console.log("Update requestId err", err);
          }
        });
      }
      setFiles([]);
      setOpenRequestForm({
        ...Config.DialogConfig,
        RequestForm: false,
      });
      setShowLoaderinForm(false);
      callToastNotify("added");
    } catch {
      (err) => console.log("addFiles err", err);
    }
  };
  //Remove file :
  const removeFile = (fileName: string) => {
    const updatedFiles = files.filter((file) => file.name !== fileName);
    setFiles(updatedFiles);
  };
  //Handle File Selection:
  const handleFileSelection = async (e, files, setFiles, toast, Config) => {
    try {
      const existingSPFiles = await sp.web.lists
        .getByTitle(Config.libraryNamesConfig.RequestAttachments)
        .items.select("FileLeafRef")
        .get();

      const spFileNames = existingSPFiles.map((file) => file.FileLeafRef);
      const duplicatesInSP = e.files.filter((newFile) =>
        spFileNames.includes(newFile.name)
      );
      const totalDuplicates = [...duplicatesInSP];
      const newFiles = e.files.filter(
        (newFile) =>
          !spFileNames.includes(newFile.name) &&
          !files.some((existing) => existing.name === newFile.name)
      );
      if (totalDuplicates.length > 0) {
        toast.current?.show({
          severity: "warn",
          summary: "Warning",
          content: (prop) =>
            toastNotify({
              iconName: "pi-exclamation-triangle",
              ClsName: "toast-imgcontainer-warning",
              type: "Warning",
              msg: `${totalDuplicates?.map((e) => e.name)?.join(", ")} file ${
                totalDuplicates?.length > 1 ? "names" : "name"
              } already exist, Please rename the ${
                totalDuplicates?.length > 1 ? "files" : "file"
              } before uploading.`,
              image: require("../../../../../src/webparts/requestApproval/assets/giphy.gif"),
            }),
          life: 3000,
        });
      }

      if (newFiles.length > 0) {
        setFiles([...files, ...newFiles]);
      }
    } catch (error) {
      console.error("Error in file selection:", error);
    }
  };

  //Render Status Column:
  const renderStatusColumn = (rowData: IRequestDetails) => {
    return <div>{statusTemplate(rowData?.Status)}</div>;
  };

  //IsDelete update in Approval config
  const updateIsDelete = () => {
    SPServices.SPUpdateItem({
      Listname: Config.ListNames.RequestDetails,
      ID: delModal.id,
      RequestJSON: { IsDelete: true },
    })
      .then(() => {
        getRequestApprovalDetails();
        setDelModal({ isOpen: false, id: null });
      })
      .catch((err) => console.log("updateIsDelete error", err));
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
        approvalObj?.stages
          ?.filter((stage) => stage?.stage >= approvalObj?.Currentstage)
          .flatMap((stage) =>
            stage?.approvers
              ?.filter((approver) => approver?.statusCode === 0)
              ?.map((approver) => ({
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
        {approvers.length > 0
          ? approvers.length > 1
            ? multiplePeoplePickerTemplate(approvers)
            : peoplePickerTemplate(approvers[0])
          : "-"}
      </div>
    );
  };

  //Render Action Column:
  const renderActionColumn = (rowData: IRequestDetails) => {
    return (
      <div className="actionIcons">
        {rowData?.Status === "Rejected" && (
          <div>
            <i
              className="EditIcon pi pi-pencil"
              onClick={() => {
                setUpdateItem(rowData);
                setFormMode({ ...Config.FormModeConfig, edit: true });
                setOpenRequestForm({
                  ...Config.DialogConfig,
                  RequestForm: true,
                });
              }}
            ></i>
          </div>
        )}
        <div>
          <i
            className="ViewIcon pi pi-eye"
            onClick={() => {
              setUpdateItem(rowData);
              setFormMode({ ...Config.FormModeConfig, view: true });
              setOpenRequestForm({
                ...Config.DialogConfig,
                RequestForm: true,
              });
            }}
          ></i>
        </div>
        {/* <div>
          <i className="ViewIcon pi pi-eye"></i>
        </div> */}
        <div>
          <i
            onClick={() => setDelModal({ isOpen: true, id: rowData?.ID })}
            className="DeleteIcon pi pi-trash"
          ></i>
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
          validation["stageValidation"] = "* People and type are required";
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
        setShowLoaderinForm(true);
        updateItem?.ID ? updateRequestDetails() : addRequestDetails();
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
    setValidation({ ...Config.ApprovalFlowValidation });
  };

  //Render Approvers column
  const renderApproversColumn = (rowData) => {
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
      <div className={formStyles.stagesTabelContainer}>
        {requestDetails?.ApprovalJson[0].stages.map((stage) => (
          <>
            <div
              style={
                selectedStage?.["stage"] === stage?.stage
                  ? { backgroundColor: "#f3f3f3bd", borderColor: "#0000005c" }
                  : {}
              }
              onClick={() => setSelectedStage(stage)}
              className={formStyles.stageContainer}
            >
              <div className={formStyles.stageIcon}>
                {" "}
                <img
                  style={{ height: "25px", width: "25px" }}
                  src={require("../../assets/teamwork.png")}
                />
              </div>
              <div className={formStyles.stageDetails}>
                <h3 className={formStyles.stageTitle}>
                  {`Stage ${stage?.stage} approval`}
                </h3>
                {stage?.approvalType &&
                  renderRejectionName(stage?.approvalType)}
              </div>

              <div className={formStyles.approversContainer}>
                {renderApproversColumn(stage)}
              </div>
            </div>
            <div>
              {validation?.stageErrIndex.some(
                (e) =>
                  e ===
                  requestDetails?.ApprovalJson[0]?.stages.findIndex(
                    (res) => res.stage === stage?.stage
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
        ))}
      </div>
    );
  };

  return (
    <>
      <Loader showLoader={showLoader} />
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
            body={(rowdata) =>
              rowdata?.Status !== "Approved" ? renderApprovers(rowdata) : "-"
            }
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
        header={
          formMode?.edit
            ? "Edit request details"
            : formMode?.view
            ? "View request details"
            : "Add new request"
        }
        visible={openRequestForm?.RequestForm}
        style={{ width: "50vw" }}
        onHide={() => {
          setOpenRequestForm({
            ...Config.DialogConfig,
            RequestForm: false,
          });
        }}
      >
        <Toast ref={toast} />
        <div className={formStyles.dialogContentStyles}>
          <label className={formStyles.contentTitle}>BASIC DETAILS</label>
          <div className={formStyles.contentData}>
            <InputText
              onChange={(e) => onChangeHandle("RequestID", e.target.value)}
              value={requestDetails?.RequestID}
              placeholder="Request Id"
              disabled={true}
            />
            <Dropdown
              value={requestTypesChoice?.find(
                (e) => e.name === requestDetails?.RequestType
              )}
              onChange={(e) => onChangeHandle("RequestType", e.value?.name)}
              options={requestTypesChoice}
              optionLabel="name"
              placeholder="Request type"
              disabled={formMode?.view}
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
              disabled={formMode?.view}
              className="w-full md:w-14rem"
            />
            <InputText
              value={requestDetails?.Amount?.toString()}
              onChange={(e) => onChangeHandle("Amount", e.target.value)}
              disabled={formMode?.view}
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
            placeholder="Enter any notes"
            disabled={formMode?.view}
            value={requestDetails?.Notes}
            rows={5}
          />
          {!formMode?.view && (
            <FileUpload
              name="demo[]"
              url={"/api/upload"}
              multiple
              ref={clearFiles}
              chooseLabel="Browse"
              onSelect={(e) => {
                handleFileSelection(e, files, setFiles, toast, Config);
                clearFiles.current.clear();
              }}
              className={
                formMode?.view ? "buttonbarNotVisible" : "buttonbarVisible"
              }
              onRemove={(e) => removeFile(e?.file?.name)}
              emptyTemplate={
                <p className="fileUploadEmptyMsg">
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    {formMode?.view ? (
                      <img
                        style={{ height: "35px", width: "35px" }}
                        src={require("../../assets/error-file.png")}
                      />
                    ) : (
                      <img
                        style={{ height: "40px", width: "40px" }}
                        src={require("../../assets/upload.png")}
                      />
                    )}
                  </div>
                  {formMode?.view
                    ? "No files found"
                    : "Click or drag file to this area to upload"}
                </p>
              }
            />
          )}
          <div className={formStyles.attachmentsContainer}>
            {files?.map((file) => (
              <div className={formStyles.fileContainer}>
                <div className={formStyles.fileIcon}>
                  {getFileIcon(file?.name)}
                </div>
                <div className={formStyles.fileDetails}>
                  <Label
                    style={{ cursor: "pointer" }}
                    className={`tooltip ${formStyles.label}`}
                    onClick={() =>
                      file?.ulr
                        ? viewFiles(file?.ulr)
                        : viewFiles(file?.objectURL)
                    }
                  >
                    {file?.name.length > 20
                      ? `${file?.name.slice(0, 20)}....`
                      : file?.name}
                    <span className="tooltiptext">{file?.name}</span>
                  </Label>
                </div>
                <div className={formStyles.cancelIcon}>
                  <img
                    onClick={() =>
                      file?.ulr
                        ? DownloadFiles(file?.ulr)
                        : DownloadFiles(file?.objectURL)
                    }
                    className={formStyles.cancelImg}
                    src={require("../../assets/downloading.png")}
                  />
                  {!formMode?.view &&
                    (file?.objectURL || file?.author?.EMail === loginUser) && (
                      <img
                        onClick={() => removeFile(file?.name)}
                        className={formStyles.cancelImg}
                        src={require("../../assets/close.png")}
                      />
                    )}
                </div>
              </div>
            ))}
          </div>

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
                    visible={formMode?.edit || formMode?.add}
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
                        visible={formMode?.edit || formMode?.add}
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
                      disabled={formMode?.view}
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
                      disabled={formMode?.view}
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
          <ActionButtons
            showLoaderinForm={showLoaderinForm}
            setShowLoaderinForm={setShowLoaderinForm}
            setOpenRequestForm={setOpenRequestForm}
            validRequiredField={validRequiredField}
            formMode={formMode}
            updateFilesbyApprovalForm={""}
            context={context}
            setUserStatusUpdate={setUserStatusUpdate}
            activeTab={activeTab}
            userStatusUpdate={userStatusUpdate}
            currentRecord={updateItem}
          />
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
      <Dialog
        className="modal-template confirmation"
        draggable={false}
        blockScroll={false}
        resizable={false}
        visible={delModal.isOpen}
        style={{ width: "20rem" }}
        onHide={() => {
          setDelModal({ isOpen: false, id: null });
        }}
      >
        <div className="modal-container">
          <div className="modalIconContainer">
            <i className={`pi pi-trash ${formStyles.DialogDelIcon}`}></i>
          </div>
          <div className="modal-content">
            <div>
              <div className="modal-header">
                <h4>Confirmation</h4>
              </div>
              <p>Are you sure, you want to delete this request?</p>
            </div>
          </div>
          <div className="modal-btn-section">
            <Button
              label="No"
              className={`cancel-btn`}
              onClick={() => {
                setDelModal({ isOpen: false, id: null });
              }}
            />
            <Button
              className={`submit-btn`}
              label="Yes"
              onClick={() => updateIsDelete()}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};
export default RequestForm;
