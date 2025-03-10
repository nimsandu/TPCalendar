import React from "react";
import { signOutUser } from "../auth/authService";

const SignOut = () => {
  const handleSignOut = async () => {
    try {
      await signOutUser();
      alert("Signed out successfully!");
    } catch (error) {
      alert("Error signing out: " + error.message);
    }
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
};

export default SignOut;
