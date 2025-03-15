import React, { useEffect, useState, useRef } from "react";
import Modal from "react-modal";
import DOMPurify from "dompurify";
import { db, auth } from "../auth/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import defaultAvatar from "../images/avatar.png";
import "./ViewPoemModal.css";

Modal.setAppElement("#root");

const ViewPoemModal = ({ isOpen, onClose, poem }) => {
    const [modalIsOpen, setModalIsOpen] = useState(isOpen);
    const [userData, setUserData] = useState(null);
    const [formattedDate, setFormattedDate] = useState("");
    const modalRef = useRef(null);
    const [userEmail, setUserEmail] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserEmail(user.email);
            } else {
                setUserEmail(null);
            }
        });
        return () => unsubscribe();
    },);

    useEffect(() => {
        setModalIsOpen(isOpen);
        if (isOpen && poem) {
            fetchUserData();
            formatTimestamp();
        }
    }, [isOpen, poem, userEmail]);

    const fetchUserData = async () => {
        try {
            if (userEmail) {
                const userRef = doc(db, "users", userEmail);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    setUserData({
                        displayName: userSnap.data().firstName + " " + userSnap.data().lastName || "Anonymous Poet",
                        avatar: userSnap.data().avatar || defaultAvatar,
                    });
                } else {
                    setUserData({
                        displayName: "Anonymous Poet",
                        avatar: defaultAvatar,
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            setUserData({
                displayName: "Anonymous Poet",
                avatar: defaultAvatar,
            });
        }
    };

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


    if (!poem) return null;

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
            <div className="view-modal-content" ref={modalRef} style={{position:'relative', overflow: 'visible', width:'100%', height:'100%'}}>
                <div className = "light-tube-download"></div>
                <div className="author-header">
                    <img
                        src={userData?.avatar || defaultAvatar}
                        alt="Author"
                        className="author-avatar"
                    />
                    <div className="author-info">
                        <h3 className="author-name">
                            {userData?.displayName || "Anonymous Poet"}
                        </h3>
                        {formattedDate && <p className="poem-date">{formattedDate}</p>}
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

                <div className="view-modal-actions">


                </div>

            </div>

        </Modal>
    );
};

export default ViewPoemModal;