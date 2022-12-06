import { defaultValue, defined } from "cesium";
/**
 * @Author: dongnan
 * @Description:画两个img
 * @Date: 2021-08-28 17:24:55
 */
export async function drawDoubleImageCanvas(img1, img2, textOptions) {
	let canvas = document.createElement("canvas");
	let context = canvas.getContext("2d");
	let text1 = "";
	let text2 = 0; //球上数字
	let font1 = "30px sans-serif";
	let font2 = "50px sans-serif";
	let fillStyle1 = "White";
	let fillStyle2 = "White";
	let strokeStyle1 = "#3e59a9";
	let strokeStyle2 = "#fff";
	let minNum = 0;
	let maxNum = 1;
	if (defined(textOptions)) {
		text1 = defined(textOptions.text) ? textOptions.text : text1;
		text2 = defined(textOptions.text2)
			? parseFloat(textOptions.text2)
			: text2;
		minNum = defined(textOptions.minNum)
			? parseFloat(textOptions.minNum)
			: minNum;
		maxNum = defined(textOptions.maxNum)
			? parseFloat(textOptions.maxNum)
			: maxNum;
		// 第一个文字样式
		if (defined(textOptions.fontOptions)) {
			font1 = defined(textOptions.fontOptions.font)
				? textOptions.fontOptions.font
				: font1;
			fillStyle1 = defined(textOptions.fontOptions.fillColor)
				? textOptions.fontOptions.fillColor
				: fillStyle1;
			strokeStyle1 = defined(textOptions.fontOptions.strokeColor)
				? textOptions.fontOptions.strokeColor
				: strokeStyle1;
		}
		// 第二个文字样式
		if (defined(textOptions.fontOptions2)) {
			font2 = defined(textOptions.fontOptions2.font)
				? textOptions.fontOptions2.font
				: font2;
			fillStyle2 = defined(textOptions.fontOptions2.fillColor)
				? textOptions.fontOptions2.fillColor
				: fillStyle2;
			strokeStyle2 = defined(textOptions.fontOptions2.strokeColor)
				? textOptions.fontOptions2.strokeColor
				: strokeStyle2;
		}
	}
	// 确定canvas大小
	let circleDiameter = calculateCircleSize(parseFloat(text2), minNum, maxNum);
	canvas.width = circleDiameter;
	canvas.height = circleDiameter;
	// 绘制图片 100%填充
	let imgWidthScale = circleDiameter / img1.width;
	let imgHeightScale = circleDiameter / img1.height;
	context.scale(imgWidthScale, imgHeightScale);
	context.drawImage(img1, 0, 0);
	context.scale(1 / imgWidthScale, 1 / imgHeightScale);
	await document.fonts.load(font1);
	await document.fonts.load(font2);
	// 绘制文字
	drawLongText(text1, img2, {
		font: font1,
		fillStyle: fillStyle1,
		strokeStyle: strokeStyle1,
	});
	// 绘制数字
	drawTextPlacing(
		text2.toString(),
		8,
		circleDiameter,
		circleDiameter / 2 - 8,
		{
			font: font2,
			fillStyle: fillStyle2,
			strokeStyle: strokeStyle2,
		},
	);
	return canvas;
	/**
	 * @Author: dongnan
	 * @Description: 绘制底部文字及图片
	 * @Date: 2021-10-25 14:10:21
	 * @param {*} text
	 * @param {*} img
	 * @param {*} fontOptions
	 */
	function drawLongText(text, img, fontOptions) {
		// 绘制文字
		context.textAlign = "center";
		context.textBaseline = "top";
		context.lineWidth = 4;
		context.font = fontOptions.font;
		context.strokeStyle = fontOptions.strokeStyle;
		context.fillStyle = fontOptions.fillStyle;
		let fontSize =
			context.measureText(text.trim()).width / text.trim().length;
		if (
			context.measureText(text.trim()).width + img.width + 20 <=
			circleDiameter
		) {
			context.strokeText(
				text.trim(),
				circleDiameter / 2 + img.width / 2,
				circleDiameter / 2 + 8,
			);
			context.fillText(
				text.trim(),
				circleDiameter / 2 + img.width / 2,
				circleDiameter / 2 + 8,
			);
			// 绘制图片
			let leftOffset =
				circleDiameter / 2 +
				img.width / 2 +
				5 -
				img.width -
				(text.trim().length * fontSize) / 2 -
				15;
			let topOffset =
				circleDiameter / 2 + 8 - img.height / 2 + fontSize / 2;
			context.drawImage(img, leftOffset, topOffset);
		} else {
			context.strokeText(
				text.trim(),
				circleDiameter / 2,
				circleDiameter / 2 + 8,
			);
			context.fillText(
				text.trim(),
				circleDiameter / 2,
				circleDiameter / 2 + 8,
			);
		}
	}
	/**
	 * @Author: dongnan
	 * @Description: 水平居中绘制数字
	 * @Date: 2021-08-29 16:38:10
	 * @param {*} text 文字
	 * @param {*} space 间距
	 * @param {*} totalLength 总长度
	 * @param {*} startY y轴起绘点
	 * @param {*} fontOptions 字体样式 {font,fontSize,fillStyle,strokeStyle}
	 */
	function drawTextPlacing(text, space, totalLength, startY, fontOptions) {
		context.textBaseline = "bottom";
		context.textAlign = "left";
		context.font = fontOptions.font;
		context.strokeStyle = fontOptions.strokeStyle;
		context.fillStyle = fontOptions.fillStyle;
		context.lineWidth = 4;
		// 计算起绘点
		let list = text.trim().split("");
		let textLength =
			context.measureText(text).width + (list.length - 1) * space;
		let startX = (totalLength - textLength) / 2;
		let fontSize = context.measureText(text).width / list.length;
		list.forEach((item) => {
			context.strokeText(item, startX, startY);
			context.fillText(item, startX, startY);
			startX += fontSize + space;
		});
	}
	/**
	 * @Author: dongnan
	 * @Description: 根据数量确定圆的直径
	 * @Date: 2021-08-28 18:40:16
	 * @param {*} num
	 * @param {*} minNum
	 * @param {*} maxNum
	 * @param return diameter 直径px
	 */
	function calculateCircleSize(num, minNum, maxNum) {
		let diameter = 0;
		// let minNum = 0;
		// let maxNum = 100000;
		let ratio = (num - minNum) / (maxNum - minNum);
		diameter = ratio * 250 + 100;
		return diameter;
	}
}
/**
 * @Author: dongnan
 * @Description: 画两个样式的文本canvas
 * @Date: 2021-02-08 23:15:33
 */
export async function drawDoubleTextCanvas(img, textOptions) {
	let canvas = document.createElement("canvas");
	let context = canvas.getContext("2d");
	let text1 = "";
	let text2 = "";
	let padding1 = [20, 20, 20, 20];
	let padding2 = [20, 20, 20, 20];
	let font1 = "25px sans-serif";
	let font2 = "40px sans-serif";
	let fillStyle1 = "White";
	let fillStyle2 = "red";
	let strokeStyle1 = "#3e59a9";
	let strokeStyle2 = "#3e59a9";
	let fontSize1 = 25;
	let fontSize2 = 40;
	let textWidth = 0;
	let canvasWidth = 0;
	let canvasHeight = 0;
	if (defined(textOptions)) {
		text1 = defaultValue(textOptions.text, text1);
		text2 = defaultValue(textOptions.text2, text2);
		padding1 = defaultValue(textOptions.padding, padding1);
		padding2 = defaultValue(textOptions.padding2, padding2);
		// 第一个文字样式
		if (defined(textOptions.fontOptions)) {
			font1 = defaultValue(textOptions.fontOptions.font, font1);
			fillStyle1 = defaultValue(
				textOptions.fontOptions.fillColor,
				fillStyle1,
			);
			strokeStyle1 = defaultValue(
				textOptions.fontOptions.strokeColor,
				strokeStyle1,
			);
		}
		// 第二个文字样式
		if (defined(textOptions.fontOptions2)) {
			font2 = defaultValue(textOptions.fontOptions2.font, font2);
			fillStyle2 = defaultValue(
				textOptions.fontOptions2.fillColor,
				fillStyle2,
			);
			strokeStyle2 = defaultValue(
				textOptions.fontOptions2.strokeColor,
				strokeStyle2,
			);
		}
	}
	// 确认字的大小
	let fontArray1 = font1.split(" ");
	let fontArray2 = font2.split(" ");
	fontArray1.forEach((item) => {
		if (item.indexOf("px") >= 0) {
			fontSize1 = parseFloat(item);
			return;
		}
	});
	fontArray2.forEach((item) => {
		if (item.indexOf("px") >= 0) {
			fontSize2 = parseFloat(item);
			return;
		}
	});
	// 根据字的个数判断
	textWidth =
		fontSize1 * text1.trim().length + fontSize2 * text2.trim().length;
	// 设置padding[上,右,下,左]
	canvasWidth =
		padding1[1] + padding1[3] + textWidth + padding2[1] + padding2[3];
	canvasHeight =
		padding1[0] + fontSize1 + padding1[2] >
		padding2[0] + fontSize2 + padding2[2]
			? padding1[0] + fontSize1 + padding1[2]
			: padding2[0] + fontSize2 + padding2[2];
	// 设置canvas大小
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	// 绘制图片 100%填充
	let imgWidthScale = canvasWidth / img.width;
	let imgHeightScale = canvasHeight / img.height;
	context.scale(imgWidthScale, imgHeightScale);
	context.drawImage(img, 0, 0);
	context.scale(1 / imgWidthScale, 1 / imgHeightScale);
	await document.fonts.load(font1);
	await document.fonts.load(font2);
	// 绘制文字1
	context.lineWidth = 4;
	context.font = font1;
	context.strokeStyle = strokeStyle1;
	context.fillStyle = fillStyle1;
	context.strokeText(
		text1.trim(),
		padding1[3],
		padding1[0] + fontSize1 / 1.5,
	);
	context.fillText(text1.trim(), padding1[3], padding1[0] + fontSize1 / 1.5);
	// 绘制文字2
	let textLength1 =
		text1.trim().length * fontSize1 + padding1[3] + padding1[1];
	context.lineWidth = 4;
	context.font = font2;
	context.strokeStyle = strokeStyle2;
	context.fillStyle = fillStyle2;
	context.strokeText(
		text2.trim(),
		textLength1 + padding2[3],
		padding2[0] + fontSize2 / 1.5,
	);
	context.fillText(
		text2.trim(),
		textLength1 + padding2[3],
		padding2[0] + fontSize2 / 1.5,
	);
	return canvas;
}
/**
 * @Author: dongnan
 * @Description: 画单样式文本canvas 内嵌型
 * @Date: 2021-02-08 23:15:33
 */
export async function drawSingleTextCanvas(img, textOptions) {
	let canvas = document.createElement("canvas");
	let context = canvas.getContext("2d");
	let text = "";
	let padding = [20, 20, 20, 20];
	let font = "30px sans-serif";
	let fillStyle = "White";
	let strokeStyle = "#3e59a9";
	let fontSize = 30;
	let textWidth = 0;
	let textHeight = 0;
	let canvasWidth = 0;
	let canvasHeight = 0;
	if (defined(textOptions)) {
		text = defaultValue(textOptions.text, text);
		padding = defaultValue(textOptions.padding, padding);
		if (defined(textOptions.fontOptions)) {
			font = defaultValue(textOptions.fontOptions.font, font);
			fillStyle = defaultValue(
				textOptions.fontOptions.fillColor,
				fillStyle,
			);
			strokeStyle = defaultValue(
				textOptions.fontOptions.strokeColor,
				strokeStyle,
			);
		}
	}
	// 确认字的大小
	let fontArray = font.split(" ");
	fontArray.forEach((item) => {
		if (item.indexOf("px") >= 0) {
			fontSize = parseFloat(item);
			return;
		}
	});
	// 根据字的个数判断
	textWidth = fontSize * text.trim().length;
	textHeight = fontSize;
	// 设置padding[上,右,下,左]
	canvasWidth = padding[1] + padding[3] + textWidth;
	canvasHeight = padding[0] + padding[2] + textHeight;
	// 设置canvas大小
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;
	// 绘制图片 100%填充
	let imgWidthScale = canvasWidth / img.width;
	let imgHeightScale = canvasHeight / img.height;
	context.scale(imgWidthScale, imgHeightScale);
	context.drawImage(img, 0, 0);
	// 绘制文字
	context.scale(1 / imgWidthScale, 1 / imgHeightScale);
	// context.lineWidth = 4;
	await document.fonts.load(font);
	context.font = font;
	context.strokeStyle = strokeStyle;
	context.fillStyle = fillStyle;
	context.strokeText(text.trim(), padding[3], padding[0] + fontSize / 1.5);
	context.fillText(text.trim(), padding[3], padding[0] + fontSize / 1.5);
	return canvas;
}
/**
 * @Author: dongnan
 * @Description: 绘制文本canvas
 * @Date: 2021-09-11 20:44:54
 */
export async function drawTextCanvas(textOptions) {
	let canvas = document.createElement("canvas");
	let context = canvas.getContext("2d");
	let font = "28px sans-serif";
	let fillStyle = "#4fa9cb";
	let strokeStyle = "#4fa9cb";
	let fontSize = 28;
	let text = "";
	if (defined(textOptions)) {
		text = defaultValue(textOptions.text.trim(), text);
		if (defined(textOptions.fontOptions)) {
			font = defaultValue(textOptions.fontOptions.font, font);
			fillStyle = defaultValue(
				textOptions.fontOptions.fillColor,
				fillStyle,
			);
			strokeStyle = defaultValue(
				textOptions.fontOptions.strokeColor,
				strokeStyle,
			);
		}
	}
	// 确认字的大小
	let fontArray = font.split(" ");
	fontArray.some((item) => {
		if (item.indexOf("px") >= 0) {
			fontSize = parseFloat(item);
			return true;
		}
	});
	canvas.width = fontSize * (text.length + 2);
	canvas.height = fontSize + 10;
	context.lineWidth = 2;
	await document.fonts.load(font);
	context.font = font;
	context.fillStyle = fillStyle;
	context.strokeStyle = strokeStyle;
	context.textAlign = "center";
	context.fillText(text, canvas.width / 2, fontSize);
	context.strokeText(text, canvas.width / 2, fontSize);
	return canvas;
}
