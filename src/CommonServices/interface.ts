//Dropdown
export interface IBasicDropdown {
  name: string;
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
  stages: Stage[];
}
interface Stage {
  stage: number;
  ApprovalType: number;
  stageStatusCode: number;
  approvers: Approver[];
}
interface Approver {
  id: number;
  name: string;
  email: string;
  statusCode: number;
}
//Whole List Names Interfaces:
export interface IListNames {
  RequestDetails: string;
}

//Tab Names Interface:
export interface ITabNames {
  Request: string;
  Approval: string;
}
