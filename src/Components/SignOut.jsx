import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOutUser } from "../auth/authService";
import "./AuthStyles.css";

const SignOut = () => {
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOutUser();
      navigate("/"); // Redirect to home page
    } catch (error) {
      alert("Error signing out: " + error.message);
    }
  };

  return (
    <>
      <button className="SObutton" onClick={() => setShowPopup(true)}>Sign Out</button>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <p>Are you sure you want to sign out?</p>
            <div className="popup-buttons">
              <button className="confirm" onClick={handleSignOut}>Yes</button>
              <button className="cancel" onClick={() => setShowPopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SignOut;
