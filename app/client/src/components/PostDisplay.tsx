import { auth, storage } from "../firebase";
import { ref, deleteObject } from "firebase/storage";

import type { Post } from "../types";

import { useNavigate } from "react-router-dom";
import { useState } from "react";

import Typography from "@mui/material/Typography";
import IconButton from '@mui/material/IconButton';
import CircularProgress from "@mui/material/CircularProgress";
import Modal from "@mui/material/Modal";
import Button from "@mui/material/Button";

import DeleteIcon from '@mui/icons-material/Delete';

export default function PostDisplay({ post, deletePost, groupId, amAdmin }: {
	post: Post,
	deletePost: (id: string) => void,
	groupId: string,
	amAdmin: boolean
}) {
	const navigate = useNavigate();
	const [deleting, setDeleting] = useState(false);

	const [commentModal, setCommentModal] = useState(false);

	async function handleDelete() {
		setDeleting(true);

		for (let i = 0; i < post.files.length; ++i) {
			const fileRef = ref(storage, post.files[i].url);
			await deleteObject(fileRef);
		}
		
		const result = await fetch(`http://localhost:6969/deletePost/${groupId}-${auth.currentUser?.uid}-${post._id}`, {
			method: "DELETE"
		});

		setDeleting(false);
		if (result.status === 403) {
			navigate("/profile");
			alert(await result.text());
			return;
		} else if (result.status === 200) {
			deletePost(post._id);
		}
	}

	async function openComments() {
		setCommentModal(true);
	}

	return (
		<div className="flex flex-col border-solid border-[1px] border-violet-800 rounded p-[32px] min-w-[300px]">
			<div className="flex justify-between">
				<Typography sx={{mb: 2}} variant="caption">{ "By: " + post.name }</Typography>
				{
					amAdmin && ( deleting ? (
						<CircularProgress />
					) : (
						<IconButton onClick={ handleDelete } color="error">
							<DeleteIcon />
						</IconButton>
					))
				}
			</div>
			<Typography variant="h4">{ post.title }</Typography>
			<Typography variant="body1">{ post.content }</Typography>
			{
				post.files.length !== 0 && <Typography variant="h6">Attachments:</Typography>
			}
			{
				post.files.map((file) => {
					return (<div key={file.name}>
						<a className="text-blue-700" href={file.url} target="_blank">{ file.name }</a>
					</div>)
				})
			}
			<Button onClick={openComments} sx={{mt: 4}} variant="outlined" color="success">Comments</Button>
			<Modal open={commentModal} onClose={() => setCommentModal(false)}>
				<div>
					
				</div>
			</Modal>
		</div>
	);
}