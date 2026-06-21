import React from 'react'
import BookUploader from '../components/BookUploader'
import Library from '../components/Library'
import type { StoredBook } from '../types/Book'

type HomeProps = {
  books: StoredBook[]
  onFileSelected: (file: File) => void
  onSelectBook: (id: string) => void
  lastOpenedBookId?: string | null
  onResumeReading: () => void
}

const Home: React.FC<HomeProps> = ({ books, onFileSelected, onSelectBook, lastOpenedBookId, onResumeReading }) => (
  <main className="mx-auto max-w-6xl px-4 pb-12 pt-6">
    <section className="mb-10">
      <BookUploader onFileSelected={onFileSelected} />
    </section>

    <section className="mb-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">My Library</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-100">Tap a book to open the reader</h2>
        </div>
        {lastOpenedBookId ? (
          <button
            type="button"
            onClick={onResumeReading}
            className="rounded-3xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          >
            Resume reading
          </button>
        ) : null}
      </div>

      <Library books={books} onSelectBook={onSelectBook} />
    </section>
  </main>
)

export default Home
