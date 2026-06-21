import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PdfReader from '../components/PdfReader'
import { getBook, getProgress, saveLastOpenedBook } from '../lib/bookStorage'
import type { StoredBook } from '../types/Book'

const ReaderPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>()
  const navigate = useNavigate()
  const [book, setBook] = useState<StoredBook | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState<number>(1)

  useEffect(() => {
    const load = async () => {
      if (!bookId) return
      setLoading(true)
      const stored = await getBook(bookId)
      if (stored) {
        setBook(stored)
        const savedPage = await getProgress(bookId)
        setPage(savedPage)
        await saveLastOpenedBook(bookId)
      }
      setLoading(false)
    }
    load()
  }, [bookId])

  const url = useMemo(() => {
    if (!book) return ''
    return URL.createObjectURL(book.blob)
  }, [book])

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-slate-200">Loading book…</div>
    )
  }

  if (!book) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-rose-300">
        Book not found. <button type="button" onClick={() => navigate('/')} className="underline">Go back</button>
      </div>
    )
  }

  return (
    <PdfReader
      url={url}
      name={book.name}
      onClose={() => navigate('/')}
      initialPage={page}
      bookId={book.id}
    />
  )
}

export default ReaderPage
