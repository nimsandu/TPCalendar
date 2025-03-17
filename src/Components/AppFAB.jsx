import React, { useState, useEffect } from 'react';
import './AppFAB.css';
import './AppMenu.css';
import './Modal.css';
import { useRegisterSW } from 'virtual:pwa-register/react';

const CURRENT_APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.1.0';

const AppFAB = () => {
    const [showAppMenu, setShowAppMenu] = useState(false);
    const {
        needRefresh,
        updateServiceWorker,
        registration,
    } = useRegisterSW({
        immediate: false, // Disable immediate registration and automatic updates
        onNeedRefresh() {
            console.log('Service worker reports: New content available, needs refresh.');
            setUpdateAvailable(true);
        },
        onOfflineReady() {
            console.log('App is ready to work offline.');
        },
        // You might also want to control the registration manually later if needed
        // registerType: 'prompt', // Or 'autoUpdate' with different options
    });

    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [versionNotes, setVersionNotes] = useState([]);
    const [hasFetchedNotes, setHasFetchedNotes] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [showNoticesModal, setShowNoticesModal] = useState(false);
    const [notices, setNotices] = useState([
        { id: 1, title: 'Welcome to the App!', content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
        { id: 2, title: 'New Features Released', content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.' },
    ]);

    useEffect(() => {
        const storedVersion = localStorage.getItem('appVersion');
        if (storedVersion !== CURRENT_APP_VERSION) {
            localStorage.setItem('appVersion', CURRENT_APP_VERSION);
            console.log('App version in localStorage updated to:', CURRENT_APP_VERSION);
        }
    }, []);

    useEffect(() => {
        console.log("AppFAB useEffect for version notes running. needRefresh:", needRefresh, "hasFetchedNotes:", hasFetchedNotes);
        if (needRefresh && !hasFetchedNotes) {
            setUpdateAvailable(true);
            setHasFetchedNotes(true);
            const fetchVersionNotes = async () => {
                console.log("Fetching version notes...");
                try {
                    const response = await fetch('/versionNotes.json');
                    console.log("Version notes response:", response);
                    if (response.ok) {
                        const data = await response.json();
                        const currentVersion = localStorage.getItem('appVersion') || '0.1.0';
                        console.log("Current appVersion from localStorage:", currentVersion);
                        const newVersionNotes = data.filter(note => note.version > currentVersion);
                        console.log("Filtered version notes:", newVersionNotes);
                        setVersionNotes(newVersionNotes);
                    } else {
                        console.error('Failed to fetch version notes.');
                    }
                } catch (error) {
                    console.error('Error fetching version notes:', error);
                }
            };
            fetchVersionNotes();
        }
    }, [needRefresh, hasFetchedNotes]);

    const handleFabClick = () => {
        setShowAppMenu(!showAppMenu);
    };

    const handleUpdateClick = () => {
        setShowUpdateModal(true);
        setShowAppMenu(false);
    };

    const handleUpdateNow = () => {
        console.log('Update Now button clicked.');
        if (updateServiceWorker) {
            console.log('Calling updateServiceWorker()...');
            updateServiceWorker();
        } else {
            console.warn('updateServiceWorker function is not available.');
        }
        setShowUpdateModal(false);
    };

    const handleUpdateLater = () => {
        setShowUpdateModal(false);
    };

    const handleAboutClick = () => {
        setShowAboutModal(true);
        setShowAppMenu(false);
    };

    const handlePrivacyClick = () => {
        setShowPrivacyModal(true);
        setShowAppMenu(false);
    };

    const handleFeedbackClick = () => {
        setShowFeedbackModal(true);
        setShowAppMenu(false);
    };

    const handleNoticesClick = () => {
        setShowNoticesModal(true);
        setShowAppMenu(false);
    };

    const closeModal = (setter) => {
        setter(false);
    };

    useEffect(() => {
        if (registration && registration.waiting) {
            console.log('Service worker waiting to activate.', registration.waiting);
        }
        if (registration && registration.installing) {
            console.log('Service worker installing.', registration.installing);
        }
        if (registration && registration.active) {
            console.log('Service worker active.', registration.active);
        }
    }, [registration]);

    return (
        <div className="app-fab-container">
            <button className="app-fab" onClick={handleFabClick}>
                {updateAvailable && <div className="red-dot" />}
            </button>

            {showAppMenu && (
                <div className="app-menu">
                    {updateAvailable && (
                        <button className="app-menu-item with-dot" onClick={handleUpdateClick}>
                            Update Available
                            <div className="red-dot-small" />
                        </button>
                    )}
                    <button className="app-menu-item" onClick={handlePrivacyClick}>Privacy Policy</button>
                    <button className="app-menu-item" onClick={handleAboutClick}>About App</button>
                    <button className="app-menu-item" onClick={handleFeedbackClick}>Send Feedback</button>
                    <button className="app-menu-item with-dot" onClick={handleNoticesClick}>
                        Notices
                        {notices.length > 0 && <div className="yellow-dot-small" />}
                    </button>
                </div>
            )}

            {showUpdateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>New Updates Available!</h3>
                        {versionNotes.length > 0 ? (
                            <ul>
                                {versionNotes.map((note) => (
                                    <li key={note.version}>
                                        <strong>Version {note.version}</strong> ({note.releaseDate}):
                                        <ul>
                                            {note.notes.map((item, index) => (
                                                <li key={index}>{item}</li>
                                            ))}
                                        </ul>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No new version notes found.</p>
                        )}
                        <div className="modal-buttons">
                            <button onClick={handleUpdateNow}>Update Now</button>
                            <button onClick={() => closeModal(setShowUpdateModal)}>Update Later</button>
                        </div>
                        <button className="modal-close-button" onClick={() => closeModal(setShowUpdateModal)}>
                            &times;
                        </button>
                    </div>
                </div>
            )}

            {showAboutModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>About App</h3>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vitae elit libero, a pharetra augue. Donec sed odio dui. Maecenas sed diam eget risus varius blandit sit amet non magna. Cras mattis consectetur purus sit amet fermentum.</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.</p>
                        <p><strong>Version:</strong> {CURRENT_APP_VERSION}</p>
                        <button className="modal-close-button" onClick={() => closeModal(setShowAboutModal)}>
                            &times;
                        </button>
                    </div>
                </div>
            )}

            {showPrivacyModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Privacy Policy</h3>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean lacinia bibendum nulla sed consectetur. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras mattis consectetur purus sit amet fermentum. Donec id elit non mi porta gravida at eget metus.</p>
                        <button className="modal-close-button" onClick={() => closeModal(setShowPrivacyModal)}>
                            &times;
                        </button>
                    </div>
                </div>
            )}

            {showFeedbackModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Send Feedback</h3>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent commodo cursus magna, vel scelerisque nisl consectetur et.</p>
                        <p>You can send your feedback to: <a href="mailto:feedback@example.com">feedback@example.com</a></p>
                        <button className="modal-close-button" onClick={() => closeModal(setShowFeedbackModal)}>
                            &times;
                        </button>
                    </div>
                </div>
            )}

            {showNoticesModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Notices</h3>
                        {notices.length > 0 ? (
                            <ul>
                                {notices.map((notice) => (
                                    <li key={notice.id}>
                                        <h4>{notice.title}</h4>
                                        <p>{notice.content}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No new notices at this time.</p>
                        )}
                        <button className="modal-close-button" onClick={() => closeModal(setShowNoticesModal)}>
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppFAB;