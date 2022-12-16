/**
 * 基于echart的动态折线和柱状图的混合图，这里提供初始化图表、更新数据等功能
 * date：2022.09.19 v1.0 by yanwenqing
 * date: 2022.09.21 v1.1 by yanwenqing      *饼图传入的颜色支持传入数组实现渐变效果 *新增根据domid销毁chart实例的方法 *初始化的时候判断是否已经chart实例
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
 * @param yAxisName1 左侧的y轴显示的名称（y轴的单位），用于表示折线的单位
 * @param yAxisName2 右侧的y轴显示的名称（y轴的单位），用于表示饼图的单位
 * @param color_line 折线图的颜色
 * @param color_bar 饼图的颜色
 */
function setOption(myChart, data, yAxisName1, yAxisName2, color_line, color_bar){
    let lineData = [];
    let barData = [];
    let color_bar_formatted = _initColor(color_bar);
    //数值小于0的时候渐变反向
    let oppositeGradient = [];
    let oppositeGradientObj = null;
    if((typeof color == 'object') && color.constructor == Array){
        //准备一个反向渐变，数值为负数的时候使用
        let _divide = (1 / color.length).toFixed(2);
        for(let i = color.length -1; i > 0; i--){
            let tempobj = {
                offset: 0 + _divide * i,
                color: color[i]
            };
            oppositeGradient.push(tempobj);
        }
        oppositeGradient.push({offset: 1, color: color[0]});
        oppositeGradientObj = new echarts.graphic.LinearGradient(0, 0, 0, 1, oppositeGradient, false);
    }
    for(let i = 0; i < data.length; i++){
        lineData.push(data[i].linevalue);
        //如果有颜色渐变主要要反转渐变
        if(oppositeGradientObj){
            if(data[i].barvalue < 0){
                barData.push({value: data[i].barvalue, itemStyle: { color: oppositeGradientObj }});
            } else{
                barData.push(data[i].barvalue);
            }
        } else{
            barData.push(data[i].barvalue);
        }
        let xobj = data[i].name.split('-')[1] + '-' + data[i].name.split('-')[2];
        xAxisArr.push({ value: xobj, textStyle: {color: '#B2BAE6'} });
    }

    let option = _initOption(xAxisArr, yAxisName1, yAxisName2, color_line, color_bar_formatted, lineData, barData);
    myChart.setOption(option);
}

/**
 * 设置动态chart option 配置
 * 一个图表的大体样式和配置应该是一样的，修改数据时只需要修改series部分
 * @param myChart ehcarts创建的图表对象，由initChart方法返回
 * @param data 表数据
 * @param yAxisName1 左侧的y轴显示的名称（y轴的单位），用于表示折线的单位
 * @param yAxisName2 右侧的y轴显示的名称（y轴的单位），用于表示饼图的单位
 * @param color_line 折线图的颜色
 * @param color_bar 饼图的颜色
 * @param count 每次在图表中，x轴显示的数量
 * @param interval 图表更新的时间间隔
 */
function dynamicSetOption(myChart, data, yAxisName1, yAxisName2, color_line, color_bar, count, interval){
    // if(dynamicChartInterval) {
    //     clearInterval(dynamicChartInterval);
    // }
    let dynamicChartInterval;
    let lineData = [];
    let barData = [];
    let numcount = 0;
    let xAxisArr = [];

    let color_bar_formatted = _initColor(color_bar);
    //数值小于0的时候渐变反向
    let oppositeGradient = [];
    let oppositeGradientObj = null;
    if((typeof color == 'object') && color.constructor == Array){
        //准备一个反向渐变，数值为负数的时候使用
        let _divide = (1 / color.length).toFixed(2);
        for(let i = color.length -1; i > 0; i--){
            let tempobj = {
                offset: 0 + _divide * i,
                color: color[i]
            };
            oppositeGradient.push(tempobj);
        }
        oppositeGradient.push({offset: 1, color: color[0]});
        oppositeGradientObj = new echarts.graphic.LinearGradient(0, 0, 0, 1, oppositeGradient, false);
    }
    for(let i = 0; i < count; i++){
        // lineData.push({name: data[i].name, value: data[i].linevalue});
        // barData.push({name: data[i].name, value: data[i].barvalue});
        lineData.push(data[i].linevalue);
        //如果有颜色渐变主要要反转渐变
        if(oppositeGradientObj){
            if(data[i].barvalue < 0){
                barData.push({value: data[i].barvalue, itemStyle: { color: oppositeGradientObj }});
            } else{
                barData.push(data[i].barvalue);
            }
        } else{
            barData.push(data[i].barvalue);
        }
        numcount++;
    }
    for(let i = 0; i < count; i++){
        let xobj = data[i].name.split('-')[1] + '-' + data[i].name.split('-')[2];
        xAxisArr.push({ value: xobj, textStyle: {color: '#B2BAE6'} });
    }

    let option = _initOption(xAxisArr, yAxisName1, yAxisName2, color_line, color_bar_formatted, lineData, barData);
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
            lineData.shift();
            numcount = (numcount < data.length) ? numcount : 0;
            lineData.push(data[numcount].linevalue);
            barData.shift();
            numcount = (numcount < data.length) ? numcount : 0;
            if(oppositeGradientObj){
                //负数反转渐变
                if(data[numcount].barvalue < 0){
                    barData.push({value: data[numcount].barvalue, itemStyle: { color: oppositeGradientObj }});
                } else{
                    barData.push(data[numcount].barvalue);
                }
            } else{
                barData.push(data[numcount].barvalue);
            }
            barData.push(data[numcount].barvalue);
            xAxisArr.shift();
            let xobj = data[numcount].name.split('-')[1] + '-' + data[numcount].name.split('-')[2]
            xAxisArr.push({ value: xobj, textStyle: {color: '#B2BAE6'} });
            option.xAxis.data = xAxisArr;
            option.series[0].data = lineData;
            option.series[1].data = barData;
            myChart.setOption(option);
            
        }, interval);
    });

    dynamicChartInterval = setInterval(() => {
        numcount++;
        lineData.shift();
        numcount = (numcount < data.length) ? numcount : 0;
        lineData.push(data[numcount].linevalue);
        barData.shift();
        numcount = (numcount < data.length) ? numcount : 0;
        if(oppositeGradientObj){
            //负数反转渐变
            if(data[numcount].barvalue < 0){
                barData.push({value: data[numcount].barvalue, itemStyle: { color: oppositeGradientObj }});
            } else{
                barData.push(data[numcount].barvalue);
            }
        } else{
            barData.push(data[numcount].barvalue);
        }
        barData.push(data[numcount].barvalue);
        xAxisArr.shift();
        let xobj = data[numcount].name.split('-')[1] + '-' + data[numcount].name.split('-')[2]
        xAxisArr.push({ value: xobj, textStyle: {color: '#B2BAE6'} });
        option.xAxis.data = xAxisArr;
        option.series[0].data = lineData;
        option.series[1].data = barData;
        // 图表被销毁之后就终止循环
        if(myChart._disposed){
            clearInterval(dynamicChartInterval);
        }
        myChart.setOption(option);
    }, interval);
    
    //返回Interval的值，可以控制清除
    return dynamicChartInterval;
}

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
        colorobj = new echarts.graphic.LinearGradient(0, 0, 0, 1,lineargradientcolorArr, false);

        
    } else if((typeof color == 'string') && color.constructor == String){
        colorobj = color;
    } else{
        return null;
    }
    return colorobj;
}

function _initOption(xAxisArr, yAxisName1, yAxisName2, color_line, color_bar, lineData, barData){
    let option = {
        grid: {
            bottom: '15%',
            left: '15%'
        },
        xAxis: {
            name: '日',
            type: 'category',
            //splitNumber: 10, //这项的用处不大
            //boundaryGap: false,
            data: xAxisArr,
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
        yAxis: [
            {
                name: yAxisName1,
                type: 'value',
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#374dae'
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
            {
                name: yAxisName2,
                type: 'value',
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#374dae'
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
                    show: true,
                    color: '#B2BAE6',
                }
            }
        ],
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
                type: 'line',
                name: yAxisName1.split('(')[0],   //系列名称，用于tooltip的显示，legend 的图例筛选，在 setOption 更新数据和配置项时用于指定对应的系列。
                tooltip: {
                    valueFormatter: (value) => {
                        return value + yAxisName1;
                    }
                },
                symbol: 'circle',   //设置了这一项，itemStyle才会起效（相当于是自定义折线拐点展示的图形）
                itemStyle: {
                     color: color_line,
                    borderColor: color_line,
                    borderWidth: 1.5,
                    borderType: 'solid',
                },
                lineStyle: {
                    color: color_line
                },
                smooth: 0.6,
                //showSymbol: false,
                data: lineData
            },
            {
                type: 'bar',
                name: yAxisName2.split('(')[0],
                tooltip: {
                    valueFormatter: (value) => {
                        return value + yAxisName2;
                    }
                },
                itemStyle: {
                    color: color_bar
                },
                barWidth: '40%',
                data: barData
            }
        ],
    };
    return option;
}


export default{
    initChart, setOption, dynamicSetOption, disposeChart
}