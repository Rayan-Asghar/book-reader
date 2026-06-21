import React, { useEffect, useState } from 'react'
import { getBooks, countBookmarks, getLastOpenedBook } from '../lib/bookStorage'
import type { StoredBook } from '../types/Book'

const Stats: React.FC = () => {
  const [books, setBooks] = useState<StoredBook[]>([])
  const [bookmarkCount, setBookmarkCount] = useState(0)
  const [lastOpenedBookId, setLastOpenedBookId] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      const storedBooks = await getBooks()
      setBooks(storedBooks)
      const count = await countBookmarks()
      setBookmarkCount(count)
      const lastBook = await getLastOpenedBook()
      setLastOpenedBookId(lastBook ?? null)
    }
    loadStats()
  }, [])

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-6">
      <section className="mb-10 rounded-[40px] border border-white/10 bg-slate-950/95 p-8 shadow-2xl shadow-slate-950/40">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Reading stats</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Your reading dashboard</h1>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Books in library</p>
            <p className="mt-3 text-4xl font-semibold text-white">{books.length}</p>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Bookmarks saved</p>
            <p className="mt-3 text-4xl font-semibold text-white">{bookmarkCount}</p>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Resume book</p>
            <p className="mt-3 text-4xl font-semibold text-white">{lastOpenedBookId ? 'Available' : 'None'}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold text-white">Library overview</h2>
          <p className="mt-3 text-slate-400">Your book collection is stored locally in IndexedDB. Pick a book and continue reading anytime.</p>
        </div>
        <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold text-white">Why this matters</h2>
          <p className="mt-3 text-slate-400">Search, bookmarks, progress tracking and theme preferences all persist across refreshes, making this a strong demo of offline-capable reading apps.</p>
        </div>
      </section>
    </main>
  )
}

export default Stats
