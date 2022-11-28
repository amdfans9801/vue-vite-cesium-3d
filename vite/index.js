import vue from "@vitejs/plugin-vue";

import createAutoImport from "./plugins/auto-import";
import createCompression from "./plugins/compression";
import createSetupExtend from "./plugins/setup-extend";
import createSvgIcon from "./plugins/svg-icon";
import cesium from "vite-plugin-cesium";

export default function createVitePlugins(viteEnv, isBuild = false) {
	const vitePlugins = [vue()];
	vitePlugins.push(cesium());
	vitePlugins.push(createAutoImport());
	vitePlugins.push(createSetupExtend());
	vitePlugins.push(createSvgIcon(isBuild));
	isBuild && vitePlugins.push(...createCompression(viteEnv));
	return vitePlugins;
}
