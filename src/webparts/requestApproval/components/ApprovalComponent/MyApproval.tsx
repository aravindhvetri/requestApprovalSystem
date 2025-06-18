//Default Imports:
import * as React from "react";
import { useEffect, useRef, useState } from "react";
//Common Services Imports:
import SPServices from "../../../../CommonServices/SPServices";
import { Config } from "../../../../CommonServices/Config";
import {
  IApprovalHistory,
  IPeoplePickerDetails,
  IRequestDetails,
} from "../../../../CommonServices/interface";
import {
  viewFiles,
  getFileIcon,
  peoplePickerTemplate,
  statusTemplate,
  toastNotify,
  DownloadFiles,
  getApprovalHistory,
} from "../../../../CommonServices/CommonTemplate";
//PrimeReact Imports:
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
//Styles Imports:
import "../../../../External/style.css";
import MyApprovalStyles from "./MyApproval.module.scss";
import { peoplePicker } from "office-ui-fabric-react/lib/components/FloatingPicker/PeoplePicker/PeoplePicker.scss";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import ActionButtons from "../ActionButtons/ActionButtons";
import { Label } from "office-ui-fabric-react";
import { FileUpload } from "primereact/fileupload";
import { sp } from "@pnp/sp/presets/all";
import Loader from "../Loader";

const MyApproval = ({
  openRequestForm,
  setOpenRequestForm,
  filterSelected,
  activeTab,
  callToastNotify,
  context,
}) => {
  const loginUser = context._pageContext._user.email;
  const serverRelativeUrl = context?._pageContext?._site?.serverRelativeUrl;
  //States:
  const [requestDetailsObj, setRequestDetailsObj] = useState<IRequestDetails>({
    ...Config.RequestDetails,
  });
  const [requestDetails, setRequestDetails] = useState<IRequestDetails[]>([]);
  const [files, setFiles] = useState([]);
  const [approvalFormMode, setApprovalFormMode] = useState({
    edit: false,
    view: false,
  });
  const [alreadyExistingFiles, setAlreadyExistingFiles] = useState([]);
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [showLoaderinForm, setShowLoaderinForm] = useState<boolean>(false);
  const [getApprovalHistoryDetails, setGetApprovalHistoryDetails] = useState<
    IApprovalHistory[]
  >([]);
  const toast = useRef(null);
  const clearFiles = useRef(null);
  //Initial Render:
  useEffect(() => {
    getRequestApprovalDetails();
  }, [filterSelected]);
  useEffect(() => {
    setShowLoader(true);
    getRequestApprovalDetails();
  }, []);
  useEffect(() => {
    if (openRequestForm?.ApprovalForm) {
      if (requestDetailsObj?.ID) {
        LoadExistingFiles(requestDetailsObj?.ID);
      }
    } else if (!openRequestForm?.RequestForm) {
      setFiles([]);
      setApprovalFormMode({ edit: false, view: false });
      setRequestDetailsObj({ ...Config.RequestDetails });
      getRequestApprovalDetails();
    }
  }, [openRequestForm]);
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
            ApprovalJson: JSON.parse(item?.ApprovalJson),
            Author: author,
            IsDelete: item?.IsDelete,
          });
        });
        filterRecords([...tempRequestDetails]);
      })
      .catch((err) => {
        console.log("Error fetching request approval details:", err);
      });
  };
  //Filter records for approvers
  const filterRecords = async (tempArr) => {
    const filterTempArr = tempArr.filter((item) =>
      item.ApprovalJson[0]?.stages?.some(
        (stage) =>
          stage.stage <= item.ApprovalJson[0].Currentstage &&
          stage.approvers.some((approver) => approver.email === loginUser)
      )
    );
    const finalFilterData = filterTempArr.filter(
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
            res?.Author?.name
              .toLowerCase()
              .includes(filterSelected?.globalSearchValue.toLowerCase()) ||
            res?.Author?.email
              .toLowerCase()
              .includes(filterSelected?.globalSearchValue.toLowerCase())
          : true)
    );
    await setRequestDetails([...finalFilterData]);
    setShowLoader(false);
  };
  //Render Author Column:
  const renderAuthorColumn = (rowData: IRequestDetails) => {
    return <div>{peoplePickerTemplate(rowData?.Author)}</div>;
  };

  //Render Status Column:
  const renderStatusColumn = (rowData: IRequestDetails) => {
    return <div>{statusTemplate(rowData?.Status)}</div>;
  };
  //Set current data
  const currentData = (rowData) => {
    setRequestDetailsObj({
      ID: rowData?.ID,
      RequestID: rowData?.RequestID,
      RequestType: rowData?.RequestType || "",
      Department: rowData?.Department || "",
      Status: rowData?.Status || "",
      Created: rowData?.Created,
      Amount: rowData?.Amount || 0,
      Description: rowData?.Description || "",
      ApprovalJson: rowData?.ApprovalJson,
      Author: rowData?.Author,
      IsDelete: false,
    });
  };
  //Render Action Column:
  const renderActionColumn = (rowData: IRequestDetails) => {
    return (
      <div className="actionIcons">
        {(rowData?.Status === "Pending" || rowData?.Status === "Resubmited") &&
          rowData?.ApprovalJson[0].stages
            .find((e) => e.stage === rowData.ApprovalJson[0].Currentstage)
            .approvers.find((e) => e.email === loginUser)?.statusCode === 0 && (
            <div>
              <i
                className="EditIcon pi pi-pencil"
                onClick={async () => {
                  await currentData(rowData);
                  await getApprovalHistory(
                    rowData?.ID,
                    setGetApprovalHistoryDetails,
                    ""
                  );
                  setApprovalFormMode({ edit: true, view: false });
                  setOpenRequestForm({
                    ...Config.DialogConfig,
                    ApprovalForm: true,
                  });
                }}
              ></i>
            </div>
          )}
        <div>
          <i
            className="ViewIcon pi pi-eye"
            onClick={async () => {
              await currentData(rowData);
              await getApprovalHistory(
                rowData?.ID,
                setGetApprovalHistoryDetails,
                ""
              );
              setApprovalFormMode({ edit: false, view: true });
              setOpenRequestForm({
                ...Config.DialogConfig,
                ApprovalForm: true,
              });
            }}
          ></i>
        </div>
      </div>
    );
  };
  //Format date
  const formatDate = (inputDate) => {
    const date = new Date(inputDate);
    const formattedDate = `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;

    return formattedDate;
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
  //Remove file :
  const removeFile = (fileName: string) => {
    const updatedFiles = files.filter((file) => file.name !== fileName);
    setFiles(updatedFiles);
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
      const folderPath = `${serverRelativeUrl}/${Config.libraryNamesConfig?.RequestAttachments}/Approvers`;
      const requestId = `${requestDetailsObj?.ID}`;

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
  return (
    <>
      <div>
        <Loader showLoader={showLoader} />
        <DataTable
          paginator
          rows={5}
          value={requestDetails}
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
            field="Requestor"
            header="Requested by"
            body={renderAuthorColumn}
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
        <Dialog
          header={approvalFormMode?.edit ? "Update request" : "View request"}
          visible={openRequestForm?.ApprovalForm}
          style={{ width: "50vw" }}
          onHide={() => {
            setOpenRequestForm({
              ...Config.DialogConfig,
              ApprovalForm: false,
            });
          }}
        >
          <Toast ref={toast} />
          <div className={MyApprovalStyles.dialogContentStyles}>
            <div className={MyApprovalStyles.requestDetailsContainer}>
              <div className={MyApprovalStyles.requestID}>
                <Label className={MyApprovalStyles.label}>
                  {requestDetailsObj?.RequestID}
                </Label>
                {statusTemplate(requestDetailsObj?.Status)}
              </div>
              <div className={MyApprovalStyles.requestDetails}>
                <Label className={MyApprovalStyles.userLabel}>
                  User - {renderAuthorColumn(requestDetailsObj)}
                </Label>
                <Label className={MyApprovalStyles.label}>{`Date - ${formatDate(
                  requestDetailsObj?.Created
                )}`}</Label>
                <Label
                  className={MyApprovalStyles.label}
                >{`Request Type - ${requestDetailsObj?.RequestType}`}</Label>
                <Label
                  className={MyApprovalStyles.label}
                >{`Amount - ${requestDetailsObj?.Amount}`}</Label>
              </div>
            </div>
            <Label
              style={{ marginBottom: "10px" }}
              className={MyApprovalStyles.contentTitle}
            >
              APPROVAL HISTORY
            </Label>
            <DataTable
              paginator
              rows={2}
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
            {(approvalFormMode?.edit || files.length > 0) && (
              <Label className={MyApprovalStyles.contentTitle}>DOCUMENTS</Label>
            )}
            {approvalFormMode?.edit && (
              <FileUpload
                name="demo[]"
                url={"/api/upload"}
                chooseOptions={{
                  icon: "pi pi-upload",
                  style: { padding: "5px 10px" },
                  className: "modernButton",
                }}
                multiple
                ref={clearFiles}
                chooseLabel="Browse"
                onSelect={(e) => {
                  handleFileSelection(e, files, setFiles, toast, Config);
                  clearFiles.current.clear();
                }}
                className={
                  approvalFormMode?.view
                    ? "buttonbarNotVisible"
                    : "buttonbarVisible"
                }
                onRemove={(e) => removeFile(e?.file?.name)}
                emptyTemplate={
                  <p className="fileUploadEmptyMsg">
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      {approvalFormMode?.view ? (
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
                    {approvalFormMode?.view
                      ? "No files found"
                      : "Drag file to this area to upload"}
                  </p>
                }
              />
            )}
            <div className={MyApprovalStyles.attachmentsContainer}>
              {files?.map((file) => (
                <div className={MyApprovalStyles.fileContainer}>
                  <div className={MyApprovalStyles.fileIcon}>
                    {getFileIcon(file?.name)}
                  </div>
                  <div className={MyApprovalStyles.fileDetails}>
                    <Label
                      style={{ cursor: "pointer" }}
                      className={`tooltip ${MyApprovalStyles.label}`}
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
                  <div className={MyApprovalStyles.cancelIcon}>
                    <img
                      onClick={() =>
                        file?.ulr
                          ? DownloadFiles(file?.ulr)
                          : DownloadFiles(file?.objectURL)
                      }
                      className={MyApprovalStyles.cancelImg}
                      src={require("../../assets/downloading.png")}
                    />
                    {!approvalFormMode?.view &&
                      (file?.objectURL ||
                        file?.author?.EMail === loginUser) && (
                        <img
                          onClick={() => removeFile(file?.name)}
                          className={MyApprovalStyles.cancelImg}
                          src={require("../../assets/close.png")}
                        />
                      )}
                  </div>
                </div>
              ))}
            </div>
            <ActionButtons
              showLoaderinForm={showLoaderinForm}
              setShowLoaderinForm={setShowLoaderinForm}
              setOpenRequestForm={setOpenRequestForm}
              validRequiredField={""}
              updateFilesbyApprovalForm={checkFiles}
              formMode={approvalFormMode}
              context={context}
              setUserStatusUpdate={""}
              activeTab={activeTab}
              userStatusUpdate={""}
              currentRecord={requestDetailsObj}
            />
          </div>
        </Dialog>
      </div>
    </>
  );
};

export default MyApproval;
