// file.js 封装下载本地文件方法
import axios from "axios";
import { saveAs } from "file-saver";
/**
 * @params {string} localFileName 本地文件名称
 * @params {string} saveFileName 下载的文件名称
 * @retuen {promise}
 */
export function downloadLocalFile(localFileName, saveFileName) {
	return new Promise((resolve, reject) => {
		axios({
			url: `${localFileName}`, // 本地文件夹路径+本地文件名称(若资源在服务器，且是具体的路径，这里可改成该资源路径，此时封装的方法需要微调，入参的localFileName改成资源路径resource)
			method: "get",
			responseType: "blob", //	arraybuffer	也可
		})
			.then((res) => {
				const blob = new Blob([res.data]);
				if (navigator.msSaveBlob) {
					// 兼容IE
					navigator.msSaveBlob(blob, saveFileName);
				} else {
					const url = window.URL.createObjectURL(blob);
					saveAs(url, saveFileName);
				}
				resolve();
			})
			.catch((err) => {
				// 这里可以统一处理错误，比如"未找到相关文件"，"下载失败"等
				if (err.message === "Request failed with status code 404") {
					// 提示or弹框：未找到相关文件
				} else {
					// 提示or弹框：下载失败
				}
				reject(err);
			});
	});
}
// 使用（注意文件格式的后缀名）
// downloadLocalFile("excelFile.xlsx", "newExcelFile.xlsx").then((res) => {
// 	// 下载成功后的操作
// 	console.log("下载成功！");
// });
/**
 * @params {stream} fileStream 服务器返回的文件流
 * @params {string} saveFileName 下载的文件名称
 * @retuen {promise}
 */
export function downloadFile(fileStream, saveFileName) {
	return new Promise((resolve, reject) => {
		const blob = new Blob([fileStream]);
		if (navigator.msSaveBlob) {
			// 兼容IE
			navigator.msSaveBlob(blob, saveFileName);
		} else {
			const url = window.URL.createObjectURL(blob);
			saveAs(url, saveFileName);
		}
		resolve();
	});
}

// 使用（注意文件格式的后缀名）
// const fileStream = await xxApi(); // 获取文件流
// downloadFile(fileStream, "file.pdf").then((res) => {
// 	// 下载成功后的操作
// 	console.log("下载成功！");
// });
/**
 * @Author: dongnan
 * @Description: 下载指定内容
 * @Date: 2022-08-05 14:07:43
 * @param {String} title 文件名
 * @param {String} content 文件内容
 */
export function downloadText(title, content) {
	var file = new File([content], title, { type: "text/plain;charset=utf-8" });
	saveAs(file);
}
// 使用
// downloadText("test.json", JSON.stringify([{ test: "123" }]));
