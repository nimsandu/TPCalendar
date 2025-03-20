// ViewPoemModal.jsx
import React, { useEffect, useState, useRef } from "react";
import Modal from "react-modal";
import DOMPurify from "dompurify";
import defaultAvatar from "../images/avatar.png";
import "./ViewPoemModal.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileImport, faShareAlt } from '@fortawesome/free-solid-svg-icons';

Modal.setAppElement("#root");

const ViewPoemModal = ({ isOpen, onClose, poem, authorData, onExport }) => { // Added onExport prop
    const [modalIsOpen, setModalIsOpen] = useState(isOpen);
    const [formattedDate, setFormattedDate] = useState("");
    const modalRef = useRef(null);

    useEffect(() => {
        setModalIsOpen(isOpen);
        if (isOpen && poem) {
            formatTimestamp();
        }
    }, [isOpen, poem]);

    const formatTimestamp = () => {
        try {
            if (!poem?.timestamp) {
                setFormattedDate("");
                return;
            }

            let date;
            if (typeof poem.timestamp?.toDate === "function") {
                date = poem.timestamp.toDate();
            } else if (poem.timestamp instanceof Date) {
                date = poem.timestamp;
            } else {
                date = new Date(poem.timestamp);
            }

            setFormattedDate(
                date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                })
            );
        } catch (error) {
            console.error("Error formatting timestamp:", error);
            setFormattedDate("Invalid date");
        }
    };

    // New function to handle the export button click
    const handleExportClick = () => {
        onClose(); // Close the view modal
        onExport(poem, authorData); // Open the share modal
    };

    if (!poem) return null;

    const displayName = authorData?.firstName && authorData?.lastName
        ? `${authorData.firstName} ${authorData.lastName}`
        : "Anonymous Poet";
    const avatar = authorData?.avatar || defaultAvatar;

    return (
        <Modal
            isOpen={modalIsOpen}
            onRequestClose={onClose}
            className="view-modal"
            overlayClassName="view-overlay"
            style={{
                content: {
                    "--card-accent": poem?.color || "#ff9e3d",
                    background: poem?.color
                        ? `linear-gradient(180deg, ${poem.color}33 0%, ${poem.color}22 50%)`
                        : "linear-gradient(180deg, #292929aa 0%, #191919cc 50%)",
                    backdropFilter: "blur(12px)",
                },
            }}
        >
            <div className="close-container">
                <button className="view-close-button" onClick={onClose}>
                    <i className="fas fa-times"></i>
                </button>
            </div>
            <div className="view-modal-content" ref={modalRef} style={{ position: 'relative', overflow: 'visible', width: '100%', height: '100%' }}>
                <div className="light-tube-download"></div>
                <div className="author-header">
                    <img
                        src={avatar}
                        alt="Author"
                        className="author-avatar"
                    />
                    <div className="author-info">
                        <h3 className="author-name">
                            {displayName}
                        </h3>
                        {formattedDate && (
                            <p className="poem-date">
                                {formattedDate}
                            </p>
                        )}
                        <p>
                        {poem.imported && (
                                    <span className="imported-indicator" title="Restored from a Backup">
                                        <FontAwesomeIcon icon={faFileImport} /> Restored from a Backup
                                    </span>
                                )}
                        </p>
                    </div>
                </div>

                <div className="scrollable-content">
                    <h2 className="view-title">
                        {poem.title}
                    </h2>

                    <div
                        className="view-content"
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(poem.content || ""),
                        }}
                    />

                    {poem.backstory && (
                        <div
                            className="view-backstory"
                            style={{ borderColor: poem?.color || "#ff9e3d" }}
                        >
                            <h4 className="backstory-heading">The Story Behind</h4>
                            <div className="backstory-content">{poem.backstory}</div>
                        </div>
                    )}
                </div>

                {/* Added export button in the actions div */}
                <div className="view-modal-actions">
                    <button 
                        className="view-export-button" 
                        onClick={handleExportClick}
                    >
                        <FontAwesomeIcon icon={faShareAlt} />
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ViewPoemModal;