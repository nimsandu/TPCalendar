import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { db } from "../auth/firebaseConfig";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import "./Poems.css";

Modal.setAppElement("#root"); // Required for accessibility

const PoemModal = ({ isOpen, onClose, poemToEdit }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [backstory, setBackstory] = useState("");
  const [showBackstory, setShowBackstory] = useState(false);

  // Fill in form when editing
  useEffect(() => {
    if (poemToEdit) {
      setTitle(poemToEdit.title);
      setContent(poemToEdit.content);
      setBackstory(poemToEdit.backstory || "");
    } else {
      setTitle("");
      setContent("");
      setBackstory("");
    }
  }, [poemToEdit]);

  // Function to handle save
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Title and content cannot be empty!");
      return;
    }

    if (poemToEdit) {
      // Editing existing poem
      const poemRef = doc(db, "poems", poemToEdit.id);
      await updateDoc(poemRef, {
        title,
        content,
        backstory,
      });
    } else {
      // Adding new poem
      await addDoc(collection(db, "poems"), {
        title,
        content,
        backstory,
        timestamp: serverTimestamp(), // Save date and time
      });
    }

    onClose(); // Close modal
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="modal"
      overlayClassName="overlay"
    >
      <h2>{poemToEdit ? "Edit Poem" : "Add New Poem"}</h2>
      <input
        type="text"
        placeholder="Poem Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Write your poem here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {showBackstory ? (
        <textarea
          placeholder="Add a backstory..."
          value={backstory}
          onChange={(e) => setBackstory(e.target.value)}
        />
      ) : (
        <button onClick={() => setShowBackstory(true)}>+ Add a backstory</button>
      )}
      <div className="modal-buttons">
        <button onClick={handleSave}>Save</button>
        <button onClick={onClose} className="cancel">Cancel</button>
      </div>
    </Modal>
  );
};

export default PoemModal;
