import { WebMapServiceImageryProvider, defined } from "cesium";
/**
 * @Author: dongnan
 * @Description: 重写 WebMapServiceImageryProvider 省略前5级
 * @Date: 2022-02-11 13:54:00
 * @param {*}
 */
class WMSProvider extends WebMapServiceImageryProvider {
	constructor(options) {
		super(options);
	}
	requestImage(x, y, level, request) {
		if (level <= 5) {
			//这里就是跳过前面5级，根据自己需要设置
			return;
		}
		//下面代码是cesium源码抄录过来的
		let result;
		let timeDynamicImagery = this._timeDynamicImagery;
		let currentInterval;
		if (defined(timeDynamicImagery)) {
			currentInterval = timeDynamicImagery.currentInterval;
			result = timeDynamicImagery.getFromCache(x, y, level, request);
		}
		if (!defined(result)) {
			let dynamicIntervalData = defined(currentInterval)
				? currentInterval.data
				: undefined;
			let tileProvider = this._tileProvider;
			if (defined(dynamicIntervalData)) {
				tileProvider._resource.setQueryParameters(dynamicIntervalData);
			}
			result = tileProvider.requestImage(x, y, level, request);
		}
		if (defined(result) && defined(timeDynamicImagery)) {
			timeDynamicImagery.checkApproachingInterval(x, y, level, request);
		}
		return result;
	}
}
export default WMSProvider;
