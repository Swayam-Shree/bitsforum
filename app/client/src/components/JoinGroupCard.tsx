import { auth } from "../firebase";

import { useNavigate } from "react-router-dom";

import type { Group } from "../types";

import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export default function JoinGroupCard({ data }: { data: Group }) {
	const navigate = useNavigate();

	async function handleJoin() {
		await fetch(import.meta.env.VITE_SERVER_ORIGIN + `/joinGroup/${ data._id }-${ auth.currentUser?.uid }`);

		navigate("/profile");
	}

	return (<div className="flex flex-col gap-[8px] border-[1px] p-[32px] rounded border-violet-800 min-w-[300px]">
		<Typography variant="h6">{ data.groupName }</Typography>
		<Typography variant="body1">{ data.groupDesc }</Typography>

		{
			auth.currentUser ? (
				<Button onClick={ handleJoin } variant="contained">Join</Button>
			): (
				<Typography className="text-red-700" variant="caption">
					Please login to join groups
				</Typography>
			)
		}

		<Typography variant="caption">Members: { data.allMembers.length }</Typography>
	</div>);
}