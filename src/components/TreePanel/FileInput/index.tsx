import { useEffect, useRef } from 'react';
import * as React from 'react';

export type FileUploadResult = {
  name: string;
  content: string;
};

export type FileInputProps = {
  onChange(files: FileUploadResult[]): void;
};
const FileInput = ({ onChange }: FileInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const readAsDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string); // "data:<mime>;base64,..."
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  async function handleOnChange(files?: FileList | null) {
    if (!files || files.length === 0) {
      onChange([]);
      return;
    }

    // Optional: size guard (localStorage is ~5–10MB per origin)
    const MAX_BYTES = 4 * 1024 * 1024;
    for (const f of Array.from(files)) {
      if (f.size > MAX_BYTES) {
        alert(`${f.name} is too large for localStorage. Consider IndexedDB.`);
        return;
      }
    }

    const results: FileUploadResult[] = await Promise.all(
      Array.from(files).map(async (file) => ({
        name: file.name,
        content: await readAsDataURL(file),
      }))
    );

    onChange(results); // now populated
  }

  return (
    <input
      type="file"
      ref={inputRef}
      data-testid="uploader"
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
          handleOnChange(e.target.files);
        }
      }}
    />
  );
};

export default FileInput;
