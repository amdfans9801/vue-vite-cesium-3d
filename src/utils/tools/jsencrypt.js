import JSEncrypt from "encryptlong/bin/jsencrypt.js";

// 密钥对生成 http://web.chacuo.net/netrsakeypair
const PUBLIC_KEY = `
	-----BEGIN PUBLIC KEY-----
	MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDKX1Fs2JUD25zrAEwPnjnZC0az
	rl1XjGzGrJ64eb1lr9QVVOO2zGKZdqDLZD4Ut4Mp6GHMaqqFXKm+zN7IAXu+mqZb
	UrqUziHE5YGC02wObiZEzfa6V9a8ZvqpB+Z8KO+hAkkjzjMl+E+hDORpZmez3SMz
	etn7mcCeLw8/vmxz3QIDAQAB
	-----END PUBLIC KEY-----`;
//私钥
const PRIVATE_KEY = `
	-----BEGIN PUBLIC KEY-----
	MIICXgIBAAKBgQDKX1Fs2JUD25zrAEwPnjnZC0azrl1XjGzGrJ64eb1lr9QVVOO2
	zGKZdqDLZD4Ut4Mp6GHMaqqFXKm+zN7IAXu+mqZbUrqUziHE5YGC02wObiZEzfa6
	V9a8ZvqpB+Z8KO+hAkkjzjMl+E+hDORpZmez3SMzetn7mcCeLw8/vmxz3QIDAQAB
	AoGBAJBr6b4V6nJwXdHPyngy4PGl/HTqcK60BkTamALqzmEtU9tNU5z2yz7dy+6a
	wTsjo7Vao8CwNrUp5fHGXw65EEc1/3Iu2Fiix0XF7RP4NFSoxbBmzQW1nUK/5DFi
	4VR1uhEmdbgLwGabsdqzeUqhRKkRGAPVCotBjaDBOu0J3Mu5AkEA+SM7Ctu7evOv
	ZwjWrp9a5MGxJ9yLLabbIuWL+420jr2G6ojaTZ2ROA2DWWQPx4JqWxDHttomrb38
	dk2emP2WAwJBAM/yU58YRQ+dTeuTzNYC1JdWcs35n9+hoVP7y+x29CmcqDTPp3nR
	Bbbq88yMb2nZdlwthWi7BurNHsRJFqj0GJ8CQF5gJCuW1UxcJ2PGi1yW7R2e6fcJ
	qoden8B2aDKgmXdBAGyz7s5cE/jB1bH1H60aECPzFVSFCwXh5FMEUEHwPfUCQQC7
	JqZ57lbhebrSRcA58GwzFFvY40wu8gIHWvwqgti2xsZgWW+qZCPXf9gSBWaUhmJP
	Da0fGAxesGN7VyhswNuTAkEAzCFNqL/zwHXcwh9YyHTdk/bRWIJq49jTA+vbgGv0
	szKIvGRKoRbub3NEUiI80TDsCAvbJ6R80J7RjnpmShOwcA==
	-----END PUBLIC KEY-----`;
const encryptor = new JSEncrypt();
encryptor.setPublicKey(PUBLIC_KEY); // 设置公钥
encryptor.setPublicKey(PRIVATE_KEY); // 设置私钥
// 加密
export function encrypt(txt) {
	return encryptor.encryptLong(txt); // 对数据进行加密
}
// 解密
export function decrypt(txt) {
	return encryptor.decryptLong(txt); // 对数据进行解密
}
