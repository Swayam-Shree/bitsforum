import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
	apiKey: "AIzaSyDNc25A5yk-V5cTuN0vl7PwpKem900Qs3A",
	authDomain: "bitsforum-71157.firebaseapp.com",
	projectId: "bitsforum-71157",
	storageBucket: "bitsforum-71157.appspot.com",
	messagingSenderId: "903705939224",
	appId: "1:903705939224:web:1e88e53d70cd8db17c226d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);