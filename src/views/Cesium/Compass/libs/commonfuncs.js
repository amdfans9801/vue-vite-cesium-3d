/**
 * Created by wqy
 * Date 2022/10/24 19:08
 * Description
 */
import * as Cesium from "cesium";
import coordinates from "./Coordinates.js";
function GetCamera(viewer) {
	let ellipsoid = viewer.scene.globe.ellipsoid;
	let cartesian3 = viewer.camera.position;
	let cartographic = ellipsoid.cartesianToCartographic(cartesian3);
	let lat = Cesium.Math.toDegrees(cartographic.latitude);
	let lng = Cesium.Math.toDegrees(cartographic.longitude);
	let alt = cartographic.height;
	return {
		longitude: lng,
		latitude: lat,
		height: alt,
		heading: Cesium.Math.toDegrees(viewer.camera.heading),
		pitch: Cesium.Math.toDegrees(viewer.camera.pitch),
		roll: Cesium.Math.toDegrees(viewer.camera.roll),
	};
}

//获取圆上另一个点
//第一个参数wgs84poi表示圆上已知点，第二个参数heading表示第一个参数对应的heading，第三个参数表示新点的heading，第四个参数表示原始点和返回点的倾斜角（相同）
//返回新点的wgs84poi经纬度坐标
function GetPointOnSameCircle(wgs84poi, heading, headingnew, pitch) {
	// heading=heading+180;
	// headingnew=headingnew+180;
	heading = 270 - heading;
	headingnew = 270 - headingnew;
	let planedis = wgs84poi.height / Math.tan(Cesium.Math.toRadians(0 - pitch));
	let mercatorpoi = coordinates.CoordinateMercator.fromWGS84(wgs84poi);
	// let x1=mercatorpoi.Mercator_X-planedis*Math.sin(Cesium.Math.toRadians(heading))+planedis*Math.sin(Cesium.Math.toRadians(headingnew));
	// let y1=mercatorpoi.Mercator_Y-planedis*Math.cos(Cesium.Math.toRadians(heading))+planedis*Math.cos(Cesium.Math.toRadians(headingnew));
	let x1 =
		mercatorpoi.Mercator_X -
		planedis * Math.cos(Cesium.Math.toRadians(heading)) +
		planedis * Math.cos(Cesium.Math.toRadians(headingnew));
	let y1 =
		mercatorpoi.Mercator_Y -
		planedis * Math.sin(Cesium.Math.toRadians(heading)) +
		planedis * Math.sin(Cesium.Math.toRadians(headingnew));
	return coordinates.CoordinateWGS84.fromMercatorxyh(x1, y1, wgs84poi.height);
}

//heading\pitch都为角度，roll目前全部传参为0 duration单位为秒
function FlyToWithDuration(latitude, longitude, height, heading, pitch, roll, duration, viewer) {
	if (duration === -1) {
		viewer.camera.flyTo({
			destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
			orientation: {
				heading: Cesium.Math.toRadians(heading),
				pitch: Cesium.Math.toRadians(pitch),
				roll: Cesium.Math.toRadians(roll),
			},
			maximumHeight: 10,
			// maximumHeight:10,
			// pitchAdjustHeight:10,
			//easingFunction : Cesium.EasingFunction.BACK_IN_OUT
		});
	}
	viewer.camera.flyTo({
		destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
		orientation: {
			heading: Cesium.Math.toRadians(heading),
			pitch: Cesium.Math.toRadians(pitch),
			roll: Cesium.Math.toRadians(roll),
		},
		duraion: duration,
	});
}

function GetPickedRayPositionWGS84(pos, viewer) {
	var ray = viewer.camera.getPickRay(pos);
	var x = Cesium.Math.toDegrees(ray.direction.x);
	var y = Cesium.Math.toDegrees(ray.direction.y);
	var z = Cesium.Math.toDegrees(ray.direction.z);
	var position = viewer.scene.globe.pick(ray, viewer.scene);
	var feature = viewer.scene.pick(pos);
	if (!feature || feature === null) {
		if (Cesium.defined(position)) {
			return coordinates.CoordinateWGS84.fromCatesian(position);
		}
	} else {
		var cartesian = viewer.scene.pickPosition(pos);
		if (Cesium.defined(cartesian)) {
			return coordinates.CoordinateWGS84.fromCatesianWithCartographic(cartesian);
		}
	}
	return null;
}

function SetCurrentTime(viewer, year, month, day, hour, minute, second, addsecond = 0) {
	var date = new Date(year, month - 1, day, hour, minute, second);
	date = new Date(date.getTime() + addsecond * 1000);
	var julian_time = Cesium.JulianDate.fromDate(date);
	viewer.clock.currentTime = julian_time;
}

//添加实体对象
function SetEntity(entity, viewer, replace = true) {
	let entityori = viewer.entities.getById(entity.id);
	if (entityori) {
		viewer.entities.remove(entityori);
	}
	return viewer.entities.add(entity);
}

//移除集合中指定id的实体对象
function RemoveEntityById(viewer, entityid) {
	viewer.entities.removeById(entityid);
}

function GetLerpWGS84(wgs84pos1, wgs84pos2, tpoint, viewer) {
	var cartesian1 = Cesium.Cartesian3.fromDegrees(wgs84pos1.longitude, wgs84pos1.latitude, wgs84pos1.height);
	var cartesian2 = Cesium.Cartesian3.fromDegrees(wgs84pos2.longitude, wgs84pos2.latitude, wgs84pos2.height);
	var cartesian3 = Cesium.Cartesian3.lerp(cartesian1, cartesian2, tpoint, new Object());
	var cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian3);
	return new coordinates.CoordinateWGS84(
		Cesium.Math.toDegrees(cartographic.longitude),
		Cesium.Math.toDegrees(cartographic.latitude),
		cartographic.height,
	);
}

function GetWindowPosFromWGS84(wgs84, viewer) {
	let car3 = Cesium.Cartesian3.fromDegrees(wgs84.longitude, wgs84.latitude, wgs84.height);
	return Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, car3);
}

function SetFogVisible(visible, viewer) {
	let stage = viewer.scene.postProcessStages._stages.find((stage) => stage && stage.name == "czm_fog");
	if (visible == true && stage == null) {
		viewer.scene.postProcessStages.add(
			new Cesium.PostProcessStage({
				name: "czm_fog",
				//sampleMode:PostProcessStageSampleMode.LINEAR,
				fragmentShader:
					"  uniform sampler2D colorTexture;\n" +
					"  uniform sampler2D depthTexture;\n" +
					"  varying vec2 v_textureCoordinates;\n" +
					"  void main(void)\n" +
					"  {\n" +
					"      vec4 origcolor=texture2D(colorTexture, v_textureCoordinates);\n" +
					"      vec4 fogcolor=vec4(0.8,0.8,0.8,0.5);\n" +
					"\n" +
					"      float depth = czm_readDepth(depthTexture, v_textureCoordinates);\n" +
					"      vec4 depthcolor=texture2D(depthTexture, v_textureCoordinates);\n" +
					"\n" +
					//"      float f=(depthcolor.r-0.22)/0.2;\n" +//修改后的线性雾
					"      float f=(depthcolor.r-0.2)/0.2;\n" + //第一次使用的线性雾"
					//"    float f=1.0-pow(2.71828,0.0-(depthcolor.r-0.28)/0.08);\n" +//修改后的指数雾
					"      if(f<0.0) f=0.0;\n" +
					"      else if(f>1.0) f=1.0;\n" +
					"      gl_FragColor = mix(origcolor,fogcolor,f);\n" +
					"   }",
			}),
		);
	} else if (visible == false && stage != null) {
		viewer.scene.postProcessStages.remove(stage);
	}
}

function SetSnowVisible(visible, viewer) {
	let stage = viewer.scene.postProcessStages._stages.find((stage) => stage && stage.name == "czm_snow");
	if (visible == true && stage == null) {
		viewer.scene.postProcessStages.add(
			new Cesium.PostProcessStage({
				name: "czm_snow",
				fragmentShader:
					"uniform sampler2D colorTexture; //输入的场景渲染照片\n" +
					"varying vec2 v_textureCoordinates;\n" +
					"\n" +
					"float snow(vec2 uv,float scale)\n" +
					"{\n" +
					"    float time = czm_frameNumber / 60.0;\n" +
					"    float w=smoothstep(1.0,0.0,-uv.y*(scale/10.));\n" +
					//  "    if(w<0.1)return 0.;\n" +//可以不需要
					"    uv+=time/scale;\n" +
					"    uv.y+=time*2./scale;\n" +
					// "    uv.x+=sin(uv.y+time*.5)/scale;\n" +
					"    uv.x+=sin(uv.y+time*0.5)/scale;\n" +
					"    uv*=scale;\n" +
					"    vec2 s=floor(uv),f=fract(uv),p;\n" +
					"    float k=3.,d;\n" +
					// "    p=.5+.35*sin(11.*fract(sin((s+scale)*mat2(7,3,6,5))*5.))-f;\n" +
					// "    p=sin((s)*mat2(1,0,1,0));\n" +
					"    p=.5+.35*sin(11.*fract(sin((s+scale)*mat2(7,3,6,5))*5.))-f;\n" +
					"    d=length(p);\n" +
					"    k=min(d,k);\n" +
					"    k=smoothstep(0.,k,sin(f.x+f.y)*0.01);\n" +
					"    return k*w;\n" +
					//"    return k;\n" +
					"}\n" +
					"\n" +
					"void main(void){\n" +
					"    vec2 resolution = czm_viewport.zw;\n" +
					"    vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);\n" +
					"    vec3 finalColor=vec3(0);\n" +
					"    //float c=smoothstep(1.,0.3,clamp(uv.y*.3+.8,0.,.75));\n" +
					"    float c = 0.0;\n" +
					"    c+=snow(uv,30.)*0.0;\n" + //没有用因为乘以系数0
					"    c+=snow(uv,20.)*0.0;\n" + //没有用因为乘以系数0
					"    c+=snow(uv,15.)*0.0;\n" + //没有用因为乘以系数0
					"    //c+=snow(uv,10.);\n" +
					"    c+=snow(uv,8.);\n" +
					"    c+=snow(uv,6.);\n" +
					"    c+=snow(uv,5.);\n" +
					"    finalColor=(vec3(c)); //屏幕上雪的颜色\n" +
					"    gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(finalColor,1), 0.5);  //将雪和三维场景融合\n" +
					"\n" +
					"}",
			}),
		);
	} else if (visible == false && stage != null) {
		viewer.scene.postProcessStages.remove(stage);
	}
}

function SetRainVisible(visible, viewer) {
	let stage = viewer.scene.postProcessStages._stages.find((stage) => stage && stage.name == "czm_rain");
	if (visible == true && stage == null) {
		viewer.scene.postProcessStages.add(
			new Cesium.PostProcessStage({
				name: "czm_rain",
				fragmentShader:
					"uniform sampler2D colorTexture;//输入的场景渲染照片\n" +
					"varying vec2 v_textureCoordinates;\n" +
					"\n" +
					"float hash(float x){\n" +
					"    return fract(sin(x*133.3)*13.13);\n" +
					"}\n" +
					"\n" +
					"void main(void){\n" +
					"\n" +
					"    float time = czm_frameNumber / 60.0;\n" +
					"    vec2 resolution = czm_viewport.zw;\n" +
					"\n" +
					"    vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);\n" +
					"    vec3 c=vec3(.6,.7,.8);\n" +
					"\n" +
					"    float a=-.4;//雨跟地面的夹角\n" +
					"    float si=sin(a),co=cos(a);\n" +
					"    uv*=mat2(co,-si,si,co);\n" +
					"    uv*=length(uv+vec2(0,4.9))*.3+1.;\n" +
					"\n" +
					"    float v=1.-sin(hash(floor(uv.x*100.))*2.);\n" +
					"    float b=clamp(abs(sin(20.*time*v+uv.y*(5./(2.+v))))-.95,0.,1.)*20.;\n" +
					"    c*=v*b; //屏幕上雨的颜色\n" +
					"\n" +
					"    gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(c,1), 0.5); //将雨和三维场景融合\n" +
					"}",
			}),
		);
	} else if (visible == false && stage != null) {
		viewer.scene.postProcessStages.remove(stage);
	}
}

export default {
	GetCamera,
	GetPointOnSameCircle,
	FlyToWithDuration,
	GetPickedRayPositionWGS84,
	SetCurrentTime,
	SetEntity,
	RemoveEntityById,
	GetLerpWGS84,
	GetWindowPosFromWGS84,
	SetFogVisible,
	SetSnowVisible,
	SetRainVisible,
};
