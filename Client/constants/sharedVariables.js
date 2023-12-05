import { FIREBASE_API_KEY } from '@env';

export const baseAPIUrl = 'http://192.168.18.9:5000/otwlah/asia-southeast1/app';
export const firebaseURL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
