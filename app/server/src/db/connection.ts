import { MongoClient, ServerApiVersion } from "mongodb";
import { Db, ObjectId } from "mongodb";

import { createClient } from "redis";
import { Schema, Repository } from "redis-om"

const mongoClient = new MongoClient(process.env.MONGO_URI || "", {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	}
});

const redisClient = createClient({
    password: process.env.REDIS_CLIENT_PASSWORD,
    socket: {
        host: "redis-15870.c264.ap-south-1-1.ec2.redns.redis-cloud.com",
        port: 15870,
		connectTimeout: 60000
    }
});
redisClient.on("error", error => {
	console.error("redis client error: ", error);
});
const postSchema = new Schema("post", {
	_id: { type: "string" },
	groupId: { type: "string" },
	uid: { type: "string" },
	name: { type: "text" },
	title: { type: "text" },
	content: { type: "text" },
	commentAccess: { type: "number"},

	fileNames: { type: "string[]", path: "$.files[*].name" },
	fileUrls: { type: "string[]", path: "$.files[*].url" }
});

export let db: Db;
export let groupRepo: Repository;
export let postRepo: Repository;

(async function run() {
	await Promise.all([
		mongoClient.connect(),
		redisClient.connect(),
		mongoClient.db("admin").command({ ping: 1 }),
		redisClient.ping()
	]);
	console.log("connected to mongo and redis");

	db = mongoClient.db("main");

	postRepo = new Repository(postSchema, redisClient);
	await updateRedis();
	setInterval(async () => await updateRedis(), 1000 * 3600); // reset redis cache every hour
})();

//caching latest 10 posts of top 10 groups with largest number of members
async function updateRedis() {
	await redisClient.flushAll();

	await postRepo.createIndex();

	let groups = await db.collection("groups").find().toArray();
	groups = groups.sort((a, b) => {
		return a.allMembers.length > b.allMembers.length ? -1 : 1;
	}).slice(0, 10);

	for (let group of groups) {
		const posts = await db.collection("posts").find({
			groupId: String(group._id)
		}).sort({ _id: -1 }).toArray();
		const newPosts = posts.slice(0, 3);
		const finalPosts = newPosts.map((post) => {
			return {
				_id: String(post._id),
				groupId: String(post.groupId),
				uid: String(post.uid),
				name: String(post.name),
				title: String(post.title),
				content: String(post.content),
				files: post.files,
				commentAccess: post.commentAccess
			}
		});

		for (let post of finalPosts) {
			await postRepo.save(post._id, post);
		}
	}

	console.log("redis cache updated");
}