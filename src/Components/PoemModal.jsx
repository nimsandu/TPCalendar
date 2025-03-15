import React, { useState, useEffect, useRef } from "react";
import Modal from "react-modal";
import { db } from "../auth/firebaseConfig";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import DOMPurify from "dompurify";
import "./PoemModal.css";
import Loader from "./Loader";

Modal.setAppElement("#root");

const PoemModal = ({ isOpen, onClose, poemToEdit, user }) => { // <--- Added 'user' to props
    const [title, setTitle] = useState("");
    const [backstory, setBackstory] = useState("");
    const [showBackstory, setShowBackstory] = useState(false);
    const [color, setColor] = useState("#363636");
    const contentRef = useRef(null);
    const [loading, setLoading] = useState(false);

    // const auth = getAuth(); // No need to initialize auth here if 'user' prop is passed
    // const user = auth.currentUser; // 'user' is now received as a prop

    const colors = [
        "#363636", // Dark Gray
        "#5c2b29", // Burgundy
        "#614a19", // Olive
        "#344562", // Navy
        "#16504b", // Teal
        "#42275e", // Purple
        "#283742", // Dark Slate Gray
        "#6E2C00"   // Sienna
    ];

    useEffect(() => {
        if (isOpen) {
            if (poemToEdit) {
                setTitle(poemToEdit.title);
                setBackstory(poemToEdit.backstory || "");
                setColor(poemToEdit.color || "#363636");

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

    const toggleFormat = (command) => {
        document.execCommand(command, false, null);
        contentRef.current.focus();
    };

    const handleSave = async () => {
        if (!title.trim() || !contentRef.current.innerHTML.trim()) {
            alert("Title and content cannot be empty!");
            return;
        }

        if (!user?.uid) {
            console.error("User not authenticated.");
            alert("User not authenticated. Please log in again.");
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

        setLoading(true);

        try {
            if (poemToEdit) {
                await updateDoc(doc(db, "users", user.uid, "poems", poemToEdit.id), poemData); // Corrected path
            } else {
                await addDoc(collection(db, "users", user.uid, "poems"), poemData); // Corrected path
            }
            resetForm();
            onClose();
        } catch (error) {
            console.error("Error saving poem:", error);
            alert("Error saving poem. Please try again.");
        } finally {
            setLoading(false);
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
            {loading && <Loader />}
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