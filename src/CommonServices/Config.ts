//interface Imports:
import { IListNames, IRequestDetails, ITabNames } from "./interface";

export namespace Config {
  //Whole List Names Configurations:
  export const ListNames: IListNames = {
    RequestDetails: "RequestDetails",
  };

  //Request Details Configurations:
  export const RequestDetails: IRequestDetails = {
    ID: null,
    RequestID: "",
    RequestType: "",
    Department: "",
    Status: "",
    Amount: null,
    Description: "",
    IsDelete: false,
  };

  //Tab Names Configurations:
  export const TabNames: ITabNames = {
    Request: "request",
    Approval: "approval",
  };
}
