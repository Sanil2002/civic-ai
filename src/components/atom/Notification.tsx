import { Store } from "react-notifications-component";

const Notification = (
title: string,
message: string,
type: "success" | "danger" | "info" | "default" | "warning"
) => {
console.log("Notification_success")
Store.addNotification({
id: "Notification",
title: title,
message: message,
type: type,
insert: "top",
container: "top-right",
animationIn: ["animate__animated", "animate__fadeIn"],
animationOut: ["animate__animated", "animate__fadeOut"],
dismiss: {
duration: 5000,
showIcon: true,
},
});
};
export default Notification;