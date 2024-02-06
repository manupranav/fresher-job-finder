import axios from "axios";

const API_URL = "http://localhost:8081/api/notifications/";

const createNotification = async (norificationData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_URL, norificationData, config);

  return response.data;
};

const getNotification = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL, config);

  return response.data;
};

//delte notification
const deleteNotification = async (notificationId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(API_URL + notificationId, config);

  return response.data;
};
const notificationService = {
  createNotification,
  getNotification,
  deleteNotification,
};

export default notificationService;
