// 静态资源路径
const getAssets = (url) => {
	return new URL(`../../assets/${url}`, import.meta.url).href;
};
export default getAssets;
