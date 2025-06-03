//Default Imports:
import * as React from "react";
import { useEffect, useState } from "react";
//Common Services Imports:
import SPServices from "../../../../CommonServices/SPServices";
import { Config } from "../../../../CommonServices/Config";
import { IRequestDetails } from "../../../../CommonServices/interface";
import { statusTemplate } from "../../../../CommonServices/CommonTemplate";
//PrimeReact Imports:
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
//Styles Imports:
import "../../../../External/style.css";
import MyApprovalStyles from "./MyApproval.module.scss";

const MyApproval = ({ context }) => {
  //States:
  const [requestDetailsObj, setRequestDetailsObj] = useState<IRequestDetails>({
    ...Config.RequestDetails,
  });
  const [requestDetails, setRequestDetails] = useState<IRequestDetails[]>([]);

  //Initial Render:
  useEffect(() => {
    getRequestApprovalDetails();
  }, []);

  //Function to get request approval details
  const getRequestApprovalDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.RequestDetails,
      Orderby: "Modified",
      Orderbydecorasc: false,
      Select: "*",
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
          tempRequestDetails.push({
            ID: item?.ID,
            RequestID: item?.RequestID,
            RequestType: item?.RequestType,
            Department: item?.Department,
            Status: item?.Status,
            Amount: item?.Amount,
            Description: item?.Notes,
            IsDelete: item?.IsDelete,
          });
        });
        setRequestDetails([...tempRequestDetails]);
      })
      .catch((err) => {
        console.log("Error fetching request approval details:", err);
      });
  };

  //Render Status Column:
  const renderStatusColumn = (rowData: IRequestDetails) => {
    return <div>{statusTemplate(rowData?.Status)}</div>;
  };

  //Render Action Column:
  const renderActionColumn = (rowData: IRequestDetails) => {
    return (
      <div className={MyApprovalStyles.actionIcons}>
        <div>
          <i className={`${MyApprovalStyles.EditIcon} pi pi-pencil`}></i>
        </div>
        <div>
          <i className={`${MyApprovalStyles.ViewIcon} pi pi-eye`}></i>
        </div>
        <div>
          <i className={`${MyApprovalStyles.DeleteIcon} pi pi-trash`}></i>
        </div>
      </div>
    );
  };

  return (
    <>
      <div>
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
    </>
  );
};

export default MyApproval;
