import {
	Cartesian3,
	ComponentDatatype,
	PrimitiveType,
	BoundingSphere,
	GeometryAttribute,
	GeometryAttributes,
	GeometryPipeline,
	Geometry,
} from "cesium";
class TetrahedronGeometry {
	constructor(option) {
		const negativeRootTwoOverThree = -Math.sqrt(2.0) / 3.0;
		const negativeOneThird = -1.0 / 3.0;
		const rootSixOverThree = Math.sqrt(6.0) / 3.0;
		let positions = new Float64Array(4 * 3 * 3); // 4个三角形，每个有3个坐标，一个坐标有3个float分量
		// back triangle
		positions[0] = 0.0;
		positions[1] = 0.0;
		positions[2] = 1.0;
		positions[3] = 0.0;
		positions[4] = (2.0 * Math.sqrt(2.0)) / 3.0;
		positions[5] = negativeOneThird;
		positions[6] = -rootSixOverThree;
		positions[7] = negativeRootTwoOverThree;
		positions[8] = negativeOneThird;

		// left triangle
		positions[9] = 0.0;
		positions[10] = 0.0;
		positions[11] = 1.0;
		positions[12] = -rootSixOverThree;
		positions[13] = negativeRootTwoOverThree;
		positions[14] = negativeOneThird;
		positions[15] = rootSixOverThree;
		positions[16] = negativeRootTwoOverThree;
		positions[17] = negativeOneThird;

		// right triangle
		positions[18] = 0.0;
		positions[19] = 0.0;
		positions[20] = 1.0;
		positions[21] = rootSixOverThree;
		positions[22] = negativeRootTwoOverThree;
		positions[23] = negativeOneThird;
		positions[24] = 0.0;
		positions[25] = (2.0 * Math.sqrt(2.0)) / 3.0;
		positions[26] = negativeOneThird;

		// bottom triangle
		positions[27] = -rootSixOverThree;
		positions[28] = negativeRootTwoOverThree;
		positions[29] = negativeOneThird;
		positions[30] = 0.0;
		positions[31] = (2.0 * Math.sqrt(2.0)) / 3.0;
		positions[32] = negativeOneThird;
		positions[33] = rootSixOverThree;
		positions[34] = negativeRootTwoOverThree;
		positions[35] = negativeOneThird;

		var indices = new Uint16Array(4 * 3); // 12个顶点索引，各自独立

		// back triangle
		indices[0] = 0;
		indices[1] = 1;
		indices[2] = 2;

		// left triangle
		indices[3] = 3;
		indices[4] = 4;
		indices[5] = 5;

		// right triangle
		indices[6] = 6;
		indices[7] = 7;
		indices[8] = 8;

		// bottom triangle
		indices[9] = 9;
		indices[10] = 10;
		indices[11] = 11;
		const attributes = new GeometryAttributes({
			position: new GeometryAttribute({
				componentDatatype: ComponentDatatype.DOUBLE,
				componentsPerAttribute: 3,
				values: positions,
			}),
		});
		// ... 上面省略
		const boundingSphere = new BoundingSphere(
			new Cartesian3(0.0, 0.0, 0.0),
			1.0,
		);
		// 主要是改这里
		const geometry = GeometryPipeline.computeNormal(
			new Geometry({
				attributes: attributes,
				indices: indices,
				primitiveType: PrimitiveType.TRIANGLES,
				boundingSphere: boundingSphere,
			}),
		);
		// 指定此四面体的各种属性
		this.attributes = geometry.attributes;
		this.indices = geometry.indices;
		this.primitiveType = geometry.primitiveType;
		this.boundingSphere = geometry.boundingSphere;
	}
}
export default TetrahedronGeometry;
