import Cookies from "js-cookie";
import { encrypt, decrypt } from "./jsencrypt";
/**
 * @Author: dongnan
 * @Description: 存储cookie
 * @Date: 2022-05-14 18:25:31
 * @param {Any} key 键名
 * @param {Any} value 键值
 * @param {boolean} isEncrypt 是否加密
 */
export function setCookie(key, value, isEncrypt = false) {
	if (isEncrypt) {
		Cookies.set(key, encrypt(value));
	} else {
		Cookies.set(key, value);
	}
}
/**
 * @Author: dongnan
 * @Description: 获取cookie
 * @Date: 2022-05-14 18:25:31
 * @param {Any} key 键名
 * @param {boolean} isEncrypt 是否加密
 */
export function getCookie(key, isEncrypt = false) {
	let value = Cookies.get(key);
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
 * @Description: 移除cookie
 * @Date: 2022-05-14 19:05:46
 * @param {Any} key 键名
 */
export function removeCookie(key) {
	return Cookies.remove(key);
}
