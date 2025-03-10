import React from "react";
import Modal from "react-modal";
import "./ViewPoemModal.css";

Modal.setAppElement("#root"); // Required for accessibility

const ViewPoemModal = ({ isOpen, onClose, poem }) => {
  if (!poem) return null; // Prevents rendering if no poem is selected

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="modal"
      overlayClassName="overlay"
    >
      <h2>{poem.title}</h2>
      <p className="timestamp">{new Date(poem.timestamp?.toDate()).toLocaleString()}</p>
      <p>{poem.content}</p>
      {poem.backstory && (
        <>
          <h4>Backstory:</h4>
          <p>{poem.backstory}</p>
        </>
      )}
      <div className="modal-buttons">
        <button onClick={onClose} className="close">Close</button>
      </div>
    </Modal>
  );
};

export default ViewPoemModal;
