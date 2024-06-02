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

app.get('/', (req: Request, res: Response) => {
	res.send("Hello World!");
});

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

app.post("/addUser", async (req: Request, res: Response) => {
	const { groupId, email } = req.body;

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

	res.status(200).send(result);
});

app.listen(port, () => {
	console.log(`app listening on port ${port}`);
});