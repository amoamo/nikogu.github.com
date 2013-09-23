/*
** @prop: Dynamic Reverse Template Engine for KISSY
** @author: yujiang
** @data: 2013 09 22
** @quote: Simple JavaScript Templating John Resig - http://ejohn.org/ - MIT Licensed
*/

KISSY.add('tmpl', function(S, Node) {

    //缓存，用来缓存编译过的模板，因为使用的new Function的内置js解析器
    var cache = {};

    //你懂得（like jquery）
    var $ = Node.all;

    //转换成data可访问的数据，将a.b.c的类似字符串转换成data[a][b][c]
    function translateData(arg, data) {
        var arr = arg.split('.');
        var count = -1;

        //递归实现a.b.c=>data[a][b][c]
        function t(arr, data) {

            count++;

            if ( arr[count] ) {
                //处理数组
                var index = /\[([\d\w])*\]/g.exec(arr[count]);
                var key = arr[count].replace(/\[[^\]]*\]/g, '');

                if ( index && index[1] && data[key][index[1]] ) {
                    return t(arr, data[key][index[1]]);
                } else {
                    if ( data[arr[count]] ) {
                        return t(arr, data[arr[count]]);
                    } else {
                        //如果没有此变量就返回字符串
                        return arr[count];
                    }
                }//end of if

            } else {
                //如果没有此变量就返回字符串
                return data ? data : arr[count-1];

            }//end of if

        }//end of t

        return t(arr, data);

    }
 
    //获取需要更新的节点，并更新
    function update(nodes, data) {

        nodes.each(function(item, index) {

            var watchNum = item.attr('data-watch').split(',');

            for ( var i = 0, len = watchNum.length; i < len; i++ ) {

                //args[0]:type, args[1]:key, args[2]:value
                var args = watchNum[i].split(':');

                //根据类型更新
                switch( args[0] ) {
                    case 'text':
                        item.html( translateData(args[1], data) );
                    break;

                    case 'value':
                        item.html( translateData(args[1], data) );
                    break;

                    case 'attr':
                        var val = translateData(args[2], data);
                        item.attr(args[1], args[2]);
                    break;

                    case 'style':
                        var val = translateData(args[2], data);
                        if ( val ) {
                            switch( args[1] ) {
                                case 'left':
                                case 'right':
                                case 'top':
                                case 'bottom':
                                case 'width':
                                case 'height':
                                    item.css(args[1], val + 'px');
                                break;
                                default:
                                    item.css(args[1], val);
                                break;
                            }
                        }
                    break;

                    case 'class':
                        var clazz = translateData(args[1], data);
                        if ( clazz ) {
                            if ( args[2] && args[2] == 'rm' ) {
                                item.removeClass(clazz);
                            } else {
                                item.addClass(clazz);
                            }
                        }
                    break;

                    //局部全体更新，需要重新编译
                    case 'part':
                        var target = args[1],
                            to = args[2];

                            var result = compileTpl($(target).html());
                            cache[target] = result;
                            $(to).html( data ? result(data) : result);
                    break;

                    default:
                    break;
                }//end of switch

            }//end of for

        });//end of each

    }//end of update

    //编译函数，返回的是个function
    function compileTpl(str) {

        //利用Function构造函数创建js解析器，动态解析js
        var fn = new Function("obj", "var p=[],print=function(){p.push.apply(p,arguments);};" +
       
        "with(obj){p.push('" +
       
        str.replace(/[\r\t\n]/g, "").
            split("<%").join("\t").
            replace(/((^|%>)[^\t]*)'/g, "$1\r").
            replace(/\t=(.*?)%>/g, "',$1,'").
            split("\t").join("');").
            split("%>").join("p.push('").
            split("\r").join("\\'") +
            "');}return p.join('');");

        return fn;

    }//end of comileTpl

    //渲染函数
    function render( tpl, target, data, callback ) {

        var html = tpl.html();

        //编译
        var result = compileTpl(html, data);

        //添加到模板
        target.html( data ? result(data) : result );

        //回调传出fn
        if ( callback ) {
            callback(result);
        }

    }//end of render

    //主入口函数，传入的tpl和target都是KISSY对象
    function Tmpl(tpl, target, data){

        //str表示缓存key，一般用id，如果没有id，则不保留缓存
        var str = tpl.attr('id') || 'nocache';

        //局部更新数据，说明已经生成节点
        if ( cache[str] ) {

            //遍历寻找需要动态修改的节点
            var nodes = target.all('.node-watch');

            //如果没有动态更新的节点，就用缓存重绘视图
            if ( nodes.length < 1 ) {

                target.html( data ? cache[str]( data ) : cache[str] );

            } else {
                //局部更新
                update(nodes, data);
            }


        } else {

            //渲染
            render(tpl, target, data, function(fn) {
                //生成cache
                cache[str] = fn;
            });

        }//end of if

    }//end of Tmpl

    //暴露入口接口
    return Tmpl;
  
}, {
    requires: ['node']
});

