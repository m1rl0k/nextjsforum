import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import EmojiPicker from 'emoji-picker-react';
import styles from '../styles/WysiwygEditor.module.css';

// Dynamically import ReactQuill to avoid SSR issues - using react-quill-new for React 18+ compatibility
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className={styles.loadingEditor}>Loading editor...</div>
});

const WysiwygEditor = ({
  value,
  onChange,
  placeholder = "Enter your message...",
  height = 200,
  showEmojiPicker = true,
  toolbar = 'full'
}) => {
  const [showEmojis, setShowEmojis] = useState(false);
  const [quillLoaded, setQuillLoaded] = useState(false);
  const quillRef = useRef(null);
  const [editorKey, setEditorKey] = useState(() => Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    console.log('WysiwygEditor mounted with key:', editorKey);
    setQuillLoaded(true);
  }, [editorKey]);

  // Cleanup function to prevent duplicate editors
  useEffect(() => {
    return () => {
      if (quillRef.current) {
        try {
          const editor = quillRef.current.getEditor();
          if (editor) {
            // Clean up any event listeners or references
            editor.off('text-change');
            editor.off('selection-change');
          }
        } catch (error) {
          console.log('Cleanup error:', error);
        }
      }
    };
  }, []);

  // Image handler is now set up via modules.toolbar.handlers below

  // Function to get the Quill editor instance safely
  const getQuillEditor = () => {
    try {
      if (quillRef.current && typeof quillRef.current.getEditor === 'function') {
        return quillRef.current.getEditor();
      }
    } catch (error) {
      console.log('Error getting Quill editor:', error);
    }
    return null;
  };

  const handleEmojiClick = (emojiObject) => {
    const quill = getQuillEditor();
    if (quill) {
      const range = quill.getSelection();
      const position = range ? range.index : quill.getLength();
      quill.insertText(position, emojiObject.emoji);
      quill.setSelection(position + emojiObject.emoji.length);
    }
    setShowEmojis(false);
  };

  // Custom image handler for Quill
  const imageHandler = function() {
    console.log('Image handler called');

    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      console.log('Input onchange triggered');
      const file = input.files[0];
      if (!file) {
        console.log('No file selected');
        return;
      }

      console.log('File selected:', file.name, file.size, file.type);

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      // Get the Quill editor instance - try multiple methods
      let quill = this.quill || this; // 'this' context from toolbar handler
      if (!quill || !quill.getSelection) {
        quill = quillRef.current?.getEditor?.();
      }

      if (!quill || !quill.getSelection) {
        console.error('Editor not ready');
        alert('Editor not ready. Please try again.');
        return;
      }

      const range = quill.getSelection();
      const index = range ? range.index : quill.getLength();

      console.log('Inserting image at index:', index);

      // Insert loading text with unique identifier
      const loadingId = `loading-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const loadingText = `🔄 Uploading image... [${loadingId}]`;
      quill.insertText(index, loadingText);

      try {
        // Upload image
        const formData = new FormData();
        formData.append('image', file);

        console.log('Uploading image...');

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        console.log('Upload response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Upload error response:', errorData);
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();

        console.log('Upload successful:', result);
        console.log('Image URL:', result.imageUrl);

        if (!result.imageUrl) {
          throw new Error('No image URL returned from server');
        }

        // Find and replace loading text with actual image using Delta operations
        try {
          console.log('Getting current Delta contents...');
          const delta = quill.getContents();
          console.log('Current Delta:', delta);

          // Find the loading text in the delta operations
          let foundIndex = -1;
          let currentIndex = 0;

          for (let i = 0; i < delta.ops.length; i++) {
            const op = delta.ops[i];
            if (op.insert && typeof op.insert === 'string') {
              const textIndex = op.insert.indexOf(loadingText);
              if (textIndex !== -1) {
                foundIndex = currentIndex + textIndex;
                console.log('Found loading text at delta index:', foundIndex);
                break;
              }
              currentIndex += op.insert.length;
            } else if (op.insert) {
              currentIndex += 1; // For embeds like images
            }
          }

          if (foundIndex !== -1) {
            console.log('Deleting loading text at index:', foundIndex, 'length:', loadingText.length);
            // Delete the loading text
            quill.deleteText(foundIndex, loadingText.length);
            console.log('Loading text deleted, inserting image at index:', foundIndex);
            // Insert the image at the same position
            quill.insertEmbed(foundIndex, 'image', result.imageUrl);
            console.log('Image inserted successfully at index:', foundIndex);

            // Force update the React component state
            const newContent = quill.getContents();
            console.log('New content after image insertion:', newContent);

            // Trigger onChange to sync with React state
            if (onChange) {
              const htmlContent = quill.root.innerHTML;
              console.log('Triggering onChange with new HTML content');
              onChange(htmlContent);
            }

            // Force a re-render by updating the editor
            setTimeout(() => {
              try {
                quill.update();
                console.log('Quill editor updated');

                // Set selection after the image
                if (quill.hasFocus()) {
                  quill.setSelection(foundIndex + 1);
                  console.log('Selection set after image');
                }
              } catch (error) {
                console.log('Post-insertion operations skipped:', error.message);
              }
            }, 50);

            console.log('✅ Image upload and insertion completed successfully!');
          } else {
            console.warn('Could not find loading text in Delta, trying simple approach');
            // Fallback to simple text replacement
            const currentContent = quill.getText();
            const simpleIndex = currentContent.indexOf('🔄 Uploading image...');
            if (simpleIndex !== -1) {
              // Find the end of the loading text (look for the closing bracket)
              const endIndex = currentContent.indexOf(']', simpleIndex);
              if (endIndex !== -1) {
                const fullLoadingLength = endIndex - simpleIndex + 1;
                console.log('Found loading text with simple search, deleting from', simpleIndex, 'length', fullLoadingLength);
                quill.deleteText(simpleIndex, fullLoadingLength);
                quill.insertEmbed(simpleIndex, 'image', result.imageUrl);
                console.log('Image inserted with simple approach');

                // Force update
                if (onChange) {
                  onChange(quill.root.innerHTML);
                }
                setTimeout(() => quill.update(), 50);
              }
            } else {
              console.warn('Could not find any loading text, inserting at original position');
              quill.insertEmbed(index, 'image', result.imageUrl);
              // Force update
              if (onChange) {
                onChange(quill.root.innerHTML);
              }
              setTimeout(() => quill.update(), 50);
            }
          }
        } catch (insertError) {
          console.error('Error inserting image:', insertError);
          console.error('Insert error details:', insertError.stack);
          // Fallback: try to insert at original position
          try {
            console.log('Trying fallback insertion at index:', index);
            quill.insertEmbed(index, 'image', result.imageUrl);
            console.log('Fallback insertion successful');
          } catch (fallbackError) {
            console.error('Fallback insertion also failed:', fallbackError);
            console.error('Fallback error details:', fallbackError.stack);
            throw new Error('Failed to insert image into editor');
          }
        }

      } catch (error) {
        console.error('Image upload failed:', error);
        // Remove loading text
        try {
          const currentContent = quill.getText();
          const loadingIndex = currentContent.indexOf(loadingText);
          if (loadingIndex !== -1) {
            quill.deleteText(loadingIndex, loadingText.length);
          }
        } catch (deleteError) {
          console.error('Error removing loading text:', deleteError);
        }
        alert(`Failed to upload image: ${error.message}`);
      }
    };
  };

  // Toolbar configurations
  const toolbarConfigs = {
    minimal: [
      ['bold', 'italic', 'underline'],
      ['link'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
    standard: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image', 'blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['clean']
    ],
    full: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }, { 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ]
  };

  const modules = {
    toolbar: {
      container: toolbarConfigs[toolbar] || toolbarConfigs.standard,
      handlers: {
        image: function() {
          // Use the imageHandler function with proper context
          imageHandler.call(this);
        }
      }
    },
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align', 'script',
    'code-block', 'direction'
  ];

  if (!quillLoaded) {
    return (
      <div className={styles.editorContainer}>
        <div className={styles.loadingEditor}>Loading editor...</div>
      </div>
    );
  }

  return (
    <div className={styles.editorContainer}>
      <div className={styles.editorWrapper}>
        <ReactQuill
          key={`quill-editor-${editorKey}`}
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          modules={modules}
          formats={formats}
          style={{ height: `${height}px` }}
        />
        
        {showEmojiPicker && (
          <div className={styles.editorActions}>
            <button
              type="button"
              className={styles.emojiButton}
              onClick={() => setShowEmojis(!showEmojis)}
              title="Add Emoji"
            >
              😀
            </button>
          </div>
        )}
      </div>

      {showEmojis && (
        <div className={styles.emojiPickerContainer}>
          <div className={styles.emojiPickerOverlay} onClick={() => setShowEmojis(false)} />
          <div className={styles.emojiPicker}>
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width={300}
              height={400}
              searchDisabled={false}
              skinTonesDisabled={true}
              previewConfig={{
                showPreview: false
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WysiwygEditor;
