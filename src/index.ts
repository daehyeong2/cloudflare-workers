/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	DB: KVNamespace;
}

// @ts-ignore
import home from './home.html';
import { makeBadge } from './utils';

function handleHome() {
	return new Response(home, {
		headers: {
			'Content-Type': 'text/html;chartset=utf-8',
		},
	});
}

async function handleVisit(searchParams: URLSearchParams, env: Env) {
	const page = searchParams.get('page');
	if (!page) return handleBadRequest();
	const kvPage = await env.DB.get(page);
	let value = 1;
	if (!kvPage) {
		await env.DB.put(page, value + '');
	} else {
		value = parseInt(kvPage) + 1;
		await env.DB.put(page, value + '');
	}
	return new Response(makeBadge(value), {
		headers: {
			'Content-Type': 'image/svg+xml;charset=utf-8',
		},
	});
}

function handleBadRequest() {
	return new Response(null, {
		status: 400,
	});
}

function handleNotFound() {
	return new Response(null, {
		status: 404,
	});
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const { pathname, searchParams } = new URL(request.url);
		switch (pathname) {
			case '/':
				return handleHome();
			case '/visit':
				return handleVisit(searchParams, env);
			default:
				return handleNotFound();
		}
	},
};
