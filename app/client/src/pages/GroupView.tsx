import { useParams } from "react-router-dom";

import { useState, useEffect } from "react";

import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

export default function GroupView() {
	const { id } = useParams();

	const [manageUserModal, setManageUserModal] = useState(false);

	const emailDefault = "f20XXXXXX@campus.bits-pilani.ac.in";
	const [userEmail, setUserEmail] = useState(emailDefault);
	const [userEmailError, setUserEmailError] = useState(false);
	const [userEmailErrorText, setUserEmailErrorText] = useState("");

	// useEffect(() => {
	// 	async function fetchGroup() {
	// 		const result = await fetch(`http://localhost:6969/group/${id}`);
	// 		const group = JSON.parse(await result.text());
	// 		console.log(group);
	// 	}

	// 	fetchGroup();
	// }, []);

	async function handleAddUser() {
		const result = await fetch(`http://localhost:6969/addUser`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				groupId: id,
				email: userEmail
			})
		});

		if (result.status === 404) {
			setUserEmailError(true);
			setUserEmailErrorText("User not found");
		} else if (result.status === 400) {
			setUserEmailError(true);
			setUserEmailErrorText("User is already in current group");
			console.log("user already in group")
		} else if (result.status === 200) {
			setUserEmailError(false);
			setUserEmail(emailDefault);
			setUserEmailErrorText("");
		}
	}

	return (<div>
		<div className="flex flex-col items-center gap-[40px] m-[40px]">
			<Button onClick={ () => {setManageUserModal(true); setUserEmail(emailDefault); setUserEmailError(false); setUserEmailErrorText("");} } variant="outlined">Manage Users</Button>

			<Modal
				open={manageUserModal}
				onClose={ () => setManageUserModal(false) }
			>	
				<div className="flex flex-col bg-white m-[32px] p-[32px] min-w-[300px] gap-[12px]">
					<Typography variant="h5">Add Members</Typography>
					<TextField
						value={userEmail}
						onChange={ (e) => setUserEmail(e.target.value) }
						error={userEmailError}
						label="Enter full user email"
						variant="outlined"
						helperText={userEmailErrorText}
					/>
					<Button onClick={ handleAddUser } size="small" variant="contained">Add User</Button>

					<Typography sx={{mt: 4}} variant="h5">Members:</Typography>
				</div>
			</Modal>
		</div>
	</div>);
}