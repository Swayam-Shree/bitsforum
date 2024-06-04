import 'dotenv/config';
import express, { Express, Request, Response } from "express";
import cors from "cors";
import { ObjectId } from 'mongodb';
import type { PullOperator } from 'mongodb';
import { db } from "./db/connection.js";

const app: Express = express();
const port = process.env.port || 6969;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

async function validateAdminRequest(groupId: string, requester: string, res: Response) {
	const group = await db.collection("groups").findOne({
		_id: new ObjectId(String(groupId))
	});

	console.log(group?.admins, requester);
	if (!group?.admins.includes(requester)) {
		res.status(403).send("Action incomplete. You had been removed from the group.");
		return false;
	}

	return true;
}

// after each user logs in
app.post("/loggedin", async (req: Request, res: Response) => {
	const { uid, email } = req.body;

	const result = await db.collection("users").updateOne({
		uid: uid
	}, {
		$set: {
			uid: uid,
			email: email
		}
	}, {
		upsert: true
	});
	
	res.send(result).status(200);
});

app.post("/createGroup", async (req: Request, res: Response) => {
	const { uid, groupName, groupDesc } = req.body;

	const result = await db.collection("groups").insertOne({
		admins: [uid],
		allMembers: [uid],
		groupName: groupName,
		groupDesc: groupDesc
	});

	res.send(result).status(200);
});
app.delete("/deleteGroup/:groupId", async (req: Request, res: Response) => {
	const { groupId } = req.params;

	const result = await db.collection("groups").deleteOne({
		_id: new ObjectId(groupId)
	});

	res.send(result).status(200);
});

// list of groups joined and not joined by a user
app.get("/joinedGroups/:uid", async (req: Request, res: Response) => {
	const { uid } = req.params;

	const result = await db.collection("groups").find({
		allMembers: {
			$in: [uid]
		}
	}).toArray();

	res.send(result).status(200);
});
app.get("/unjoinedGroups/:uid", async (req: Request, res: Response) => {
	const { uid } = req.params;

	const result = await db.collection("groups").find({
		allMembers: {
			$nin: [uid]
		}
	}).toArray();

	res.send(result).status(200);
});

app.get("/joinGroup/:groupId-:uid", async (req: Request, res: Response) => {
	const { groupId, uid } = req.params;

	const result = await db.collection("groups").updateOne({
		_id: new ObjectId(groupId)
	}, {
		$push: {
			allMembers: uid
		} as PullOperator<Document>
	});

	res.send(result).status(200);
});
app.delete("/leaveGroup/:groupId-:uid", async (req: Request, res: Response) => {
	const { groupId, uid } = req.params;

	const result = await db.collection("groups").updateOne({
		_id: new ObjectId(groupId)
	}, {
		$pull: {
			allMembers: uid,
			admins: uid
		} as PullOperator<Document>
	});

	res.send(result).status(200);
});

app.post("/makeAdmin/:groupId-:uid-:requester", async (req: Request, res: Response) => {
	const { groupId, uid, requester } = req.params;

	if (!await validateAdminRequest(groupId, requester, res)) return;

	const result = await db.collection("groups").updateOne({
		_id: new ObjectId(groupId)
	}, {
		$push: {
			admins: uid
		} as PullOperator<Document>
	});

	res.send(result).status(200);
});

app.post("/addUser", async (req: Request, res: Response) => {
	const { groupId, requester, email } = req.body;

	if (!await validateAdminRequest(groupId, requester, res)) return;

	const user = await db.collection("users").findOne({
		email: email
	});

	if (!user) {
		res.status(404).send("user doesn't exist");
		return;
	}

	const group = await db.collection("groups").findOne({
		_id: new ObjectId(String(groupId))
	});

	if (group?.allMembers.includes(user.uid)) {
		res.status(400).send("User already in group");
		return;
	}

	const result = await db.collection("groups").updateOne({
		_id: new ObjectId(String(groupId))
	}, {
		$push: {
			allMembers: user.uid
		}
	});

	res.status(200).send(user.uid);
});
app.delete("/removeUser/:groupId-:uid-:requester", async (req: Request, res: Response) => {
	const { groupId, uid, requester } = req.params;

	if (!await validateAdminRequest(groupId, requester, res)) return;

	const result = await db.collection("groups").updateOne({
		_id: new ObjectId(String(groupId))
	}, {
		$pull: {
			allMembers: uid,
			admins: uid
		} as PullOperator<Document>
	});

	res.status(200).send(result);
});

app.get("/getGroup/:groupId", async (req: Request, res: Response) => {
	const { groupId } = req.params;

	const result = await db.collection("groups").findOne({
		_id: new ObjectId(groupId)
	});

	res.send(result).status(200);
});

app.get("/getEmail/:uid", async (req: Request, res: Response) => {
	const { uid } = req.params;

	const result = await db.collection("users").findOne({
		uid: uid
	});

	res.status(200).send(result?.email);
});

app.post("/createPost", async (req: Request, res: Response) => {
	const { groupId, uid, name, title, content, files } = req.body;

	if (!await validateAdminRequest(groupId, uid, res)) return;

	const result = await db.collection("posts").insertOne({
		groupId: groupId,
		uid: uid,
		name: name,
		title: title,
		content: content,
		files: files
	});

	res.status(200).send(result);
});
app.get("/getPosts/:groupId", async (req: Request, res: Response) => {
	const { groupId } = req.params;

	const result = await db.collection("posts").find({
		groupId: groupId
	}).toArray();

	res.status(200).send(result);
});
app.delete("/deletePost/:groupId-:uid-:postId", async (req: Request, res: Response) => {
	const { groupId, uid, postId } = req.params;

	if (!await validateAdminRequest(groupId, uid, res)) return;

	const result = await db.collection("posts").deleteOne({
		_id: new ObjectId(postId)
	});

	res.status(200).send(result);
});

app.listen(port, () => {
	console.log(`app listening on port ${port}`);
});