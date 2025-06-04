//Default Imports:
import * as React from "react";
import { useEffect, useState } from "react";
//Common Services Imports:
import SPServices from "../../../../CommonServices/SPServices";
import { Config } from "../../../../CommonServices/Config";
import {
  IPeoplePickerDetails,
  IRequestDetails,
} from "../../../../CommonServices/interface";
import {
  peoplePickerTemplate,
  statusTemplate,
} from "../../../../CommonServices/CommonTemplate";
//PrimeReact Imports:
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
//Styles Imports:
import "../../../../External/style.css";
import MyApprovalStyles from "./MyApproval.module.scss";
import { peoplePicker } from "office-ui-fabric-react/lib/components/FloatingPicker/PeoplePicker/PeoplePicker.scss";

const MyApproval = ({ context }) => {
  //States:
  const [requestDetailsObj, setRequestDetailsObj] = useState<IRequestDetails>({
    ...Config.RequestDetails,
  });
  const [requestDetails, setRequestDetails] = useState<IRequestDetails[]>([]);
  console.log(requestDetails, " Request Details from MyApproval Component");

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
        console.log(response, " Response from SPReadItems");
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
            RequestType: item?.RequestType,
            Department: item?.Department,
            Status: item?.Status,
            Amount: item?.Amount,
            Description: item?.Notes,
            ApprovalJson: item?.ApprovalJson,
            Author: author,
            IsDelete: item?.IsDelete,
          });
        });
        setRequestDetails([...tempRequestDetails]);
      })
      .catch((err) => {
        console.log("Error fetching request approval details:", err);
      });
  };

  //Render Author Column:
  const renderAuthorColumn = (rowData: IRequestDetails) => {
    return <div>{peoplePickerTemplate(rowData?.Author)}</div>;
  };

  //Render Status Column:
  const renderStatusColumn = (rowData: IRequestDetails) => {
    return <div>{statusTemplate(rowData?.Status)}</div>;
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
      </div>
    </>
  );
};

export default MyApproval;
