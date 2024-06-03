import { auth } from "../firebase";

import { useNavigate } from "react-router-dom";

import { useState, useEffect } from "react";

import type { Group } from "../types";

import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default function ManageUserTile({ uid, isAdmin, groupId, amAdmin, updateGroup, group }: {
		uid: string,
		isAdmin: boolean,
		groupId: string,
		amAdmin: boolean,
		updateGroup: (group: Group) => void,
		group: Group
	}) {
	const [email, setEmail] = useState("");
	const navigate = useNavigate();

	useEffect(() => {
		async function fetchData() {
			const result = await fetch(`http://localhost:6969/getEmail/${uid}`);
			setEmail(await result.text());
		}
		fetchData();
	}, []);

	async function handleAdmin() {
		const result = await fetch(`http://localhost:6969/makeAdmin/${groupId}-${uid}-${auth.currentUser?.uid}`, {
			method: "POST"
		});

		if (result.status === 403) {
			navigate("/profile");
			alert(await result.text());
			return;
		} else if (result.status === 200) {
			group.admins.push(uid);
			updateGroup(group);
		}
	}
	async function handleRemove() {
		const result = await fetch(`http://localhost:6969/removeUser/${groupId}-${uid}-${auth.currentUser?.uid}`, {
			method: "DELETE"
		});

		if (result.status === 403) {
			navigate("/profile");
			alert(await result.text());
			return;
		} else if (result.status === 200) {
			group.allMembers = group.allMembers.filter((member) => member !== uid);
			group.admins = group.admins.filter((admin) => admin !== uid);
			updateGroup(group);
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