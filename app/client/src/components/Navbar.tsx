import { auth } from '../firebase';
import { signOut } from "firebase/auth";
import { useAuthState } from 'react-firebase-hooks/auth';

import { NavLink, useNavigate } from 'react-router-dom';

import GoogleLoginButton from './GoogleLoginButton';

import Button from '@mui/material/Button';

export default function Navbar() {
	const [user, loading, error] = useAuthState(auth);
	const navigate = useNavigate();

	if (loading) return <div>Loading...</div>;
	if (error) return <div>Error</div>;

	return (<div className="flex justify-around m-[8px] gap-[16px]">
		<NavLink 
			className={({isActive}) => { return `px-[16px] text-blue-700 text-center ${isActive ? "border-b border-blue-700" : ""}`}}
			to="/">
				Home
		</NavLink>
		<NavLink 
			className={({isActive}) => { return `px-[16px] text-blue-700 text-center ${isActive ? "border-b border-blue-700" : ""}`}}
			to="/groups">
				Browse Groups
		</NavLink>
		<NavLink
			className={({isActive}) => { return `px-[16px] text-blue-700 text-center ${isActive ? "border-b border-blue-700" : ""}`}}
			to="/profile">
				Profile
		</NavLink>
		{
			user ?
				<Button onClick={() => { signOut(auth); navigate("/"); }} variant="contained">Logout</Button>
			:
				<GoogleLoginButton />
		}
	</div>);
}