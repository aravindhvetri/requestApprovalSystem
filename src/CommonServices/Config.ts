import { App } from "@pnp/sp/appcatalog";
import {
  IApprovalFlow,
  IBasicDropdown,
  IDropdownDetails,
  IListNames,
  IRequestDetails,
  IPatchRequestDetails,
  ITabNames,
  IDialogPopUp,
  IApprovalFlowValidation,
  IDelModal,
} from "./interface";

export namespace Config {
  //Whole List Names Configurations:
  export const ListNames: IListNames = {
    RequestDetails: "RequestDetails",
    ApprovalHistory: "ApprovalHistory",
  };

  //Dropdown config
  export const dropdownConfig: IDropdownDetails = {
    requestTypesChoice: [],
    deparmentsChoice: [],
    approvalType: [
      { name: "Everyone should approve", id: 2 },
      { name: "Anyone can approve", id: 1 },
    ],
  };

  //Request Details Config
  export const requestDetailsConfig: IPatchRequestDetails = {
    RequestID: "",
    RequestType: "",
    Department: "",
    Amount: null,
    Notes: "",
    ApprovalJson: [
      {
        Currentstage: 1,
        TotalStages: 0,
        stages: [
          { stage: 1, approvalType: null, stageStatusCode: 0, approvers: [] },
        ],
      },
    ],
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
    ApprovalJson: [],
    Author: {
      id: null,
      name: "",
      email: "",
    },
    IsDelete: false,
  };

  //Tab Names Configurations:
  export const TabNames: ITabNames = {
    Request: "request",
    Approval: "approval",
  };

  //Dialog pop_up Configurations:
  export const DialogConfig: IDialogPopUp = {
    RequestForm: false,
    ApprovalHistory: false,
  };

  //Approval Stage Error Details
  export const ApprovalFlowValidation: IApprovalFlowValidation = {
    stageValidation: "",
    stageErrIndex: [],
  };

  //Delete confirmation Details:
  export const initialdelModal: IDelModal = {
    isOpen: false,
    id: null,
  };
}
