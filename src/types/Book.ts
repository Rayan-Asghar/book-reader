export type StoredBook = {
  id: string;
  name: string;
  fileName: string;
  size: number;
  lastModified: number;
  blob: Blob;
};

export type Book = StoredBook & {
  url: string;
};

export type Bookmark = {
  id: string;
  bookId: string;
  page: number;
  note?: string;
  createdAt: string;
};
