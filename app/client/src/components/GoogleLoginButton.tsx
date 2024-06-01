import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

import { useNavigate } from 'react-router-dom';

import Button from '@mui/material/Button';

const provider = new GoogleAuthProvider();

export default function GoogleLoginButton() {
	const navigate = useNavigate();

	async function handleLogin() {
		await signInWithPopup(auth, provider);
		await fetch(`http://localhost:6969/loggedin/${auth.currentUser?.uid}`, {
			method: "POST"
		});
		navigate("/");
	}

	return (<div>
		<Button onClick={ handleLogin } variant="contained">Google Login</Button>
	</div>);
}