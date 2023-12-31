import { createClient } from "@supabase/supabase-js";
import {
	createParser,
	ParsedEvent,
	ReconnectInterval,
} from "eventsource-parser";
import { OpenAIModel } from "@/types/index";

export const supabaseAdmin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const OpenAIStream = async (prompt: string, apiKey: string) => {
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();

	const res = await fetch("https://api.openai.com/v1/chat/completions", {
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		method: "POST",
		body: JSON.stringify({
			model: OpenAIModel.DAVINCI_TURBO,
			messages: [
				{
					role: "system",
					content:
						"You are a helpful legal assistant. Your task is to advice the users about the Indian laws. Be as precise as possible. DO NOT ANSWER FROM PERSONAL KNOWLEDGE, ONLY USE THE GIVEN DATA SET",
				},
				{
					role: "user",
					content: prompt,
				},
			],
			max_tokens: 300,
			temperature: 0.2,
			stream: true,
		}),
	});

	if (res.status !== 200) {
		throw new Error("OpenAI API returned an error");
	}

	const stream = new ReadableStream({
		async start(controller) {
			const onParse = (event: ParsedEvent | ReconnectInterval) => {
				if (event.type === "event") {
					const data = event.data;

					if (data === "[DONE]") {
						controller.close();
						return;
					}

					try {
						const json = JSON.parse(data);
						const text = json.choices[0].delta.content;
						const queue = encoder.encode(text);
						controller.enqueue(queue);
					} catch (e) {
						controller.error(e);
					}
				}
			};

			const parser = createParser(onParse);

			for await (const chunk of res.body as any) {
				parser.feed(decoder.decode(chunk));
			}
		},
	});

	return stream;
};
