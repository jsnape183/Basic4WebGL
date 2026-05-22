import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface IModalWithInputProps {
  title: string;
  openText?: string;
  placeholder?: string;
  saveText?: string;
  closeText?: string;
  onSubmit: (inputText: string) => void;
}

const ModalWithInput: React.FC<IModalWithInputProps> = ({
  title,
  openText = 'Open',
  placeholder = 'Type here...',
  saveText = 'Save',
  closeText = 'Close',
  onSubmit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`);

  const open = () => {
    setIsOpen(true);
    setInputValue('');
  };

  const close = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const submit = () => {
    onSubmit(inputValue);
    close();
  };

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const modal = isOpen
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId.current}
            className="bg-ds-surface border border-ds-border rounded-lg p-6 w-full max-w-sm shadow-xl"
            onKeyDown={(e) => {
              if (e.key !== 'Tab') return;
              const focusable = e.currentTarget.querySelectorAll<HTMLElement>(
                'input, button, [tabindex]:not([tabindex="-1"])'
              );
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus(); }
              } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus(); }
              }
            }}
          >
            <h2 id={titleId.current} className="text-ds-text text-lg font-semibold mb-4">
              {title}
            </h2>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder={placeholder}
              className="w-full bg-ds-bg border border-ds-border rounded px-3 py-2 text-ds-text text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-ds-accent"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={submit}
                className="bg-ds-accent-btn text-ds-accent-btn-text text-sm px-4 py-2 rounded hover:opacity-90 transition"
              >
                {saveText}
              </button>
              <button
                onClick={close}
                className="bg-ds-surface-2 text-ds-text-muted text-sm px-4 py-2 rounded hover:bg-ds-border transition"
              >
                {closeText}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={open}
        className="text-ds-text-muted hover:text-ds-text transition text-sm"
        aria-label={openText}
      >
        {openText}
      </button>
      {modal}
    </>
  );
};

export default ModalWithInput;
