/**
 * 基于echart的动态柱状图，这里提供初始化图表、更新数据等功能
 * date：2022.09.21 v1.0 by yanwenqing
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
    let colorobj = _initColor(color);
    //数值小于0的时候渐变反向
    let oppositeGradient = [];
    let oppositeGradientObj = null;
    if((typeof color == 'object') && color.constructor == Array){
        //准备一个反向渐变，数值为负数的时候使用
        let _divide = (1 / color.length).toFixed(2);
        for(let i = 0; i < color.length - 1; i++){
            let tempobj = {
                offset: 0 + _divide * i,
                color: color[color.length - 1 - i]
            };
            oppositeGradient.push(tempobj);
        }
        oppositeGradient.push({offset: 1, color: color[0]});
        oppositeGradientObj = new echarts.graphic.LinearGradient(0, 0, 0, 1, oppositeGradient, false);
    }
    for(let i = 0; i < data.length; i++){
        //如果有颜色渐变主要要
        if(oppositeGradientObj){
            if(data[i].value < 0){
                tempArr.push({value: data[i].value, itemStyle: { color: oppositeGradientObj }});
            } else{
                tempArr.push(data[i].value);
            }
        } else{
            tempArr.push(data[i].value);
        }
        let xobj = data[i].name;
        xAxisArr.push({ value: xobj, textStyle: {color: '#B2BAE6'} });
    }

    let option = _initOption(xAxisArr, yAxisName, colorobj, tempArr);
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

    let colorobj = _initColor(color);
    //数值小于0的时候渐变反向
    let oppositeGradient = [];
    let oppositeGradientObj = null;
    if((typeof color == 'object') && color.constructor == Array){
        //准备一个反向渐变，数值为负数的时候使用
        let _divide = (1 / color.length).toFixed(2);
        for(let i = 0; i < color.length - 1; i++){
            let tempobj = {
                offset: 0 + _divide * i,
                color: color[color.length - 1 - i]
            };
            oppositeGradient.push(tempobj);
        }
        oppositeGradient.push({offset: 1, color: color[0]});
        oppositeGradientObj = new echarts.graphic.LinearGradient(0, 0, 0, 1, oppositeGradient, false);
    }
    for(let i = 0; i < count; i++){
        //如果有颜色渐变主要要
        if(oppositeGradientObj){
            if(data[i].value < 0){
                tempArr.push({value: data[i].value, itemStyle: { color: oppositeGradientObj }});
            } else{
                tempArr.push(data[i].value);
            }
        } else{
            tempArr.push(data[i].value);
        }
        let xobj = data[i].name;
        xAxisArr.push({ value: xobj, textStyle: {color: '#B2BAE6'} });
        numcount++;
    }

    let option = _initOption(xAxisArr, yAxisName, colorobj, tempArr);
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
            tempArr.shift();
            numcount = (numcount < data.length) ? numcount : 0
            //如果有颜色渐变主要要
            if(oppositeGradientObj){
                if(data[numcount].value < 0){
                    tempArr.push({value: data[numcount].value, itemStyle: { color: oppositeGradientObj }});
                } else{
                    tempArr.push(data[numcount].value);
                }
            } else{
                tempArr.push(data[numcount].value);
            }
            xAxisArr.shift();
            let xobj = data[numcount].name;
            xAxisArr.push({ value: xobj, textStyle: {color: '#B2BAE6'} });
            option.xAxis.data = xAxisArr;
            option.series[0].data = tempArr;
            myChart.setOption(option);
        }, interval);
    });
    dynamicChartInterval = setInterval(() => {
        numcount++;
        tempArr.shift();
        numcount = (numcount < data.length) ? numcount : 0
        //如果有颜色渐变主要要
        if(oppositeGradientObj){
            if(data[numcount].value < 0){
                tempArr.push({value: data[numcount].value, itemStyle: { color: oppositeGradientObj }});
            } else{
                tempArr.push(data[numcount].value);
            }
        } else{
            tempArr.push(data[numcount].value);
        }
        xAxisArr.shift();
        let xobj = data[numcount].name;
        xAxisArr.push({ value: xobj, textStyle: {color: '#B2BAE6'} });
        option.xAxis.data = xAxisArr;
        option.series[0].data = tempArr;
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

//处理颜色, 判断传入的颜色是单个颜色还是渐变色数组
function _initColor(color){
    let colorobj = null;
    let lineargradientcolorArr = [];
    if((typeof color == 'object') && color.constructor == Array){
        let _divide = (1 / color.length).toFixed(2);
        for(let i = 0; i < color.length -1; i++){
            let tempobj = {
                offset: 0 + _divide * i,
                color: color[i]
            };
            lineargradientcolorArr.push(tempobj);
        }
        lineargradientcolorArr.push({offset: 1, color: color[color.length -1]});
        colorobj = new echarts.graphic.LinearGradient(0, 0, 0, 1, lineargradientcolorArr, false);

        
    } else if((typeof color == 'string') && color.constructor == String){
        colorobj = color;
    } else{
        return null;
    }
    return colorobj;
}

function _initOption(xAxisArr, yAxisName, color, dataArr){
    
    let option = {
        grid: {
            bottom: '10%',
        },
        xAxis: {
            name: '',
            type: 'category',
            //boundaryGap: false,
            data:  xAxisArr,
            axisLine: {
                show: true,
                lineStyle: {
                    color: '#2c4596'
                }
            },
            nameTextStyle: {
                color: '#B2BAE6'
            },
        },
        yAxis: {
            name: yAxisName,
            type: 'value',
            axisLine: {
                show: true,
                lineStyle: {
                    color: '#2c4596',
                }
            },
            splitLine: {
                lineStyle: {
                    color: '#2c4596',
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
        series: [
            {
                type: 'bar',
                name: yAxisName,
                tooltip: {
                    valueFormatter: (value) => {
                        return value + '';
                    }
                },
                itemStyle: {
                     color: color
                },
                data: dataArr,
            }
        ],
    };

    return option;
}



export default{
    initChart, setOption, dynamicSetOption, disposeChart
}