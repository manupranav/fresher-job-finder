import { useDispatch } from "react-redux";
import { deleteNotification } from "../features/notifications/notificationSlice";

const NotificationItem = ({ notification }) => {
  const dispatch = useDispatch();

  return (
    <div className="goal">
      <h4 style={{ marginRight: "10px", marginTop: "5px" }}>
        {notification.webhookURL}
      </h4>
      <button
        className="close text-xs"
        onClick={() => dispatch(deleteNotification(notification._id))}
      >
        X
      </button>
    </div>
  );
};

export default NotificationItem;
