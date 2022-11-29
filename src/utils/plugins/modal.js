import { ElMessage, ElMessageBox, ElNotification, ElLoading } from "element-plus";

let loadingInstance;

export default {
	// 消息提示
	msg(content, offset = 65, duration = 2000) {
		ElMessage.info({
			message: content,
			offset: offset,
			duration: duration,
		});
	},
	// 错误消息
	msgError(content, offset = 65, duration = 2000) {
		ElMessage.error({
			message: content,
			offset: offset,
			duration: duration,
		});
	},
	// 成功消息
	msgSuccess(content, offset = 65, duration = 2000) {
		ElMessage.success({
			message: content,
			offset: offset,
			duration: duration,
		});
	},
	// 警告消息
	msgWarning(content, offset = 65, duration = 2000) {
		ElMessage.warning({
			message: content,
			offset: offset,
			duration: duration,
		});
	},
	// 弹出提示
	alert(content) {
		ElMessageBox.alert(content, "系统提示");
	},
	// 错误提示
	alertError(content) {
		ElMessageBox.alert(content, "系统提示", { type: "error" });
	},
	// 成功提示
	alertSuccess(content) {
		ElMessageBox.alert(content, "系统提示", { type: "success" });
	},
	// 警告提示
	alertWarning(content) {
		ElMessageBox.alert(content, "系统提示", { type: "warning" });
	},
	// 通知提示
	notify(content) {
		ElNotification.info(content);
	},
	// 错误通知
	notifyError(content) {
		ElNotification.error(content);
	},
	// 成功通知
	notifySuccess(content) {
		ElNotification.success(content);
	},
	// 警告通知
	notifyWarning(content) {
		ElNotification.warning(content);
	},
	// 确认窗体
	confirm(content, confirmButtonText = "确定", cancelButtonText = "取消", type = "warning") {
		return ElMessageBox.confirm(content, "系统提示", {
			confirmButtonText: confirmButtonText,
			cancelButtonText: cancelButtonText,
			type: type,
		});
	},
	// 提交内容
	prompt(content) {
		return ElMessageBox.prompt(content, "系统提示", {
			confirmButtonText: "确定",
			cancelButtonText: "取消",
			type: "warning",
		});
	},
	// 打开遮罩层
	loading(content) {
		loadingInstance = ElLoading.service({
			lock: true,
			text: content,
			background: "rgba(0, 0, 0, 0.7)",
		});
	},
	// 关闭遮罩层
	closeLoading() {
		loadingInstance.close();
	},
};
