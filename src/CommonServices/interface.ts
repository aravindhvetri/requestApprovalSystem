//Whole List Names Interfaces:
export interface IListNames {
  RequestDetails: string;
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
//Tab Names Interface:
export interface ITabNames {
  Request: string;
  Approval: string;
}
