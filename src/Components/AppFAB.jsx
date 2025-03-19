import React, { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useLocation } from 'react-router-dom';
import './AppFAB.css';
import './AppMenu.css';
import './Modal.css';
import { db } from '../auth/firebaseConfig';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';

// Import icons
import { 
  FiMenu, 
  FiX, 
  FiRefreshCw, 
  FiInfo, 
  FiLock, 
  FiMessageSquare, 
  FiBell,
  FiCheckCircle,
  FiDownload,
  FiLoader,
  FiAlertCircle
} from 'react-icons/fi';

const CURRENT_VERSION = import.meta.env.VITE_APP_VERSION || '0.0.1';

const versionCompare = (a, b) => {
  const cleanVersion = (v) => v.replace(/[^0-9.]/g, '').split('.').map(Number);
  const _a = cleanVersion(a);
  const _b = cleanVersion(b);

  for (let i = 0; i < Math.max(_a.length, _b.length); i++) {
    const n1 = _a[i] || 0;
    const n2 = _b[i] || 0;
    if (n1 !== n2) return n1 - n2;
  }
  return 0;
};

const LAST_OPENED_NOTICES_KEY = 'lastOpenedNotices';

const AppFAB = () => {
  // ROUTE DETECTION
  const location = useLocation();
  const isRoot = location.pathname === '/';

  // STATE
  const [showAppMenu, setShowAppMenu] = useState(false);
  const [updateInfo, setUpdateInfo] = useState({
    available: false,
    notes: [],
    checking: false
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [modals, setModals] = useState({
    update: false,
    about: false,
    privacy: false,
    feedback: false,
    notices: false
  });
  const [notices, setNotices] = useState([]);
  const [hasNewNotices, setHasNewNotices] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ type: '', message: '' });

  // SERVICE WORKER SETUP
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
    registration
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, r) {
      if (!r) return;
      setInterval(() => {
        console.log("Checking for updates...");
        setUpdateInfo(prev => ({ ...prev, checking: true }));
        r.update();
      }, 60 * 60 * 1000);
    },
    onNeedRefresh: () => {
      console.log("Update available!");
      checkVersionUpdates();
    },
  });

  // VERSION CHECK
  const checkVersionUpdates = useCallback(async () => {
    try {
      setUpdateInfo(prev => ({ ...prev, checking: true }));
      const response = await fetch('/versionNotes.json');
      if (!response.ok) throw new Error('Failed to fetch version notes');
      const notesData = await response.json();
      const storedVersion = localStorage.getItem('appVersion') || '0.0.0';
      const newVersions = notesData.filter(note =>
        versionCompare(note.version, storedVersion) > 0
      );
      setUpdateInfo({
        available: newVersions.length > 0 || needRefresh,
        notes: newVersions.sort((a, b) => versionCompare(b.version, a.version)),
        checking: false
      });
    } catch (error) {
      console.error('Version check failed:', error);
      setUpdateInfo(prev => ({ ...prev, checking: false }));
      showToastNotification('error', 'Failed to check for updates.');
    }
  }, [needRefresh]);

  // Show toast notification
  const showToastNotification = (type, message) => {
    setToastMessage({ type, message });
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Check for updates manually
  const checkForUpdates = () => {
    if (updateInfo.checking) return;
    if (registration) {
      setUpdateInfo(prev => ({ ...prev, checking: true }));
      registration.update().then(() => {
        checkVersionUpdates();
      });
    } else {
      checkVersionUpdates();
    }
  };

  // Update handler
  const handleUserUpdate = async () => {
    if (!updateInfo.available) {
      toggleModal('update', false);
      return;
    }
    try {
      setIsUpdating(true);
      const latestVersion = updateInfo.notes.length > 0
        ? updateInfo.notes[0].version
        : CURRENT_VERSION;
      localStorage.setItem('appVersion', latestVersion);
      sessionStorage.setItem('app_updating', 'true');
      if (registration?.waiting) {
        const controllerChangePromise = new Promise(resolve => {
          navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
        });
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Update timeout')), 5000)
        );
        await Promise.race([controllerChangePromise, timeoutPromise]);
        window.location.reload();
      } else {
        await updateServiceWorker(true);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
      sessionStorage.removeItem('app_updating');
      showToastNotification('error', 'Update failed. Please try again.');
      toggleModal('update', false);
    }
  };

  // MODAL TOGGLE
  const toggleModal = (modalName, state) => {
    if (modalName === 'update' && state === true) {
      checkForUpdates();
    }
    setModals(prev => ({ ...prev, [modalName]: state }));
    setShowAppMenu(false);

    // Update last opened timestamp when notices modal is opened
    if (modalName === 'notices' && state === true) {
      localStorage.setItem(LAST_OPENED_NOTICES_KEY, new Date().toISOString());
      setHasNewNotices(false); // Clear the new notice indicator
    }
  };

  // Toggle menu with animation
  const toggleAppMenu = () => {
    setShowAppMenu(!showAppMenu);
  };

  // FETCH NOTICES FROM FIREBASE
  useEffect(() => {
    const noticesCollectionRef = collection(db, 'notices');
    const q = query(noticesCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotices(fetchedNotices);
    });

    return () => unsubscribe();
  }, []);

  // CHECK FOR NEW NOTICES
  useEffect(() => {
    const lastOpened = localStorage.getItem(LAST_OPENED_NOTICES_KEY);
    if (lastOpened) {
      const lastOpenedDate = new Date(lastOpened);
      const newOnes = notices.some(notice => notice.createdAt && new Date(notice.createdAt.seconds * 1000) > lastOpenedDate);
      setHasNewNotices(newOnes);
    } else if (notices.length > 0) {
      // If never opened, consider all as new initially
      setHasNewNotices(true);
    }
  }, [notices]);

  // VERSION EFFECT
  useEffect(() => {
    const wasUpdating = sessionStorage.getItem('app_updating') === 'true';
    if (wasUpdating) {
      sessionStorage.removeItem('app_updating');
      setTimeout(() => {
        showToastNotification('success', 'App successfully updated!');
      }, 500);
    }
    const storedVersion = localStorage.getItem('appVersion');
    if (!storedVersion || versionCompare(CURRENT_VERSION, storedVersion) > 0) {
      localStorage.setItem('appVersion', CURRENT_VERSION);
    }
    checkVersionUpdates();
  }, [checkVersionUpdates]);

  // Watch for needRefresh changes
  useEffect(() => {
    if (needRefresh) {
      setUpdateInfo(prev => ({
        ...prev,
        available: true
      }));
    }
  }, [needRefresh]);

  // Check for updates on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersionUpdates();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkVersionUpdates]);
  
  // Close menu when clicking outside
  useEffect(() => {
    if (!showAppMenu) return;
    
    const handleClickOutside = (event) => {
      const fabContainer = document.querySelector('.app-fab-container');
      if (fabContainer && !fabContainer.contains(event.target)) {
        setShowAppMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAppMenu]);

  return (
    <>
      {/* Update overlay */}
      {isUpdating && (
        <div className="update-overlay">
          <div className="update-modal glass-card">
            <div className="update-icon-container updating">
              <div className="update-icon pulse">
                <FiRefreshCw className="spinning-icon" />
              </div>
            </div>
            <h3>Updating App</h3>
            <p>Please wait while we install the latest version...</p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="update-toast-container">
          <div className={`update-toast glass-card ${toastMessage.type}`}>
            <div className="update-toast-icon">
              {toastMessage.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            </div>
            <div className="update-toast-message">{toastMessage.message}</div>
            <button 
              className="update-toast-close" 
              onClick={() => setShowToast(false)}
            >
              <FiX />
            </button>
          </div>
        </div>
      )}

      <div className={`app-fab-container ${isRoot ? 'root-position' : 'other-position'}`}>
        {/* Glass backdrop moved outside of button */}
        <div className={`glass-backdrop ${showAppMenu ? 'active' : ''}`}></div>
        
        <button
          className={`app-fab ${showAppMenu ? 'active' : ''}`}
          onClick={toggleAppMenu}
          aria-label="Open app menu"
        >
          {updateInfo.available ? <div className="notification-dot red-dot" /> : null}
          {hasNewNotices ? <div className="notification-dot yellow-dot" /> : null}
          {showAppMenu ? <FiX className="fab-icon" /> : <FiMenu className="fab-icon" />}
        </button>
        
        {/* Menu moved outside of button */}
        <div className={`app-menu ${showAppMenu ? 'visible' : ''}`}>
          <button
            className={`app-menu-item ${updateInfo.available ? 'with-notification' : ''}`}
            onClick={() => toggleModal('update', true)}
          >
            <FiRefreshCw className="menu-icon" />
            <span className="menu-text">Updates</span>
            {updateInfo.available && <div className="red-dot-small" />}
          </button>
          <button 
            className="app-menu-item" 
            onClick={() => toggleModal('privacy', true)}
          >
            <FiLock className="menu-icon" />
            <span className="menu-text">Privacy</span>
          </button>
          <button 
            className="app-menu-item" 
            onClick={() => toggleModal('about', true)}
          >
            <FiInfo className="menu-icon" />
            <span className="menu-text">About</span>
          </button>
          <button 
            className="app-menu-item" 
            onClick={() => toggleModal('feedback', true)}
          >
            <FiMessageSquare className="menu-icon" />
            <span className="menu-text">Feedback</span>
          </button>
          <button
            className={`app-menu-item ${hasNewNotices ? 'with-notification' : ''}`}
            onClick={() => toggleModal('notices', true)}
          >
            <FiBell className="menu-icon" />
            <span className="menu-text">Notices</span>
            {hasNewNotices && <div className="yellow-dot-small" />}
          </button>
        </div>

        {/* Updated Modals with Glass Card Style */}
        {modals.update && (
          <div className="modal-fo-overlay">
            <div className="modal-fo-content glass-card">
              <h3>Updates</h3>
              
              {updateInfo.checking ? (
                <div>
                <div className="checking-updates glass-section">
                  <div className="update-icon-container checking">
                    <div className="update-icon pulse">
                      <FiRefreshCw className="spinning-icon" />
                    </div>
                  </div>
                </div>
                 <div className="update-icon-container checking">
                 <p>Checking for updates...</p>
                 </div>
                 </div>
              ) : updateInfo.available ? (
                <>
                  <div className="update-icon-container">
                    <div className="update-icon">
                      <FiDownload />
                    </div>
                  </div>
                  <h4 className="text-center">New Updates Available!</h4>
                  <div className="update-notes-container">
                    {updateInfo.notes.length > 0 ? (
                      updateInfo.notes.map((note) => (
                        <div key={note.version} className="version-note glass-section">
                          <h4>Version {note.version} <span className="version-date">({note.releaseDate})</span></h4>
                          <ul>
                            {note.notes.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ))
                    ) : (
                      <p className="text-center glass-section">A new version of the app is available.</p>
                    )}
                  </div>
                  <div className="modal-buttons">
                    <button
                      className="primary-button glass-button"
                      onClick={handleUserUpdate}
                      disabled={isUpdating}
                    >
                      <FiDownload className="button-icon" /> Install Update
                    </button>
                    <button
                      className="secondary-button glass-button"
                      onClick={() => toggleModal('update', false)}
                      disabled={isUpdating}
                    >
                      Remind Me Later
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="update-icon-container up-to-date">
                    <div className="update-icon">
                      <FiCheckCircle />
                    </div>
                  </div>
                  <div className="up-to-date glass-section">
                    <p><span className="checkmark-text">✓</span> Your app is up to date!</p>
                  </div>
                  <p className="text-center"><strong>Current Version:</strong> {CURRENT_VERSION}</p>
                  <div className="modal-buttons">
                    <button
                      className="secondary-button glass-button"
                      onClick={checkForUpdates}
                    >
                      <FiRefreshCw className="button-icon" /> Check Again
                    </button>
                    <button
                      className="secondary-button glass-button"
                      onClick={() => toggleModal('update', false)}
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
              <button
                className="modal-close-button"
                onClick={() => toggleModal('update', false)}
                aria-label="Close update modal"
                disabled={isUpdating}
              >
                <FiX />
              </button>
            </div>
          </div>
        )}

        {/* About Modal */}
        {modals.about && (
          <div className="modal-fo-overlay">
            <div className="modal-fo-content glass-card">
              <h3>About App</h3>
              <div className="glass-section">
                <p>Your application description here.</p>
                <p><strong>Current Version:</strong> {CURRENT_VERSION}</p>
              </div>
              <div className="modal-buttons">
                <button
                  className="secondary-button glass-button"
                  onClick={() => toggleModal('about', false)}
                >
                  Close
                </button>
              </div>
              <button
                className="modal-close-button"
                onClick={() => toggleModal('about', false)}
                aria-label="Close about modal"
              >
                <FiX />
              </button>
            </div>
          </div>
        )}

        {/* Privacy Modal */}
        {modals.privacy && (
          <div className="modal-fo-overlay">
            <div className="modal-fo-content glass-card">
              <h3>Privacy Policy</h3>
              <div className="glass-section">
                <p>Your privacy policy content here.</p>
              </div>
              <div className="modal-buttons">
                <button
                  className="secondary-button glass-button"
                  onClick={() => toggleModal('privacy', false)}
                >
                  Close
                </button>
              </div>
              <button
                className="modal-close-button"
                onClick={() => toggleModal('privacy', false)}
                aria-label="Close privacy modal"
              >
                <FiX />
              </button>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {modals.feedback && (
          <div className="modal-fo-overlay">
            <div className="modal-fo-content glass-card">
              <h3>Send Feedback</h3>
              <div className="glass-section">
                <p>Contact us at: <a href="mailto:feedback@example.com" className="glass-link">feedback@example.com</a></p>
              </div>
              <div className="modal-buttons">
                <button
                  className="secondary-button glass-button"
                  onClick={() => toggleModal('feedback', false)}
                >
                  Close
                </button>
              </div>
              <button
                className="modal-close-button"
                onClick={() => toggleModal('feedback', false)}
                aria-label="Close feedback modal"
              >
                <FiX />
              </button>
            </div>
          </div>
        )}

        {/* Notices Modal */}
        {modals.notices && (
          <div className="modal-fo-overlay">
            <div className="modal-fo-content glass-card">
              <h3>Notices</h3>
              <div className="notices-container">
                {notices.length > 0 ? (
                  notices.map((notice) => (
                    <div key={notice.id} className="notice-item glass-section">
                      <h4>{notice.title}</h4>
                      <div className="notice-content">
                        {notice.content}
                      </div>
                      {notice.createdAt && (
                        <p className="notice-date">
                          {new Date(notice.createdAt.seconds * 1000).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="glass-section text-center">
                    <p>No current notices.</p>
                  </div>
                )}
              </div>
              <div className="modal-buttons">
                <button
                  className="secondary-button glass-button"
                  onClick={() => toggleModal('notices', false)}
                >
                  Close
                </button>
              </div>
              <button
                className="modal-close-button"
                onClick={() => toggleModal('notices', false)}
                aria-label="Close notices modal"
              >
                <FiX />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AppFAB;