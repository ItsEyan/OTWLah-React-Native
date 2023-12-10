import { FIREBASE_API_KEY } from '@env';

export const baseAPIUrl = 'http://149.28.133.78:3000';
export const firebaseURL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
