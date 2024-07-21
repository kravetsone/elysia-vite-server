# elysia-vite-server

Plugin which start and decorate `vite` dev server in `development` and in `production` mode serve static (if it needed)

## Usage

### Simple

Add `index.html` and `server.ts` with:

```ts
import { Elysia } from "elysia";
import { vite } from "elysia-vite-server";

new Elysia()
    .use(
        vite({
            static: {
                assets: ".",
                alwaysStatic: false,
                noCache: true,
            },
        })
    )
    .listen(3000, console.log);
```

> [!WARNING]
> It serve static from root of example!! For education only

### Vue SSR example (inspired by [bluwy/create-vite-extra/template-ssr-vue](https://github.com/bluwy/create-vite-extra/blob/master/template-ssr-vue/server.js))

```ts
import { Elysia } from "elysia";
import { vite } from "elysia-vite-server";

const isProduction = process.env.NODE_ENV === "production";
// Cached production assets
const templateHtml = isProduction ? await Bun.file("./index.html").text() : "";
const ssrManifest = isProduction
    ? await Bun.file("./index.html").text()
    : undefined;

new Elysia()
    .use(
        vite({
            static: {
                assets: "./dist/client",
                alwaysStatic: false,
                noCache: true,
            },
        })
    )
    .get("/", async ({ vite, request, set }) => {
        try {
            let template: string | undefined;
            let render: any;
            if (vite) {
                // Always read fresh template in development
                template = await Bun.file("./index.html").text();

                template = await vite.transformIndexHtml(request.url, template);
                render = (await vite.ssrLoadModule("/src/entry-server.js"))
                    .render;
            } else {
                template = templateHtml;
                render = (await import("./dist/server/entry-server.js")).render;
            }

            const rendered = await render(request.url, ssrManifest);

            const html = template
                .replace("<!--app-head-->", rendered.head ?? "")
                .replace("<!--app-html-->", rendered.html ?? "");

            return new Response(html, {
                headers: {
                    "Content-Type": "text/html",
                },
            });
        } catch (e) {
            if (e instanceof Error) {
                vite?.ssrFixStacktrace(e);
                console.log(e.stack);
                set.status = 500;

                return e.stack;
            }
        }
    })
    .listen(3000, console.log);
```

### Options

| Key     | Type                                                          | Default                                 | Description                                                                                                                        |
| ------- | ------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| mode?   | "development" \| "production"                                 | process.env.NODE_ENV \|\| "development" | In `development` mode it starts `vite` and in `production` it just served static (if it needed).                                   |
| vite?   | InlineConfig                                                  |                                         | Configure `vite` server in `development` mode.                                                                                     |
| static? | [StaticOptions](https://elysiajs.com/plugins/static) \| false |                                         | Configure [static plugin](https://elysiajs.com/plugins/static) options in `production` mode. Pass `false` to disable static plugin |
