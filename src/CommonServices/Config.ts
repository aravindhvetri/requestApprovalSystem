
import {
  IApprovalFlow,
  IBasicDropdown,
  IDropdownDetails,
  IListNames,
  IRequestDetails,
  IPatchRequestDetails,
  ITabNames,
} from "./interface";

export namespace Config {
   //Whole List Names Configurations:
  export const ListNames: IListNames = {
    RequestDetails: "RequestDetails",
  };
  
  //Dropdown config
  export const dropdownConfig: IDropdownDetails = {
    requestTypesChoice: [],
    deparmentsChoice: [],
    approvalType: [
      { name: "Everyone should approve" },
      { name: "Anyone can approve" },
    ],
  };
  
  //Request Details Config
  export const requestDetailsConfig: IPatchRequestDetails = {
    RequestID: "",
    RequestType: "",
    Department: "",
    Amount: null,
    Status: "",
    Notes: "",
    ApprovalJson: {
      Currentstage: 1,
      TotalStages: 0,
      stages: [],
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
