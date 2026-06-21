import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ReaderPage from './pages/ReaderPage'
import Stats from './pages/Stats'
import { getBooks, getLastOpenedBook, saveBook } from './lib/bookStorage'
import type { StoredBook } from './types/Book'

function App() {
  const [books, setBooks] = useState<StoredBook[]>([])
  const [lastOpenedBookId, setLastOpenedBookId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      const storedBooks = await getBooks()
      setBooks(storedBooks.sort((a, b) => b.lastModified - a.lastModified))
      const lastOpened = await getLastOpenedBook()
      setLastOpenedBookId(lastOpened ?? null)
    }
    load()
  }, [])

  const handleNewFile = async (file: File) => {
    const id = `${file.name}-${file.lastModified}`
    const existingBook = books.find(
      (book) =>
        book.name === file.name &&
        book.size === file.size &&
        book.lastModified === file.lastModified,
    )

    if (existingBook) {
      navigate(`/reader/${existingBook.id}`)
      return
    }

    const newBook: StoredBook = {
      id,
      name: file.name,
      fileName: file.name,
      size: file.size,
      lastModified: file.lastModified,
      blob: file,
    }

    await saveBook(newBook)
    setBooks((current) => [newBook, ...current])
    navigate(`/reader/${id}`)
  }

  const handleSelectBook = (id: string) => {
    navigate(`/reader/${id}`)
  }

  const handleResumeReading = () => {
    if (lastOpenedBookId) {
      navigate(`/reader/${lastOpenedBookId}`)
    }
  }

  const navLinks = [
    { label: 'Library', href: '/' },
    { label: 'Stats', href: '/stats' },
  ];

  return (
    <>
      <Navbar productName="Book Reader Pro" productLinks={navLinks} ctaText="Resume" onCtaClick={handleResumeReading} />
      <Routes>
        <Route
          path="/"
          element={
            <Home
              books={books}
              onFileSelected={handleNewFile}
              onSelectBook={handleSelectBook}
              lastOpenedBookId={lastOpenedBookId}
              onResumeReading={handleResumeReading}
            />
          }
        />
        <Route path="/reader/:bookId" element={<ReaderPage />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
