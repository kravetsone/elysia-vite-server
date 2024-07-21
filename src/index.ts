import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import type { InlineConfig, ViteDevServer } from "vite";

/**
 * Configure {@link vite} plugin
 */
export interface ViteOptions {
	/**
	 * in `development` mode it starts `vite` and in `production` it just served like static.
	 *
	 * @default process.env.NODE_ENV || "development"
	 */
	mode?: "development" | "production";
	/**
	 * Configure `vite` server in `development` mode
	 */
	vite?: InlineConfig;

	/**
	 * Configure [static plugin](https://elysiajs.com/plugins/static) options in `production` mode
	 *
	 * Pass `false` to disable static plugin
	 */
	static?: Parameters<typeof staticPlugin>[0] | false;
}

/**
 * Plugin which start and decorate `vite` dev server in `development` and in `production` mode serve static (if it needed)
 */
export async function vite(options?: ViteOptions) {
	const mode = options?.mode ?? process.env.NODE_ENV ?? "development";

	let vite: ViteDevServer | undefined;

	if (mode !== "production") {
		vite = await import("vite").then((vite) => {
			return vite.createServer({
				...options?.vite,
				server: {
					...options?.vite?.server,
					middlewareMode: true,
				},
			});
		});
	}

	const app = new Elysia({
		name: "elysia-vite",
		seed: options,
	}).decorate("vite", vite);

	if (vite) {
		app.use(
			(await import("elysia-connect-middleware")).connect(vite.middlewares),
		);
	} else {
		if (options?.static !== false) app.use(staticPlugin(options?.static));
	}

	return app;
}
