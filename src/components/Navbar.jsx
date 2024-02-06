import React from "react";
import {
  FaSignInAlt,
  FaSignOutAlt,
  FaUser,
  FaBell,
  FaHome,
} from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout, reset } from "../features/auth/authSlice";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate("/");
  };

  return (
    <>
      <header className="header">
        <div className="logo">
          <Link to="/">JobsFinder</Link>
        </div>
        <ul className="nav-links">
          {user ? (
            <>
              <li>
                {location.pathname === "/notification" ? (
                  <Link to="/">
                    <FaHome /> Dashboard
                  </Link>
                ) : (
                  <Link to="/notification">
                    <FaBell /> Notifications
                  </Link>
                )}
              </li>
              <li>
                <button className="logout-btn" onClick={onLogout}>
                  <FaSignOutAlt /> Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login">
                  <FaSignInAlt /> Login
                </Link>
              </li>
              <li>
                <Link to="/register">
                  <FaUser /> Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </header>
    </>
  );
};

export default Navbar;
