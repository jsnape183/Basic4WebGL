import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface IModalWithInputProps {
  title: string;
  openText?: string;
  placeholder?: string;
  saveText?: string;
  closeText?: string;
  onSubmit: (inputText: string) => void;
  /** Optional validator. Return an error message string when invalid, or null when valid. */
  validate?: (value: string) => string | null;
}

const ModalWithInput: React.FC<IModalWithInputProps> = ({
  title,
  openText = 'Open',
  placeholder = 'Type here...',
  saveText = 'Save',
  closeText = 'Close',
  onSubmit,
  validate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`);

  const open = () => {
    setIsOpen(true);
    setInputValue('');
    setValidationError(null);
  };

  const close = () => {
    setIsOpen(false);
    setValidationError(null);
    triggerRef.current?.focus();
  };

  const handleChange = (value: string) => {
    setInputValue(value);
    if (validate) {
      setValidationError(validate(value));
    }
  };

  const submit = () => {
    if (validate) {
      const error = validate(inputValue);
      if (error) {
        setValidationError(error);
        return;
      }
    }
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
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder={placeholder}
              aria-describedby={validationError ? `${titleId.current}-error` : undefined}
              className={`w-full bg-ds-bg border rounded px-3 py-2 text-ds-text text-sm focus:outline-none focus:ring-2 focus:ring-ds-accent ${
                validationError ? 'border-ds-error mb-1' : 'border-ds-border mb-4'
              }`}
            />
            {validationError && (
              <p
                id={`${titleId.current}-error`}
                className="text-ds-error text-xs mb-3"
              >
                {validationError}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={submit}
                className="bg-accent-gradient text-white text-sm px-4 py-2 rounded hover:opacity-90 transition"
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
