import React, { useState } from "react";

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
  openText = "Open",
  placeholder = "Type here...",
  saveText = "Save",
  closeText = "Close",
  onSubmit,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = () => {
    onSubmit(inputValue);
    handleCloseModal();
  };

  return (
    <div>
      <button
        onClick={handleOpenModal}
        className="bg-blue-500 text-white p-2 rounded"
      >
        {openText}
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-xl mb-4">{title}</h2>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              className="border border-gray-300 p-2 rounded w-full mb-4"
              placeholder={placeholder}
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={handleSubmit}
                className="bg-green-500 text-white p-2 rounded"
              >
                {saveText}
              </button>
              <button
                onClick={handleCloseModal}
                className="bg-gray-300 text-black p-2 rounded"
              >
                {closeText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalWithInput;
