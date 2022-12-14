import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
import path from "path";
// <svg-icon iconClass="user" className="test">
export default function createSvgIcon(isBuild) {
	return createSvgIconsPlugin({
		iconDirs: [path.resolve(process.cwd(), "src/assets/icons/svg")],
		symbolId: "icon-[dir]-[name]",
		svgoOptions: isBuild,
	});
}
