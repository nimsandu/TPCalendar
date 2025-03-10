import React, { useState, useEffect } from "react";
import { db } from "../auth/firebaseConfig";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import PoemModal from "./PoemModal";
import "./Poems.css"
import ViewPoemModal from "./ViewPoemModal";  // Import the new modal
import DeleteConfirmationModal from "./DeleteConfirmationModal"; // Import the new modal

const Poems = () => {
  const [poems, setPoems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [poemToEdit, setPoemToEdit] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [poemToView, setPoemToView] = useState(null);
  const [deletePoemId, setDeletePoemId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "poems"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPoems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

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
