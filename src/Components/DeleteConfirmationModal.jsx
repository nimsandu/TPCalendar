import React from "react";
import Modal from "react-modal";
import "./DeleteConfirmationModal.css";

Modal.setAppElement("#root");

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="modal"
      overlayClassName="overlay"
    >
      <h2>Are you sure?</h2>
      <p>Once deleted, this poem cannot be recovered.</p>
      <div className="modal-buttons">
        <button onClick={onConfirm} className="delete">Yes, Delete</button>
        <button onClick={onClose} className="close">Cancel</button>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;
