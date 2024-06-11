import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

import { useNavigate } from 'react-router-dom';

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export default function Home() {
	const [_, loading, error] = useAuthState(auth);
	const navigate = useNavigate();

	if (loading) return <div>Loading...</div>;
	if (error) return <div>Error</div>;
	
	return (<div className="flex flex-col items-center mt-[100px] gap-[40px]">
		<Typography variant="h5">Welcome to BITSForum</Typography>
		<Button onClick={() => { navigate('/groups'); }} variant="contained">Browse Groups</Button>
	</div>);
}