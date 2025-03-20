import React, { useState, useEffect, useRef } from "react";
import Modal from "react-modal";
import { db } from "../auth/firebaseConfig";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import DOMPurify from "dompurify";
import "./PoemModal.css";
import Loader from "./Loader";
import { toast } from "react-toastify";
import { Save, X, Plus, Bold, Italic, Underline, Loader as LoaderIcon, ArrowLeft, Trash2 } from "lucide-react";

Modal.setAppElement("#root");

const PoemModal = ({ isOpen, onClose, poemToEdit, user }) => {
    const [title, setTitle] = useState("");
    const [backstory, setBackstory] = useState("");
    const [showBackstory, setShowBackstory] = useState(false);
    const [color, setColor] = useState("#363636");
    const [isSaving, setIsSaving] = useState(false);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const contentRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

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
            setHasChanges(false);
        }
    }, [isOpen, poemToEdit]);

    // Track changes
    useEffect(() => {
        if (isOpen) {
            setHasChanges(true);
        }
    }, [title, backstory, color]);

    // Also track content changes
    const handleContentChange = () => {
        setHasChanges(true);
    };

    const resetForm = () => {
        setTitle("");
        setBackstory("");
        setColor("#363636");
        if (contentRef.current) {
            contentRef.current.innerHTML = "";
        }
        setHasChanges(false);
    };

    const toggleFormat = (command) => {
        document.execCommand(command, false, null);
        contentRef.current.focus();
        setHasChanges(true);
    };

    const handleCloseRequest = () => {
        if (hasChanges && (title.trim() || contentRef.current?.innerHTML.trim() || backstory.trim())) {
            setShowDiscardConfirm(true);
        } else {
            resetForm();
            onClose();
        }
    };

    const handleDiscard = () => {
        setShowDiscardConfirm(false);
        resetForm();
        onClose();
    };

    const handleSave = async () => {
        if (!title.trim() || !contentRef.current.innerHTML.trim()) {
            toast.error("Title and content cannot be empty!");
            return;
        }

        if (!user?.uid) {
            console.error("User not authenticated.");
            toast.error("User not authenticated. Please log in again.");
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
        setIsSaving(true);

        try {
            if (poemToEdit) {
                await updateDoc(doc(db, "users", user.uid, "poems", poemToEdit.id), poemData);
                toast.success("Poem updated successfully! Remember to periodically backup your poems for safekeeping.");
            } else {
                await addDoc(collection(db, "users", user.uid, "poems"), poemData);
                toast.success("Poem saved successfully! Remember to periodically backup your poems for safekeeping.");
            }
            resetForm();
            onClose();
        } catch (error) {
            console.error("Error saving poem:", error);
            toast.error("Error saving poem. Please try again.");
        } finally {
            setLoading(false);
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={handleCloseRequest}
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
                        <Bold size={16} />
                    </button>
                    <button className="format-button" onClick={() => toggleFormat("italic")}>
                        <Italic size={16} />
                    </button>
                    <button className="format-button" onClick={() => toggleFormat("underline")}>
                        <Underline size={16} />
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
                    onInput={handleContentChange}
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
                        <Plus size={16} /> Add Backstory
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
                    <button className="icon-button cancel-button" onClick={handleCloseRequest} title="Cancel" >
                        <X size={20} />
                    </button>
                    <button className="icon-button save-button" onClick={handleSave} disabled={isSaving} title={poemToEdit ? "Update" : "Save"}>
                        {isSaving ? (
                            <LoaderIcon className="spinner" size={20} />
                        ) : (
                            <Save size={20} />
                        )}
                    </button>
                </div>
            </div>

            {/* Discard Confirmation Dialog */}
            {showDiscardConfirm && (
                <div className="discard-confirm-overlay">
                    <div className="discard-confirm-modal">
                        <h3>Discard Changes?</h3>
                        <p>You have unsaved changes that will be lost if you continue.</p>
                        <div className="discard-actions">
                            <button className="icon-button-text cancel-button" onClick={() => setShowDiscardConfirm(false)}>
                                <ArrowLeft size={16} />
                                <span>Keep Editing</span>
                            </button>
                            <button className="icon-button-text discard-button" onClick={handleDiscard}>
                                <Trash2 size={16} />
                                <span>Discard</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default PoemModal;