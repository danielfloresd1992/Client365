import withFlowbiteReact from "flowbite-react/plugin/nextjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    // Permite aislar el build en otro directorio para no chocar con un .next
    // creado por otra sesión (p.ej. servers corriendo como root). Solo se activa
    // con DEV_ALT_DIST=1; en condiciones normales usa el ".next" por defecto.
    ...(process.env.DEV_ALT_DIST ? { distDir: ".next-dev" } : {}),
    async headers() {
        return [
            {
                // Permitir iframe solo desde el WebView de Cordova (net.jarvis365.app)
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'ALLOWALL',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: "frame-ancestors *;",
                    },
                ],
            },
        ];
    },
    webpack: (config, { isServer, webpack: wp }) => {
        if (!isServer) {
            // Forzar que onnxruntime-web resuelva al bundle de browser
            config.resolve.alias = {
                ...config.resolve.alias,
                'onnxruntime-web': path.resolve(
                    __dirname,
                    'node_modules/onnxruntime-web/dist/ort.min.mjs'
                ),
            };

            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                module: false,
            };

            // Excluir archivos de onnxruntime del Terser minimizer
            config.optimization.minimizer = config.optimization.minimizer?.map((plugin) => {
                if (plugin.constructor.name === 'TerserPlugin' || plugin.constructor.name === 'CssMinimizerPlugin') {
                    if (plugin.options) {
                        plugin.options.exclude = [
                            ...(plugin.options.exclude || []),
                            /ort\..*\.mjs$/,
                        ];
                    }
                }
                return plugin;
            });

            // Tratar archivos .mjs de onnxruntime como JS modules, no assets
            config.module.rules.push({
                test: /ort.*\.mjs$/,
                include: /node_modules[\\/]onnxruntime-web/,
                type: 'javascript/auto',
            });
        }

        if (isServer) {
            config.externals = config.externals || [];
            if (Array.isArray(config.externals)) {
                config.externals.push('onnxruntime-web');
            }
        }

        return config;
    },
};

/*
 * flowbite-react (su plugin de Next) arranca en desarrollo un watcher
 * `chokidar.watch(".")` que vigila TODO el proyecto de forma recursiva y agota
 * los inotify watchers del sistema (ENOSPC) en este entorno — disco externo +
 * varios proyectos corriendo a la vez.
 *
 * Solución: en desarrollo aplicamos únicamente el patch que necesita flowbite
 * (optimizePackageImports) sin lanzar el watcher; en `next build` se usa el
 * plugin completo. Los componentes flowbite siguen funcionando porque sus
 * clases ya están en `.flowbite-react/class-list.json` (que lee Tailwind).
 */
function withFlowbitePatchOnly(config) {
    const experimental = config.experimental || {};
    const optimizePackageImports = experimental.optimizePackageImports || [];
    return {
        ...config,
        experimental: {
            ...experimental,
            optimizePackageImports: [...optimizePackageImports, "flowbite-react"],
        },
    };
}

export default process.env.NODE_ENV === "production"
    ? withFlowbiteReact(nextConfig)
    : withFlowbitePatchOnly(nextConfig);