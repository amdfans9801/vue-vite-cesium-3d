class threedpiechart{
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
}