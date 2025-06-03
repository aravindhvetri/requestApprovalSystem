import {
  IApprovalFlow,
  IBasicDropdown,
  IDropdownDetails,
  IListNames,
  IRequestDetails,
} from "./interface";

export namespace Config {
  //List Names config
  export const listNames: IListNames = {
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
  export const requestDetailsConfig: IRequestDetails = {
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
    },
  };
}
