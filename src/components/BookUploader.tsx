import React, { useState } from 'react';

interface BookUploaderProps {
  onFileSelected: (file: File) => void;
}

const BookUploader: React.FC<BookUploaderProps> = ({ onFileSelected }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setError('');
    setSuccess('');

    if (!selectedFile) {
      return;
    }

    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a valid PDF file');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setSuccess(`Ready to add ${selectedFile.name}`);
  };

  const handleAddBook = () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    onFileSelected(file);
    setSuccess(`Added ${file.name} to your library`);
    setFile(null);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) input.value = '';
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-[50px] border border-white/10 bg-slate-900/95 p-5 shadow-[0_40px_120px_-50px_rgba(15,23,42,0.8)] ring-1 ring-white/10 backdrop-blur-xl">
      <div className="relative mb-6 flex items-center justify-center">
        <div className="absolute top-0 h-2.5 w-24 rounded-full bg-slate-800/90" />
        <div className="h-2 w-14 rounded-full bg-slate-700/70" />
      </div>

      <div className="overflow-hidden rounded-[40px] border border-white/10 bg-slate-950/80 p-6 shadow-inner shadow-white/5 backdrop-blur-lg">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Book Uploader</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Upload your PDF</h2>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-sky-500/15 text-sky-200 shadow-sm shadow-sky-500/10">
            <span aria-hidden="true">📄</span>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block cursor-pointer rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-4 shadow-sm shadow-slate-950/20 transition duration-300 hover:border-sky-400/30">
            <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-200">
              <span>Choose PDF file</span>
              <span className="rounded-full bg-sky-500 px-3 py-1 text-[11px] font-semibold uppercase text-slate-950">PDF</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Select a book file from your device</p>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          {file && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-slate-200 shadow-inner shadow-white/5">
              <p className="font-medium text-white truncate">{file.name}</p>
              <p className="mt-1 text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}

          {error && (
            <p className="rounded-3xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {success}
            </p>
          )}

          <button
            type="button"
            onClick={handleAddBook}
            disabled={!file}
            className="inline-flex w-full items-center justify-center rounded-3xl bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Add to Library
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-1 text-center text-[10px] uppercase tracking-[0.3em] text-slate-500">
        <span>Designed for your PDF library</span>
        <span className="text-slate-600">iPhone-inspired upload experience</span>
      </div>
    </div>
  );
};

export default BookUploader;
