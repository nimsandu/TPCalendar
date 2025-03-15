// components/CustomModal.jsx
import React from 'react';
import './CustomModal.css'; // Create a CSS file for the modal

const CustomModal = ({ isOpen, onClose, title, content, onConfirm, confirmText, cancelText }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="custom-modal-overlay">
            <div className="custom-modal">
                <div className="custom-modal-header">
                    <h2>{title}</h2>
                    <button className="custom-modal-close-button" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="custom-modal-content">
                    <p dangerouslySetInnerHTML={{ __html: content }} />
                </div>
                <div className="custom-modal-footer">
                    {cancelText && (
                        <button className="custom-modal-cancel-button" onClick={onClose}>
                            {cancelText}
                        </button>
                    )}
                    {confirmText && (
                        <button className="custom-modal-confirm-button" onClick={onConfirm}>
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomModal;