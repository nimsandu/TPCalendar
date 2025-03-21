import React, { useState, useRef, useEffect } from "react";
import Modal from "react-modal";
import html2canvas from "html2canvas";
import { SketchPicker } from "react-color";
import DOMPurify from "dompurify";
import "./SharePoem.css";
import defaultAvatar from "../images/avatar.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faPalette, faAlignLeft, faAlignCenter, faAlignRight, faFont, faDownload, faTimes, faEdit, faSave, faRedo, faTextHeight, faSlash, faAdjust, faEye, faChevronDown, faChevronUp, faEyeSlash, faUserCircle, faTrash } from '@fortawesome/free-solid-svg-icons';

Modal.setAppElement("#root");

const SharePoem = ({ isOpen, onClose, poem, authorData }) => {
    // Initial default values
    const defaultBackgroundColor = "#2a2a2a";
    const defaultTextColor = "#ffffff";
    const defaultTitleSize = "medium";
    const defaultContentSize = "medium";
    const defaultTextAlign = "left";
    const defaultFontType = "standard";
    const defaultAspectRatio = "1:1";
    const defaultOverlay = "none";
    const defaultShowAuthorInfo = true;
    
    // Initialize state
    const [backgroundColor, setBackgroundColor] = useState(defaultBackgroundColor);
    const [backgroundImage, setBackgroundImage] = useState(null);
    const [titleSize, setTitleSize] = useState(defaultTitleSize);
    const [contentSize, setContentSize] = useState(defaultContentSize);
    const [textAlign, setTextAlign] = useState(defaultTextAlign);
    const [fontType, setFontType] = useState(defaultFontType);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showTextColorPicker, setShowTextColorPicker] = useState(false);
    const [textColor, setTextColor] = useState(defaultTextColor);
    const [exportLoading, setExportLoading] = useState(false);
    const [titleText, setTitleText] = useState("");
    const [contentText, setContentText] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [aspectRatio, setAspectRatio] = useState(defaultAspectRatio);
    const [overlay, setOverlay] = useState(defaultOverlay);
    const [showAuthorInfo, setShowAuthorInfo] = useState(defaultShowAuthorInfo);
    // Collapsible sections state
    const [textOptionsCollapsed, setTextOptionsCollapsed] = useState(false);
    const [backgroundOptionsCollapsed, setBackgroundOptionsCollapsed] = useState(false);
    
    // Update state when poem prop changes
    useEffect(() => {
        if (poem) {
            if (poem.color) {
                setBackgroundColor(poem.color);
            }
            if (poem.title) {
                setTitleText(poem.title);
            }
            if (poem.content) {
                // Strip HTML tags for editing
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = DOMPurify.sanitize(poem.content);
                setContentText(tempDiv.textContent || tempDiv.innerText || "");
            }
        }
    }, [poem]);
    
    // Reset all settings when modal closes
    useEffect(() => {
        if (!isOpen) {
            // Reset everything to default on close
            resetAllSettings();
        }
    }, [isOpen]);
    
    // Function to reset all settings to default
    const resetAllSettings = () => {
        setBackgroundColor(poem?.color || defaultBackgroundColor);
        setBackgroundImage(null);
        setTitleSize(defaultTitleSize);
        setContentSize(defaultContentSize);
        setTextAlign(defaultTextAlign);
        setFontType(defaultFontType);
        setTextColor(defaultTextColor);
        setIsEditMode(false);
        setAspectRatio(defaultAspectRatio);
        setOverlay(defaultOverlay);
        setShowAuthorInfo(defaultShowAuthorInfo);
        setShowColorPicker(false);
        setShowTextColorPicker(false);
        
        // Reset text to original poem content
        if (poem) {
            setTitleText(poem.title || "");
            if (poem.content) {
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = DOMPurify.sanitize(poem.content);
                setContentText(tempDiv.textContent || tempDiv.innerText || "");
            } else {
                setContentText("");
            }
        }
    };

    // Function to remove background image
    const removeBackgroundImage = () => {
        setBackgroundImage(null);
    };
    
    const displayRef = useRef(null);
    const modalRef = useRef(null);
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);
    
    // Check and adjust for mobile
    useEffect(() => {
        const checkMobile = () => {
            if (window.innerWidth <= 768) {
                // Adjust modal styles for mobile
                if (modalRef.current) {
                    modalRef.current.style.padding = "10px";
                }
            }
        };
        
        checkMobile();
        window.addEventListener("resize", checkMobile);
        
        return () => {
            window.removeEventListener("resize", checkMobile);
        };
    }, []);
    
    const displayName = authorData?.firstName && authorData?.lastName
        ? `${authorData.firstName} ${authorData.lastName}`
        : "Anonymous Poet";
    const avatar = authorData?.avatar || defaultAvatar;
    
    const formattedDate = poem?.timestamp ? formatDate(poem.timestamp) : "";
    
    function formatDate(timestamp) {
        try {
            let date;
            if (typeof timestamp?.toDate === "function") {
                date = timestamp.toDate();
            } else if (timestamp instanceof Date) {
                date = timestamp;
            } else {
                date = new Date(timestamp);
            }

            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch (error) {
            console.error("Error formatting timestamp:", error);
            return "Invalid date";
        }
    }
    
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                // Pre-load the image to get dimensions
                const img = new Image();
                img.onload = () => {
                    setBackgroundImage(event.target.result);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
        
        // Reset file input value to allow re-uploading the same file
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const handleExport = async () => {
        if (!displayRef.current || !poem) return;

        try {
            setExportLoading(true);

            // Get aspect ratio dimensions
            let width = 900;
            let height;

            switch (aspectRatio) {
                case "1:1": height = 900; break;
                case "4:5": height = 1125; break;
                case "9:16": default: height = 1600; break;
            }

            // Create a temporary container with exact dimensions
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '-9999px';
            tempContainer.style.width = `${width}px`;
            tempContainer.style.height = `${height}px`;
            tempContainer.style.overflow = 'hidden';
            document.body.appendChild(tempContainer);

            // Clone the display element
            const clonedDisplay = displayRef.current.cloneNode(true);
            
            // Reset positioning and layout properties that could affect alignment
            clonedDisplay.style.position = 'absolute';
            clonedDisplay.style.top = '0';
            clonedDisplay.style.left = '0';
            clonedDisplay.style.width = '100%';
            clonedDisplay.style.height = '100%';
            clonedDisplay.style.margin = '0';
            clonedDisplay.style.padding = '30px'; // Consistent padding
            clonedDisplay.style.boxSizing = 'border-box';
            clonedDisplay.style.backgroundColor = backgroundImage ? 'transparent' : backgroundColor;
            clonedDisplay.style.color = textColor;
            clonedDisplay.className = `share-poem-display ${getTitleSizeClass()} ${getContentSizeClass()} text-${textAlign}`;

            // Fix all internal element styles
            const clonedTitle = clonedDisplay.querySelector('.share-poem-title');
            const clonedContent = clonedDisplay.querySelector('.share-poem-content');
            const clonedFooter = clonedDisplay.querySelector('.share-poem-footer');
            const clonedOverlay = clonedDisplay.querySelector('.share-poem-overlay');
            const clonedBackground = clonedDisplay.querySelector('.share-poem-background');
            const clonedDisplayContent = clonedDisplay.querySelector('.share-poem-display-content');

            // Setup background if exists
            if (backgroundImage && clonedBackground) {
                clonedBackground.style.backgroundImage = `url(${backgroundImage})`;
                clonedBackground.style.backgroundSize = 'cover';
                clonedBackground.style.backgroundPosition = 'center';
                clonedBackground.style.position = 'absolute';
                clonedBackground.style.top = '0';
                clonedBackground.style.left = '0';
                clonedBackground.style.width = '100%';
                clonedBackground.style.height = '100%';
                clonedBackground.style.zIndex = '0';
            }

            // Setup overlay if exists
            if (clonedOverlay) {
                clonedOverlay.style.position = 'absolute';
                clonedOverlay.style.top = '0';
                clonedOverlay.style.left = '0';
                clonedOverlay.style.width = '100%';
                clonedOverlay.style.height = '100%';
                clonedOverlay.style.zIndex = '1';
                clonedOverlay.style.backgroundColor = getOverlayStyle().backgroundColor;
            }

            // Content container styling
            if (clonedDisplayContent) {
                clonedDisplayContent.style.position = 'relative';
                clonedDisplayContent.style.zIndex = '2';
                clonedDisplayContent.style.height = '100%';
                clonedDisplayContent.style.display = 'flex';
                clonedDisplayContent.style.flexDirection = 'column';
                clonedDisplayContent.style.justifyContent = 'space-between';
            }

            // Apply title styling
            if (clonedTitle) {
                clonedTitle.style.marginBottom = '20px';
                clonedTitle.style.fontWeight = 'bold';
                clonedTitle.className = 'share-poem-title no-text-shadow';
                
                // Apply font sizes based on selected title size
                switch (titleSize) {
                    case "small": clonedTitle.style.fontSize = "28px"; break;
                    case "medium": clonedTitle.style.fontSize = "36px"; break;
                    case "large": clonedTitle.style.fontSize = "44px"; break;
                    case "x-large": clonedTitle.style.fontSize = "50px"; break;
                    default: clonedTitle.style.fontSize = "36px";
                }
            }

            // Apply content styling
            if (clonedContent) {
                clonedContent.style.flex = '1';
                clonedContent.style.overflow = 'hidden';
                
                // Apply font sizes to all paragraphs
                const contentFontSize = (() => {
                    switch (contentSize) {
                        case "small": return "22px";
                        case "medium": return "25px";
                        case "large": return "27px";
                        case "x-large": return "38px";
                        default: return "25px";
                    }
                })();
                
                const paragraphs = clonedContent.querySelectorAll('p');
                paragraphs.forEach(p => {
                    p.style.fontSize = contentFontSize;
                    p.style.marginBottom = '10px';
                    p.style.lineHeight = '1.5';
                });
            }

            // Apply footer styling
            if (clonedFooter) {
                clonedFooter.style.marginTop = '10px';
                clonedFooter.style.transform = 'scale(2)';
                clonedFooter.style.width = '40%';
                clonedFooter.style.marginLeft = 'auto';
                clonedFooter.style.marginRight = 'auto';
            }

          
                clonedDisplay.style.fontFamily = '"Roboto", "Helvetica Neue", sans-serif';


            // Apply text alignment
            clonedDisplay.style.textAlign = textAlign;

            // Add the cloned element to the temporary container
            tempContainer.appendChild(clonedDisplay);

            // Wait a moment for any async rendering to complete
            await new Promise(resolve => setTimeout(resolve, 500));

            // Generate the image
            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                width: width,
                height: height,
                logging: false
            });

            // Clean up
            document.body.removeChild(tempContainer);

            // Create and trigger download
            const image = canvas.toDataURL("image/png");
            const filename = titleText ? `${titleText.replace(/\s+/g, '_')}_poem.png` : `poem_export.png`;
            const link = document.createElement("a");
            link.href = image;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setExportLoading(false);
        } catch (error) {
            console.error("Error generating image:", error);
            setExportLoading(false);
            alert("Failed to generate image. Please try again.");
        }
    };

    const getTitleSizeClass = () => {
        switch (titleSize) {
            case "small": return "title-sm";
            case "medium": return "title-md";
            case "large": return "title-lg";
            case "x-large": return "title-xl";
            default: return "title-md";
        }
    };

    const getContentSizeClass = () => {
        switch (contentSize) {
            case "small": return "content-sm";
            case "medium": return "content-md";
            case "large": return "content-lg";
            case "x-large": return "content-xl";
            default: return "content-md";
        }
    };


    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    const resetToOriginal = () => {
        if (poem) {
            setTitleText(poem.title || "");
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = DOMPurify.sanitize(poem.content || "");
            setContentText(tempDiv.textContent || tempDiv.innerText || "");
        }
    };

    if (!poem) {
        return null;
    }

    const getAspectRatioStyle = () => {
        switch (aspectRatio) {
            case "1:1": return { paddingBottom: "100%" };
            case "4:5": return { paddingBottom: "125%" };
            case "9:16": return { paddingBottom: "177.78%" };
            default: return { paddingBottom: "177.78%" };
        }
    };

    const getOverlayStyle = () => {
        switch (overlay) {
            case "light": return { backgroundColor: "rgba(255, 255, 255, 0.3)" };
            case "dark": return { backgroundColor: "rgba(0, 0, 0, 0.5)" };
            default: return { backgroundColor: "transparent" };
        }
    };
    
    // Custom function for modal close to ensure state is reset
    const handleModalClose = () => {
        onClose();
    };
    
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={handleModalClose}
            className="share-modal"
            overlayClassName="share-overlay"
        >
            <div className="share-modal-container" ref={modalRef}>
                <div className="share-modal-header">
                    <h2>Export Poem as Image</h2>
                    <button className="share-close-button" onClick={handleModalClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                
                <div className="share-modal-content">
                    {/* Fixed size preview panel */}
                    <div className="preview-section">
                        <div className="preview-container" style={getAspectRatioStyle()}>
                            <div className="preview-area">
                                <div 
                                    ref={displayRef} 
                                    className={`share-poem-display ${getTitleSizeClass()} ${getContentSizeClass()} text-${textAlign}`}
                                    style={{
                                        backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
                                        color: textColor,
                                    }}
                                >
                                    {/* Background with optional blur */}
                                    {backgroundImage && (
                                        <div 
                                            className="share-poem-background" 
                                            style={{
                                                backgroundImage: `url(${backgroundImage})`
                                            }}
                                        ></div>
                                    )}
                                    
                                    {/* Overlay for dimming */}
                                    <div 
                                        className="share-poem-overlay"
                                        style={getOverlayStyle()}
                                    ></div>
                                    
                                    <div className="share-poem-display-content">
                                        {isEditMode ? (
                                            <>
                                                <input
                                                    type="text"
                                                    className="share-poem-title-edit"
                                                    value={titleText}
                                                    onChange={(e) => setTitleText(e.target.value)}
                                                    placeholder="Enter title..."
                                                    style={{ color: textColor }}
                                                />
                                                <textarea
                                                    className="share-poem-content-edit"
                                                    value={contentText}
                                                    onChange={(e) => setContentText(e.target.value)}
                                                    placeholder="Enter poem content..."
                                                    style={{ color: textColor }}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <h2 className="share-poem-title no-text-shadow" style={{ color: textColor }}>{titleText}</h2>
                                                <div className="share-poem-content" style={{ color: textColor }}>
                                                    {contentText.split('\n').map((line, index) => (
                                                        <p key={index}>{line}</p>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                        
                                        <div className="share-poem-footer">
                                            {showAuthorInfo ? (
                                                <div className="poet-info">
                                                    <img src={avatar} alt="Poet" className="poet-avatar" />
                                                    <div className="poet-details">
                                                        <div className="poet-name" style={{ color: textColor }}>{displayName}</div>
                                                        <div className="share-poem-date" style={{ color: textColor }}>{formattedDate}</div>
                                                    </div>
                                                </div>
                                            ) : null}
                                            <div className="poet-tagline" style={{ color: textColor }}>The Poet's Calendar</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="preview-disclaimer">
                            <p>Note: The exported image may differ slightly from this preview</p>
                        </div>
                    </div>
                    
                    <div className="controls-area">
                        <div className="control-section">
                            <div className="section-header" onClick={() => setTextOptionsCollapsed(!textOptionsCollapsed)}>
                                <h3>Text Options</h3>
                                <FontAwesomeIcon icon={textOptionsCollapsed ? faChevronDown : faChevronUp} />
                            </div>
                            
                            {!textOptionsCollapsed && (
                                <div className="section-content">
                                    <div className="control-group">
                                        <button 
                                            className={`control-button ${isEditMode ? 'active' : ''}`}
                                            onClick={toggleEditMode}
                                        >
                                            <FontAwesomeIcon icon={isEditMode ? faSave : faEdit} />
                                            {isEditMode ? ' Save Changes' : ' Edit Text'}
                                        </button>
                                        
                                        {isEditMode && (
                                            <button 
                                                className="control-button"
                                                onClick={resetToOriginal}
                                            >
                                                <FontAwesomeIcon icon={faRedo} /> Reset
                                            </button>
                                        )}
                                    </div>
                                    
                                    
                                    <div className="control-group">
                                        <label>Text Color</label>
                                        <button 
                                            className="control-button color-button"
                                            onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                                        >
                                            <FontAwesomeIcon icon={faPalette} /> Choose Text Color
                                            <span className="color-preview" style={{ backgroundColor: textColor }}></span>
                                        </button>
                                        
                                        {showTextColorPicker && (
                                            <div className="color-picker-popover">
                                                <div 
                                                    className="color-picker-cover" 
                                                    onClick={() => setShowTextColorPicker(false)}
                                                />
                                                <SketchPicker 
                                                    color={textColor}
                                                    onChange={(color) => setTextColor(color.hex)}
                                                    presetColors={[
                                                        '#ffffff', '#000000', '#f8f9fa',
                                                        '#3498db', '#2ecc71', '#e74c3c', 
                                                        '#f39c12', '#9b59b6', '#1abc9c',
                                                        '#ff9e3d'
                                                    ]}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="control-group">
                                        <label>Text Alignment</label>
                                        <div className="button-group">
                                            <button 
                                                className={textAlign === 'left' ? 'active' : ''} 
                                                onClick={() => setTextAlign('left')}
                                            >
                                                <FontAwesomeIcon icon={faAlignLeft} />
                                            </button>
                                            <button 
                                                className={textAlign === 'center' ? 'active' : ''} 
                                                onClick={() => setTextAlign('center')}
                                            >
                                                <FontAwesomeIcon icon={faAlignCenter} />
                                            </button>
                                            <button 
                                                className={textAlign === 'right' ? 'active' : ''} 
                                                onClick={() => setTextAlign('right')}
                                            >
                                                <FontAwesomeIcon icon={faAlignRight} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="control-group">
                                        <label>Title Size</label>
                                        <div className="button-group">
                                            <button 
                                                className={titleSize === 'small' ? 'active' : ''} 
                                                onClick={() => setTitleSize('small')}
                                            >
                                                <FontAwesomeIcon icon={faTextHeight} /> S
                                            </button>
                                            <button 
                                                className={titleSize === 'medium' ? 'active' : ''} 
                                                onClick={() => setTitleSize('medium')}
                                            >
                                                <FontAwesomeIcon icon={faTextHeight} /> M
                                            </button>
                                            <button 
                                                className={titleSize === 'large' ? 'active' : ''} 
                                                onClick={() => setTitleSize('large')}
                                            >
                                                <FontAwesomeIcon icon={faTextHeight} /> L
                                            </button>
                                            <button 
                                                className={titleSize === 'x-large' ? 'active' : ''} 
                                                onClick={() => setTitleSize('x-large')}
                                            >
                                                <FontAwesomeIcon icon={faTextHeight} /> XL
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="control-group">
                                        <label>Content Size</label>
                                        <div className="button-group">
                                            <button 
                                                className={contentSize === 'small' ? 'active' : ''} 
                                                onClick={() => setContentSize('small')}
                                            >
                                                <FontAwesomeIcon icon={faFont} /> S
                                            </button>
                                            <button 
                                                className={contentSize === 'medium' ? 'active' : ''} 
                                                onClick={() => setContentSize('medium')}
                                            >
                                                <FontAwesomeIcon icon={faFont} /> M
                                            </button>
                                            <button 
                                                className={contentSize === 'large' ? 'active' : ''} 
                                                onClick={() => setContentSize('large')}
                                            >
                                                <FontAwesomeIcon icon={faFont} /> L
                                            </button>
                                            <button 
                                                className={contentSize === 'x-large' ? 'active' : ''} 
                                                onClick={() => setContentSize('x-large')}
                                            >
                                                <FontAwesomeIcon icon={faFont} /> XL
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="control-group">
                                        <label>Author Information</label>
                                        <button 
                                            className={`control-button ${showAuthorInfo ? 'active' : ''}`}
                                            onClick={() => setShowAuthorInfo(!showAuthorInfo)}
                                        >
                                            <FontAwesomeIcon icon={showAuthorInfo ? faEye : faEyeSlash} />
                                            {showAuthorInfo ? ' Show Author Info' : ' Hide Author Info'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="control-section">
                            <div className="section-header" onClick={() => setBackgroundOptionsCollapsed(!backgroundOptionsCollapsed)}>
                                <h3>Background</h3>
                                <FontAwesomeIcon icon={backgroundOptionsCollapsed ? faChevronDown : faChevronUp} />
                            </div>
                            
                            {!backgroundOptionsCollapsed && (
                                <div className="section-content">
                                    <div className="control-group">
                                        <button 
                                            className="control-button color-button"
                                            onClick={() => setShowColorPicker(!showColorPicker)}
                                            disabled={!!backgroundImage}
                                            style={{ opacity: backgroundImage ? 0.5 : 1 }}
                                        >
                                            <FontAwesomeIcon icon={faPalette} /> Choose Background Color
                                            <span className="color-preview" style={{ backgroundColor }}></span>
                                        </button>
                                        
                                        {showColorPicker && !backgroundImage && (
                                            <div className="color-picker-popover">
                                                <div 
                                                    className="color-picker-cover" 
                                                    onClick={() => setShowColorPicker(false)}
                                                />
                                                <SketchPicker 
                                                    color={backgroundColor}
                                                    onChange={(color) => setBackgroundColor(color.hex)}
                                                    presetColors={[
                                                        '#2a2a2a', '#1a1a1a', '#000000', 
                                                        '#3498db', '#2ecc71', '#e74c3c', 
                                                        '#f39c12', '#9b59b6', '#1abc9c',
                                                        poem?.color || '#ff9e3d'
                                                    ]}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="control-group">
                                    {backgroundImage ? (
                                        <button 
                                            className="control-button remove-image-button"
                                            onClick={removeBackgroundImage}
                                        >
                                            <FontAwesomeIcon icon={faTrash} /> Remove Background Image
                                        </button>
                                    ) : (
                                        <>
                                            <label htmlFor="image-upload" className="control-button">
                                                <FontAwesomeIcon icon={faImage} /> Upload Background Image
                                            </label>
                                            <input 
                                                id="image-upload" 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleImageUpload}
                                                style={{ display: 'none' }}
                                                ref={fileInputRef}
                                            />
                                        </>
                                    )}
                                        
                                        {backgroundImage && (
                                            <>
                                                <div className="control-group">
                                                    <label>Background Overlay</label>
                                                    <div className="button-group">
                                                        <button 
                                                            className={overlay === 'none' ? 'active' : ''} 
                                                            onClick={() => setOverlay('none')}
                                                        >
                                                            <FontAwesomeIcon icon={faSlash} /> None
                                                        </button>
                                                        <button 
                                                            className={overlay === 'light' ? 'active' : ''} 
                                                            onClick={() => setOverlay('light')}
                                                        >
                                                            <FontAwesomeIcon icon={faAdjust} /> Light
                                                        </button>
                                                        <button 
                                                            className={overlay === 'dark' ? 'active' : ''} 
                                                            onClick={() => setOverlay('dark')}
                                                        >
                                                            <FontAwesomeIcon icon={faAdjust} /> Dark
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    
                                    <div className="control-group">
                                        <label>Aspect Ratio</label>
                                        <div className="button-group">
                                            <button 
                                                className={aspectRatio === '9:16' ? 'active' : ''} 
                                                onClick={() => setAspectRatio('9:16')}
                                            >
                                                9:16
                                            </button>
                                            <button 
                                                className={aspectRatio === '4:5' ? 'active' : ''} 
                                                onClick={() => setAspectRatio('4:5')}
                                            >
                                                4:5
                                            </button>
                                            <button 
                                                className={aspectRatio === '1:1' ? 'active' : ''} 
                                                onClick={() => setAspectRatio('1:1')}
                                            >
                                                1:1
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="share-modal-footer">
                    <button 
                        className="export-button"
                        onClick={handleExport}
                        disabled={exportLoading}
                    >
                        <FontAwesomeIcon icon={faDownload} />
                        {exportLoading ? (
                            <>
                                <span className="loading-spin-indicator"></span> Generating...
                            </>
                        ) : 'Save as Image'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SharePoem;