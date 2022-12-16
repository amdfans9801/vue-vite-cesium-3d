/**
 * echarts折线图
 */


function initChart(dom){
    let chartDom = document.getElementById(dom);
    let chartInstance = echarts.getInstanceByDom(chartDom);
    if(chartInstance){
        return chartInstance;
    } else{
        let myChart = echarts.init(chartDom);
        return myChart;
    }
}

function disposeChart(domid){
    let dom = document.getElementById(domid);
    let chartInstance = echarts.getInstanceByDom(dom);
    if(chartInstance){
        echarts.dispose(chartInstance);
    }
}

function _initOption(xAxisArr, yAxisName, color, datatArr){
    let transparent = color.slice(0,7) + '00';
    let option = {
        
    };
    return option;
}

// 静态图表数据
function setStaticData(){

}
// 动态图表数据
function setDynamicData(){

}

export {
    
}