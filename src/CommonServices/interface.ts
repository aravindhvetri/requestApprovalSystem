//Dropdown
export interface IBasicDropdown {
  name: string;
  id: number;
}
export interface IDropdownDetails {
  requestTypesChoice: IBasicDropdown[];
  deparmentsChoice: IBasicDropdown[];
  approvalType: IBasicDropdown[];
}

//Request Details Interface:
export interface IRequestDetails {
  ID: number;
  RequestID: string;
  RequestType: string;
  Department: string;
  Status: string;
  Amount: number;
  Description: string;
  ApprovalJson: IApprovalFlow[];
  Author: IPeoplePickerDetails;
  IsDelete: boolean;
}

//Request Details
export interface IPatchRequestDetails {
  RequestID: string;
  RequestType: string;
  Department: string;
  Amount: number;
  Notes: string;
  ApprovalJson: IApprovalFlow[];
}
export interface IApprovalFlow {
  Currentstage: number;
  TotalStages: number;
  stages: IStage[];
}
export interface IStage {
  stage: number;
  approvalType: number;
  stageStatusCode: number;
  approvers: IStageApprover[];
}
export interface IStageApprover {
  id: number;
  name: string;
  email: string;
  statusCode: number;
}
//Whole List Names Interfaces:
export interface IListNames {
  RequestDetails: string;
  ApprovalHistory: string;
}
//Library names
export interface ILibraryNames {
  RequestAttachments: string;
}
//Toast Message Details:
export interface IToaster {
  iconName: string;
  ClsName: string;
  type: "Warning" | "Success" | "Alert";
  msg: string;
  image?: string;
}

//Tab Names Interface:
export interface ITabNames {
  Request: string;
  Approval: string;
}

//PeoplePicker Details:
export interface IPeoplePickerDetails {
  id: number;
  name: string;
  email: string;
}

//Approval History Interface:
export interface IApprovalHistory {
  ID: number;
  RequestID: string;
  Approver: IPeoplePickerDetails;
  Status: string;
  Comments: string;
  Date: string;
}

//Dialog pop_up Interface:
export interface IDialogPopUp {
  RequestForm: boolean;
  ApprovalHistory: boolean;
}

//Approval Stage Error Details
export interface IApprovalFlowValidation {
  stageValidation: string;
  stageErrIndex: number[];
}

//Form mode
export interface IFormMode {
  view: boolean;
  edit: boolean;
  add: boolean;
}

//Delete Confirmation Interface
export interface IDelModal {
  isOpen: boolean;
  id: number;
}
