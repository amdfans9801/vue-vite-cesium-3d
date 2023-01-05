
export default class threedpiechart{
    constructor(domid){
        return _initchart(domid);
    }

    _initchart(domid) {
        let cahrtdom = document.getElementById(domid);
        let chartInstance = echarts.getInstanceByDom(cahrtdom);
        if(chartInstance){
            return chartInstance;
        } else{
            let myChart = echarts.init(chartDom);
            return myChart;
            
        }
    }
    
    _disposeChart(domid){
        let dom = document.getElementById(domid);
        let chartInstance = echarts.getInstanceByDom(dom);
        if(chartInstance){
            echarts.dispose(chartInstance);
        }
    }

    /**
     * 绘制3d饼图，提供图表的配置项和数据
     * @param pieData 饼图的数据
     * @param internalDiameterRatio:透明的空心占比
     * @param distance 视角到主体的距离
     * @param alpha 旋转角度
     * @param pieHeight 立体的高度
     * @param opacity 饼或者环的透明度
     * 此方法的返回值是一个option对象，对象格式见echarts文档
     */
    _set3DPieOption(pieData, internalDiameterRatio, distance, alpha) {
        let series = [];    //option中的series数组，这个数组里有几个对象，就代表有几个图表
        let sumValue = 0;
        let startValue = 0;
        let endValue = 0;
        let pieHeight = 0;
        let opacity = 1;
        const k = 1 - internalDiameterRatio;
        //每一个饼图数据，就会生成一个series中type：surface的对象
        for(let i = 0; i< pieData.length; i++){
            sumValue += pieData[i].value;
            let seriesobj = { 
                type: 'surface',    //曲面图,支持绘制
                name: typeof pieData[i].name == 'undefined' ? `threedpie${i}` :  pieData[i].name,   //反引号``除了作为普通字符串，还可以用来定义多行字符串，还可以在字符串中加入变量和表达式
                silent: true,       //屏蔽鼠标事件
                parametric: true,   //是否为曲面boolean
                wireframe: {        //曲面的网格线
                    show: false     //default:true
                },
                pieData: pieData[i],
                pieStatus: {
                    selected: false,
                    hovered: false,
                    k: k
                },
                center: ['10%', '50%'],
            };
            if(typeof pieData[i].itemStyle !== 'undefined'){
                let itemStyle = {};
                typeof pieData[i].itemStyle.color != 'undefined' ? itemStyle.color = pieData[i].itemStyle.color : opacity;
                typeof pieData[i].itemStyle.opacity != 'undefined' ? itemStyle.opacity = pieData[i].itemStyle.opacity : opacity;
                seriesobj.itemStyle = itemStyle;
            }
            series.push(seriesobj);
        }
        for (let i = 0; i < series.length; i++) {
            endValue = startValue + series[i].pieData.value;
            pieHeight = series[i].pieData.value / 10;
            series[i].pieData.startRatio = startValue / sumValue;
            series[i].pieData.endRatio = endValue / sumValue;
            series[i].parametricEquation = getParametricEquation(series[i].pieData.startRatio, series[i].pieData.endRatio, false, false, k, pieHeight);
            startValue = endValue;
        }
        
        // 补充一个透明的圆环，用于支撑高亮功能的近似实现。
        series.push({
            name: 'mouseoutSeries',
            type: 'surface',
            silent: true,       //屏蔽鼠标事件
            parametric: true,
            wireframe: {
                show: false
            },
            itemStyle: {
                opacity: 0.08, color: '#47A5CE'
            },
            parametricEquation: {
                u: {
                    min: 0,
                    max: Math.PI * 2,
                    step: Math.PI / 20
                },
                v: {
                    min: 0,
                    max: Math.PI,
                    step: Math.PI / 20
                },
                x: function(u, v) {
                    return (Math.sin(u) + Math.sin(u) * Math.sin(v)) * 0.8;
                },
                y: function(u, v) {
                    return (Math.cos(u) + Math.cos(u) * Math.sin(v)) * 0.8;
                },
                z: function(u, v) {
                    return Math.cos(v) > 0 ? -1 : -1.1;
                }
            }
        }); 
        series.push({
            name: 'mouseoutSeries',
            type: 'surface',
            silent: true,       //屏蔽鼠标事件
            parametric: true,
            wireframe: {
                show: false
            },
            itemStyle: {
                opacity: 0.08, color: '#47A5CE'
            },
            parametricEquation: {
                u: {
                    min: 0,
                    max: Math.PI * 2,
                    step: Math.PI / 20
                },
                v: {
                    min: 0,
                    max: Math.PI,
                    step: Math.PI / 20
                },
                x: function(u, v) {
                    return (Math.sin(u) + Math.sin(u) * Math.sin(v)) * 0.9;
                },
                y: function(u, v) {
                    return (Math.cos(u) + Math.cos(u) * Math.sin(v)) * 0.9;
                },
                z: function(u, v) {
                    return Math.cos(v) > 0 ? -1.1 : -1.2;
                }
            }
        });
    
        series.push({
            name: 'mouseoutSeries',
            type: 'surface',
            silent: true,       //屏蔽鼠标事件
            parametric: true,
            wireframe: {
                show: false
            },
            itemStyle: {
                opacity: 0.02, color: '#119f83'
            },
            parametricEquation: {
                u: {
                    min: 0,
                    max: Math.PI * 2,
                    step: Math.PI / 20
                },
                v: {
                    min: 0,
                    max: Math.PI,
                    step: Math.PI / 20
                },
                x: function(u, v) {
                    return (Math.sin(u) + Math.sin(u) * Math.sin(v)) * 1.05;
                },
                y: function(u, v) {
                    return (Math.cos(u) + Math.cos(u) * Math.sin(v)) * 1.05;
                },
                z: function(u, v) {
                    return Math.cos(v) > 0 ? -1.2 : -1.2;
                }
            }
        });
    
        // 准备待返回的配置项，把准备好的 legendData、series 传入。
        let option = {
            label: {
                formatter: '{b}\n{d}%',
                textBorderColor: 'transparent',
                textBorderWidth: 0,
                color: '#ffffff',
            },
            xAxis3D: {
                min: -1,
                max: 1 
            },
            yAxis3D: {
                min: -1,
                max: 1
            },
            zAxis3D: {
                min: -1,
                max: 1
            },
            grid3D: {
                show: false,
                temporalSuperSampling: {
                    enable: 'false'
                },
                viewControl: {
                    projection: 'orthographic',
                    autoRotate: false,  //自动旋转
                    autoRotateSpeed: 30,
                    alpha: 30,
                    // diatance: 20,
                    // minDistance: 0,
                    // maxDistance: 200,
                    orthographicSize: 300,
                    zoomSensitivity: 0,     //鼠标缩放的灵敏度，0是禁止缩放
                    panSensitivity: 0,      //鼠标移动的灵敏度，0是禁止移动
                    rotateSensitivity: 0,   //鼠标旋转的灵敏度，0是禁止旋转
                },
            },
            series: series
        };
        return option;
    }

    _getParametricEquation(startRatio, endRatio, isSelected, isHovered, k, value) {
        const startRadian = startRatio * Math.PI * 2;   //起始点的弧度
        const endRadian = endRatio * Math.PI * 2;       //终点的弧度
    
        // 这里使用k作为辅助参数， k的含义是：扇形的 内径/外径，没有传入的话默认值为1/3
        k = typeof k !== 'undefined' ? k : (1/3);
        // 计算选中效果分别在 x 轴、y 轴方向上的位移（未选中，则位移均为 0）
        //const offsetx = isSelected ? Math.cos() * 0.1 : 0;
        //const offsety = isSelected ? Math.cos() * 0.1 : 0;
        const offsetx = 0;
        const offsety = 0;
        // 计算高亮效果的放大比例（未高亮，则比例为 1）
        //const hoverRate = isHovered ? 1.05 : 1;
        // 返回曲面参数方程
        return {
            // u: {
            //     min: 0,
            //     max: Math.PI * 2,
            //     step: Math.PI / 20,
            // },
            // v: {
            //     min: 0,
            //     max: Math.PI,
            //     step: Math.PI / 20
            // },
            // x: function (u, v){
            //     if(u < startRadian){
            //         return Math.cos(startRadian) + Math.cos(startRadian) * Math.sin(v) * k;
            //     }
            //     if(u > endRadian){
            //         return Math.cos(endRadian) + Math.cos(endRadian) * Math.sin(v) * k;
            //     }
            //     return Math.cos(u) + Math.cos(u) * Math.sin(v) * k;
            // },
            // y: function (u, v){
            //     if(u < startRadian){
            //         return Math.sin(startRadian) + Math.sin(startRadian) * Math.sin(v) * k;
            //     }
            //     if(u > endRadian){
            //         return Math.sin(endRadian) + Math.sin(endRadian) * Math.sin(v) * k;
            //     }
            //     return Math.sin(u) + Math.sin(u) * Math.sin(v) * k;
            // },
            // z: function (u, v){
            //     return Math.cos(v) * k > 0 ? 1 * value * 0.1 : -1;
            // }
    
            //文档中的写法,暂时去掉offset
            u: {
                min: -Math.PI,
                max: Math.PI * 3,
                step: Math.PI / 32
            },
            v: {
                min: 0,
                max: Math.PI * 2,
                step: Math.PI / 20
            },
            x: function (u, v) {
                if (u < startRadian) {
                    return Math.cos(startRadian) * (1 + Math.cos(v) * k) * hoverRate;
                }
                if (u > endRadian) {
                    return Math.cos(endRadian) * (1 + Math.cos(v) * k) * hoverRate;
                }
                return Math.cos(u) * (1 + Math.cos(v) * k) * hoverRate;
            },
            y: function (u, v) {
                if (u < startRadian) {
                    return Math.sin(startRadian) * (1 + Math.cos(v) * k) * hoverRate;
                }
                if (u > endRadian) {
                    return Math.sin(endRadian) * (1 + Math.cos(v) * k) * hoverRate;
                }
                return Math.sin(u) * (1 + Math.cos(v) * k) * hoverRate;
            },
            z: function (u, v) {
                if (u < -Math.PI * 0.5) {
                  return Math.sin(u);
                }
                if (u > Math.PI * 2.5) {
                  return Math.sin(u) * value * 0.1;
                }
                return Math.sin(v) > 0 ? 1 * value * 0.1 : -1;
            }
        };
    }
    
    /**
     * 获取三维饼图最高扇区的高度
     */
    _getHeight(series, height) {
        series.sort((a, b) => {
            return b.pieData.value - a.pieData.value
        });
        return (height * 25) / series[0].pieData.value
    }


}