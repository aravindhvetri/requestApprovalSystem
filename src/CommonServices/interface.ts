//List Names
export interface IListNames {
  RequestDetails: string;
}
//Dropdown
export interface IBasicDropdown {
  name: string;
}
export interface IDropdownDetails {
  requestTypesChoice: IBasicDropdown[];
  deparmentsChoice: IBasicDropdown[];
  approvalType: IBasicDropdown[];
}
//Request Details
export interface IRequestDetails {
  RequestID: string;
  RequestType: string;
  Department: string;
  Amount: number;
  Status: string;
  Notes: string;
  ApprovalJson: IApprovalFlow;
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
