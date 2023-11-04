import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import OpenAI from "openai";
import { PGResource } from "../types";

loadEnvConfig("");

const generateEmbeddings = async (resources: PGResource[]) => {
	console.log("process.env :>> ", process.env.OPEN_API_KEY);
	const openai = new OpenAI({ apiKey: process.env.OPEN_API_KEY });

	const supabase = createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!
	);

	for (let i = 0; i < resources.length; i++) {
		const resource = resources[i];

		const {
			resource_title,
			resource_type,
			resource_upload_date,
			content,
			content_length,
			content_tokens,
		} = resource;

		const embeddingResponse = await openai.embeddings.create({
			model: "text-embedding-ada-002",
			input: content,
		});

		const [{ embedding }] = embeddingResponse.data;

		const { data, error } = await supabase
			.from("pg_resources")
			.insert({
				resource_title,
				resource_type,
				resource_upload_date,
				content,
				content_length,
				content_tokens,
				embedding,
			})
			.select("*");

		if (error) {
			console.log("error", error);
		} else {
			console.log("saved", i);
		}

		await new Promise((resolve) => setTimeout(resolve, 200));
	}
};

(async () => {
	const resources: PGResource[] = JSON.parse(
		fs.readFileSync("scripts/out/all-out.json", "utf8")
	);

	await generateEmbeddings(resources);
})();
