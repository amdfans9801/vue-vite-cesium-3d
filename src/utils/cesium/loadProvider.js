/*
 * @Author: dongnan
 * @Description:底图
 * @Date: 2021-11-07 00:19:09
 * @LastEditTime: 2022-11-23 15:32:17
 */
import {
	WebMapTileServiceImageryProvider,
	ArcGisMapServerImageryProvider,
	WebMercatorTilingScheme,
	Math as CesiumMath,
	Cartographic,
	UrlTemplateImageryProvider,
	OpenStreetMapImageryProvider,
} from "cesium";
import { wgs84togcj02, gcj02towgs84 } from "coordtransform";
import BaiduImageryProvider from "@/utils/cesium/libs/baidu/BaiduImageryProvider";
import WebTileProvider from "@/utils/cesium/WebTileProvider";
// 天地图秘钥
const tdtToken = "aef1277d283beb91a608f2971d735fb2";
/**
 * @Author: dongnan
 * @Description: osm 地图
 * @Date: 2022-05-27 09:31:42
 */
export function getOsm(show) {
	let provider = new OpenStreetMapImageryProvider({
		url: "http://a.tile.openstreetmap.org/",
	});
	provider.readyPromise.then(() => {
		transformProjection(provider);
	});
	return {
		provider: provider,
		name: "osm地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 天地图 矢量
 * @Date: 2021-11-07 00:20:07
 */
export function getTdtVector(show) {
	let provider = new WebMapTileServiceImageryProvider({
		url: "http://t0.tianditu.gov.cn/vec_w/wmts?tk=" + tdtToken,
		layer: "vec",
		style: "default",
		tileMatrixSetID: "w",
		format: "tiles",
		maximumLevel: 18,
	});
	return {
		provider: provider,
		name: "天地图矢量地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 天地图 矢量标注
 * @Date: 2021-11-07 00:24:07
 */
export function getTdtVectorLabel(show) {
	let provider = new WebMapTileServiceImageryProvider({
		url: "http://t0.tianditu.gov.cn/cva_w/wmts?tk=" + tdtToken,
		layer: "cva",
		style: "default",
		tileMatrixSetID: "w",
		format: "tiles",
		maximumLevel: 18,
	});
	return {
		provider: provider,
		name: "天地图矢量标注地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 天地图 影像
 * @Date: 2021-11-07 00:24:20
 */
export function getTdtImage(show) {
	let provider = new WebMapTileServiceImageryProvider({
		url: "http://t0.tianditu.gov.cn/img_w/wmts?tk=" + tdtToken,
		layer: "img",
		style: "default",
		tileMatrixSetID: "w",
		format: "tiles",
		maximumLevel: 18,
	});
	return {
		provider: provider,
		name: "天地图影像地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 天地图 影像标注
 * @Date: 2021-11-07 00:24:36
 */
export function getTdtImageLabel(show) {
	let provider = new WebMapTileServiceImageryProvider({
		url: "http://t0.tianditu.gov.cn/cia_w/wmts?tk=" + tdtToken,
		layer: "cia",
		style: "default",
		tileMatrixSetID: "w",
		format: "tiles",
		maximumLevel: 18,
	});
	return {
		provider: provider,
		name: "天地图影像标注地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: arcgis 矢量
 * @Date: 2021-11-07 00:29:25
 */
export function getGisVector(show) {
	let provider = new ArcGisMapServerImageryProvider({
		url: "http://map.geoq.cn/arcgis/rest/services/ChinaOnlineCommunity/MapServer",
		tilingScheme: new WebMercatorTilingScheme(),
	});
	provider.readyPromise.then(() => {
		transformProjection(provider);
	});
	return {
		provider: provider,
		name: "ESRI矢量地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: arcgis 影像
 * @Date: 2021-11-07 00:31:21
 */
export function getGisImage(show) {
	let provider = new ArcGisMapServerImageryProvider({
		url: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
		tilingScheme: new WebMercatorTilingScheme(),
	});
	provider.readyPromise.then(() => {
		transformProjection(provider);
	});
	return {
		provider: provider,
		name: "ESRI影像地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: arcgis 蓝黑
 * @Date: 2021-11-07 00:28:50
 */
export function getGisBlue(show) {
	let provider = new ArcGisMapServerImageryProvider({
		url: "http://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetPurplishBlue/MapServer",
		tilingScheme: new WebMercatorTilingScheme(),
	});
	provider.readyPromise.then(() => {
		transformProjection(provider);
	});
	return {
		provider: provider,
		name: "ESRI蓝黑地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: arcgis 灰色
 * @Date: 2021-11-07 00:33:17
 */
export function getGisGrey(show) {
	let provider = new ArcGisMapServerImageryProvider({
		url: "http://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetGray/MapServer",
		tilingScheme: new WebMercatorTilingScheme(),
	});
	provider.readyPromise.then(() => {
		transformProjection(provider);
	});
	return {
		provider: provider,
		name: "ESRI灰色地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: arcgis 暖色
 * @Date: 2021-11-07 00:34:02
 */
export function getGisWarm(show) {
	let provider = new ArcGisMapServerImageryProvider({
		url: "http://map.geoq.cn/arcgis/rest/services/ChinaOnlineStreetWarm/MapServer",
		tilingScheme: new WebMercatorTilingScheme(),
	});
	provider.readyPromise.then(() => {
		transformProjection(provider);
	});
	return {
		provider: provider,
		name: "ESRI暖色地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 高德 矢量
 * @Date: 2021-11-07 00:35:10
 */
export function getGaodeVector(show) {
	let provider = new UrlTemplateImageryProvider({
		url: "http://webst02.is.autonavi.com/appmaptile?style=7&x={x}&y={y}&z={z}",
		tilingScheme: new WebMercatorTilingScheme(),
		maximumLevel: 20,
	});
	provider.readyPromise.then(() => {
		transformProjection(provider);
	});
	return {
		provider: provider,
		name: "高德矢量地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 高德 影像
 * @Date: 2021-11-07 00:39:04
 */
export function getGaodeImage(show) {
	let provider = new UrlTemplateImageryProvider({
		url: "http://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
		tilingScheme: new WebMercatorTilingScheme(),
		maximumLevel: 20,
	});
	provider.readyPromise.then(() => {
		transformProjection(provider);
	});
	return {
		provider: provider,
		name: "高德影像地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 高德 影像标注
 * @Date: 2021-11-07 00:43:18
 */
export function getGaodeImageLabel(show) {
	let provider = new UrlTemplateImageryProvider({
		url: "http://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
		tilingScheme: new WebMercatorTilingScheme(),
		maximumLevel: 20,
	});
	provider.readyPromise.then(() => {
		transformProjection(provider);
	});
	return {
		provider: provider,
		name: "高德影像标注地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 高德 街道
 * @Date: 2021-11-07 00:44:55
 */
export function getGaodeStreet(show) {
	let provider = new UrlTemplateImageryProvider({
		url: "http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
		tilingScheme: new WebMercatorTilingScheme(),
		maximumLevel: 20,
	});
	provider.readyPromise.then(() => {
		transformProjection(provider);
	});
	return {
		provider: provider,
		name: "高德街道地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 谷歌 矢量
 * @Date: 2021-11-07 14:15:11
 */
export function getGoogleVector(show) {
	let provider = new UrlTemplateImageryProvider({
		url: "http://mt3.google.cn/vt/lyrs=t@131,r@227000000&hl=zh-CN&gl=cn&x={x}&y={y}&z={z}&s=Galile",
		tilingScheme: new WebMercatorTilingScheme(),
	});
	provider.readyPromise.then(() => {
		transformProjection(provider);
	});
	return {
		provider: provider,
		name: "谷歌矢量地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 谷歌 街道
 * @Date: 2021-11-20 15:46:16
 */
export function getGoogleStreet(show) {
	let provider = new UrlTemplateImageryProvider({
		url: "http://mt3.google.cn/vt/lyrs=m&hl=zh-CN&x={x}&y={y}&z={z}&s=Galile",
		tilingScheme: new WebMercatorTilingScheme(),
	});
	provider.readyPromise.then(() => {
		transformProjection(provider);
	});
	return {
		provider: provider,
		name: "谷歌街道地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 谷歌 影像
 * @Date: 2021-11-07 14:35:27
 */
export function getGoogleImage(show) {
	let provider = new UrlTemplateImageryProvider({
		url: "http://mt3.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}&s=Gali",
	});
	return {
		provider: provider,
		name: "谷歌影像地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 谷歌 影像标注
 * @Date: 2021-11-07 14:36:19
 */
export function getGoogleImageLabel(show) {
	let provider = new UrlTemplateImageryProvider({
		url: "http://www.google.cn/maps/vt?lyrs=h@189&gl=cn&x={x}&y={y}&z={z}",
		tilingScheme: new WebMercatorTilingScheme(),
	});
	provider.readyPromise.then(() => {
		transformProjection(provider);
	});
	return {
		provider: provider,
		name: "谷歌影像标注地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 谷歌 道路
 * @Date: 2021-11-07 14:37:10
 */
export function getGoogleRoad(show) {
	let provider = new UrlTemplateImageryProvider({
		url: "http://www.google.cn/maps/vt/pb=!1m4!1m3!1i{z}!2i{x}!3i{y}!2m3!1e0!2sm!3i380072576!3m8!2szh-CN!3scn!5e1105!12m4!1e68!2m2!1sset!2sRoadmap!4e0!5m1!1e0",
		tilingScheme: new WebMercatorTilingScheme(),
	});
	provider.readyPromise.then(() => {
		transformProjection(provider);
	});
	return {
		provider: provider,
		name: "谷歌道路地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 百度 矢量
 * @Date: 2021-11-07 14:38:42
 */
export function getBaiduVector(show) {
	let provider = new BaiduImageryProvider({
		style: "normal", // style: img、imgLabel、normal、dark
		crs: "WGS84", // 使用84坐标系，默认为：BD09
	});
	return {
		provider: provider,
		name: "百度矢量地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 百度 影像
 * @Date: 2021-11-20 19:50:31
 */
export function getBaiduImage(show) {
	let provider = new BaiduImageryProvider({
		style: "img", // style: img、imgLabel、normal、dark
		crs: "WGS84", // 使用84坐标系，默认为：BD09
	});
	return {
		provider: provider,
		name: "百度影像地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 百度 影像标注
 * @Date: 2021-11-20 19:50:31
 */
export function getBaiduImageLabel(show) {
	let provider = new BaiduImageryProvider({
		style: "imgLabel", // style: img、imgLabel、normal、dark
		crs: "WGS84", // 使用84坐标系，默认为：BD09
	});
	return {
		provider: provider,
		name: "百度影像标注地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 百度 深色图
 * @Date: 2021-11-20 20:13:03
 */
export function getBaiduDark(show) {
	let provider = new BaiduImageryProvider({
		style: "dark", // style: img、imgLabel、normal、dark
		crs: "WGS84", // 使用84坐标系，默认为：BD09
	});
	return {
		provider: provider,
		name: "百度深色地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 腾讯 矢量
 * @Date: 2021-11-20 20:33:11
 */
export function getTengxunVector(show) {
	let provider = new UrlTemplateImageryProvider({
		url: "https://rt3.map.gtimg.com/tile?z={z}&x={x}&y={reverseY}&styleid={style}&scene=0&version=347",
		tilingScheme: new WebMercatorTilingScheme(),
		maximumLevel: 18,
	});
	provider.readyPromise.then(() => {
		transformProjection(provider);
	});
	return {
		provider: provider,
		name: "腾讯矢量地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 腾讯 影像
 * @Date: 2021-11-20 20:33:38
 */
export function getTengxunImage(show) {
	let provider = new UrlTemplateImageryProvider({
		url: "https://p3.map.gtimg.com/sateTiles/{z}/{sx}/{sy}/{x}_{reverseY}.jpg?version=400",
		tilingScheme: new WebMercatorTilingScheme(),
		maximumLevel: 18,
		customTags: {
			sx: (imageryProvider, x, y, level) => {
				return x >> 4;
			},
			sy: (imageryProvider, x, y, level) => {
				return ((1 << level) - y) >> 4;
			},
		},
	});
	provider.readyPromise.then(() => {
		transformProjection(provider);
	});
	return {
		provider: provider,
		name: "腾讯影像地图",
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: 离线瓦片
 * @Date: 2021-11-23 10:28:58
 * @param {string} url 瓦片地址
 * @param {string} name 名称
 */
export function getWebTile(url, name, show) {
	let provider = new UrlTemplateImageryProvider({
		// url: "http://localhost:3232/zz-tile-blue/{z}/{x}/{y}.png",
		url: url,
	});
	return {
		provider: provider,
		name: name,
		show: show ?? false,
	};
}
/**
 * @Author: dongnan
 * @Description: GCJ02 转 WGS84
 * @Date: 2021-11-20 15:44:13
 * @param {*} provider
 */
function transformProjection(provider) {
	let webMercatorTilingScheme = provider.tilingScheme;
	let projection = webMercatorTilingScheme._projection;
	projection.x_project = projection.project;
	projection.project = function (cartographic) {
		let point;
		return (
			(point = wgs84togcj02(CesiumMath.toDegrees(cartographic.longitude), CesiumMath.toDegrees(cartographic.latitude))),
			projection.x_project(new Cartographic(CesiumMath.toRadians(point[0]), CesiumMath.toRadians(point[1])))
		);
	};
	projection.x_unproject = projection.unproject;
	projection.unproject = function (cartesian) {
		let point,
			cartographic = projection.x_unproject(cartesian);
		return (
			(point = gcj02towgs84(CesiumMath.toDegrees(cartographic.longitude), CesiumMath.toDegrees(cartographic.latitude))),
			new Cartographic(CesiumMath.toRadians(point[0]), CesiumMath.toRadians(point[1]))
		);
	};
	return provider;
}
