/**
 * @Date: 2022.12.09
 * @Author: ywq
 * @Description: 试图使用粒子特效局部添加雨雪雾等天气特效
 */

import { Cartesian2, Cartesian3, ParticleSystem, Color, CircleEmitter, BoxEmitter, ConeEmitter, TranslationRotationScale, Quaternion, Matrix4, HeadingPitchRoll } from "cesium";


// 添加下雪粒子特效
function setRainParticle(position){
	let _position = Cartesian3.fromDegrees(position.position_x, position.position_y, position.position_z);
    let _degree = {degree_x: 0, degree_y: 180, degree_z: 0};// 粒子发射器的朝向角度
    let _translation = { translation_x: 0, translation_y: 0, translation_z: 0 }// 粒子发射器偏移的位置
	let hole = window.viewer.entities.add({ position: _position});
	let rainparticle = new ParticleSystem({
		image: new URL('../assets/smoke.png', import.meta.url).href,
		startColor: new Color(1, 1, 1, 0.7),
		endColor: new Color(1, 1, 1, 0.5),
		startScale: 1,
		endScale: 1,
		minimumParticleLife: 3,//粒子寿命的可能持续时间的最小界限（以秒为单位），超过该界限，将随机选择粒子的实际寿命
		maximumParticleLife: 10,
		minimumSpeed: 1,//设置将随机选择粒子的实际速度的最小界限（米/秒）
		maximumSpeed: 1,
		imageSize: new Cartesian2(6, 6),//以像素为单位缩放粒子图像尺寸
		emissionRate: 20,//每秒要发射的粒子数
		lifetime: 20.0,//粒子系统发射粒子的时间（秒）
		speed: 80,
		emitter: new CircleEmitter(500),//此系统的粒子发射器的发射范围
		//emitter: new Cesium.BoxEmitter(new Cesium.Cartesian3(0,1.2,6)),	
		//emitter: new Cesium.ConeEmitter(90),
		// modelMatrix: computeModelMatrix(hole),//将粒子系统从模型变换为世界坐标的4x4变换矩阵
		emitterModelMatrix: computeEmitterModelMatrix(_degree, _translation),//4x4变换矩阵，用于在粒子系统粒子发射器的朝向角度
    	// emitterModelMatrix: computeEmitterModelMatrix(),
		//updateCallback: callback,
	});
	viewer.scene.preUpdate.addEventListener(function (scene, time) {
		rainparticle.modelMatrix = computeModelMatrix(hole, time);
		//rainparticle.emitterModelMatrix = computeEmitterModelMatrix();
	});
	window.viewer.scene.primitives.add(rainparticle);
}

function computeModelMatrix(entity, time) {
	return entity.computeModelMatrix(time, new Matrix4());
}

//用来设置该粒子系统的位置
// function computeModelMatrix(entity, time){
// 	var position = Cesium.Property.getValueOrUndefined(entity.position, time);
// 	let modelMartrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);
// 	return modelMartrix;
// }

//控制粒子系统中粒子发射器的朝向角度
function computeEmitterModelMatrix(degree, translation){
	const trs = new TranslationRotationScale();
	const rotation = new Quaternion();
	const emitterModelMatrix = new Matrix4();
	const hpr = HeadingPitchRoll.fromDegrees(degree.degree_x, degree.degree_y, degree.degree_z);
	trs.translation = Cartesian3.fromElements(translation.translation_x, translation.translation_y, translation.translation_z);
	trs.rotation = Quaternion.fromHeadingPitchRoll(hpr, rotation);
	return Matrix4.fromTranslationRotationScale(trs, emitterModelMatrix);
}

// 粒子模拟一个乌云
function setDarkCloudParticle(position) {
    let _position = Cartesian3.fromDegrees(position.position_x, position.position_y, position.position_z);
    let _degree = {degree_x: 180, degree_y: 0, degree_z: 0};// 粒子发射器的朝向角度
    let _translation = { translation_x: 0, translation_y: 0, translation_z: 0 }// 粒子发射器偏移的位置
	let hole = window.viewer.entities.add({ position: _position});
	let darkcloudparticle = new ParticleSystem({
		image: new URL('../assets/smoke.png', import.meta.url).href,
		startColor: new Color(178/255, 184/255, 191/255, 0.7),
		endColor: new Color(56/255, 63/255, 71/255, 0.7),
		startScale: 1,
		endScale: 1,
		minimumParticleLife: 3,//粒子寿命的可能持续时间的最小界限（以秒为单位），超过该界限，将随机选择粒子的实际寿命
		maximumParticleLife: 10,
		minimumSpeed: 1,//设置将随机选择粒子的实际速度的最小界限（米/秒）
		maximumSpeed: 1,
		imageSize: new Cartesian2(100, 100),//以像素为单位缩放粒子图像尺寸
		emissionRate: 20,//每秒要发射的粒子数
		lifetime: 20.0,//粒子系统发射粒子的时间（秒）
		speed: 10,
		// emitter: new CircleEmitter(500),//此系统的粒子发射器的发射范围
		emitter: new BoxEmitter(new Cartesian3(500,500,20)),// 盒子形状的粒子发射器范围，随机在盒子内生成粒子，三个参数分别是盒子的长宽高
		// emitter: new Cesium.ConeEmitter(90),
		// modelMatrix: computeModelMatrix(hole),//将粒子系统从模型变换为世界坐标的4x4变换矩阵
		emitterModelMatrix: computeEmitterModelMatrix(_degree, _translation),//4x4变换矩阵，用于在粒子系统粒子发射器的朝向角度
    	// emitterModelMatrix: computeEmitterModelMatrix(),
		//updateCallback: callback,
	});
	viewer.scene.preUpdate.addEventListener(function (scene, time) {
		darkcloudparticle.modelMatrix = computeModelMatrix(hole, time);
		//rainparticle.emitterModelMatrix = computeEmitterModelMatrix();
	});
	window.viewer.scene.primitives.add(darkcloudparticle);
}

export {
    setRainParticle, setDarkCloudParticle
}
