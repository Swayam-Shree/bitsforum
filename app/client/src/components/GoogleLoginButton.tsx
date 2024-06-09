import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

import { useNavigate } from 'react-router-dom';

import Button from '@mui/material/Button';

const provider = new GoogleAuthProvider();

export default function GoogleLoginButton() {
	async function handleLogin() {
		await signInWithPopup(auth, provider);
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

	return (<div>
		<Button onClick={ handleLogin } variant="contained">Google Login</Button>
	</div>);
}