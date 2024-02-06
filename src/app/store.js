import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import jobReducer from "../features/jobs/jobSlice";
import notificationReducer from "../features/notifications/notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    jobs: jobReducer,
    notifications: notificationReducer,
  },
});
