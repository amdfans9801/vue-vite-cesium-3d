<template>
	<div id="menus">
		<div class="guidemenuitem" v-for="(item, i) in menusdata" :id="'guide_' + item.name" @click="gotonewpage(item.path)">
			<img :src="item.img" alt="" class="guidemenu_img" />
			<div class="textdiv">
				<span class="textspan">{{ item.name }}</span>
			</div>
		</div>
	</div>
</template>

<script setup>
import router from '@/router';

const menusdata = _meuns;

function gotonewpage(src) {
	router.push({ path: src });
}
</script>

<style scoped>
@import url('./css/menustyle.css');
</style>
