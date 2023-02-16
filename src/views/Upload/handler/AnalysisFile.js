/**
 * 解析上传的文件
 */

import { GeoJsonDataSource, Color as CesiumColor } from 'cesium';
import * as XLSX from 'xlsx';

export default class analysisfile{
    constructor() {
        this.reader = new FileReader();
    }

    analysis_geojson(file) {
        this.reader.onload = (ev) => {
            if(typeof(ev.target.result) == 'string'){
                let resultobj = JSON.parse(ev.target.result);
                viewer.dataSources.add(
                    GeoJsonDataSource.load(resultobj, {})
                )
            }
        }
        this.reader.readAsText(file);
    }
    
    analysis_json(file) {
        // 判断符合geojson的结构
        if(file){
            
        }
        analysis_geojson(file);
    }
    

    analysis_csv(file) {
        this.reader.onload = (ev) => {
            console.log(ev.target.result);
        }
        this.reader.readAsText(file);
    }
    
    analysis_xls(file) {
        
    }




    
    analysis_xlsx(file) {
        let xlsxdata;
        this.reader.onload = (ev) => {
            xlsxdata = XLSX.read(ev.target.result, { type: "binary" });
            console.log(xlsxdata);
            let data = []; // 存储获取到的数据
            // 遍历每张工作表进行读取（这里默认只读取第一张表）
 
            console.log(data);
        }
        this.reader.readAsBinaryString(file);
    }
    
    analysis_shp(file) {
        shp(file).then((geojson) => {
            console.log(geojson);
        });
        
    }

    _clearall() {

    }
};

