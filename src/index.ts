export interface Env {
	DB: KVNamespace;
	CHAT: DurableObjectNamespace;
}

// @ts-ignore
import home from './home.html';

export class ChatRoom {
	users: WebSocket[];
	messages: string[];
	constructor() {
		this.users = [];
		this.messages = [];
	}
	handleHome() {
		return new Response(home, {
			headers: {
				'Content-Type': 'text/html;chartset=utf-8',
			},
		});
	}
	handleNotFound() {
		return new Response(null, {
			status: 404,
		});
	}
	handleConnect() {
		const pairs = new WebSocketPair();
		this.handleWebSocket(pairs[1]);
		return new Response(null, { status: 101, webSocket: pairs[0] });
	}
	handleWebSocket(webSocket: WebSocket) {
		webSocket.accept();
		this.users.push(webSocket);
		webSocket.send(JSON.stringify({ message: 'Hello from backend!' }));
		this.messages.forEach((message) => webSocket.send(message));
		webSocket.addEventListener('message', (event) => {
			console.log(event.data.toString());
			this.messages.push(event.data.toString());
			this.users.forEach((user) => user.send(event.data));
		});
	}
	async fetch(request: Request) {
		const { pathname } = new URL(request.url);
		switch (pathname) {
			case '/':
				return this.handleHome();
			case '/connect':
				return this.handleConnect();
			default:
				return this.handleNotFound();
		}
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const id = env.CHAT.idFromName('chat');
		const durableObject = env.CHAT.get(id);
		const response = await durableObject.fetch(request);
		return response;
	},
};
