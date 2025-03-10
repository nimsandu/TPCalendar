import React, { useEffect, useState } from "react";
import { auth } from "../auth/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import SignOut from "./SignOut";
import Poems from "./Poems";
import { Link } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  if (!user) {
    return <p>Please sign in to view your profile.</p>;
  }

  return (
    <div>
      <h2>My Profile</h2>
      <p>Email: {user.email}</p>
      <SignOut />
      <Link to="/change-password">Change Password</Link>
      <Poems />
    </div>
  );
};

export default Profile;
