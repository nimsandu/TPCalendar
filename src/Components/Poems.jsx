// Poems.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { db } from "../auth/firebaseConfig";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import PoemModal from "./PoemModal";
import "./Poems.css";
import ViewPoemModal from "./ViewPoemModal";
import DOMPurify from 'dompurify';
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileImport } from '@fortawesome/free-solid-svg-icons';

const Poems = ({ user, onOpenModal, onEditPoem }) => { // Receive onOpenModal and onEditPoem
    const [poems, setPoems] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false); // Local modal state (can be removed)
    const [poemToEdit, setPoemToEdit] = useState(null); // Local edit state (can be removed)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [poemToView, setPoemToView] = useState(null);
    const [deletePoemId, setDeletePoemId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loggedInUserData, setLoggedInUserData] = useState(null);

    const poemListRef = useRef(null);
    const [poemsVisible, setPoemsVisible] = useState(10);
    const loadingMore = useRef(false);

    useEffect(() => {
        if (!user?.uid) {
            setPoems([]);
            setLoading(false);
            setLoggedInUserData(null);
            return;
        }

        // Fetch logged-in user's data
        const userRef = doc(db, "users", user.uid);
        const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                setLoggedInUserData(docSnap.data());
            }
        });

        // Fetch user's poems
        const poemsCollectionRef = collection(db, "users", user.uid, "poems");
        const q = query(
            poemsCollectionRef,
            orderBy("timestamp", "desc")
        );

        const unsubscribePoems = onSnapshot(q, (snapshot) => {
            setPoems(snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate(),
            })));
            setLoading(false);
        });

        return () => {
            unsubscribeUser();
            unsubscribePoems();
        };
    }, [user]);

    const handleScroll = () => {
        if (poemListRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = poemListRef.current;
            if (scrollTop + clientHeight >= scrollHeight - 20 && !loadingMore.current && poems && poems.length > poemsVisible) {
                loadMorePoems();
            }
        }
    };

    const loadMorePoems = () => {
        if (loadingMore.current) return;
        loadingMore.current = true;
        setTimeout(() => {
            setPoemsVisible((prev) => prev + 5);
            loadingMore.current = false;
        }, 500);
    };

    const openModal = () => {
        onOpenModal(); // Inform Profile to open the modal
    };

    const editPoem = (poem) => {
        onEditPoem(poem); // Send the poem to Profile for editing
    };

    const viewPoem = (poem) => {
        setPoemToView(poem);
        setIsViewModalOpen(true);
    };

    const closeViewModal = () => {
        setPoemToView(null);
        setIsViewModalOpen(false);
    };

    const confirmDelete = (id) => {
        setDeletePoemId(id);
        setIsDeleteModalOpen(true);
    };

    const deletePoem = async () => {
        if (deletePoemId && user) {
            await deleteDoc(doc(db, "users", user.uid, "poems", deletePoemId));
            setDeletePoemId(null);
            setIsDeleteModalOpen(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        return `${timestamp.toLocaleDateString()} • ${timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    };

    if (loading) {
        return <div>Loading poems...</div>;
    }

    return (
        <div>
            <button onClick={openModal} className="add-button" style={{ display: "none" }}>
                <i className="fas fa-plus"></i> Add New Poem
            </button>

            <div className="blankblock"></div>

            <div className="poem-grid" ref={poemListRef} onScroll={handleScroll}>
                {poems.slice(0, poemsVisible).map((poem) => (
                    <div
                        key={poem.id}
                        className="poem-card"
                        style={{
                            '--card-accent': poem?.color || '#ff9e3d',
                            backgroundColor: poem?.color ? `${poem.color}33` : '#191919aa',
                            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)),
                            url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E
                            %3Ccircle cx="50" cy="50" r="50" fill="%23${poem.color?.slice(1)}" /%3E%3C/svg%3E')`,
                            cursor: 'pointer',
                        }}
                        onClick={() => viewPoem(poem)}
                    >
                        <div className="light-tube"></div>
                        <div className="color-bar" style={{ backgroundColor: poem.color || '#ffffff' }}></div>
                        <h3 className="poem-title">{poem.title}</h3>

                        <div
                            className="poem-content"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poem.content) }}
                        />

                        <div className="card-footer">
                            <div className="footer-info">
                                {poem.imported && (
                                    <span className="imported-indicator" title="Imported from backup">
                                        <FontAwesomeIcon icon={faFileImport} />
                                    </span>
                                )}
                                <span className="timestamp">{formatDate(poem.timestamp)}</span>
                            </div>
                            <div className="actions-container">
                                <button
                                    className="icon-button"
                                    style={{ cursor: 'pointer' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        viewPoem(poem);
                                    }}
                                >
                                    <i className="fas fa-eye"></i>
                                </button>

                                <button
                                    className="icon-button"
                                    style={{ cursor: 'pointer' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        editPoem(poem);
                                    }}
                                >
                                    <i className="fas fa-edit"></i>
                                </button>

                                <button
                                    className="icon-button"
                                    style={{ cursor: 'pointer' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        confirmDelete(poem.id);
                                    }}
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {poems && poems.length > poemsVisible && !loadingMore.current && (
                    <div className="load-more-indicator">Loading more poems...</div>
                )}
                {loadingMore.current && <div className="load-more-indicator">Fetching poems...</div>}
                {poems && poems.length === 0 && !loading && (
                    <div className="empty-poems">No poems created yet.</div>
                )}
            </div>

            {/* PoemModal is now in Profile */}
            <ViewPoemModal isOpen={isViewModalOpen} onClose={closeViewModal} poem={poemToView} authorData={loggedInUserData} />
            <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={deletePoem} />
        </div>
    );
};

export default Poems;