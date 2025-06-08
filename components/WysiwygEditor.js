import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import EmojiPicker from 'emoji-picker-react';
import styles from '../styles/WysiwygEditor.module.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

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

  useEffect(() => {
    setQuillLoaded(true);
  }, []);

  // Set up image handler after Quill is loaded
  useEffect(() => {
    if (quillLoaded && quillRef.current) {
      const timer = setTimeout(() => {
        const quill = quillRef.current.getEditor();
        if (quill) {
          const toolbar = quill.getModule('toolbar');
          if (toolbar) {
            toolbar.addHandler('image', imageHandler);
            console.log('Image handler set up successfully');
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [quillLoaded]);

  // Function to get the Quill editor instance safely
  const getQuillEditor = () => {
    if (quillRef.current && quillRef.current.getEditor) {
      return quillRef.current.getEditor();
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
      const file = input.files[0];
      if (!file) return;

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

      // Get the Quill editor instance
      const quill = quillRef.current?.getEditor();
      if (!quill) {
        alert('Editor not ready. Please try again.');
        return;
      }

      const range = quill.getSelection();
      const index = range ? range.index : quill.getLength();

      console.log('Inserting image at index:', index);

      // Show loading placeholder
      quill.insertEmbed(index, 'image', '/images/loading.svg');
      quill.setSelection(index + 1);

      try {
        // Upload image
        const formData = new FormData();
        formData.append('image', file);

        console.log('Uploading image...');

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();

        console.log('Upload successful:', result.imageUrl);

        // Replace loading placeholder with actual image
        quill.deleteText(index, 1);
        quill.insertEmbed(index, 'image', result.imageUrl);
        quill.setSelection(index + 1);

      } catch (error) {
        console.error('Image upload failed:', error);
        // Remove loading placeholder
        quill.deleteText(index, 1);
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
    toolbar: toolbarConfigs[toolbar] || toolbarConfigs.standard,
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
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
