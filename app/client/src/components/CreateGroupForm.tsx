import { auth } from "../firebase";

import { useState } from "react";

import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

export default function CreateGroupForm(){
	const [groupName, setGroupName] = useState("");
	const [groupDesc, setGroupDesc] = useState("");

	const [groupNameError, setGroupNameError] = useState(false);
	const [groupDescError, setGroupDescError] = useState(false);

	async function handleSubmit() {
		setGroupNameError(!groupName);
		setGroupDescError(!groupDesc);

		if (!groupName || !groupDesc) return;
		
		await fetch(import.meta.env.VITE_SERVER_ORIGIN + "/createGroup", {
			method: "POST",
			body: JSON.stringify({
				uid: auth.currentUser?.uid,
				groupName: groupName,
				groupDesc: groupDesc
			}),
			headers: {
				"Content-Type": "application/json"
			}
		});
		
		setGroupName("");
		setGroupDesc("");
	}

	return (<div className="bg-white flex flex-col items-center gap-[16px] my-[30vh] mx-[5vw] p-[16px] rounded min-w-[300px]">
		<TextField
			label="Group Name"
			variant="outlined"
			value={groupName}
			onChange={(e) => {setGroupName(e.target.value); }}
			size="small"
			error={groupNameError}
			inputProps={{ maxLength: 24 }}
		/>
		<TextField
			label="Group Description"
			variant="outlined"
			value={groupDesc}
			onChange={(e) => {setGroupDesc(e.target.value); }}
			fullWidth
			multiline
			size="small"
			error={groupDescError}
			rows={4}
			inputProps={{ maxLength: 256 }}
		/>
		<Button onClick={handleSubmit} variant="contained">Create Group</Button>
	</div>);
}