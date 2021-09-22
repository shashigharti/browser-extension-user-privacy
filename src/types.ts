
export enum Sender {
    React,
    Content
}
export interface ChromeMessage {
    from: Sender,
    message: any
}

// Popup requesting background script for status change
export interface UserData {
    type: "USER_DATA";
    data: any;
}