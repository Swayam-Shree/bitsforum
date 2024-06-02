import { auth } from "../firebase";

import { useState, useEffect } from "react";

import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default function ManageUserTile({ uid, isAdmin, groupId, amAdmin, updateGroup, allMembers, admins }: {
		uid: string,
		isAdmin: boolean,
		groupId: string,
		amAdmin: boolean,
		updateGroup: (allMems: string[], adms: string[]) => void,
		allMembers: string[],
		admins: string[]
	}) {
	const [email, setEmail] = useState("");

	useEffect(() => {
		async function fetchData() {
			const result = await fetch(`http://localhost:6969/getEmail/${uid}`);
			setEmail(await result.text());
		}
		fetchData();
	}, []);

	async function handleAdmin() {
		const result = await fetch(`http://localhost:6969/makeAdmin/${groupId}-${uid}`, {
			method: "POST"
		});

		if (result.status === 200) {
			admins = admins.concat(uid);
			updateGroup(allMembers, admins);
		}
	}
	async function handleRemove() {
		const result = await fetch(`http://localhost:6969/leaveGroup/${groupId}-${uid}`, {
			method: "DELETE"
		});

		if (result.status === 200) {
			allMembers = allMembers.filter((member) => member !== uid);
			admins = admins.filter((admin) => admin !== uid);
			updateGroup(allMembers, admins);
		}
	}

	return (<div className="border-t-[1px] border-violet-800 py-[4px] text-center">
		<div className="flex justify-around">
			<Typography variant="body1">{email.slice(0, -18)}</Typography>
			{
				isAdmin && <Typography className="text-green-600" variant="caption">Admin</Typography>
			}
		</div>

		{
			amAdmin && auth.currentUser?.uid !== uid && <div className="flex justify-around">
				{
					!isAdmin &&
					<Button onClick={ handleAdmin } size="small" variant="outlined" color="primary">Make Admin</Button>
				}
				<Button onClick={ handleRemove } size="small" variant="outlined" color="error">Remove</Button>
				
			</div>
		}
	</div>);
}