import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

import Button from '@mui/material/Button';

const provider = new GoogleAuthProvider();

export default function GoogleLoginButton() {
	async function handleLogin() {
		await signInWithPopup(auth, provider);

		if (auth.currentUser?.email?.endsWith("bits-pilani.ac.in")) {
			await fetch(import.meta.env.VITE_SERVER_ORIGIN + `/loggedin`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					uid: auth.currentUser?.uid,
					email: auth.currentUser?.email,
				})
			});
		}
	}

	return (<div>
		<Button onClick={ handleLogin } variant="contained">Google Login</Button>
	</div>);
}