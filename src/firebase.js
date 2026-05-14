import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  projectId: 'bookclub-app-7f897',
  appId: '1:1087634152747:web:b551df156b29c3a965796e',
  storageBucket: 'bookclub-app-7f897.firebasestorage.app',
  apiKey: 'AIzaSyD7WAvwtIrjOjprkfPNS3yeGeK-k-ydN3E',
  authDomain: 'bookclub-app-7f897.firebaseapp.com',
  messagingSenderId: '1087634152747',
}

const app = initializeApp(firebaseConfig)
export const storage = getStorage(app)
