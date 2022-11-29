import {
	Viewer,
	SingleTileImageryProvider,
	ScreenSpaceEventType,
	CameraEventType,
	FeatureDetection,
	Color,
	ScreenSpaceEventHandler,
	Ellipsoid,
	Math as CesiumMath,
	defined,
	SceneMode,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
export function initViewer(containerId = "CesiumMap", mode) {
	let options = {
		orderIndependentTranslucency: false,
		contextOptions: {
			webgl: {
				alpha: true,
				reserveDrawingBuffer: true,
				useDefaultRenderLoop: true,
				willReadFrequently: true,
			},
		},
		imageryProvider: new SingleTileImageryProvider({
			url: new URL("../../assets/images/cesium/globe.png", import.meta.url).href,
		}),
		skyAtmosphere: false,
		selectionIndicator: false,
		animation: false, //是否显示动画控件
		baseLayerPicker: false, //是否显示图层选择控件
		geocoder: false, //是否显示地名查找控件
		timeline: false, //是否显示时间线控件
		sceneModePicker: false, //模式切换
		navigationHelpButton: false, //是否显示帮助信息控件
		infoBox: false, //是否显示点击要素之后显示的信息
		fullscreenButton: false, //全屏
		homeButton: false, //主页,
		shouldAnimate: true,
		sceneMode: mode == "2d" ? SceneMode.SCENE2D : SceneMode.SCENE3D,
	};
	let viewer = new Viewer(containerId, options);
	viewer.scene.skyBox.show = false;
	viewer._cesiumWidget._creditContainer.style.display = "none"; //取消版权信息
	viewer.scene.globe.depthTestAgainstTerrain = true;
	//去除默认双击事件
	viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
	//设置鼠标中键
	viewer.scene.screenSpaceCameraController.zoomEventTypes = [CameraEventType.WHEEL, CameraEventType.PINCH];
	viewer.scene.screenSpaceCameraController.tiltEventTypes = [CameraEventType.PINCH, CameraEventType.RIGHT_DRAG];
	//开启抗锯齿
	if (FeatureDetection.supportsImageRenderingPixelated()) {
		//判断是否支持图像渲染像素化处理
		viewer.resolutionScale = window.devicePixelRatio;
	}
	viewer.scene.fxaa = true;
	viewer.scene.postProcessStages.fxaa.enabled = true;
	viewer.scene.globe.baseColor = new Color(0, 0, 0, 0);
	let handler = new ScreenSpaceEventHandler(viewer.canvas);
	handler.setInputAction(function (movement) {
		let cartesian = viewer.scene.pickPosition(movement.position);
		if (cartesian) {
			let cartographic = Ellipsoid.WGS84.cartesianToCartographic(cartesian);
			let lon = CesiumMath.toDegrees(cartographic.longitude);
			let lat = CesiumMath.toDegrees(cartographic.latitude);
			let height = cartographic.height;
			let extent = getExtent(viewer);
			let padding = [0, 0, 0, 0];
			let topOffset = degreeToMeter(extent[3] - lat);
			let rightOffset = degreeToMeter(extent[2] - lon);
			let bottomOffset = degreeToMeter(lat - extent[1]);
			let leftOffset = degreeToMeter(lon - extent[0]);
			padding = [topOffset, rightOffset, bottomOffset, leftOffset];
			console.log("点击的经纬度坐标为:" + lon + "," + lat + " 海拔高度:" + height + "m");
			// console.log("当前视域范围:" + extent);
			// console.log("偏移:" + padding);
		}
	}, ScreenSpaceEventType.LEFT_CLICK);
	// 图层控制扩展方法
	layerControl(viewer);
	// debugView(viewer);
	return viewer;
}
/**
 * @Author: dongnan
 * @Description: 开发调试
 * @Date: 2021-08-01 13:02:09
 * @param {*} viewer
 */
function debugView(viewer) {
	let handler = new ScreenSpaceEventHandler(viewer.canvas);
	handler.setInputAction(function (movement) {
		let pickedFeature = viewer.scene.pick(movement.endPosition);
		if (
			defined(pickedFeature) &&
			defined(pickedFeature.collection) &&
			defined(pickedFeature.collection.Type) &&
			pickedFeature.collection.Type == "PrimitivePoints"
		) {
			viewer._container.style.cursor = "pointer";
		} else {
			viewer._container.style.cursor = "default";
		}
	}, ScreenSpaceEventType.MOUSE_MOVE);
	viewer.camera.percentageChanged = 0.001;
	viewer.camera.changed.addEventListener(function (moveEndPosition) {
		let ellipsoid = viewer.scene.globe.ellipsoid;
		let cartesian3 = viewer.camera.position;
		let cartograhphic = ellipsoid.cartesianToCartographic(cartesian3);
		let lat = CesiumMath.toDegrees(cartograhphic.latitude);
		let lng = CesiumMath.toDegrees(cartograhphic.longitude);
		let alt = cartograhphic.height;
		console.log("位置:" + cartesian3);
		console.log("相机高度:" + alt);
		console.log("heading:", viewer.camera.heading + "," + "pitch:" + viewer.camera.pitch + "," + "roll:" + viewer.camera.roll);
	});
}
/**
 * @Author: dongnan
 * @Description: 图层控制
 * @Date: 2022-11-15 17:12:57
 * @param {Cesium.Viewer} viewer
 */
function layerControl(viewer) {
	// 图层控制
	let proxy = new Proxy(viewer, {});
	// id
	proxy.layerIndex = 0;
	proxy.layerId = 10;
	proxy.terrainId = 99;
	proxy.resourceId = 100;
	// 底图
	proxy.layers = [];
	// 地形
	proxy.terrain;
	// 三维资源
	proxy.resources = [];
	proxy.bgLayer = proxy.imageryLayers.get(0);
	proxy.bgLayer.alpha = 0.0;
	proxy.imageryLayers.remove(proxy.bgLayer, false);
	/**
	 * @Author: dongnan
	 * @Description:添加底图
	 * @Date: 2022-11-15 13:27:24
	 * @param {Object} obj {provider,name,show}
	 */
	proxy.addLayer = (obj) => {
		let layer;
		let layerIndex = proxy.layerIndex++;
		if (obj?.show) {
			layer = proxy.imageryLayers.addImageryProvider(obj.provider, layerIndex);
		} else {
			proxy.imageryLayers.add(proxy.bgLayer, layerIndex);
		}
		proxy.layers.push({
			layer: layer,
			provider: obj.provider,
			label: obj.name,
			id: ++proxy.layerId,
			show: obj?.show ?? false,
			index: layerIndex,
		});
	};
	/**
	 * @Author: dongnan
	 * @Description: 添加地形
	 * @Date: 2022-11-15 14:01:54
	 * @param {Object} obj {provider,name,show}
	 */
	proxy.addTerrain = (obj) => {
		proxy.terrainProvider = obj.provider;
		if (obj.show) {
			proxy.terrainProvider = obj.provider;
		}
		proxy.terrain = {
			provider: obj.provider,
			label: obj.name,
			id: proxy.terrainId,
			show: obj?.show ?? false,
		};
	};
	/**
	 * @Author: dongnan
	 * @Description: 添加三维数据
	 * @Date: 2022-11-15 14:07:24
	 * @param {Object} obj
	 * @param {string} obj.type 类型
	 * @param {Object} obj.data 数据
	 * @param {string} obj.name 名称
	 * @param {string} obj.show 显示
	 */
	proxy.addResource = (obj) => {
		obj.data.show = obj.show;
		proxy.resources.push({
			id: ++proxy.resourceId,
			type: obj.type,
			data: obj.data,
			show: obj.show,
			label: obj.name,
		});
	};
}
/**
 * @Author: dongnan
 * @Description: 获取视域范围
 * @Date: 2022-01-04 10:31:27
 * @param {*} viewer
 */
function getExtent(viewer) {
	let rectangle = viewer.camera.computeViewRectangle();
	let extent = [
		CesiumMath.toDegrees(rectangle.west),
		CesiumMath.toDegrees(rectangle.south),
		CesiumMath.toDegrees(rectangle.east),
		CesiumMath.toDegrees(rectangle.north),
	];
	return extent;
}
/**
 * @Author: dongnan
 * @Description: 计算画布中心距离为1px的两点的实际距离 单位米
 * @Date: 2021-07-31 17:45:25
 * @param {*} viewer
 */
function getResolution(viewer) {
	let scene = viewer.scene;
	// 获取画布的大小
	let width = scene.canvas.clientWidth;
	let height = scene.canvas.clientHeight;
	//获取画布中心两个像素的坐标（默认地图渲染在画布中心位置）
	let left = scene.camera.getPickRay(new Cartesian2((width / 2) | 0, (height - 1) / 2));
	let right = scene.camera.getPickRay(new Cartesian2((1 + width / 2) | 0, (height - 1) / 2));
	let globe = scene.globe;
	let leftPosition = globe.pick(left, scene);
	let rightPosition = globe.pick(right, scene);
	if (!defined(leftPosition) || !defined(rightPosition)) {
		return;
	}
	let leftCartographic = globe.ellipsoid.cartesianToCartographic(leftPosition);
	let rightCartographic = globe.ellipsoid.cartesianToCartographic(rightPosition);
	let geodesic = new EllipsoidGeodesic();
	geodesic.setEndPoints(leftCartographic, rightCartographic);
	let distance = geodesic.surfaceDistance / 1000; //分辨率
	return distance;
}
/**
 * @Author: dongnan
 * @Description: 经纬度转米(EPSG:4326)
 * @Date: 2022-01-04 13:54:05
 * @param {*} degree
 */
function degreeToMeter(degree) {
	let meter = (degree / 360) * (2 * Math.PI * 6371004);
	return meter;
}
