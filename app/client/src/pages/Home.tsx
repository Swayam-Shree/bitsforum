import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

import { useNavigate } from 'react-router-dom';

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export default function Home() {
	const [user, loading, error] = useAuthState(auth);
	const navigate = useNavigate();

	if (loading) return <div>Loading...</div>;
	if (error) return <div>Error</div>;
	if (user) {console.log("logged in")};
	
	return (<div className="flex flex-col items-center mt-[100px] gap-[40px]">
		<Typography variant="h6">Welcome to BITS forum</Typography>
		<Button onClick={() => { navigate('/groups'); }} variant="contained">Browse Groups</Button>
	</div>);
}