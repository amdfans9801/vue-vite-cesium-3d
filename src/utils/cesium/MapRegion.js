import {
	BillboardCollection,
	defined,
	Cartesian3,
	defaultValue,
	VerticalOrigin,
	HorizontalOrigin,
	Cartesian2,
	DistanceDisplayCondition,
	NearFarScalar,
	GeoJsonDataSource,
} from "cesium";
import WMSProvider from "@/utils/cesium/WMSProvider";
import { bbox as turfBBox } from "@turf/turf";
import { zoomToExtent } from "@/utils/cesium/CameraTool";
import axios from "axios";
/**
 * @Author: dongnan
 * @Description: 网格缩放
 * @Date: 2021-10-21 09:56:21
 */
class MapRegion {
	constructor(viewer) {
		this.viewer = viewer;
		this.MapRegionLayer = {
			first: {},
			second: {},
			third: {},
			fourth: {},
		}; //存储wms图层信息
		this.MapRegionLabel = {
			first: [],
			second: [],
			third: [],
			fourth: [], //primitive
		}; //存储标签图层信息
		this.MapRegionLabelData = {
			first: [],
			second: [],
			third: [],
			fourth: [],
		}; //存储标签数据
		this.zoomEvent = null; //层级刷新事件
		this.isZoomStart = true; //是否开启缩放
		this.defaultLevels = {
			first: 9,
			second: 11.5,
			third: 14,
			fourth: 20,
		}; //默认四级显示层级
		this.levels = {
			first: 9,
			second: 11.5,
			third: 14,
			fourth: 20,
		}; //图层显示层级(实时变化)
		this.currentKey = "first"; //缩放当前层级key
		this.wmsUrl = "http://dongnan185.com:8081/geoserver/nan/wms"; //wms服务地址
		this.wmsLayer = "nan:sys_grids"; //wms服务图层名
		this.wmsLevels = {
			first: 2,
			second: 3,
			third: 4,
			fourth: 5,
		}; //wms各层级过滤条件(level==2为市级别)
		this.level = null;
		this.load();
	}

	/**
	 * @Author: dongnan
	 * @Description: 网格显示
	 * @Date: 2021-10-22 13:52:01
	 */
	show() {
		this.isZoomStart = true;
		this.showRegion(true);
		this.showLabel(true);
	}

	/**
	 * @Author: dongnan
	 * @Description: 网格隐藏
	 * @Date: 2021-10-22 13:52:08
	 */
	hide() {
		this.isZoomStart = false;
		this.showRegion(false);
		this.showLabel(false);
	}

	/**
	 * @Author: dongnan
	 * @Description: 网格过滤
	 * @Date: 2021-10-22 13:52:56
	 * @param {*} dataAreaCode
	 * @param {*} radius 球半径
	 */
	filter(dataAreaCode, radius) {
		// 清除原有网格数据
		this.removeAllRegions();
		this.removeAllLabels();
		if (dataAreaCode == "370685") {
			// 370685
			this.currentKey = "first";
			this.fitBound(dataAreaCode, radius, () => {
				this.refreshRegion(
					"first",
					dataAreaCode,
					this.defaultLevels.first,
				);
				this.refreshRegion(
					"second",
					dataAreaCode,
					this.defaultLevels.second,
				);
				this.refreshRegion(
					"third",
					dataAreaCode,
					this.defaultLevels.third,
				);
				this.refreshRegion(
					"fourth",
					dataAreaCode,
					this.defaultLevels.fourth,
				);
				// 刷新
				setTimeout(() => {
					this.showRegion(true);
					this.showLabel(true);
				}, 1000);
			});
		} else if (dataAreaCode.length == 6 && dataAreaCode != "370685") {
			// 370685
			this.currentKey = "first";
			this.fitBound(dataAreaCode, radius, () => {
				this.refreshRegion("first", dataAreaCode, this.level + 0.5);
				this.refreshRegion("second", dataAreaCode, this.level + 2);
				this.refreshRegion("third", dataAreaCode, this.level + 4);
				this.refreshRegion("fourth", dataAreaCode, this.level + 6);
				// 刷新
				setTimeout(() => {
					this.showRegion(true);
					this.showLabel(true);
				}, 1000);
			});
		} else if (dataAreaCode.length == 9) {
			// 370685110
			this.currentKey = "second";
			this.fitBound(dataAreaCode, radius, () => {
				this.refreshRegion("first", dataAreaCode, 0);
				this.refreshRegion("second", dataAreaCode, this.level + 0.5);
				this.refreshRegion("third", dataAreaCode, this.level + 2);
				this.refreshRegion("fourth", dataAreaCode, this.level + 4);
				// 刷新
				setTimeout(() => {
					this.showRegion(true);
					this.showLabel(true);
				}, 1000);
			});
		} else if (dataAreaCode.length == 12) {
			// 370685105239
			this.currentKey = "third";
			this.fitBound(dataAreaCode, radius, () => {
				this.refreshRegion("first", dataAreaCode, 0);
				this.refreshRegion("second", dataAreaCode, 0);
				this.refreshRegion("third", dataAreaCode, this.level + 0.5);
				this.refreshRegion("fourth", dataAreaCode, this.level + 2);
				// 刷新
				setTimeout(() => {
					this.showRegion(true);
					this.showLabel(true);
				}, 1000);
			});
		} else if (dataAreaCode.length == 15) {
			// 370685105239001
			this.currentKey = "fourth";
			this.fitBound(dataAreaCode, radius, () => {
				this.refreshRegion("first", dataAreaCode, 0);
				this.refreshRegion("second", dataAreaCode, 0);
				this.refreshRegion("third", dataAreaCode, 0);
				this.refreshRegion("fourth", dataAreaCode, this.level + 0.5);
				// 刷新
				setTimeout(() => {
					this.showRegion(true);
					this.showLabel(true);
				}, 1000);
			});
		}
	}

	/**
	 * @Author: dongnan
	 * @Description: 定位至缩放范围
	 * @Date: 2021-10-16 02:39:05
	 * @param {*} dataAreaCode
	 * @param {*} radius
	 * @param {*} callback 回调
	 */
	async fitBound(dataAreaCode, radius, callback) {
		let label = this.MapRegionLabelData[this.currentKey].filter((item) => {
			return item.dataAreaCode == dataAreaCode;
		});
		if (label.length != 1) {
			console.log("此dataAreaCode无数据:" + dataAreaCode);
			return;
		}
		let fliterXml =
			'<Filter xmlns="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml">' +
			"<And>" +
			"<Intersects>" +
			"<PropertyName>geom</PropertyName>" +
			"<gml:Point>" +
			"<gml:coordinates>" +
			label[0].x +
			"," +
			label[0].y +
			"</gml:coordinates>" +
			"</gml:Point>" +
			"</Intersects>" +
			"<PropertyIsEqualTo>" +
			"<PropertyName>level</PropertyName>" +
			"<Literal>" +
			this.wmsLevels[this.currentKey] +
			"</Literal>" +
			"</PropertyIsEqualTo>" +
			"</And>" +
			"</Filter>";
		let wfsUrl =
			"http://dongnan185.com:8081/geoserver/nan/ows" +
			"?service=WFS&version=1.0.0&request=GetFeature&typeName=nan:sys_grids" +
			"&outputFormat=application%2Fjson&filter=" +
			fliterXml;
		await axios.get(wfsUrl).then((res) => {
			let features = res.data.features;
			if (Array.isArray(features) && features.length > 0) {
				let feature = features[0];
				let bbox = turfBBox(feature);
				zoomToExtent(this.viewer, {
					extent: bbox,
					radius: radius,
					callback: callback,
				});
			} else {
				alert("wms服务无此区划");
			}
		});
	}
	/**
	 * @Author: dongnan
	 * @Description: 刷新面及标注
	 * @Date: 2021-10-22 13:54:04
	 * @param {*} key 对应面的key
	 * @param {*} dataAreaCode 区划
	 * @param {*} level
	 */
	refreshRegion(key, dataAreaCode, level) {
		// 设置显示层级
		this.levels[key] = level;
		// 过滤面图层
		this.MapRegionLayer[key].provider = new WMSProvider({
			url: this.wmsUrl,
			layers: this.wmsLayer,
			parameters: {
				service: "WMS",
				format: "image/png",
				transparent: true,
				cql_filter:
					"level == " +
					this.wmsLevels[key] +
					" and region_code LIKE '" +
					dataAreaCode +
					"%'",
			},
		});
		this.MapRegionLayer[key].layer =
			this.viewer.imageryLayers.addImageryProvider(
				this.MapRegionLayer[key].provider,
			);
		// 过滤标签
		let data = this.MapRegionLabelData[key].filter((item) => {
			return item.dataAreaCode.toString().indexOf(dataAreaCode) >= 0;
		});
		if (key == "fourth") {
			this.addLabels({
				data: data,
				key: key,
				type: "normal",
				subNum: 100,
			});
		} else {
			this.addLabels({
				data: data,
				key: key,
				type: "cluster",
				subNum: 100,
			});
		}
	}

	/**
	 * @Author: dongnan
	 * @Description: 清除所有面信息
	 * @Date: 2021-10-22 15:16:11
	 */
	removeAllRegions() {
		for (let i in this.MapRegionLayer) {
			let layer = this.MapRegionLayer[i].layer;
			this.viewer.imageryLayers.remove(layer);
		}
	}

	/**
	 * @Author: dongnan
	 * @Description: 清除所有标注信息
	 * @Date: 2021-10-22 14:47:00
	 */
	removeAllLabels() {
		// 清除primitive
		for (let i in this.MapRegionLabel) {
			let object = this.MapRegionLabel[i];
			object.some((item) => {
				if (item.type == "normal") {
					this.viewer.scene.primitives.remove(item.primitive);
				} else if (item.type == "cluster") {
					this.viewer.dataSources.remove(item.source);
				}
			});
		}
		// 重置标注信息
		this.MapRegionLabel = {
			first: [],
			second: [],
			third: [],
			fourth: [],
		}; //存储标签图层信息
	}

	/**
	 * @Author: dongnan
	 * @Description: 加载
	 * @Date: 2021-10-21 10:25:26
	 */
	async load() {
		await this.loadLabels();
		this.loadRegions();
		this.loadEvent();
	}

	/**
	 * @Author: dongnan
	 * @Description: 添加事件
	 * @Date: 2021-10-22 13:06:25
	 */
	loadEvent() {
		let self = this;
		// 默认先显示第一级
		this.showLabel(true);
		this.showRegion(true);
		// 添加层级刷新事件
		this.zoomEvent = function (moveEndPosition) {
			let height = self.viewer.camera.positionCartographic.height;
			self.level = self.getLevel(height);
			if (self.level < self.levels.first) {
				self.currentKey = "first";
			} else if (
				self.level >= self.levels.first &&
				self.level < self.levels.second
			) {
				self.currentKey = "second";
			} else if (
				self.level >= self.levels.second &&
				self.level < self.levels.third
			) {
				self.currentKey = "third";
			} else if (
				self.level >= self.levels.third &&
				self.level < self.levels.fourth
			) {
				self.currentKey = "fourth";
			}
			if (self.isZoomStart) {
				self.showRegion(true);
				self.showLabel(true);
			}
		};
		this.viewer.camera.changed.addEventListener(this.zoomEvent);
		this.viewer.camera.percentageChanged = 0.001;
	}

	/**
	 * @Author: dongnan
	 * @Description: 加载区划
	 * @Date: 2021-10-21 10:28:31
	 */
	loadRegions() {
		// 添加第一级wms
		this.MapRegionLayer.first["provider"] = new WMSProvider({
			url: this.wmsUrl,
			layers: this.wmsLayer,
			parameters: {
				service: "WMS",
				format: "image/png",
				transparent: true,
				cql_filter: "level == " + this.wmsLevels.first,
			},
		});
		// this.MapRegionLayer.first["provider"].requestImage = (
		// 	x,
		// 	y,
		// 	level,
		// 	request,
		// ) => {
		// 	if (level <= 5) {
		// 		//这里就是跳过前面5级，根据自己需要设置
		// 		return;
		// 	}
		// 	//下面代码是cesium源码抄录过来的
		// 	let result;
		// 	let imageProvider = this.MapRegionLayer.first["provider"];
		// 	let timeDynamicImagery = imageProvider._timeDynamicImagery;
		// 	let currentInterval;
		// 	if (defined(timeDynamicImagery)) {
		// 		currentInterval = timeDynamicImagery.currentInterval;
		// 		result = timeDynamicImagery.getFromCache(x, y, level, request);
		// 	}
		// 	if (!defined(result)) {
		// 		let dynamicIntervalData = defined(currentInterval)
		// 			? currentInterval.data
		// 			: undefined;
		// 		let tileProvider = imageProvider._tileProvider;
		// 		if (defined(dynamicIntervalData)) {
		// 			tileProvider._resource.setQueryParameters(
		// 				dynamicIntervalData,
		// 			);
		// 		}
		// 		result = tileProvider.requestImage(x, y, level, request);
		// 	}
		// 	if (defined(result) && defined(timeDynamicImagery)) {
		// 		timeDynamicImagery.checkApproachingInterval(
		// 			x,
		// 			y,
		// 			level,
		// 			request,
		// 		);
		// 	}
		// 	return result;
		// };
		this.MapRegionLayer.first["layer"] =
			this.viewer.imageryLayers.addImageryProvider(
				this.MapRegionLayer.first["provider"],
			);
		// 添加第二级wms
		this.MapRegionLayer.second["provider"] = new WMSProvider({
			url: this.wmsUrl,
			layers: this.wmsLayer,
			parameters: {
				service: "WMS",
				format: "image/png",
				transparent: true,
				cql_filter: "level == " + this.wmsLevels.second,
			},
		});
		this.MapRegionLayer.second["layer"] =
			this.viewer.imageryLayers.addImageryProvider(
				this.MapRegionLayer.second["provider"],
			);
		// 添加第三级wms
		this.MapRegionLayer.third["provider"] = new WMSProvider({
			url: this.wmsUrl,
			layers: this.wmsLayer,
			parameters: {
				service: "WMS",
				format: "image/png",
				transparent: true,
				cql_filter: "level == " + this.wmsLevels.third,
			},
		});
		this.MapRegionLayer.third["layer"] =
			this.viewer.imageryLayers.addImageryProvider(
				this.MapRegionLayer.third["provider"],
			);
		// 添加第四级wms
		this.MapRegionLayer.fourth["provider"] = new WMSProvider({
			url: this.wmsUrl,
			layers: this.wmsLayer,
			parameters: {
				service: "WMS",
				format: "image/png",
				transparent: true,
				cql_filter: "level == " + this.wmsLevels.fourth,
			},
		});
		this.MapRegionLayer.fourth["layer"] =
			this.viewer.imageryLayers.addImageryProvider(
				this.MapRegionLayer.fourth["provider"],
			);
	}
	/**
	 * @Author: dongnan
	 * @Description: 展示当前区划(隐藏)
	 * @Date: 2021-10-21 11:42:35
	 */
	showRegion(status) {
		for (let i in this.MapRegionLayer) {
			let object = this.MapRegionLayer[i];
			if (status) {
				if (this.currentKey == i) {
					object["layer"].alpha = 1;
				} else {
					object["layer"].alpha = 0;
				}
			} else {
				object["layer"].alpha = 0;
			}
		}
	}

	/**
	 * @Author: dongnan
	 * @Description: 展示当前标注
	 * @Date: 2021-10-22 10:57:05
	 */
	showLabel(status) {
		for (let i in this.MapRegionLabel) {
			let object = this.MapRegionLabel[i];
			if (status) {
				if (this.currentKey == i) {
					object.some((item) => {
						if (item.type == "normal") {
							for (let i = 0; i < item.points.length; i++) {
								let temp = item.points.get(i);
								temp.show = true;
							}
						} else if (item.type == "cluster") {
							item.points.some((temp) => {
								temp.show = true;
							});
						}
					});
				} else {
					object.some((item) => {
						if (item.type == "normal") {
							for (let i = 0; i < item.points.length; i++) {
								let temp = item.points.get(i);
								temp.show = false;
							}
						} else if (item.type == "cluster") {
							item.points.some((temp) => {
								temp.show = false;
							});
						}
					});
				}
			} else {
				object.some((item) => {
					if (item.type == "normal") {
						for (let i = 0; i < item.points.length; i++) {
							let temp = item.points.get(i);
							temp.show = false;
						}
					} else if (item.type == "cluster") {
						item.points.some((temp) => {
							temp.show = false;
						});
					}
				});
			}
		}
	}

	/**
	 * @Author: dongnan
	 * @Description: 计算层级参数
	 * @Date: 2020-12-30 16:06:19
	 * @param {*} height
	 */
	getLevel(height) {
		let decimal = 0;
		let level = 0;
		if (height >= 48000000) {
			decimal = 1 - (height - 48000000) / 48000000;
			level = decimal + 0;
		} else if (height >= 24000000 && height < 48000000) {
			decimal = 1 - (height - 24000000) / 24000000;
			level = decimal + 1;
		} else if (height >= 12000000 && height < 24000000) {
			decimal = 1 - (height - 12000000) / 12000000;
			level = decimal + 2;
		} else if (height >= 6000000 && height < 12000000) {
			decimal = 1 - (height - 6000000) / 6000000;
			level = decimal + 3;
		} else if (height >= 3000000 && height < 6000000) {
			decimal = 1 - (height - 3000000) / 3000000;
			level = decimal + 4;
		} else if (height >= 1500000 && height < 3000000) {
			decimal = 1 - (height - 1500000) / 1500000;
			level = decimal + 5;
		} else if (height >= 750000 && height < 1500000) {
			decimal = 1 - (height - 750000) / 750000;
			level = decimal + 6;
		} else if (height >= 375000 && height < 750000) {
			decimal = 1 - (height - 375000) / 375000;
			level = decimal + 7;
		} else if (height >= 187500 && height < 375000) {
			decimal = 1 - (height - 187500) / 187500;
			level = decimal + 8;
		} else if (height >= 93750 && height < 187500) {
			decimal = 1 - (height - 93750) / 93750;
			level = decimal + 9;
		} else if (height >= 46875 && height < 93750) {
			decimal = 1 - (height - 46875) / 46875;
			level = decimal + 10;
		} else if (height >= 23437.5 && height < 46875) {
			decimal = 1 - (height - 23437.5) / 23437.5;
			level = decimal + 11;
		} else if (height >= 11718.75 && height < 23437.5) {
			decimal = 1 - (height - 11718.75) / 11718.75;
			level = decimal + 12;
		} else if (height >= 5859.38 && height < 11718.75) {
			decimal = 1 - (height - 5859.38) / 5859.38;
			level = decimal + 13;
		} else if (height >= 2929.69 && height < 5859.38) {
			decimal = 1 - (height - 2929.69) / 2929.69;
			level = decimal + 14;
		} else if (height >= 1464.84 && height < 2929.69) {
			decimal = 1 - (height - 1464.84) / 1464.84;
			level = decimal + 15;
		} else if (height >= 732.42 && height < 1464.84) {
			decimal = 1 - (height - 732.42) / 732.42;
			level = decimal + 16;
		} else if (height >= 366.21 && height < 732.42) {
			decimal = 1 - (height - 366.21) / 366.21;
			level = decimal + 17;
		} else if (height >= 183.1 && height < 366.21) {
			decimal = 1 - (height - 183.1) / 183.1;
			level = decimal + 18;
		} else if (height >= 91.55 && height < 183.1) {
			decimal = 1 - (height - 91.55) / 91.55;
			level = decimal + 19;
		} else if (height < 91.55) {
			level = 20;
		}
		return level;
	}

	/**
	 * @Author: dongnan
	 * @Description: 加载标注
	 * @Date: 2021-10-21 10:38:53
	 */
	async loadLabels() {
		await this.loadLabelData();
		this.addLabels({
			data: this.MapRegionLabelData.first,
			key: "first",
			type: "cluster",
			subNum: 50,
		});
		this.addLabels({
			data: this.MapRegionLabelData.second,
			key: "second",
			type: "cluster",
			subNum: 100,
		});
		this.addLabels({
			data: this.MapRegionLabelData.third,
			key: "third",
			type: "cluster",
			subNum: 100,
		});
		this.addLabels({
			data: this.MapRegionLabelData.fourth,
			key: "fourth",
			type: "normal",
			subNum: 100,
		});
	}

	/**
	 * @Author: dongnan
	 * @Description: 加载标注数据
	 * @Date: 2021-10-21 10:39:05
	 */
	async loadLabelData() {
		// 第一级
		await axios.get("data/json/shi.json").then((res) => {
			let list = [];
			res.data.some((item) => {
				let obj = {};
				obj.TextOptions = {
					text: item.name,
					image: require("@/assets/images/cesium/RegionLabel.png"),
					padding: [15, 10, 10, 10],
					fontOptions: {
						font: "30px 'MoTi'",
						lineWidth: 1,
					},
				};
				obj.dataAreaCode = item.dataAreaCode;
				obj.x = item.x;
				obj.y = item.y;
				list.push(obj);
			});
			this.MapRegionLabelData.first = list;
		});
		// 第二级
		await axios.get("data/json/zhen.json").then((res) => {
			let list = [];
			res.data.some((item) => {
				let obj = {};
				obj.TextOptions = {
					text: item.name,
					image: require("@/assets/images/cesium/RegionLabel.png"),
					padding: [15, 10, 10, 10],
					fontOptions: {
						font: "30px 'MoTi'",
						lineWidth: 1,
					},
				};
				obj.dataAreaCode = item.dataAreaCode;
				obj.x = item.x;
				obj.y = item.y;
				list.push(obj);
			});
			this.MapRegionLabelData.second = list;
		});
		// 第三级
		await axios.get("data/json/cun.json").then((res) => {
			let list = [];
			res.data.some((item) => {
				let obj = {};
				obj.TextOptions = {
					text: item.name,
					image: require("@/assets/images/cesium/RegionLabel.png"),
					padding: [15, 10, 10, 10],
					fontOptions: {
						font: "30px 'MoTi'",
						lineWidth: 1,
					},
				};
				obj.dataAreaCode = item.dataAreaCode;
				obj.x = item.x;
				obj.y = item.y;
				list.push(obj);
			});
			this.MapRegionLabelData.third = list;
		});
		// 第四级
		await axios.get("data/json/grid.json").then((res) => {
			let list = [];
			res.data.some((item) => {
				let obj = {};
				obj.TextOptions = {
					text: item.name,
					image: require("@/assets/images/cesium/RegionLabel.png"),
					padding: [15, 10, 10, 10],
					fontOptions: {
						font: "30px 'MoTi'",
						lineWidth: 1,
					},
				};
				obj.dataAreaCode = item.dataAreaCode;
				obj.x = item.x;
				obj.y = item.y;
				list.push(obj);
			});
			this.MapRegionLabelData.fourth = list;
		});
	}

	/**
	 * @Author: dongnan
	 * @Description: 添加标注
	 * @Date: 2021-10-21 16:11:07
	 * @param {*} type nromal cluster
	 * @param {*} data 主要结构[{x:111,y:22,TextOptions:{},attributes:{}}]
	 * TextOptions:{height:高度(单位:米),image:展示的背景图片,text:展示的文本,fontOptions:{},scale:缩放比例,offset:总偏移量(如:[0,0]),padding:[20,20,20,20](用于文字偏移背景图片),displayByDistance:[0,5000](距离显示条件),scaleByDistance:缩放大小随距离变化}
	 * attributes 需要暴露给事件的信息
	 * @param {*} clusterOptions 抽稀配置 {}
	 * @param {*} subNum
	 * @param {*} key 存储位置
	 */
	addLabels(option) {
		if (!Array.isArray(option.data) || option.data.length == 0) return;
		let self = this;
		let data = JSON.parse(JSON.stringify(option.data));
		let subNum = parseInt(defaultValue(option.subNum, 200));
		if (option.type == "normal") {
			let texts = new BillboardCollection();
			let textPrimitive = this.viewer.scene.primitives.add(texts);
			textPrimitive.Key = "PrimitivePoints"; // 唯一标识 可触发点击事件
			data.some((item, index) => {
				if (
					typeof item.x == "defined" ||
					typeof item.y == "defined" ||
					!item.x ||
					!item.y
				)
					return false;
				// 显示文本时
				if (defined(item.TextOptions)) {
					if (defined(item.TextOptions.image)) {
						let image = new Image();
						image.src = item.TextOptions.image;
						image.onload = () => {
							let imageCanvas;
							if (defined(item.TextOptions.text2)) {
								imageCanvas = self.drawDoubleTextCanvas(
									image,
									item.TextOptions,
								);
							} else {
								imageCanvas = self.drawSingleTextCanvas(
									image,
									item.TextOptions,
								);
							}
							let temp = texts.add({
								position: Cartesian3.fromDegrees(
									parseFloat(item.x),
									parseFloat(item.y),
									defaultValue(item.TextOptions.height, 0),
								),
								disableDepthTestDistance:
									Number.POSITIVE_INFINITY, //关闭深度检测
								image: imageCanvas,
								scale: defaultValue(item.TextOptions.scale, 1),
								verticalOrigin: VerticalOrigin.CENTER,
								horizontalOrigin: HorizontalOrigin.CENTER,
								pixelOffset: defined(item.TextOptions.offset)
									? new Cartesian2(
											item.TextOptions.offset[0],
											item.TextOptions.offset[1],
									  )
									: new Cartesian2(0, 0),
								distanceDisplayCondition: defined(
									item.TextOptions.displayByDistance,
								)
									? new DistanceDisplayCondition(
											item.TextOptions.displayByDistance[0],
											item.TextOptions.displayByDistance[1],
									  )
									: new DistanceDisplayCondition(
											0,
											100000000,
									  ),
								scaleByDistance: defined(
									item.TextOptions.scaleByDistance,
								)
									? new NearFarScalar(
											item.TextOptions.scaleByDistance[0],
											item.TextOptions.scaleByDistance[1],
											item.TextOptions.scaleByDistance[2],
											item.TextOptions.scaleByDistance[3],
									  )
									: new NearFarScalar(0, 1, 1, 1),
							});
							temp.attributes = item.attributes;
						};
					} else {
						let temp = texts.add({
							position: Cartesian3.fromDegrees(
								parseFloat(item.x),
								parseFloat(item.y),
								defaultValue(item.TextOptions.height, 0),
							),
							disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
							image: self.drawTextCanvas(item.TextOptions),
							scale: defaultValue(item.TextOptions.scale, 1),
							verticalOrigin: VerticalOrigin.CENTER,
							horizontalOrigin: HorizontalOrigin.CENTER,
							pixelOffset: defined(item.TextOptions.offset)
								? new Cartesian2(
										item.TextOptions.offset[0],
										item.TextOptions.offset[1],
								  )
								: new Cartesian2(0, 0),
							distanceDisplayCondition: defined(
								item.TextOptions.displayByDistance,
							)
								? new DistanceDisplayCondition(
										item.TextOptions.displayByDistance[0],
										item.TextOptions.displayByDistance[1],
								  )
								: new DistanceDisplayCondition(0, 100000000),
							scaleByDistance: defined(
								item.TextOptions.scaleByDistance,
							)
								? new NearFarScalar(
										item.TextOptions.scaleByDistance[0],
										item.TextOptions.scaleByDistance[1],
										item.TextOptions.scaleByDistance[2],
										item.TextOptions.scaleByDistance[3],
								  )
								: new NearFarScalar(0, 1, 1, 1),
						});
						temp.attributes = item.attributes;
					}
				}
				// 分段展示
				if (index > 0 && index % subNum == 0) {
					this.MapRegionLabel[option.key].push({
						type: "normal",
						points: texts,
						primitive: textPrimitive,
					});
					texts = new BillboardCollection();
					textPrimitive = this.viewer.scene.primitives.add(texts);
				}
			});
			// 存储
			this.MapRegionLabel[option.key].push({
				type: "normal",
				points: texts,
				primitive: textPrimitive,
			});
		} else if (option.type == "cluster") {
			// 分段聚合 解决数据量过大
			while (Math.floor(data.length / subNum) >= 1) {
				let sliceData = data.splice(0, subNum);
				this.clusterDataSource({
					key: option.key,
					data: sliceData,
				});
			}
			this.clusterDataSource({
				key: option.key,
				data: data,
			});
		}
	}

	/**
	 * @Author: dongnan
	 * @Description: 聚合entity
	 * @Date: 2021-10-22 10:34:06
	 * @param {*} data
	 * @param {*} key
	 * @param {*} clusterOptions
	 */
	clusterDataSource(option) {
		let self = this;
		let dataSourcePromise = this.viewer.dataSources.add(
			GeoJsonDataSource.load(this.toGeojson(option.data)),
		);
		dataSourcePromise.then((dataSource) => {
			// 设置聚合范围
			let rangeOptions = defaultValue(option.clusterOptions, {
				pixelRange: 10,
				minimumClusterSize: 2,
			});
			let pixelRange = defaultValue(rangeOptions.pixelRange, 10);
			let minimumClusterSize = defaultValue(
				rangeOptions.minimumClusterSize,
				2,
			);
			dataSource.clustering.enabled = true;
			dataSource.clustering.pixelRange = pixelRange;
			dataSource.clustering.minimumClusterSize = minimumClusterSize;
			// 添加聚合数据
			let entities = dataSource.entities.values;
			entities.some((entity) => {
				// 唯一标识 可触发点击事件
				entity.Key = "EntityPoints";
				let attr = entity.properties;
				entity.attributes = defined(attr.attributes)
					? attr.attributes._value
					: {};
				let val = entity.position._value;
				let height = defaultValue(attr.TextOptions._value.height, 0.0);
				let position = new Cartesian3(val.x, val.y, val.z + height);
				entity.billboard.show = false;
				if (defined(attr.TextOptions._value.image)) {
					let image = new Image();
					image.src = attr.TextOptions._value.image;
					image.onload = () => {
						let imageCanvas;
						if (defined(attr.TextOptions._value.text2)) {
							imageCanvas = self.drawDoubleTextCanvas(
								image,
								attr.TextOptions._value,
							);
						} else {
							imageCanvas = self.drawSingleTextCanvas(
								image,
								attr.TextOptions._value,
							);
						}
						entity.position = position;
						entity.billboard = {
							show: true,
							disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
							image: imageCanvas,
							scale: defaultValue(
								attr.TextOptions._value.scale,
								1,
							),
							verticalOrigin: VerticalOrigin.CENTER,
							horizontalOrigin: HorizontalOrigin.CENTER,
							pixelOffset: defined(attr.TextOptions._value.offset)
								? new Cartesian2(
										attr.TextOptions._value.offset[0],
										attr.TextOptions._value.offset[1],
								  )
								: new Cartesian2(0, 0),
							distanceDisplayCondition: defined(
								attr.TextOptions._value.displayByDistance,
							)
								? new DistanceDisplayCondition(
										attr.TextOptions._value.displayByDistance[0],
										attr.TextOptions._value.displayByDistance[1],
								  )
								: new DistanceDisplayCondition(0, 100000000),
							scaleByDistance: defined(
								attr.TextOptions._value.scaleByDistance,
							)
								? new NearFarScalar(
										attr.TextOptions._value.scaleByDistance[0],
										attr.TextOptions._value.scaleByDistance[1],
										attr.TextOptions._value.scaleByDistance[2],
										attr.TextOptions._value.scaleByDistance[3],
								  )
								: new NearFarScalar(0, 1, 1, 1),
						};
					};
				} else {
					entity.position = position;
					entity.billboard = {
						// show: true,
						disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
						image: self.drawTextCanvas(attr.TextOptions._value),
						scale: defaultValue(attr.TextOptions._value.scale, 1),
						verticalOrigin: VerticalOrigin.CENTER,
						horizontalOrigin: HorizontalOrigin.CENTER,
						pixelOffset: defined(attr.TextOptions._value.offset)
							? new Cartesian2(
									attr.TextOptions._value.offset[0],
									attr.TextOptions._value.offset[1],
							  )
							: new Cartesian2(0, 0),
						distanceDisplayCondition: defined(
							attr.TextOptions._value.displayByDistance,
						)
							? new DistanceDisplayCondition(
									attr.TextOptions._value.displayByDistance[0],
									attr.TextOptions._value.displayByDistance[1],
							  )
							: new DistanceDisplayCondition(0, 100000000),
						scaleByDistance: defined(
							attr.TextOptions._value.scaleByDistance,
						)
							? new NearFarScalar(
									attr.TextOptions._value.scaleByDistance[0],
									attr.TextOptions._value.scaleByDistance[1],
									attr.TextOptions._value.scaleByDistance[2],
									attr.TextOptions._value.scaleByDistance[3],
							  )
							: new NearFarScalar(0, 1, 1, 1),
					};
				}
			});
			// 监听聚合事件 更改聚合后样式
			let clusterEvent = function (entities, cluster) {
				cluster.label.show = false;
				cluster.billboard.show = false;
			};
			dataSource.clustering.clusterEvent.addEventListener(clusterEvent);
			// 存储
			this.MapRegionLabel[option.key].push({
				type: "cluster",
				points: entities,
				source: dataSource,
				event: clusterEvent,
			});
		});
	}

	/**
	 * @Author: dongnan
	 * @Description: 转换成geojson格式
	 * @Date: 2021-01-29 15:10:33
	 */
	toGeojson(list) {
		let jsons = [];
		for (let obj of list) {
			let json = {
				type: "Feature",
				geometry: {
					type: "Point",
					coordinates: [parseFloat(obj.x), parseFloat(obj.y)],
				},
				properties: obj,
			};
			jsons.push(json);
		}
		let geojson = {
			type: "FeatureCollection",
			features: jsons,
		};
		return geojson;
	}

	/**
	 * @Author: dongnan
	 * @Description: 画两个样式的文本canvas
	 * @Date: 2021-02-08 23:15:33
	 */
	async drawDoubleTextCanvas(img, textOptions) {
		let canvas = document.createElement("canvas");
		let context = canvas.getContext("2d");
		let text1 = "";
		let text2 = "";
		let padding1 = [20, 20, 20, 20];
		let padding2 = [20, 20, 20, 20];
		let font1 = "25px sans-serif";
		let font2 = "40px sans-serif";
		let fillStyle1 = "White";
		let fillStyle2 = "red";
		let strokeStyle1 = "#3e59a9";
		let strokeStyle2 = "#3e59a9";
		let fontSize1 = 25;
		let fontSize2 = 40;
		let textWidth = 0;
		let canvasWidth = 0;
		let canvasHeight = 0;
		if (defined(textOptions)) {
			text1 = defaultValue(textOptions.text, text1);
			text2 = defaultValue(textOptions.text2, text2);
			padding1 = defaultValue(textOptions.padding, padding1);
			padding2 = defaultValue(textOptions.padding2, padding2);
			// 第一个文字样式
			if (defined(textOptions.fontOptions)) {
				font1 = defaultValue(textOptions.fontOptions.font, font1);
				fillStyle1 = defaultValue(
					textOptions.fontOptions.fillColor,
					fillStyle1,
				);
				strokeStyle1 = defaultValue(
					textOptions.fontOptions.strokeColor,
					strokeStyle1,
				);
			}
			// 第二个文字样式
			if (defined(textOptions.fontOptions2)) {
				font2 = defaultValue(textOptions.fontOptions2.font, font2);
				fillStyle2 = defaultValue(
					textOptions.fontOptions2.fillColor,
					fillStyle2,
				);
				strokeStyle2 = defaultValue(
					textOptions.fontOptions2.strokeColor,
					strokeStyle2,
				);
			}
		}
		// 确认字的大小
		let fontArray1 = font1.split(" ");
		let fontArray2 = font2.split(" ");
		fontArray1.forEach((item) => {
			if (item.indexOf("px") >= 0) {
				fontSize1 = parseFloat(item);
				return;
			}
		});
		fontArray2.forEach((item) => {
			if (item.indexOf("px") >= 0) {
				fontSize2 = parseFloat(item);
				return;
			}
		});
		// 根据字的个数判断
		textWidth =
			fontSize1 * text1.trim().length + fontSize2 * text2.trim().length;
		// 设置padding[上,右,下,左]
		canvasWidth =
			padding1[1] + padding1[3] + textWidth + padding2[1] + padding2[3];
		canvasHeight =
			padding1[0] + fontSize1 + padding1[2] >
			padding2[0] + fontSize2 + padding2[2]
				? padding1[0] + fontSize1 + padding1[2]
				: padding2[0] + fontSize2 + padding2[2];
		// 设置canvas大小
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;
		// 绘制图片 100%填充
		let imgWidthScale = canvasWidth / img.width;
		let imgHeightScale = canvasHeight / img.height;
		context.scale(imgWidthScale, imgHeightScale);
		context.drawImage(img, 0, 0);
		context.scale(1 / imgWidthScale, 1 / imgHeightScale);
		await document.fonts.load(font1);
		await document.fonts.load(font2);
		// 绘制文字1
		context.lineWidth = 4;
		context.font = font1;
		context.strokeStyle = strokeStyle1;
		context.fillStyle = fillStyle1;
		context.strokeText(
			text1.trim(),
			padding1[3],
			padding1[0] + fontSize1 / 1.5,
		);
		context.fillText(
			text1.trim(),
			padding1[3],
			padding1[0] + fontSize1 / 1.5,
		);
		// 绘制文字2
		let textLength1 =
			text1.trim().length * fontSize1 + padding1[3] + padding1[1];
		context.lineWidth = 4;
		context.font = font2;
		context.strokeStyle = strokeStyle2;
		context.fillStyle = fillStyle2;
		context.strokeText(
			text2.trim(),
			textLength1 + padding2[3],
			padding2[0] + fontSize2 / 1.5,
		);
		context.fillText(
			text2.trim(),
			textLength1 + padding2[3],
			padding2[0] + fontSize2 / 1.5,
		);
		return canvas;
	}
	/**
	 * @Author: dongnan
	 * @Description: 画单样式文本canvas 内嵌型
	 * @Date: 2021-02-08 23:15:33
	 */
	async drawSingleTextCanvas(img, textOptions) {
		let canvas = document.createElement("canvas");
		let context = canvas.getContext("2d");
		let text = "";
		let padding = [20, 20, 20, 20];
		let font = "30px sans-serif";
		let fillStyle = "White";
		let strokeStyle = "#3e59a9";
		let fontSize = 30;
		let textWidth = 0;
		let textHeight = 0;
		let canvasWidth = 0;
		let canvasHeight = 0;
		if (defined(textOptions)) {
			text = defaultValue(textOptions.text, text);
			padding = defaultValue(textOptions.padding, padding);
			if (defined(textOptions.fontOptions)) {
				font = defaultValue(textOptions.fontOptions.font, font);
				fillStyle = defaultValue(
					textOptions.fontOptions.fillColor,
					fillStyle,
				);
				strokeStyle = defaultValue(
					textOptions.fontOptions.strokeColor,
					strokeStyle,
				);
			}
		}
		// 确认字的大小
		let fontArray = font.split(" ");
		fontArray.forEach((item) => {
			if (item.indexOf("px") >= 0) {
				fontSize = parseFloat(item);
				return;
			}
		});
		// 根据字的个数判断
		textWidth = fontSize * text.trim().length;
		textHeight = fontSize;
		// 设置padding[上,右,下,左]
		canvasWidth = padding[1] + padding[3] + textWidth;
		canvasHeight = padding[0] + padding[2] + textHeight;
		// 设置canvas大小
		canvas.width = canvasWidth;
		canvas.height = canvasHeight;
		// 绘制图片 100%填充
		let imgWidthScale = canvasWidth / img.width;
		let imgHeightScale = canvasHeight / img.height;
		context.scale(imgWidthScale, imgHeightScale);
		context.drawImage(img, 0, 0);
		// 绘制文字
		context.scale(1 / imgWidthScale, 1 / imgHeightScale);
		// context.lineWidth = 4;
		await document.fonts.load(font);
		context.font = font;
		context.strokeStyle = strokeStyle;
		context.fillStyle = fillStyle;
		context.strokeText(
			text.trim(),
			padding[3],
			padding[0] + fontSize / 1.5,
		);
		context.fillText(text.trim(), padding[3], padding[0] + fontSize / 1.5);
		return canvas;
	}
	/**
	 * @Author: dongnan
	 * @Description: 绘制文本canvas
	 * @Date: 2021-09-11 20:44:54
	 */
	async drawTextCanvas(textOptions) {
		let canvas = document.createElement("canvas");
		let context = canvas.getContext("2d");
		let font = "28px sans-serif";
		let fillStyle = "#4fa9cb";
		let strokeStyle = "#4fa9cb";
		let fontSize = 28;
		let text = "";
		if (defined(textOptions)) {
			text = defaultValue(textOptions.text.trim(), text);
			if (defined(textOptions.fontOptions)) {
				font = defaultValue(textOptions.fontOptions.font, font);
				fillStyle = defaultValue(
					textOptions.fontOptions.fillColor,
					fillStyle,
				);
				strokeStyle = defaultValue(
					textOptions.fontOptions.strokeColor,
					strokeStyle,
				);
			}
		}
		// 确认字的大小
		let fontArray = font.split(" ");
		fontArray.some((item) => {
			if (item.indexOf("px") >= 0) {
				fontSize = parseFloat(item);
				return true;
			}
		});
		canvas.width = fontSize * (text.length + 2);
		canvas.height = fontSize + 10;
		context.lineWidth = 2;
		await document.fonts.load(font);
		context.font = font;
		context.fillStyle = fillStyle;
		context.strokeStyle = strokeStyle;
		context.textAlign = "center";
		context.fillText(text, canvas.width / 2, fontSize);
		context.strokeText(text, canvas.width / 2, fontSize);
		return canvas;
	}
}

export default MapRegion;
