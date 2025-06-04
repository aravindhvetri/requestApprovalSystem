//Default Imports:
import * as React from "react";
//Styles Imports:
import CommonStyles from "../External/commonStyle.module.scss";
//Common Service Imports:
import { IPeoplePickerDetails } from "./interface";
//Fluent UI Imports:
import {
  DirectionalHint,
  Label,
  Persona,
  PersonaPresence,
  PersonaSize,
  TooltipDelay,
  TooltipHost,
} from "@fluentui/react";

//Status Common Template Styeles:
export const statusTemplate = (status: string) => {
  return (
    <div
      className={CommonStyles.statusItem}
      style={{
        backgroundColor: getColors(status)?.bgColor,
        color: getColors(status)?.color,
        borderColor: getColors(status)?.borderColor,
      }}
    >
      <div>{status}</div>
    </div>
  );
};

//Status Common Template Colors:
const getColors = (status: string) => {
  let colors = {
    bgColor: "",
    color: "",
    borderColor: "",
  };
  switch (status) {
    case "Pending":
      colors.bgColor = "#eaf1f6";
      colors.color = "#2a6d9c";
      break;
    case "Approved":
      colors.bgColor = "#e8f6ed";
      colors.color = "#16a34a";
      break;
    case "Rejected":
      colors.bgColor = "#f6e8e8";
      colors.color = "#b23d3f";
      break;
    case "Resubmited":
      colors.bgColor = "#e2cb3242";
      colors.color = "#af9a0b";
      break;
    default:
      return null;
  }
  return colors;
};

//MultiPeoplePicker Template:
export const multiplePeoplePickerTemplate = (users: IPeoplePickerDetails[]) => {
  return (
    <>
      {users?.length ? (
        <div
          className="user-selector-group"
          style={{
            display: "flex",
          }}
        >
          {users.map((value, index) => {
            if (index < 2) {
              return (
                <Persona
                  styles={{
                    root: {
                      cursor: "pointer",
                      margin: "0 !important;",
                      ".ms-Persona-details": {
                        display: "none",
                      },
                    },
                  }}
                  imageUrl={
                    "/_layouts/15/userphoto.aspx?size=S&username=" + value.email
                  }
                  title={value.name}
                  size={PersonaSize.size32}
                />
              );
            }
          })}

          {users.filter(
            (item, index, self) =>
              index === self.findIndex((t) => t.email === item.email)
          ).length > 2 ? (
            <TooltipHost
              className="all-member-users"
              content={
                <ul style={{ margin: 10, padding: 0 }}>
                  {users
                    .filter(
                      (item, index, self) =>
                        index === self.findIndex((t) => t.email === item.email)
                    )
                    .map((DName: any) => {
                      return (
                        <li style={{ listStyleType: "none" }}>
                          <div style={{ display: "flex" }}>
                            <Persona
                              showOverflowTooltip
                              size={PersonaSize.size24}
                              presence={PersonaPresence.none}
                              showInitialsUntilImageLoads={true}
                              imageUrl={
                                "/_layouts/15/userphoto.aspx?size=S&username=" +
                                `${DName.email}`
                              }
                            />
                            <Label style={{ marginLeft: 10, fontSize: 12 }}>
                              {DName.name}
                            </Label>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              }
              delay={TooltipDelay.zero}
              directionalHint={DirectionalHint.bottomCenter}
              styles={{ root: { display: "inline-block" } }}
            >
              <div className={CommonStyles.Persona}>
                +
                {users.filter(
                  (item, index, self) =>
                    index === self.findIndex((t) => t.email === item.email)
                ).length - 2}
                <div className={CommonStyles.AllPersona}></div>
              </div>
            </TooltipHost>
          ) : null}
        </div>
      ) : (
        ""
      )}
    </>
  );
};

//PeoplePicker Template:
export const peoplePickerTemplate = (user: IPeoplePickerDetails) => {
  return (
    <>
      {user && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <Persona
            styles={{
              root: {
                margin: "0 !important;",
                ".ms-Persona-details": {
                  display: "none",
                },
              },
            }}
            imageUrl={
              "/_layouts/15/userphoto.aspx?size=S&username=" + user?.email
            }
            title={user?.name}
            size={PersonaSize.size32}
          />
          <p
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              margin: 0,
            }}
            className="displayText"
            title={user?.name}
          >
            {user?.name}
          </p>
        </div>
      )}
    </>
  );
};
