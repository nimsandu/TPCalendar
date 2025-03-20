import React, { useState } from "react";
import Modal from "react-modal";
import { toast } from "react-toastify";
import { Trash2, X, AlertTriangle, Loader } from "lucide-react";
import "./DeleteConfirmationModal.css";

Modal.setAppElement("#root");

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      toast.success("Successfully deleted!", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      toast.error("Failed to delete. Please try again.");
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="delete-modal"
      overlayClassName="delete-modal-overlay"
    >
      <div className="delete-modal-content">
        <div className="delete-modal-header">
          <AlertTriangle className="warning-icon" size={28} />
          <h2>Confirm Deletion</h2>
        </div>
        
        <p>Once deleted, this poem cannot be recovered.</p>
        
        <div className="delete-modal-buttons">
          <button 
            onClick={handleConfirmDelete} 
            className="delete-btn" 
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader size={2} className="spinner" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Delete</span>
              </>
            )}
          </button>
          
          <button onClick={onClose} className="cancel-btn" disabled={isDeleting}>
            <X size={16} />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;