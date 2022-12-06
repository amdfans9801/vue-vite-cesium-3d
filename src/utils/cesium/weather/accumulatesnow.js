/**
 * Created by wqy
 * Date 2022/4/14 9:14
 * Description
 */
let prim=null;
let thisviewer=null;
let uniformdata=new Cesium.Cartesian4(0,0,1,0.8);
let thissnow=0.8
function AddAccumulateSnow(viewer,polygondegreesarray,originsnow) {
	thisviewer=viewer;
//增加一个groundprimitive
	prim = viewer.scene.primitives.add(new Cesium.GroundPrimitive({
		geometryInstances: new Cesium.GeometryInstance({
			
			geometry:new Cesium.PolygonGeometry({
				polygonHierarchy:new Cesium.PolygonHierarchy(
					Cesium.Cartesian3.fromDegreesArray(polygondegreesarray)
				)
			})
		}),
		
		
		
		


		appearance: new Cesium.MaterialAppearance({			
			flat:false,
			faceForward: true,
			
			material: new Cesium.Material({
				fabric: {
					uniforms: {
						uniformdata:uniformdata
					},
					source: 'uniform vec4 uniformdata;\n' +
						'czm_material czm_getMaterial(czm_materialInput materialInput) { \n' +
						'    czm_material material = czm_getDefaultMaterial(materialInput); \n' +						
						'float theta=dot(normalize(vec3(materialInput.normalEC)),uniformdata.xyz)/1.0;\n'+						
						'    material.diffuse =  vec3(1.0,1.0,1.0);\n' +						
						'    material.alpha = theta>=uniformdata.w?1.0:0.0;\n' +						
						'    return material; \n' +
						'} \n'
				}
			})
		}),
	}));
	viewer.scene.preUpdate.addEventListener(preupdatefunc)
}
function preupdatefunc() {
	let pitch=thisviewer.camera.pitch+Cesium.Math.PI/2;
	uniformdata.y=Math.sin(pitch);
	uniformdata.z=Math.cos(pitch);
	uniformdata.w=thissnow;
}
function RemoveAccumulateSnow() {
	if(thisviewer==null) return;
	if(prim==null) return;
	thisviewer.scene.preUpdate.removeEventListener(preupdatefunc);
	thisviewer.scene.primitives.remove(prim);

}
function UpdateAccumulateSnow(snow) {
	thissnow=snow;
}


