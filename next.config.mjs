import withFlowbiteReact from "flowbite-react/plugin/nextjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
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

export default withFlowbiteReact(nextConfig);