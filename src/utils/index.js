// 全局参数挂载
import modal from "./plugins/modal";
import { handleTree, resetForm, parseTime, addDateRange } from "./plugins/ruoyi";
import Pagination from "./components/Pagination/index.vue";
import * as components from "@element-plus/icons-vue";
import SvgIcon from "./components/SvgIcon/index.vue";
import { imageUrl } from "./plugins/custom";
import has from "./directive/has";
import wave from "./directive/wave";
import drag from "./directive/drag";
import * as echarts from "echarts";
import getAssets from "./tools/getAssets";

export default function installPlugins(app) {
	// 模态框对象
	app.config.globalProperties.$modal = modal;
	// 构造树形结构
	app.config.globalProperties.handleTree = handleTree;
	// 重置form表单
	app.config.globalProperties.resetForm = resetForm;
	// 解析时间
	app.config.globalProperties.parseTime = parseTime;
	// 添加日期范围
	app.config.globalProperties.addDateRange = addDateRange;
	// 分页组件
	app.component("Pagination", Pagination);
	// svg-icon组件
	for (const key in components) {
		const componentConfig = components[key];
		app.component(componentConfig.name, componentConfig);
	}
	app.component("svg-icon", SvgIcon);
	// 图片参数化方法
	app.config.globalProperties.imageUrl = imageUrl;
	// 权限控制指令
	app.directive("has", has);
	// 点击水波纹指令
	app.directive("wave", wave);
	//全局的拖动事件
	app.directive('drag', drag);
	// echarts
	app.config.globalProperties.$echarts = echarts;
	// 获取静态资源
	app.config.globalProperties.$getAssets = getAssets;
}
