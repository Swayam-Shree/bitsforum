import { auth } from '../firebase';
import { signOut } from "firebase/auth";
import { useAuthState } from 'react-firebase-hooks/auth';

import { NavLink } from 'react-router-dom';

import GoogleLoginButton from './GoogleLoginButton';

import { useState, useEffect } from 'react';

import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';

import { socket } from '../main';

export default function Navbar() {
	const [user, loading, error] = useAuthState(auth);

	const [notifOpen, setNotifOpen] = useState(false);
	const [notifText, setNotifText] = useState("");

	useEffect(() => {
		console.log("app init");

		socket.on("notification", (text) => {
			setNotifText(text);
			setNotifOpen(true);
		});

		if (user && user?.email?.endsWith("bits-pilani.ac.in")) {
			socket.emit("addUser", user.uid);
		}
	}, [user]);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>Error</div>;

	return (<div className="flex justify-around m-[8px] gap-[16px]">
		<NavLink 
			className={({isActive}) => { return `px-[16px] text-blue-700 text-center hover:bg-slate-200 ${isActive ? "border-b border-blue-700" : ""}`}}
			to="/">
				Home
		</NavLink>
		<NavLink 
			className={({isActive}) => { return `px-[16px] text-blue-700 text-center hover:bg-slate-200 ${isActive ? "border-b border-blue-700" : ""}`}}
			to="/groups">
				Browse Groups
		</NavLink>
		<NavLink
			className={({isActive}) => { return `px-[16px] text-blue-700 text-center hover:bg-slate-200 ${isActive ? "border-b border-blue-700" : ""}`}}
			to="/profile">
				Profile
		</NavLink>
		{
			user ?
				<Button onClick={async () => { await signOut(auth); }} variant="contained">Logout</Button>
			:
				<GoogleLoginButton />
		}
		<Snackbar 
			open={notifOpen}
			autoHideDuration={4000}
			message={notifText}
			onClose={ () => setNotifOpen(false) }
		/>
	</div>);
}