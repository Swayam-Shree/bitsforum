import { auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

import { useState, useEffect } from 'react';

import type { Group } from '../types';

import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';

import CreateGroupForm from '../components/CreateGroupForm';
import JoinGroupCard from '../components/JoinGroupCard';

export default function Groups() {
	const [user, loading, error] = useAuthState(auth);

	const [openCreateGroupModal, setOpenCreateGroupModal] = useState(false);
	const [unjoinedGroups, setUnjoinedGroups] = useState([]);

	useEffect(() => {
		async function fetchGroups() {
			let result = await fetch( `http://localhost:6969/unjoinedGroups/${user?.uid || ""}`);

			setUnjoinedGroups(JSON.parse(await result.text()));
		}

		fetchGroups();
	}, []);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>Error</div>;

	return (<div className="flex flex-col items-center mt-[20px]">
		{
			auth.currentUser ? (<>
				<Button
					onClick={() => { setOpenCreateGroupModal(true); }}
					variant="contained"
					color="success"
					sx={{my: 2}}
				>
					Create New Group
				</Button>
				<Modal
					open={ openCreateGroupModal }
					onClose={() => { setOpenCreateGroupModal(false); }}
				>
					<>
						<CreateGroupForm />
					</>
				</Modal>
			</>): (
				""
			)
		}
		
		{
			unjoinedGroups.length > 0 ? (
				<div className="flex flex-col gap-[20px] my-[20px]">
					{
						unjoinedGroups.map((group: Group) => {
							return <JoinGroupCard data={ group } key={ group._id } />;
						})
					}
				</div>
			): (
				<Typography variant="h6">No groups to join. Wait or create new.</Typography>
			)
		}
	</div>);
}