import React, { useState, useEffect, useRef } from "react";
import Modal from "react-modal";
import { db } from "../auth/firebaseConfig";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import DOMPurify from "dompurify";
import "./PoemModal.css";
import Loader from "./Loader"; // Import Loader

Modal.setAppElement("#root");

const PoemModal = ({ isOpen, onClose, poemToEdit }) => {
  const [title, setTitle] = useState("");
  const [backstory, setBackstory] = useState("");
  const [showBackstory, setShowBackstory] = useState(false);
  const [color, setColor] = useState("#363636");
  const contentRef = useRef(null);
  const [loading, setLoading] = useState(false); // Add loading state

  const auth = getAuth();
  const user = auth.currentUser;

  const colors = ["#363636", "#5c2b29", "#614a19", "#344562", "#16504b", "#42275e"];

  // Load existing poem when modal opens
  useEffect(() => {
    if (isOpen) {
      if (poemToEdit) {
        setTitle(poemToEdit.title);
        setBackstory(poemToEdit.backstory || "");
        setColor(poemToEdit.color || "#363636");

        // Set content properly
        setTimeout(() => {
          if (contentRef.current) {
            const sanitizedContent = DOMPurify.sanitize(poemToEdit.content);
            contentRef.current.innerHTML = sanitizedContent;
          }
        }, 50);
      } else {
        resetForm();
      }
    }
  }, [isOpen, poemToEdit]);

  const resetForm = () => {
    setTitle("");
    setBackstory("");
    setColor("#363636");
    if (contentRef.current) {
      contentRef.current.innerHTML = "";
    }
  };

  // Use execCommand for formatting text
  const toggleFormat = (command) => {
    document.execCommand(command, false, null);
    contentRef.current.focus();
  };

  const handleSave = async () => {
    if (!title.trim() || !contentRef.current.innerHTML.trim()) {
      alert("Title and content cannot be empty!");
      return;
    }

    const poemData = {
      title: DOMPurify.sanitize(title),
      content: DOMPurify.sanitize(contentRef.current.innerHTML),
      backstory: DOMPurify.sanitize(backstory),
      color,
      timestamp: serverTimestamp(),
      userId: user.uid,
    };

    setLoading(true); // Start loading

    try {
      if (poemToEdit) {
        await updateDoc(doc(db, "poems", poemToEdit.id), poemData);
      } else {
        await addDoc(collection(db, "poems"), poemData);
      }
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error saving poem:", error);
      alert("Error saving poem. Please try again.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={() => {
        resetForm();
        onClose();
      }}
      className="poem-modal"
      overlayClassName="poem-modal-overlay"
      style={{
        content: {
          "--card-accent": color,
          backgroundColor: `${color}33`,
        },
      }}
      key={`modal-${poemToEdit?.id || "new"}`}
    >
      {loading && <Loader />} {/* Show loader when loading */}
      <div>
        <input
          type="text"
          placeholder="Poem Title"
          className="modal-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="formatting-toolbar">
          <button className="format-button" onClick={() => toggleFormat("bold")}>
            <i className="fas fa-bold"></i>
          </button>
          <button className="format-button" onClick={() => toggleFormat("italic")}>
            <i className="fas fa-italic"></i>
          </button>
          <button className="format-button" onClick={() => toggleFormat("underline")}>
            <i className="fas fa-underline"></i>
          </button>
        </div>

        <div
          ref={contentRef}
          className="content-editable"
          contentEditable
          dir="ltr"
          placeholder="Write your poem here..."
          style={{
            direction: "ltr",
            textAlign: "left",
            minHeight: "200px",
            whiteSpace: "pre-wrap",
          }}
          suppressContentEditableWarning
        />

        {showBackstory ? (
          <textarea
            placeholder="Add a backstory..."
            className="backstory-input"
            value={backstory}
            onChange={(e) => setBackstory(e.target.value)}
          />
        ) : (
          <button className="add-backstory-button" onClick={() => setShowBackstory(true)}>
            <i className="fas fa-plus"></i> Add Backstory
          </button>
        )}

        <div className="color-picker">
          {colors.map((c) => (
            <div
              key={c}
              className={`color-option ${color === c ? "selected" : ""}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave}>
            {poemToEdit ? "Update Poem" : "Save Poem"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PoemModal;