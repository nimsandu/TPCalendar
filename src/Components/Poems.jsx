import React, { useState, useEffect } from "react";
import { db } from "../auth/firebaseConfig";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, where } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Import authentication
import PoemModal from "./PoemModal";
import "./Poems.css";
import ViewPoemModal from "./ViewPoemModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

const Poems = () => {
  const [poems, setPoems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [poemToEdit, setPoemToEdit] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [poemToView, setPoemToView] = useState(null);
  const [deletePoemId, setDeletePoemId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser; // Get the logged-in user

  useEffect(() => {
    if (!user) return; // Only fetch poems if a user is logged in

    const q = query(
      collection(db, "poems"),
      where("userId", "==", user.uid), // Filter by user ID
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPoems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]); // Re-run when user changes

  const openModal = () => {
    setPoemToEdit(null);
    setIsModalOpen(true);
  };

  const editPoem = (poem) => {
    setPoemToEdit(poem);
    setIsModalOpen(true);
  };

  const viewPoem = (poem) => {
    setPoemToView(poem);
    setIsViewModalOpen(true);
  };

  const confirmDelete = (id) => {
    setDeletePoemId(id);
    setIsDeleteModalOpen(true);
  };

  const deletePoem = async () => {
    if (deletePoemId) {
      await deleteDoc(doc(db, "poems", deletePoemId));
      setDeletePoemId(null);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div>
      <button onClick={openModal} className="add-button">+ Add New</button>
      
      {poems.map((poem) => (
        <div key={poem.id} className="poem-card">
          <h3>{poem.title}</h3>
          <p>{poem.content.substring(0, 50)}...</p>
          <p className="timestamp">{new Date(poem.timestamp?.toDate()).toLocaleString()}</p>
          <div className="poem-buttons">
            <button onClick={() => viewPoem(poem)}>View</button>
            <button onClick={() => editPoem(poem)}>Edit</button>
            <button onClick={() => confirmDelete(poem.id)} className="delete">Delete</button>
          </div>
        </div>
      ))}

      <PoemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} poemToEdit={poemToEdit} />
      <ViewPoemModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} poem={poemToView} />
      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={deletePoem} 
      />
    </div>
  );
};

export default Poems;
