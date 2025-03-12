import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import DOMPurify from "dompurify";
import "./ViewPoemModal.css";

Modal.setAppElement("#root"); // Ensure this is only called ONCE globally

const ViewPoemModal = ({ isOpen, onClose, poem }) => {
  const [modalIsOpen, setModalIsOpen] = useState(isOpen);

  useEffect(() => {
    setModalIsOpen(isOpen);
  }, [isOpen]);

  if (!poem) return null; // Prevent rendering if no poem is passed

  // Fix timestamp formatting issues
  let formattedTimestamp = "Timestamp not available";
  if (poem.timestamp) {
    try {
      formattedTimestamp = new Date(poem.timestamp).toLocaleString();
    } catch (error) {
      console.error("Invalid timestamp:", error);
    }
  }

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={onClose}
      className="view-modal"
      overlayClassName="view-overlay"
      style={{
        content: {
          "--card-accent": poem?.color || "#ff9e3d",
          backgroundColor: poem?.color ? `${poem.color}33` : "#191919aa",
        },
      }}
    >
      <div className="view-modal-content">
        <h2 className="view-title">{poem.title}</h2>
        <div className="view-timestamp">{formattedTimestamp}</div>

        <div
          className="view-content"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(poem.content || ""), // Ensure content is not undefined
          }}
        />

        {poem.backstory && (
          <div className="view-backstory">
            <h4 className="backstory-heading">Backstory</h4>
            <div className="backstory-content">{poem.backstory}</div>
          </div>
        )}

        <div className="view-modal-buttons">
          <button onClick={onClose} className="view-close-button">
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewPoemModal;
