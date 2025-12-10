export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    aud?: string; // audience claim
    iss?: string; // issuer claim
    exp?: number; // expiration time
    iat?: number; // issued at time
}
