import autoImport from "unplugin-auto-import/vite";

// 自动导入
export default function createAutoImport() {
	return autoImport({
		imports: [
			"vue",
			"vue-router",
			{
				vuex: ["useStore"],
			},
		],
		dts: "src/auto-import.d.ts",
	});
}
