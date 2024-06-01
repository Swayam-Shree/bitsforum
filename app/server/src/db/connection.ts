import { MongoClient, ServerApiVersion } from "mongodb";
import type { Db } from "mongodb";

const uri = process.env.MONGO_URI || "";

const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	}
});

export let db: Db;

async function run() {
	await client.connect();
	console.log("connected to mongo");

	db = client.db("main");
}
run();