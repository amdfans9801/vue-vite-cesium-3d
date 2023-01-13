<template>
	<div id="uploadcontainer">
		<div id="selectcontainer">
			<el-input id="filename" class="filepath" disabled placeholder="请选择文件" />
			<el-button class="selectbutton" type="primary" :icon="Upload" @click="selectfile()"></el-button>
			<input type="file" id="file" @change="selectedfile()" accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.csv,.geojson,.json,application/zip" />
		</div>
	</div>
</template>

<script setup>
import { Upload } from '@element-plus/icons-vue';
import analysisfile from './handler/AnalysisFile';

function selectfile() {
	const filedom = document.getElementById('file');
	filedom.click();
}

function selectedfile() {
	const filedom = document.getElementById('file');
	const filenamedom = document.getElementById('filename');
	filenamedom.value = filedom.files[0].name;
	let file = new analysisfile();
	// file.analysis_geojson(filedom.files[0]);
	// file.analysis_xlsx(filedom.files[0]);
	let url = window.URL.createObjectURL(filedom.files[0]);
	file.analysis_shp(url);
}

function uploadfile() {}
</script>

<style scoped>
@import url('./css/uploadstyle.css');
</style>
