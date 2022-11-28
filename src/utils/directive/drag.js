// drag
export default {
	mounted(el, binding, vnode, prevnode) {
		let dragDiv = el;
        dragDiv.onmousedown = function(e){
            if(e.target.className == binding.arg){
                //这个offsetx,offsety是鼠标距离这个div 0,0 点的距离
                let offsetx = e.clientX - dragDiv.offsetLeft;
                let offsety = e.clientY - dragDiv.offsetTop;
                dragDiv.onmousemove = function(e1){
                    //通过事件委托，计算移动的距离
                    let movex = e1.clientX - offsetx;
                    let movey = e1.clientY - offsety;
                    //拖动div
                    dragDiv.style.left = movex + 'px';
                    dragDiv.style.top = movey + 'px';
                }
                dragDiv.onmouseup = function(e2){
                    dragDiv.onmousemove = null;
                    dragDiv.onmouseup = null;
                }
                return false;
            } else{
                return;
            }
            
            //return false不加的话可能导致黏连，就是拖到一个地方时div粘在鼠标上不下来，相当于onmouseup失效
            /**
             * 这里注意：★★★★★
             * 1、return;(return null;)起到的是中断方法执行的效果，只要不return false事件处理函数将会继续执行，表单将提交。
             * 2、return false，事件处理函数会取消事件，不再继续向下执行。比如表单将终止提交。
             */
            
        }
	},

    // 更新传入的参数时候进行的操作
    update(el, binding, vnode, prevnode){
        console.log('update:' + binding.value);
    },

};
