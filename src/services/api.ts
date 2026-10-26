import { Book } from '../types';

const API_BASE = '/api';

export async function fetchBooks(): Promise<Book[]> {
  const res = await fetch(`${API_BASE}/books`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error del servidor (${res.status})`);
  }
  const data = await res.json();
  return data.books || [];
}

export async function createBook(bookData: Omit<Book, 'id'>): Promise<Book> {
  const res = await fetch(`${API_BASE}/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error al crear libro (${res.status})`);
  }
  const data = await res.json();
  return data.book;
}

export async function updateBook(id: string, bookData: Partial<Book>): Promise<Book> {
  const res = await fetch(`${API_BASE}/books/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookData),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error al actualizar libro (${res.status})`);
  }
  const data = await res.json();
  return data.book;
}

export async function deleteBook(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/books/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error al eliminar libro (${res.status})`);
  }
}

export async function importBatchBooks(
  books: Book[],
  mode: 'replace' | 'merge'
): Promise<{ count: number }> {
  const res = await fetch(`${API_BASE}/books/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ books, mode }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error al importar lote (${res.status})`);
  }
  return await res.json();
}

export async function seedInitialBooks(): Promise<Book[]> {
  const res = await fetch(`${API_BASE}/books/seed`, {
    method: 'POST',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Error al reiniciar libros (${res.status})`);
  }
  const data = await res.json();
  return data.books || [];
}

export async function checkDbHealth(): Promise<{ status: string; db: string; count: number }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Error de salud del servidor (${res.status})`);
  }
  return await res.json();
}
