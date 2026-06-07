const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  status: number;
  details: string[];

  constructor(status: number, message: string, details: string[] = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message[0] : (data?.message ?? 'Request failed');
    const details = Array.isArray(data?.message) ? data.message : [];
    throw new ApiError(res.status, message, details);
  }

  return data as T;
}

export type Role = 'ADMIN' | 'USER';

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface Concert {
  id: string;
  name: string;
  description: string;
  totalSeats: number;
  reservedCount: number;
  availableSeats: number;
  isReservedByMe: boolean;
}

export interface ReservationLogEntry {
  id: string;
  userId: string;
  username: string;
  concertId: string;
  concertName: string;
  action: 'RESERVE' | 'CANCEL';
  createdAt: string;
}

export const api = {
  register: (body: { name: string; email: string; password: string; role?: Role }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body }),

  getConcerts: (token: string) => request<Concert[]>('/concerts', { token }),

  createConcert: (token: string, body: { name: string; description: string; totalSeats: number }) =>
    request<Concert>('/concerts', { method: 'POST', body, token }),

  deleteConcert: (token: string, id: string) =>
    request<{ id: string }>(`/concerts/${id}`, { method: 'DELETE', token }),

  reserve: (token: string, concertId: string) =>
    request(`/reservations/${concertId}`, { method: 'POST', token }),

  cancel: (token: string, concertId: string) =>
    request(`/reservations/${concertId}`, { method: 'DELETE', token }),

  getMyHistory: (token: string) => request<ReservationLogEntry[]>('/reservations/me', { token }),

  getAllHistory: (token: string) => request<ReservationLogEntry[]>('/reservations', { token }),
};
