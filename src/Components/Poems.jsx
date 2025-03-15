import React, { useState, useEffect, useRef } from "react";
import { db } from "../auth/firebaseConfig";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import PoemModal from "./PoemModal";
import "./Poems.css";
import ViewPoemModal from "./ViewPoemModal";
import DOMPurify from 'dompurify';
import DeleteConfirmationModal from "./DeleteConfirmationModal";

const Poems = () => {
  const [poems, setPoems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [poemToEdit, setPoemToEdit] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [poemToView, setPoemToView] = useState(null);
  const [deletePoemId, setDeletePoemId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const user = auth.currentUser;

  const poemListRef = useRef(null);
  const [poemsVisible, setPoemsVisible] = useState(10);
  const loadingMore = useRef(false);

  useEffect(() => {
    if (!user) {
      setPoems([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "poems"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPoems(snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })));
      setLoading(false);
    });

    return () => unsubscribe();
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
    setPoemToEdit(null);
    setIsModalOpen(true);
  };

  const editPoem = (poem) => {
    setPoemToEdit(poem);
    setIsModalOpen(true);
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
    if (deletePoemId) {
      await deleteDoc(doc(db, "poems", deletePoemId));
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
              cursor: 'pointer', // Added this line to make the cursor a pointer
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
              <span className="timestamp">{formatDate(poem.timestamp)}</span>

              <div className="actions-container">
                <button
                  className="icon-button"
                  style={{ cursor: 'pointer' }} // Added for consistency, though less crucial here
                  onClick={(e) => {
                    e.stopPropagation();
                    viewPoem(poem);
                  }}
                >
                  <i className="fas fa-eye"></i>
                </button>

                <button
                  className="icon-button"
                  style={{ cursor: 'pointer' }} // Added for consistency
                  onClick={(e) => {
                    e.stopPropagation();
                    editPoem(poem);
                  }}
                >
                  <i className="fas fa-edit"></i>
                </button>

                <button
                  className="icon-button"
                  style={{ cursor: 'pointer' }} // Added for consistency
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

      <PoemModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} poemToEdit={poemToEdit} />
      <ViewPoemModal isOpen={isViewModalOpen} onClose={closeViewModal} poem={poemToView} />
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={deletePoem} />
    </div>
  );
};

export default Poems;