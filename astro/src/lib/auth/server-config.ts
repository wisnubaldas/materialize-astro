const JWT_SECRET = (import.meta.env.AUTH_JWT_SECRET ?? '').trim();
const JWT_ALGORITHM = (import.meta.env.AUTH_JWT_ALGORITHM ?? 'HS256').trim() || 'HS256';

export { JWT_SECRET, JWT_ALGORITHM };
