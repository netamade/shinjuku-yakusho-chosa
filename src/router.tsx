import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { previewPathRewrite } from "@/lib/preview-path-prefix";
import { routeTree } from "./routeTree.gen";

// GitHub Pages (静的公開) では、Vite の base と同じサブパスをルーターの basepath にする。
// dev / Vercel では従来どおりルート直下。
const pagesBasePath = "/shinjuku-yakusho-chosa";
const isPagesBuild = import.meta.env.VITE_PAGES_BUILD === "true";

export function getRouter() {
  return createRouter({
    routeTree,
    basepath: isPagesBuild ? pagesBasePath : undefined,
    rewrite: previewPathRewrite(),
    defaultErrorComponent: AppErrorComponent,
  });
}
