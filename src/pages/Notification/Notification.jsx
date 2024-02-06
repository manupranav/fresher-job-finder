import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify"; // Import toast
import {
  createNotification,
  getNotification,
  reset,
} from "../../features/notifications/notificationSlice";
import Spinner from "../../components/Spinner";
import NotificationItem from "../../components/NotificationItem";

const Notification = () => {
  const [webhookURL, setWebhookURL] = useState("");
  const [validationError, setValidationError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { notifications, isLoading, isError, message } = useSelector(
    (state) => state.notifications
  );

  useEffect(() => {
    if (isError) {
      toast.error(message); // Display error message as toast
    }
    if (!user) {
      navigate("/login");
    }

    dispatch(getNotification());

    return () => {
      dispatch(reset());
    };
  }, [user, navigate, isError]);

  const validateWebhookURL = (url) => {
    // Regular expression for validating Discord/Slack webhook URLs
    const webhookRegex =
      /^(https:\/\/discord\.com\/api\/webhooks\/|https:\/\/discordapp\.com\/api\/webhooks\/|https:\/\/discordapp\.com\/api\/webhooks\/|https:\/\/hooks\.slack\.com\/services\/).+$/;

    return webhookRegex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!webhookURL) {
        throw new Error("Webhook URL is required");
      }

      if (!validateWebhookURL(webhookURL)) {
        setValidationError("Invalid Discord/Slack webhook URL");
        return;
      }

      console.log({ userId: user._id, webhookURL });
      await dispatch(createNotification({ userId: user._id, webhookURL }));
      dispatch(getNotification());
      setWebhookURL("");
      setValidationError(""); // Clear validation error on successful submission

      toast.success("Webhook added successfully!"); // Display success message as toast
    } catch (error) {
      console.error("Error creating webhook:", error.message);
    }
  };

  const goBack = () => {
    navigate(-1); // Go back to the previous page
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="max-w-screen-md mx-auto p-4">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="flex items-center justify-between mb-4">
          <button className="text-black hover:underline" onClick={goBack}>
            <FaArrowLeft />
          </button>
          <div className="text-center">
            <h1 className="text-3xl">Notification</h1>
            <p>Manage your notifications</p>
          </div>
          <div></div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block mb-2 text-sm font-bold text-gray-700"
              htmlFor="webhookURL"
            >
              Webhook URL:
            </label>
            <input
              type="text"
              id="webhookURL"
              name="webhookURL"
              value={webhookURL}
              onChange={(e) => setWebhookURL(e.target.value)}
              className={`w-full p-2 border rounded ${
                validationError ? "border-red-500" : ""
              }`}
              placeholder="Enter Webhook URL"
            />
            {validationError && (
              <p className="text-red-500 text-sm">{validationError}</p>
            )}
          </div>
          <div className="mb-4">
            <button
              className="w-full bg-[#050708] hover:bg-gray-800 text-white font-bold py-2 px-4 rounded"
              type="submit"
            >
              Add Webhook
            </button>
          </div>
        </form>
      </div>
      <section>
        {notifications.length > 0 ? (
          <div className="goals">
            {notifications.map((notification, index) => (
              <NotificationItem
                key={notification._id || index}
                notification={notification}
              />
            ))}
          </div>
        ) : (
          <h3>You have 0 webhooks.</h3>
        )}
      </section>
    </div>
  );
};

export default Notification;
