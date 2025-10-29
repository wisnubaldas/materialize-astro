import jwt from 'jsonwebtoken';
import { JWT_ALGORITHM, JWT_SECRET } from './server-config';

export interface AuthTokenPayload extends jwt.JwtPayload {
  username: string;
}

export type VerifyTokenResult = {
  payload: AuthTokenPayload;
};

const ensureSecret = () => {
  if (!JWT_SECRET) {
    throw new Error('AUTH_JWT_SECRET env variable is not set.');
  }
};

export const verifyAccessTokenLocally = (token: string): VerifyTokenResult => {
  ensureSecret();

  const decoded = jwt.verify(token, JWT_SECRET, {
    algorithms: [JWT_ALGORITHM],
  });

  const basePayload =
    typeof decoded === 'string'
      ? ({ sub: decoded } as jwt.JwtPayload)
      : (decoded as jwt.JwtPayload);

  const username =
    typeof basePayload.sub === 'string'
      ? basePayload.sub
      : typeof (basePayload as Record<string, unknown>).username === 'string'
        ? ((basePayload as Record<string, string>).username as string)
        : null;

  if (!username) {
    throw new Error('Token payload missing username');
  }

  const payload: AuthTokenPayload = {
    ...(basePayload as jwt.JwtPayload),
    username,
  };

  return {
    payload,
  };
};
