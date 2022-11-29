import { encrypt, decrypt } from "./jsencrypt";
/**
 * @Author: dongnan
 * @Description: 存储item
 * @Date: 2022-05-14 18:25:31
 * @param {Any} key 键名
 * @param {Any} value 键值
 * @param {boolean} isEncrypt 是否加密
 */
export function setItem(key, value, isEncrypt = false) {
	if (isEncrypt) {
		localStorage.setItem(key, encrypt(value));
	} else {
		localStorage.setItem(key, value);
	}
}
/**
 * @Author: dongnan
 * @Description: 获取item
 * @Date: 2022-05-14 18:25:31
 * @param {Any} key 键名
 * @param {boolean} isEncrypt 是否加密
 */
export function getItem(key, isEncrypt = false) {
	let value = localStorage.getItem(key);
	if (value) {
		if (isEncrypt) {
			return decrypt(value);
		} else {
			return value;
		}
	}
}
/**
 * @Author: dongnan
 * @Description: 移除item
 * @Date: 2022-05-14 19:05:46
 * @param {Any} key 键名
 */
export function removeItem(key) {
	return localStorage.removeItem(key);
}
