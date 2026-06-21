import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';
import type { Bookmark } from '../types/Book';
import { deleteBookmark, getBookmarksByBookId, saveBookmark, saveProgress } from '../lib/bookStorage';

GlobalWorkerOptions.workerSrc = pdfjsWorker;

type PdfReaderProps = {
  url: string;
  name: string;
  onClose: () => void;
  initialPage?: number;
  bookId?: string;
};

type SearchResult = {
  page: number;
  snippet: string;
};

type SearchIndexEntry = {
  page: number;
  text: string;
};

const PdfReader: React.FC<PdfReaderProps> = ({ url, name, onClose, initialPage, bookId }) => {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState<number>(() => initialPage ?? 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [currentBookmarkId, setCurrentBookmarkId] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const primaryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const secondaryCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const textIndexRef = useRef<SearchIndexEntry[]>([]);
  const [scale, setScale] = useState(1.0);
  const [theme, setTheme] = useState<'day' | 'night'>(() => (window.localStorage.getItem('reader-theme') as 'day' | 'night') || 'day');
  const [spread, setSpread] = useState<'single' | 'double'>(() => (window.localStorage.getItem('reader-spread') as 'single' | 'double') || 'single');

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setLoading(true);
        setError('');
        textIndexRef.current = [];

        const res = await fetch(url);
        if (!res.ok) throw new Error('Network error');
        const buffer = await res.arrayBuffer();
        const pdfData = await getDocument({ data: buffer }).promise;

        setNumPages(pdfData.numPages);
        pdfRef.current = pdfData;

        const searchEntries: SearchIndexEntry[] = [];
        for (let page = 1; page <= pdfData.numPages; page += 1) {
          const pdfPage = await pdfData.getPage(page);
          const content = await pdfPage.getTextContent();
          const text = content.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' ');
          searchEntries.push({ page, text });
        }
        textIndexRef.current = searchEntries;
      } catch (err) {
        console.error(err);
        setError('Unable to open PDF.');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    mountedRef.current = true;
    loadPdf();

    return () => {
      mountedRef.current = false;
      if (pdfRef.current) {
        try {
          (pdfRef.current as unknown as { destroy?: () => void })?.destroy?.();
        } catch (e) {
          console.warn(e);
        }
        pdfRef.current = null;
      }
    };
  }, [url]);

  useEffect(() => {
    const loadBookmarks = async () => {
      if (!bookId) {
        setBookmarks([]);
        return;
      }
      const storedBookmarks = await getBookmarksByBookId(bookId);
      setBookmarks(storedBookmarks);
    };
    loadBookmarks();
  }, [bookId]);

  useEffect(() => {
    setCurrentBookmarkId(bookmarks.find((bookmark) => bookmark.page === pageNumber)?.id ?? null);
  }, [bookmarks, pageNumber]);

  useEffect(() => {
    const persistPage = async () => {
      if (!bookId || pageNumber <= 0) return;
      await saveProgress(bookId, pageNumber);
    };
    persistPage();
  }, [bookId, pageNumber]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.trim().toLowerCase();
    const results = textIndexRef.current
      .reduce<SearchResult[]>((acc, entry) => {
        const index = entry.text.toLowerCase().indexOf(query);
        if (index === -1) return acc;
        const start = Math.max(0, index - 40);
        const snippet = entry.text.slice(start, Math.min(entry.text.length, index + query.length + 80)).replace(/\s+/g, ' ');
        acc.push({ page: entry.page, snippet: `...${snippet}...` });
        return acc;
      }, [])
      .slice(0, 12);

    setSearchResults(results);
  }, [searchQuery]);

  useEffect(() => {
    window.localStorage.setItem('reader-theme', theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem('reader-spread', spread);
  }, [spread]);

  const renderCanvas = useCallback(
    async (pageNum: number, canvas: HTMLCanvasElement | null) => {
      const pdf = pdfRef.current;
      if (!canvas || !pdf || pageNum < 1 || pageNum > numPages) return;

      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const context = canvas.getContext('2d');
        if (!context) return;

        const parent = canvas.parentElement;
        const maxWidth = parent?.clientWidth ? Math.min(parent.clientWidth, viewport.width) : viewport.width;
        const scaledViewport = page.getViewport({ scale: (maxWidth / viewport.width) * scale });

        canvas.width = Math.floor(scaledViewport.width);
        canvas.height = Math.floor(scaledViewport.height);
        canvas.style.width = `${Math.floor(scaledViewport.width)}px`;
        canvas.style.height = `${Math.floor(scaledViewport.height)}px`;

        await (page as any).render({ canvasContext: context, viewport: scaledViewport }).promise;
      } catch (err) {
        console.warn(err);
      }
    },
    [scale, numPages],
  );

  useEffect(() => {
    renderCanvas(pageNumber, primaryCanvasRef.current);
    if (spread === 'double') {
      if (pageNumber < numPages) {
        renderCanvas(pageNumber + 1, secondaryCanvasRef.current);
      } else if (secondaryCanvasRef.current) {
        const canvas = secondaryCanvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = 0;
        canvas.height = 0;
        if (context) context.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [pageNumber, scale, spread, renderCanvas, numPages]);

  const goToPrevious = () => setPageNumber((current) => Math.max(1, current - 1));
  const goToNext = () => setPageNumber((current) => Math.min(numPages, current + 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') setPageNumber((n) => Math.min(numPages, n + 1));
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') setPageNumber((n) => Math.max(1, n - 1));
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, numPages]);

  const progressPercent = numPages ? Math.round((pageNumber / numPages) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl flex-col rounded-[40px] border border-white/10 bg-slate-950/95 shadow-2xl shadow-slate-950/40 ring-1 ring-white/10">
        <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 transition hover:border-sky-400"
              >
                ← Back
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">PDF Reader</p>
                <h3 className="mt-2 text-lg font-semibold text-white truncate">{name}</h3>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'day' ? 'night' : 'day'))}
              className="rounded-full border border-slate-700/80 bg-slate-900/95 px-3 py-1 text-sm text-slate-200 transition hover:border-slate-500"
              aria-label="Toggle theme"
            >
              {theme === 'day' ? '☀️' : '🌙'}
            </button>
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)))}
              className="rounded-full border border-slate-700/80 bg-slate-900/95 px-3 py-1 text-sm text-slate-200 transition hover:border-slate-500"
              aria-label="Zoom out"
            >
              –
            </button>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(3, +(s + 0.1).toFixed(2)))}
              className="rounded-full border border-slate-700/80 bg-slate-900/95 px-3 py-1 text-sm text-slate-200 transition hover:border-slate-500"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setSpread((s) => (s === 'single' ? 'double' : 'single'))}
              className="rounded-full border border-slate-700/80 bg-slate-900/95 px-3 py-1 text-sm text-slate-200 transition hover:border-slate-500"
              aria-label="Toggle spread"
            >
              {spread === 'single' ? '1up' : '2up'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-700/80 bg-slate-900/95 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-5 py-6">
          <div className="mb-4 flex items-center justify-between gap-4 rounded-[32px] border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-400 shadow-inner shadow-slate-950/20">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Page</p>
              <p className="text-sm text-slate-100">{pageNumber} / {numPages || '--'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToPrevious}
                disabled={pageNumber <= 1}
                className="rounded-2xl bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={goToNext}
                disabled={pageNumber >= numPages}
                className="rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mb-4 grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-4 shadow-inner shadow-slate-950/20">
              <label className="text-sm font-semibold text-slate-200">Search inside this book</label>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Find words or phrases..."
                className="mt-3 w-full rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400"
              />
              {searchQuery ? (
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  {searchResults.length === 0 ? (
                    <div className="rounded-3xl bg-white/5 px-4 py-3 text-slate-400">No matching text found.</div>
                  ) : (
                    searchResults.map((result) => (
                      <button
                        key={`${result.page}-${result.snippet}`}
                        type="button"
                        onClick={() => setPageNumber(result.page)}
                        className="w-full rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3 text-left transition hover:border-sky-500"
                      >
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
                          <span>Page {result.page}</span>
                          <span>Jump</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-200">{result.snippet}</p>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Search across all extracted PDF text. Matches update while you type.</p>
              )}
            </div>

            <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-4 shadow-inner shadow-slate-950/20">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Bookmarks</p>
                  <p className="mt-2 text-sm text-slate-200">Save and return to pages fast.</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (!bookId) return;
                    if (currentBookmarkId) {
                      await deleteBookmark(currentBookmarkId);
                      setBookmarks((current) => current.filter((bookmark) => bookmark.id !== currentBookmarkId));
                      setCurrentBookmarkId(null);
                      return;
                    }

                    const nextBookmark: Bookmark = {
                      id: `${bookId}-${pageNumber}-${Date.now()}`,
                      bookId,
                      page: pageNumber,
                      createdAt: new Date().toISOString(),
                    };
                    await saveBookmark(nextBookmark);
                    setBookmarks((current) => [nextBookmark, ...current]);
                    setCurrentBookmarkId(nextBookmark.id);
                  }}
                  className="rounded-3xl bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400"
                >
                  {currentBookmarkId ? 'Remove bookmark' : 'Bookmark page'}
                </button>
              </div>

              <div className="space-y-3">
                {bookmarks.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-4 py-5 text-sm text-slate-500">No bookmarks yet. Tap the button to bookmark this page.</div>
                ) : (
                  bookmarks.map((bookmark) => (
                    <div key={bookmark.id} className="rounded-3xl border border-white/10 bg-slate-950/90 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setPageNumber(bookmark.page)}
                          className="text-left text-sm text-slate-100 transition hover:text-sky-300"
                        >
                          Page {bookmark.page}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteBookmark(bookmark.id);
                            setBookmarks((current) => current.filter((item) => item.id !== bookmark.id));
                            if (currentBookmarkId === bookmark.id) setCurrentBookmarkId(null);
                          }}
                          className="text-xs uppercase tracking-[0.25em] text-slate-500 transition hover:text-rose-400"
                        >
                          Delete
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">Saved {new Date(bookmark.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-[32px] border border-white/10 bg-slate-900/80 p-4">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Reading progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="h-full min-h-[28rem] overflow-auto rounded-[32px] border border-white/10 bg-slate-950/90 p-4 shadow-inner shadow-slate-950/20">
            {loading ? (
              <div className="flex h-full min-h-[24rem] items-center justify-center text-slate-500">Loading PDF…</div>
            ) : error ? (
              <div className="flex h-full min-h-[24rem] items-center justify-center text-rose-300">{error}</div>
            ) : (
              <div className={`reader-canvas-wrapper grid gap-4 ${spread === 'double' ? 'lg:grid-cols-2' : 'grid-cols-1'} ${theme === 'night' ? 'bg-slate-900' : 'bg-[#F5ECD9]'}`}>
                <div className="flex justify-center">
                  <canvas ref={primaryCanvasRef} className="w-full max-w-full rounded-md shadow-md" />
                </div>
                {spread === 'double' && (
                  <div className="flex justify-center">
                    <canvas ref={secondaryCanvasRef} className="w-full max-w-full rounded-md shadow-md" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfReader;
