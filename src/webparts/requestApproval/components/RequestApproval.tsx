import * as React from "react";
// import styles from "./RequestApproval.module.scss";
import { IRequestApprovalProps } from "./IRequestApprovalProps";
import { escape } from "@microsoft/sp-lodash-subset";
import { sp } from "@pnp/sp";
import MainComponent from "./MainComponent";

export default class RequestApproval extends React.Component<
  IRequestApprovalProps,
  {}
> {
  constructor(prop: IRequestApprovalProps, state: {}) {
    super(prop);
    sp.setup({
      spfxContext: this.props.context,
    });
  }
  public render(): React.ReactElement<IRequestApprovalProps> {
    return <MainComponent context={this.props.context} />;
  }
}
