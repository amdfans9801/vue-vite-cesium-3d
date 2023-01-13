/**
 * 全局引用，配置变量
 */

// 所有可以到达的页面按钮
const _meuns = [
    {name: 'cesium', path: '/map', img: ''}, 
    {name: 'charts', path: '/charts', img: ''}, 
    {name: 'threejs', path: '/threejs', img: ''},
    {name: 'upload', path: '/uploadfiles', img: ''}, 
];

// 天地图密钥
const tianditu_key = 'be0e5bc8af64d9f3c3ccb730ce6fab14';

// 折线图数据
let linechart_1 = [];
// 饼图数据
let piecahrt_1 = [];
// 柱状图数据
let barchart_1 = [];


// 文件类型
const filetype = [
    { name: 'xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { name: 'xls', type: 'application/vnd.ms-excel' },
    { name: 'json', type: 'application/json' },
    { name: 'csv', type: 'text/csv' },
    { name: 'geojson', type: '' },
    { name: 'zip', type: 'application/zip' },
    { name: 'zip', type: 'application/x-zip-compressed' },
    { name: 'zip', type: 'application/x-zip' },
    { name: 'zip', type: 'application/octet-stream' },
];
