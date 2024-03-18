import React, { useState, useEffect } from "react";
import { FaSignInAlt } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { unwrapResult } from "@reduxjs/toolkit";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { login, reset } from "../../features/auth/authSlice";
import Spinner from "../../components/Spinner";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { email, password } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    if (isSuccess || user) {
      navigate("/");
    }

    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const isFormIncomplete = () => {
    return !email || !password;
  };

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (isFormIncomplete()) {
      toast.error("Please complete all fields");
    } else {
      const userData = {
        email,
        password,
      };

      try {
        // Dispatch the login action and unwrap the result
        const resultAction = await dispatch(login(userData));
        unwrapResult(resultAction);

        // If successful, you can navigate or perform other actions
        // For example, navigate("/");
      } catch (error) {
        // Handle the rejected action and display the error message
        if (error && error.response && error.response.status === 400) {
          toast.error("Invalid email or password");
        } else {
          toast.error("An error occurred during login");
        }
      }
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="max-w-screen-md mx-auto">
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="text-center mb-4">
          <h1 className="text-3xl">
            <FaSignInAlt className="inline-block mb-1" /> Login
          </h1>
          <p>Login & find jobs</p>
        </div>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label
              className="block mb-2 text-sm font-medium text-gray-900"
              htmlFor="email"
            >
              Your Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="Enter your email"
              value={email}
              onChange={onChange}
            />
          </div>
          <div className="mb-4">
            <label
              className="block mb-2 text-sm font-medium text-gray-900"
              htmlFor="password"
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="Enter password"
              value={password}
              onChange={onChange}
            />
          </div>
          <div className="mb-4">
            <button
              type="submit"
              className="w-full justify-center text-white bg-[#050708] hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-800 dark:hover:bg-gray-800 me-2 mb-2"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
