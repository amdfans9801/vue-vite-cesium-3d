import * as Cesium from "cesium";
import * as h337 from "heatmapjs";
/**
 * @Author: dongnan
 * @Description:
 * @Date: 2021-11-19 22:06:23
 * @param {Cesium.Viewer} viewer
 * @param {Array} extent 范围
 * @param {Boolean} autoRefresh 默认不实时刷新 false
 * @param {Boolean} isOverBuild 默认置于3dtiles之上 true
 * @param {Object} heatOptions {radiusFactor,spacingFactor,maxOpacity,minOpacity,blur,gradient,maxRadius,minRadius,minLevel,maxLevel}
 */
export default class CesiumHeatMap {
	constructor(option) {
		if (!option.extent) return null;
		this.WMP = new Cesium.WebMercatorProjection();
		this._viewer = option.viewer;
		this._autoRefresh = Cesium.defaultValue(option.autoRefresh, false);
		this.isOverBuild = Cesium.defaultValue(option.isOverBuild, true);
		this.min = 0;
		this.max = 0;
		this._defaults = {
			useEntitiesIfAvailable: true, //whether to use entities if a Viewer is supplied or always use an ImageryProvider
			minCanvasSize: 700, // minimum size (in pixels) for the heatmap canvas
			maxCanvasSize: 2000, // maximum size (in pixels) for the heatmap canvas
			radiusFactor: 60, // data point size factor used if no radius is given (the greater of height and width divided by this number yields the used radius)
			spacingFactor: 1.5, // extra space around the borders (point radius multiplied by this number yields the spacing)
			maxOpacity: 0.8, // the maximum opacity used if not given in the heatmap options object
			minOpacity: 0.1, // the minimum opacity used if not given in the heatmap options object
			blur: 0.85, // the blur used if not given in the heatmap options object
			radius: 40,
			gradient: {
				0.25: "rgb(0,0,255)",
				0.55: "rgb(0,255,0)",
				0.85: "yellow",
				1.0: "rgb(255,0,0)",
			},
		};
		this._options = Cesium.defaultValue(option.heatOptions, {});
		this._id = this._getID();
		this._options.radius = this._options.radius
			? this._options.radius
			: this._defaults.radius;
		this._options.gradient = this._options.gradient
			? this._options.gradient
			: this._defaults.gradient;
		this._options.maxOpacity = this._options.maxOpacity
			? this._options.maxOpacity
			: this._defaults.maxOpacity;
		this._options.minOpacity = this._options.minOpacity
			? this._options.minOpacity
			: this._defaults.minOpacity;
		this._options.blur = this._options.blur
			? this._options.blur
			: this._defaults.blur;
		this.autoRadiusConfig = {
			minLevel: 1,
			maxLevel: 18,
			maxRadius: 50,
			minRadius: 10,
		};
		this.autoRadiusConfig.minLevel = Cesium.defaultValue(
			this._options.minLevel,
			this.autoRadiusConfig.minLevel,
		);
		this.autoRadiusConfig.maxLevel = Cesium.defaultValue(
			this._options.maxLevel,
			this.autoRadiusConfig.maxLevel,
		);
		this.autoRadiusConfig.maxRadius = Cesium.defaultValue(
			this._options.maxRadius,
			this.autoRadiusConfig.maxRadius,
		);
		this.autoRadiusConfig.minRadius = Cesium.defaultValue(
			this._options.minRadius,
			this.autoRadiusConfig.minRadius,
		);
		this._mbounds = this.wgs84ToMercatorBB({
			west: option.extent[0],
			south: option.extent[1],
			east: option.extent[2],
			north: option.extent[3],
		});
		this._setWidthAndHeight(this._mbounds);
		this._options.radius = Math.round(
			this._options.radius
				? this._options.radius
				: this.width > this.height
				? this.width / this._defaults.radiusFactor
				: this.height / this._defaults.radiusFactor,
		);
		this._spacing = this._options.radius * this._defaults.spacingFactor;
		this._xoffset = this._mbounds.west;
		this._yoffset = this._mbounds.south;
		this.width = Math.round(this.width + this._spacing * 2);
		this.height = Math.round(this.height + this._spacing * 2);
		this._mbounds.west -= this._spacing * this._factor;
		this._mbounds.east += this._spacing * this._factor;
		this._mbounds.south -= this._spacing * this._factor;
		this._mbounds.north += this._spacing * this._factor;
		this.bounds = this.mercatorToWgs84BB(this._mbounds);
		this._rectangle = Cesium.Rectangle.fromDegrees(
			this.bounds.west,
			this.bounds.south,
			this.bounds.east,
			this.bounds.north,
		);
		this._container = this._getContainer(this.width, this.height, this._id);
		this._options.container = this._container;
		this._heatmap = h337.create(this._options);
		this._container.children[0].setAttribute("id", this._id + "-hm");
	}
	wgs84PointToHeatmapPoint(p) {
		return this.mercatorPointToHeatmapPoint(this.wgs84ToMercator(p));
	}
	mercatorPointToHeatmapPoint(p) {
		let pn = {};
		pn.x = Math.round((p.x - this._xoffset) / this._factor + this._spacing);
		pn.y = Math.round((p.y - this._yoffset) / this._factor + this._spacing);
		pn.y = this.height - pn.y;
		return pn;
	}
	_setWidthAndHeight(mbb) {
		this.width =
			mbb.east > 0 && mbb.west < 0
				? mbb.east + Math.abs(mbb.west)
				: Math.abs(mbb.east - mbb.west);
		this.height =
			mbb.north > 0 && mbb.south < 0
				? mbb.north + Math.abs(mbb.south)
				: Math.abs(mbb.north - mbb.south);
		this._factor = 1;

		if (
			this.width > this.height &&
			this.width > this._defaults.maxCanvasSize
		) {
			this._factor = this.width / this._defaults.maxCanvasSize;

			if (this.height / this._factor < this._defaults.minCanvasSize) {
				this._factor = this.height / this._defaults.minCanvasSize;
			}
		} else if (
			this.height > this.width &&
			this.height > this._defaults.maxCanvasSize
		) {
			this._factor = this.height / this._defaults.maxCanvasSize;

			if (this.width / this._factor < this._defaults.minCanvasSize) {
				this._factor = this.width / this._defaults.minCanvasSize;
			}
		} else if (
			this.width < this.height &&
			this.width < this._defaults.minCanvasSize
		) {
			this._factor = this.width / this._defaults.minCanvasSize;

			if (this.height / this._factor > this._defaults.maxCanvasSize) {
				this._factor = this.height / this._defaults.maxCanvasSize;
			}
		} else if (
			this.height < this.width &&
			this.height < this._defaults.minCanvasSize
		) {
			this._factor = this.height / this._defaults.minCanvasSize;

			if (this.width / this._factor > this._defaults.maxCanvasSize) {
				this._factor = this.width / this._defaults.maxCanvasSize;
			}
		}
		this.width = this.width / this._factor;
		this.height = this.height / this._factor;
	}
	/**
	 * @Author: dongnan
	 * @Description: 设置数据
	 * @Date: 2021-11-20 14:12:18
	 * @param {*} data
	 */
	setWGS84Data(data) {
		let convdata = [];
		for (let i = 0; i < data.length; i++) {
			let gp = data[i];
			let hp = this.wgs84PointToHeatmapPoint(gp);
			if (gp.value || gp.value === 0) {
				hp.value = gp.value;
			}
			this.updateMaxMin(hp.value);
			convdata.push(hp);
		}
		this._data = convdata;
		this.updateCesium();
		// 移除已有事件
		if (this.cameraMoveEnd) {
			this._viewer.camera.moveEnd.removeEventListener(this.cameraMoveEnd);
		}
		// 添加新事件
		if (this._autoRefresh) {
			this.cameraMoveEnd = () => this.updateCesium();
			this._viewer.camera.moveEnd.addEventListener(this.cameraMoveEnd);
		}
	}
	/**
	 * @Author: dongnan
	 * @Description: 移除热力图
	 * @Date: 2021-11-20 14:12:11
	 * @param {*}
	 */
	remove() {
		// 移除已有事件
		if (this.cameraMoveEnd) {
			this._viewer.camera.moveEnd.removeEventListener(this.cameraMoveEnd);
		}
		if (this.isOverBuild) {
			if (this._layer) {
				this._viewer.entities.remove(this._layer);
			}
		} else {
			if (this._layer) {
				this._viewer.scene.imageryLayers.remove(this._layer);
			}
		}
	}
	/**
	 * @Author: dongnan
	 * @Description: 更新cesium上数据
	 * @Date: 2021-11-19 23:10:01
	 * @param {*}
	 */
	updateCesium() {
		this.updateHeatmap();
		// 置于模型上面 则用entity方式
		if (this.isOverBuild) {
			let material = new Cesium.ImageMaterialProperty({
				image: this._heatmap._renderer.canvas,
			});
			material.transparent = true;
			if (this._layer) {
				this._layer.rectangle.material = material;
			} else {
				this._layer = this._viewer.entities.add({
					show: true,
					rectangle: {
						coordinates: this._rectangle,
						material: material,
					},
				});
			}
		} else {
			if (this._layer) {
				this._viewer.scene.imageryLayers.remove(this._layer);
			}
			this._layer = this._viewer.scene.imageryLayers.addImageryProvider(
				this._getImageryProvider(this),
			);
		}
	}
	/**
	 * 按当前的相机高度调整点的辐射（越高，越大）
	 */
	updateHeatmap() {
		const { minLevel, maxLevel, minRadius, maxRadius } =
			this.autoRadiusConfig;
		let cartograhphic =
			this._viewer.scene.globe.ellipsoid.cartesianToCartographic(
				this._viewer.camera.position,
			);
		let height = cartograhphic.height;
		let ratio = (this.getLevel(height) - minLevel) / (maxLevel - minLevel);
		if (ratio < 0) {
			ratio = 0;
		} else if (ratio >= 1) {
			ratio = 1;
		}
		let newRadius = parseInt(
			minRadius + (maxRadius - minRadius) * (1 - ratio),
		);
		this._heatmap.setData({
			max: this.max,
			min: this.min,
			data: this._data.map(({ x, y, value }) => {
				return {
					x,
					y,
					value,
					radius: newRadius,
				};
			}),
		});
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
	 * 更新最大值最小值
	 * @param {number} value
	 */
	updateMaxMin(value) {
		this.max = Math.max(value, this.max);
		this.min = Math.min(value, this.min);
	}
	_getContainer(width, height, id) {
		let c = document.createElement("div");
		if (id) {
			c.setAttribute("id", id);
		}
		c.setAttribute(
			"style",
			"width: " +
				width +
				"px; height: " +
				height +
				"px; margin: 0px; display: none;",
		);
		document.body.appendChild(c);
		return c;
	}
	_getImageryProvider() {
		let d = this._heatmap.getDataURL();
		let imgprov = new Cesium.SingleTileImageryProvider({
			url: d,
			rectangle: this._rectangle,
		});
		imgprov._tilingScheme = new Cesium.WebMercatorTilingScheme({
			rectangleSouthwestInMeters: new Cesium.Cartesian2(
				this._mbounds.west,
				this._mbounds.south,
			),
			rectangleNortheastInMeters: new Cesium.Cartesian2(
				this._mbounds.east,
				this._mbounds.north,
			),
		});
		return imgprov;
	}
	_getID(len) {
		let text = "";
		let possible =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (let i = 0; i < (len ? len : 8); i++)
			text += possible.charAt(
				Math.floor(Math.random() * possible.length),
			);

		return text;
	}
	/*  Convert a WGS84 location into a mercator location
	 *
	 *  p: the WGS84 location like {x: lon, y: lat}
	 */
	wgs84ToMercator(p) {
		let mp = this.WMP.project(Cesium.Cartographic.fromDegrees(p.x, p.y));
		return {
			x: mp.x,
			y: mp.y,
		};
	}
	/*  Convert a WGS84 bounding box into a mercator bounding box
	 *
	 *  bb: the WGS84 bounding box like {north, east, south, west}
	 */
	wgs84ToMercatorBB(bb) {
		let sw = this.WMP.project(
			Cesium.Cartographic.fromDegrees(bb.west, bb.south),
		);
		let ne = this.WMP.project(
			Cesium.Cartographic.fromDegrees(bb.east, bb.north),
		);
		return {
			north: ne.y,
			east: ne.x,
			south: sw.y,
			west: sw.x,
		};
	}

	/*  Convert a mercator location into a WGS84 location
	 *
	 *  p: the mercator lcation like {x, y}
	 */
	mercatorToWgs84(p) {
		let wp = this.WMP.unproject(new Cesium.Cartesian3(p.x, p.y));
		return {
			x: wp.longitude,
			y: wp.latitude,
		};
	}

	/*  Convert a mercator bounding box into a WGS84 bounding box
	 *
	 *  bb: the mercator bounding box like {north, east, south, west}
	 */
	mercatorToWgs84BB(bb) {
		let sw = this.WMP.unproject(new Cesium.Cartesian3(bb.west, bb.south));
		let ne = this.WMP.unproject(new Cesium.Cartesian3(bb.east, bb.north));
		return {
			north: this.rad2deg(ne.latitude),
			east: this.rad2deg(ne.longitude),
			south: this.rad2deg(sw.latitude),
			west: this.rad2deg(sw.longitude),
		};
	}

	/*  Convert degrees into radians
	 *
	 *  d: the degrees to be converted to radians
	 */
	deg2rad(d) {
		let r = d * (Math.PI / 180.0);
		return r;
	}

	/*  Convert radians into degrees
	 *
	 *  r: the radians to be converted to degrees
	 */
	rad2deg(r) {
		let d = r / (Math.PI / 180.0);
		return d;
	}
}
