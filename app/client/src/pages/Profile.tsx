import { auth } from '../firebase';

import { useAuthState } from 'react-firebase-hooks/auth';

import { useState, useEffect } from 'react';

import type { Group } from '../types';

import GroupCard from '../components/GroupCard';

import Typography from '@mui/material/Typography';

export default function Profile() {
	const [user, loading, error] = useAuthState(auth);
	const [adminGroups, setAdminGroups] = useState<Group[]>([]);
	const [memberGroups, setMemberGroups] = useState<Group[]>([]);

	useEffect(() => {
		async function fetchGroups() {
			const result = await fetch(import.meta.env.VITE_SERVER_ORIGIN + `/joinedGroups/${user?.uid}`);

			const groups = JSON.parse(await result.text());
			setAdminGroups(groups.filter((group: Group) => group.admins.includes(user?.uid || "")));
			setMemberGroups(groups.filter((group: Group) => !group.admins.includes(user?.uid || "")));
		}

		fetchGroups();
	}, [user]);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>Error</div>;

	if (user) {
		return (<div className="flex flex-col mt-[40px] gap-[20px] items-center">
			<img src={user.photoURL || ""} />
			<Typography variant="h6">{user.displayName}</Typography>

			<Typography sx={{mt: 4}} variant="h3">Joined Groups</Typography>

			<Typography variant="h4">---As Admin---</Typography>
			{
				adminGroups.length > 0 ? (
					<div className="flex flex-col gap-[20px] mb-[60px]">
						{
							adminGroups.map((group: Group) => {
								return <GroupCard data={ group } key={ group._id } />;
							})
						}
					</div>
				): (
					<Typography sx={{mb: 4}} variant="body1">You are not an admin of any group.</Typography>
				)
			}

			<Typography variant="h4">---As Member---</Typography>
			{
				memberGroups.length > 0 ? (
					<div className="flex flex-col gap-[20px] mb-[60px]">
						{
							memberGroups.map((group: Group) => {
								return <GroupCard data={ group } key={ group._id } />;
							})
						}
					</div>
				): (
					<Typography sx={{mb: 4}} variant="body1">You are not a member of any group.</Typography>
				)
			}
		</div>);
	}

	return (<div className="text-center">
		<p className="py-[100px]">Login to view your profile and joined groups.</p>
	</div>);
}