// src/components/UploadButton.tsx
import React, { useState, useRef } from 'react';
import { uploadSchematicImage } from '../api/client';

export const UploadButton: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Optional: Validate file type on frontend
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert("Please upload a valid JPEG or PNG legacy diagram.");
      return;
    }

    try {
      setIsUploading(true);
      
      // 1. Send to backend
      console.log("Sending to AETHER Neural Engine...");
      const result = await uploadSchematicImage(file);
      
      // 2. Success! Here is your draft netlist
      console.log("SUCCESS! Extracted Netlist:", result.data);
      alert("Netlist extracted successfully! Check the console.");
      
      // TODO: Here is where you will eventually dispatch this data to your Zustand store 
      // so the 3D canvas can render it.

    } catch (error) {
      alert("Failed to process schematic. See console for details.");
    } finally {
      setIsUploading(false);
      // Reset input so you can upload the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();

  return (
    <div>
      <input 
        type="file" 
        accept="image/jpeg, image/png" 
        style={{ display: 'none' }} 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />
      <button 
        onClick={triggerUpload}
        disabled={isUploading}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-bold rounded shadow transition-colors"
      >
        {isUploading ? 'ANALYZING DIAGRAM...' : '+ UPLOAD SCHEMATIC'}
      </button>
    </div>
  );
};