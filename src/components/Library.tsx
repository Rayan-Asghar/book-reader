import React from 'react'
import type { StoredBook } from '../types/Book'

type LibraryProps = {
  books: StoredBook[]
  onSelectBook: (id: string) => void
}

const Library: React.FC<LibraryProps> = ({ books, onSelectBook }) => {
  if (books.length === 0) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 text-slate-400 shadow-lg shadow-slate-950/20">
        Upload a PDF to add it to your library. Then tap the book card to open the viewer.
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {books.map((book) => (
        <button
          key={book.id}
          type="button"
          onClick={() => onSelectBook(book.id)}
          className="group rounded-[28px] border border-white/10 bg-slate-900/90 p-5 text-left transition hover:border-sky-400/30 hover:bg-slate-900"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-sky-500/10 text-sky-200 ring-1 ring-sky-500/10 transition group-hover:bg-sky-500/15">
            <span className="text-xl">📘</span>
          </div>
          <p className="text-sm font-semibold text-slate-100">{book.name}</p>
          <p className="mt-1 text-xs text-slate-500">{book.fileName} · {(book.size / 1024 / 1024).toFixed(2)} MB</p>
        </button>
      ))}
    </div>
  )
}

export default Library
