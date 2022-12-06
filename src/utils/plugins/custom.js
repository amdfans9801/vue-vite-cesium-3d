// 图片地址参数化
export function imageUrl(url) {
	return new URL(url, import.meta.url).href;
}
