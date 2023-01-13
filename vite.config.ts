import { defineConfig, loadEnv } from 'vite';
import createVitePlugins from './vite';
import { resolve } from 'path';

import postcsspxtoviewport from 'postcss-px-to-viewport';
import autoprefixer from 'autoprefixer';
import externalGlobals from 'rollup-plugin-external-globals';
import optimizer from 'vite-plugin-optimizer';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
	const env = loadEnv(mode, process.cwd());
	return {
		plugins: [
			createVitePlugins(env, command === 'build'),
			// optimizer({
			// 	buffer: () => ({
			// 		find: /^(node:)?buffer$/,
			// 		code: `const buffer = import.meta.glob('buffer'); export { buffer as default }`,
			// 	}),
			// }),
		],
		base: './', //打包相对路径
		resolve: {
			// 配置别名
			alias: {
				'@': resolve('src'),
				'*': resolve(''),
				globalconfig: resolve('./public/config/globalconfig.js'),
			},
		},
		server: {
			host: '0.0.0.0',
			// port: parseFloat(env.VITE_PORT),
			port: 8848,
			https: false, //是否启用 https
			cors: true, //为开发服务器配置 CORS , 默认启用并允许任何源
			open: true, //服务启动时自动在浏览器中打开应用
			strictPort: false, //设为true时端口被占用则直接退出，不会尝试下一个可用端口
			force: true, //是否强制依赖预构建
			hmr: true, //禁用或配置 HMR 连接
			base: '/',
		},
		// postcss配置 自适应屏幕 px-to-vm
		css: {
			postcss: {
				plugins: [
					autoprefixer({}),
					postcsspxtoviewport({
						unitToConvert: 'px', // 要转化的单位
						viewportWidth: 1920, // UI设计稿的宽度
						viewportHeight: 1080, // UI设计稿的高度
						unitPrecision: 6, // 转换后的精度，即小数点位数
						propList: ['*'], // 指定转换的css属性的单位，*代表全部css属性的单位都进行转换
						viewportUnit: 'vw', // 指定需要转换成的视窗单位，默认vw
						fontViewportUnit: 'vw', // 指定字体需要转换成的视窗单位，默认vw
						selectorBlackList: ['.ignore'], // 指定不转换为视窗单位的类名，
						minPixelValue: 1, // 默认值1，小于或等于1px则不进行转换
						mediaQuery: true, // 是否在媒体查询的css代码中也进行转换，默认false
						replace: true, // 是否转换后直接更换属性值
						exclude: [], // 设置忽略文件，用正则做目录名匹配
						landscape: false, // 是否处理横屏情况
						landscapeUnit: 'vw', //横屏时使用的单位
						landscapeWidth: 1920, //横屏时使用的视口宽度
					}),
				],
			},
		},
		//打包配置
		build: {
			target: 'modules', //浏览器兼容性  "esnext"|"modules"
			// outDir: env.VITE_OUTPUT_DIR, //指定输出路径
			outDir: '/dist',
			assetsDir: 'assets', //生成静态资源的存放路径
			assetsInlineLimit: 4096, //小于此阈值的导入或引用资源将内联为 base64 编码，以避免额外的 http 请求。设置为 0 可以完全禁用此项
			cssCodeSplit: true, //启用/禁用 CSS 代码拆分
			sourcemap: false, //构建后是否生成 source map 文件
			rollupOptions: {
				external: ['globalconfig'],
				plugins: [
					externalGlobals({
						globalconfig: 'globalconfig',
					}),
				],
			}, //自定义底层的 Rollup 打包配置
			commonjsOptions: {}, //@rollup/plugin-commonjs 插件的选项
			manifest: false, //当设置为 true，构建后将会生成 manifest.json 文件
			// 设置为 false 可以禁用最小化混淆，或是用来指定使用哪种混淆器 boolean | 'terser' | 'esbuild'
			minify: 'terser', //terser 构建后文件体积更小
			terserOptions: {}, //传递给 Terser 的更多 minify 选项。
			write: true, //设置为 false 来禁用将构建后的文件写入磁盘
			emptyOutDir: true, //默认情况下，若 outDir 在 root 目录下，则 Vite 会在构建时清空该目录。
			brotliSize: true, //启用/禁用 brotli 压缩大小报告
			chunkSizeWarningLimit: 500, //chunk 大小警告的限制
		},
	};
});
