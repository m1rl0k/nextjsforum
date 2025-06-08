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

  const handleEmojiClick = (emojiObject) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      const position = range ? range.index : quill.getLength();
      quill.insertText(position, emojiObject.emoji);
      quill.setSelection(position + emojiObject.emoji.length);
    }
    setShowEmojis(false);
  };

  // Custom image handler for Quill
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

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

      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      const index = range ? range.index : quill.getLength();

      // Show loading placeholder
      quill.insertEmbed(index, 'image', '/images/loading.svg');
      quill.setSelection(index + 1);

      try {
        // Upload image
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();

        // Replace loading placeholder with actual image
        quill.deleteText(index, 1);
        quill.insertEmbed(index, 'image', result.imageUrl);
        quill.setSelection(index + 1);

      } catch (error) {
        console.error('Image upload failed:', error);
        // Remove loading placeholder
        quill.deleteText(index, 1);
        alert('Failed to upload image. Please try again.');
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
      ['link', 'blockquote', 'code-block'],
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
        image: imageHandler
      }
    },
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
