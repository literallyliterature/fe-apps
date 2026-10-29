import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyA36mdqdp516Hl9R7UuH-KdekQJFvU1Dmo',
  appId: '1:1015661746591:web:75639146efe368097f85aa',
  authDomain: 'literally-literature-fe-apps.firebaseapp.com',
  messagingSenderId: '1015661746591',
  projectId: 'literally-literature-fe-apps',
  storageBucket: 'literally-literature-fe-apps.firebasestorage.app',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
