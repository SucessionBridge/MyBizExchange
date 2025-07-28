import { useState, useEffect } from 'react';

export default function EditDescriptionModal({ 
  isOpen, 
  onClose, 
  currentValue, 
  onSave, 
  title 
}) {
  const [value, setValue] = useState(currentValue || '');

  useEffect(() => {
    setValue(currentValue || '');
  }, [currentValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <textarea
          className="w-full border rounded p-3 h-48"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="flex justify-end mt-4 gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(value)} 
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
