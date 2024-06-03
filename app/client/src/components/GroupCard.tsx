import { auth } from "../firebase";
import type { Group } from "../types";

import { useNavigate } from "react-router-dom";

import { useState } from "react";

import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";

export default function JoinGroupCard({ data }: { data: Group }) {
	const navigate = useNavigate();
	const [lastAdminWarning, setLastAdminWarning] = useState(false);

	async function handleView() {
		navigate(`/group/${data._id}`);
	}

	async function handleLeave() {
		if (data.admins[0] === auth.currentUser?.uid && data.admins.length === 1 && !lastAdminWarning) {
			setLastAdminWarning(true);
			return;
		}

		fetch(`http://localhost:6969/leaveGroup/${data._id}-${auth.currentUser?.uid}`, {
			method: "DELETE"
		});

		navigate("/groups");
	}
	async function handleDelete() {
		setLastAdminWarning(false);

		fetch(`http://localhost:6969/deleteGroup/${data._id}`, {
			method: "DELETE"
		});

		navigate("/groups");
	}

	return (<div className="flex flex-col gap-[8px] border-[1px] p-[32px] rounded border-violet-800 min-w-[300px]">
		<Typography variant="h6">{ data.groupName }</Typography>
		<Typography variant="body1">{ data.groupDesc }</Typography>
		
		<div className="grid grid-cols-[3fr_0.5fr] gap-[12px]">
			<Button onClick={ handleView } variant="outlined">Open</Button>
			<Button onClick={ handleLeave } color="error" variant="contained">Leave</Button>
		</div>

		{
			lastAdminWarning && <Modal
				open={ lastAdminWarning }
				onClose={ () => setLastAdminWarning(false) }
			>
				<div className="flex flex-col gap-[12px] p-[32px] bg-white rounded">
					<Typography variant="h6">Warning</Typography>
					<Typography variant="body1">
						You are the last admin in this group. Leaving will disband and delete the group.
					</Typography>

					<div className="grid grid-cols-[3fr_0.5fr] gap-[12px]">
						<Button onClick={ () => setLastAdminWarning(false) } variant="outlined">Cancel</Button>
						<Button onClick={ handleDelete } color="error" variant="contained">Delete</Button>
					</div>
				</div>
			</Modal>
		}

		<Typography variant="caption">Members: { data.allMembers.length }</Typography>
		
	</div>);
}