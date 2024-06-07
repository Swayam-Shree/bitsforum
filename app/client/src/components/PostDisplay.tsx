import { auth, storage } from "../firebase";
import { ref, deleteObject } from "firebase/storage";

import type { Post } from "../types";

import { useNavigate } from "react-router-dom";
import { useState } from "react";

import CommentForm from "./CommentForm";

import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Modal from "@mui/material/Modal";
import Button from "@mui/material/Button";

import DeleteIcon from "@mui/icons-material/Delete";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function PostDisplay({ post, deletePost, groupId, amAdmin }: {
	post: Post,
	deletePost: (id: string) => void,
	groupId: string,
	amAdmin: boolean
}) {
	const navigate = useNavigate();
	const [deleting, setDeleting] = useState(false);

	const [commentModal, setCommentModal] = useState(false);
	const [commentSettingsOpen, setCommentSettingsOpen] = useState(false);
	const commentAccessMap = ["Allow All", "Allow Admins", "Don't Allow"];
	const [commentAccess, setCommentAccess] = useState(post.commentAccess);

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
		const result = await fetch(`http://localhost:6969/getCommentAccess/${post._id}`);

		setCommentAccess(parseInt(await result.text()));
		setCommentModal(true);
	}
	async function handleChangeCommentAccess(val: number) {
		setCommentSettingsOpen(false);
		setCommentAccess(val);
		
		const result = await fetch(`http://localhost:6969/updateCommentAccess/${groupId}-${auth.currentUser?.uid}-${post._id}-${val}`, {
			method: "PATCH"
		});

		if (result.status === 403) {
			navigate("/profile");
			alert(await result.text());
			return;
		}
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
			<Markdown remarkPlugins={[remarkGfm]}>
				{ post.content }
			</Markdown>
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

			{
				amAdmin ? (
					<div className="grid grid-cols-[2fr_1fr] gap-[12px]">
						<Button onClick={openComments} sx={{mt: 4}} variant="contained" color="success">Comments</Button>
						<Button
							onClick={() => setCommentSettingsOpen(true)}
							sx={{mt: 4}}
							size="small"
							variant="contained"
						>{commentAccessMap[commentAccess]}</Button>
						<Modal open={commentSettingsOpen} onClose={() => setCommentSettingsOpen(false)}>
							<div className="flex flex-col bg-white mt-[35vh] gap-[12px] p-[32px] m-[32px]">
								<Button
									onClick={() => {handleChangeCommentAccess(0)}}
									variant={commentAccess === 0 ? "contained" : "outlined"}
								>
									Allow All
								</Button>
								<Button
									onClick={() => {handleChangeCommentAccess(1);}}
									variant={commentAccess === 1 ? "contained" : "outlined"}
								>
									Allow Admins
								</Button>
								<Button
									onClick={() => {handleChangeCommentAccess(2);}}
									variant={commentAccess === 2 ? "contained" : "outlined"}
								>
									Don't Allow
								</Button>
							</div>
						</Modal>
					</div>
				) : (
					<Button onClick={openComments} sx={{mt: 4}} variant="contained" color="success">Comments</Button>
				)
			}

			<Modal sx={{overflow: "scroll"}} open={commentModal} onClose={() => setCommentModal(false)}>
				<>
					<CommentForm amAdmin={amAdmin} access={commentAccess} postId={post._id} groupId={groupId} handleClose={() => {setCommentModal(false)}} />
				</>
			</Modal>
		</div>
	);
}