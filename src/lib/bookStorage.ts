import { openDB } from 'idb'
import type { Bookmark, StoredBook } from '../types/Book'

type BookReaderDB = {
  books: {
    key: string
    value: StoredBook
    indexes: { 'by-name': string }
  }
  progress: {
    key: string
    value: number
  }
  bookmarks: {
    key: string
    value: Bookmark
    indexes: { 'by-bookId': string }
  }
  userData: {
    key: string
    value: string
  }
}

const DB_NAME = 'book-reader-db'
const DB_VERSION = 1

const getDb = async () =>
  openDB<BookReaderDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('books')) {
        const store = db.createObjectStore('books', { keyPath: 'id' })
        store.createIndex('by-name', 'name')
      }
      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress')
      }
      if (!db.objectStoreNames.contains('bookmarks')) {
        const store = db.createObjectStore('bookmarks', { keyPath: 'id' })
        store.createIndex('by-bookId', 'bookId')
      }
      if (!db.objectStoreNames.contains('userData')) {
        db.createObjectStore('userData')
      }
    },
  })

export const saveBook = async (book: StoredBook) => {
  const db = await getDb()
  await db.put('books', book)
}

export const getBooks = async (): Promise<StoredBook[]> => {
  const db = await getDb()
  return db.getAll('books')
}

export const getBook = async (id: string): Promise<StoredBook | undefined> => {
  const db = await getDb()
  return db.get('books', id)
}

export const saveProgress = async (bookId: string, page: number) => {
  const db = await getDb()
  await db.put('progress', page, bookId)
}

export const getProgress = async (bookId: string): Promise<number> => {
  const db = await getDb()
  return (await db.get('progress', bookId)) ?? 1
}

export const saveBookmark = async (bookmark: Bookmark) => {
  const db = await getDb()
  await db.put('bookmarks', bookmark)
}

export const getBookmarksByBookId = async (bookId: string): Promise<Bookmark[]> => {
  const db = await getDb()
  return db.getAllFromIndex('bookmarks', 'by-bookId', bookId)
}

export const deleteBookmark = async (bookmarkId: string) => {
  const db = await getDb()
  await db.delete('bookmarks', bookmarkId)
}

export const countBookmarks = async (): Promise<number> => {
  const db = await getDb()
  return db.count('bookmarks')
}

export const saveLastOpenedBook = async (bookId: string) => {
  const db = await getDb()
  await db.put('userData', bookId, 'lastOpenedBook')
}

export const getLastOpenedBook = async (): Promise<string | undefined> => {
  const db = await getDb()
  return db.get('userData', 'lastOpenedBook')
}
