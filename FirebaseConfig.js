// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: 'AIzaSyDqGoCKE8l167SACewh1tmNhInk_etwZOg',
	authDomain: 'otwlah.firebaseapp.com',
	databaseURL:
		'https://otwlah-default-rtdb.asia-southeast1.firebasedatabase.app',
	projectId: 'otwlah',
	storageBucket: 'otwlah.appspot.com',
	messagingSenderId: '744933972509',
	appId: '1:744933972509:web:6ea4ec8f3088842183c4f4',
	measurementId: 'G-DNC2MSD49E',
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_DB = getFirestore(FIREBASE_APP);
