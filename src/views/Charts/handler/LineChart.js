/**
 * 基于echart的动态折线图，这里提供初始化图表、更新数据等功能
 * date：2022.09.15 v1.0 by yanwenqing
 * date: 2022.09.21 v1.1 by yanwenqing      *新增根据domid销毁chart实例的方法 *初始化的时候判断是否已经chart实例
 * date: 2022.09.21 v1.2 by yanwenqing      *初始化option的代码单独写成方法，简化整体代码
 * date: 2022.09.27 v1.3 by yanwenqing      *鼠标移入图表暂停滚动播放，移除继续滚动播放内容
 * date: 2022.10.08 v1.4 by yanwenqing      *鼠标移除再切换数据的bug
 */


/**
 * 初始化图表，需要传入图表容器的id
 * @param dom 图表容器div的id
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

/**
 * 销毁图表实例，因为重新选择数据的时候会重新渲染，一个方法是重新执行initchart，再setOption，这样需要先销毁实例，不然会有警告；
 * 或者可以直接重新setOption，这样的话应该把之前创建的实例作为全局变量或者再获取一次
 * 这里先加上销毁实例的方法
 * @param dom 图表容器div的id
 */
 function disposeChart(domid){
    let dom = document.getElementById(domid);
    let chartInstance = echarts.getInstanceByDom(dom);
    if(chartInstance){
        echarts.dispose(chartInstance);
    }
    
}

/**
 * 设置chart option 配置
 * 一个图表的大体样式和配置应该是一样的，修改数据时只需要修改series部分
 * @param myChart ehcarts创建的图表对象，由initChart方法返回
 * @param data 表数据
 * @param yAxisName y轴显示的名称（y轴的单位）
 * @param color 折线图的颜色
 */
function setOption(myChart, data, yAxisName, color){
    let tempArr = [];
    let xAxisArr = [];
    for(let i = 0; i < data.length; i++){
        tempArr.push(data[i]);
        let xobj = data[i].name.split('_')[1];
        xAxisArr.push({ value: xobj, textStyle: {color: '#B2BAE6'} });
    }
    
    let option = _initOption(xAxisArr, yAxisName, color, tempArr);
    myChart.setOption(option);
}

/**
 * 设置动态chart option 配置
 * 一个图表的大体样式和配置应该是一样的，修改数据时只需要修改series部分
 * @param myChart ehcarts创建的图表对象，由initChart方法返回
 * @param data 表数据
 * @param yAxisName y轴显示的名称（y轴的单位）
 * @param color 折线图的颜色
 * @param count 每次在图表中，x轴显示的数量
 * @param interval 图表更新的时间间隔
 */
function dynamicSetOption(myChart, data, yAxisName, color, count, interval){
    // if(dynamicChartInterval) {
    //     clearInterval(dynamicChartInterval);
    // }
    let dynamicChartInterval;
    let tempArr = [];
    let numcount = 0;
    let xAxisArr = [];
    let stopnumcount = 0;   //鼠标移入图表时的计数

    let _data = _initData(data);
    for(let i = 0; i < _data.length; i++){
        let _temp = [];
        for(let j = 0; j < count; j++){
            _temp.push(_data[i][j]);
        }
        tempArr.push(_temp);
    }
    for(let m = 0; m < count; m++){
        let xobj = _data[0][m].name.split('-')[1] + '-' + _data[0][m].name.split('-')[2];
        xAxisArr.push({ value: xobj, textStyle: {color: '#B2BAE6'} });
    }
    numcount = count;
    
    let option = _initOption(xAxisArr, yAxisName, color, tempArr);
    myChart.setOption(option);
    myChart.on('mouseover', function(param){
        if(dynamicChartInterval) {
            clearInterval(dynamicChartInterval);
        }
    });
    myChart.on('mouseout', function(param){
        dynamicChartInterval = setInterval(() => {
            if(myChart._disposed){
                clearInterval(dynamicChartInterval);
            }
            numcount++;
            for(let k = 0; k < _data.length; k++){
                tempArr[k].shift();
                numcount = (numcount < _data[0].length) ? numcount : 0;
                tempArr[k].push(_data[k][numcount]);
                option.series[k].data = tempArr[k];
            }
            
            xAxisArr.shift();
            let xobj = _data[0][numcount].name.split('-')[1] + '-' + _data[0][numcount].name.split('-')[2];
            xAxisArr.push({ value: xobj, textStyle: {color: '#B2BAE6'} });
            option.xAxis.data = xAxisArr;
            myChart.setOption(option);
        }, interval);
    });

    dynamicChartInterval = setInterval(() => {
        numcount++;
        for(let k = 0; k < _data.length; k++){
            tempArr[k].shift();
            numcount = (numcount < _data[0].length) ? numcount : 0;
            tempArr[k].push(_data[k][numcount]);
            option.series[k].data = tempArr[k];
        }
        xAxisArr.shift();
        let xobj = _data[0][numcount].name.split('-')[1] + '-' + _data[0][numcount].name.split('-')[2];
        xAxisArr.push(xobj);
        option.xAxis.data = xAxisArr;
        // 图表被销毁之后就终止循环
        if(myChart._disposed){
            clearInterval(dynamicChartInterval);
        }
        myChart.setOption(option);
    }, interval);
    
    //返回Interval的值，可以控制清除
    return dynamicChartInterval;
}

/**
 * 供内部调用，简化代码
 */
// 判断传入的数据是单条还是多条折线数据,无论是单条还是多条，都统一处理数据按照多条处理
function _initData(data){
    for(let i = 0; i < data.length; i++){
        if(Object.prototype.toString.call(data[0]) === '[object Object]'){
            
            return [data];
        } else if(Object.prototype.toString.call(data[0]) === '[object Array]'){
            if(Object.prototype.toString.call(data[0][0]) === '[object Object]'){
                return data;
            }
        }
    }
}

 function _initOption(xAxisArr, yAxisName, color, dataArr){
    //let transparent = color.slice(0,7) + '00';
    let option = {
        grid: {
            bottom: '15%',
        },
        xAxis: {
            name: '日',
            type: 'category',
            boundaryGap: false,
            data:  xAxisArr,
            axisLine: {
                show: true,
                lineStyle: {
                    color: '#374dae'
                }
            },
            nameTextStyle: {
                color: '#B2BAE6'
            },
        },
        yAxis: {
            name: "件",
            type: 'value',
            axisLine: {
                show: true,
                lineStyle: {
                    color: '#374dae',
                }
            },
            splitLine: {
                lineStyle: {
                    color: '#374dae',
                    type: 'dashed'
                }
            },
            nameTextStyle: {
                color: '#B2BAE6'
            },
            axisLabel: {
                color: '#B2BAE6',
            }
        },
        legend: {
            textStyle:{
                color: '#B2BAE6'
            }
        },
        tooltip:{
            show: true,
        },
        series: [],
    };
    for(let i = 0; i < dataArr.length; i++){
        let serie = {
            type: 'line',
            name: yAxisName[i].split('(')[0],
            tooltip: {
                valueFormatter: (value) => {
                    return value + '件';
                }
            },
            symbol: 'circle',   //设置了这一项，itemStyle才会起效（相当于是自定义折线拐点展示的图形）
            itemStyle: {
                color: color[i],
                borderColor: color[i],
                borderWidth: 1.5,
                borderType: 'solid',
            },
            lineStyle: {
                color: color[i]
            },
            smooth: 0.6,
            // areaStyle: {
            //     //线性渐变，前四个参数分别是 x0, y0, x2, y2, 范围从 0 - 1，相当于在图形包围盒中的百分比，如果 globalCoord 为 `true`，则该四个值是绝对的像素位置
            //     color: new echarts.graphic.LinearGradient(0, 0, 0, 1,[
            //                         {offset: 0, color: color},     //0% 处的颜色
            //                         {offset: 1, color: transparent}      //100% 处的颜色
            //                     ], false),
            // },
             data: dataArr[i],
        }
        option.series.push(serie);
        //let legendobj = {name: yAxisName, textStyle:{color: '#B2BAE6'}};
        //option.legend.data.push(yAxisName);
    }
    return option;
 }

 function onMouseOverChart(){

 }

 function onMouseOutChart(){

 }



export default{
    initChart, setOption, dynamicSetOption, disposeChart
}