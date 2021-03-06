/**
 * Created by Raykid on 2016/12/27.
 */
var ares;
(function (ares) {
    var pixijs;
    (function (pixijs) {
        /**
         * 提供给外部的可以注入自定义命令的接口
         * @param name
         * @param command
         */
        function addCommand(name, command) {
            if (!pixijs.commands[name])
                pixijs.commands[name] = command;
        }
        pixijs.addCommand = addCommand;
        /** 文本域命令 */
        function textContent(context) {
            context.entity.createWatcher(context.target, context.exp, context.scope, function (value) {
                var text = context.target;
                text.text = value;
            });
        }
        pixijs.textContent = textContent;
        pixijs.commands = {
            /** 修改任意属性命令 */
            prop: function (context) {
                var target = context.target;
                context.entity.createWatcher(context.target, context.exp, context.scope, function (value) {
                    if (context.subCmd != "") {
                        // 子命令形式
                        target[context.subCmd] = value;
                    }
                    else {
                        // 集成形式，遍历所有value的key，如果其表达式值为true则添加其类型
                        for (var name in value) {
                            target[name] = value[name];
                        }
                    }
                });
            },
            /** 绑定事件 */
            on: function (context) {
                if (context.subCmd != "") {
                    var handler = context.scope[context.exp] || window[context.exp];
                    if (typeof handler == "function") {
                        // 是函数名形式
                        context.target.on(context.subCmd, handler, context.scope);
                    }
                    else {
                        // 是方法执行或者表达式方式
                        context.target.on(context.subCmd, function (evt) {
                            // 创建一个临时的子域，用于保存参数
                            var scope = Object.create(context.scope);
                            scope.$event = evt;
                            scope.$target = context.target;
                            ares.utils.runExp(context.exp, scope);
                        });
                    }
                }
            },
            /** if命令 */
            if: function (context) {
                // 记录一个是否编译过的flag
                var compiled = false;
                // 插入一个占位元素
                var refNode = new PIXI.DisplayObject();
                refNode.interactive = refNode.interactiveChildren = false;
                var parent = context.target.parent;
                var index = parent.getChildIndex(context.target);
                parent.addChildAt(refNode, index);
                // 只有在条件为true时才启动编译
                context.entity.createWatcher(context.target, context.exp, context.scope, function (value) {
                    if (value == true) {
                        // 启动编译
                        if (!compiled) {
                            context.compiler.compile(context.target, context.scope);
                            compiled = true;
                        }
                        // 插入节点
                        if (!context.target.parent) {
                            var index = refNode.parent.getChildIndex(refNode);
                            refNode.parent.addChildAt(context.target, index);
                        }
                    }
                    else {
                        // 移除元素
                        if (context.target.parent) {
                            context.target.parent.removeChild(context.target);
                        }
                    }
                });
            },
            /** for命令 */
            for: function (context) {
                // 解析表达式
                var reg = /^\s*(\S+)\s+in\s+(\S+)\s*$/;
                var res = reg.exec(context.exp);
                if (!res) {
                    console.error("for命令表达式错误：" + context.exp);
                    return;
                }
                var itemName = res[1];
                var arrName = res[2];
                var parent = context.target.parent;
                var sNode = new PIXI.DisplayObject();
                sNode.interactive = sNode.interactiveChildren = false;
                var eNode = new PIXI.DisplayObject();
                eNode.interactive = eNode.interactiveChildren = false;
                // 替换原始模板
                var index = parent.getChildIndex(context.target);
                parent.addChildAt(sNode, index);
                parent.addChildAt(eNode, index + 1);
                parent.removeChild(context.target);
                // 添加订阅
                context.entity.createWatcher(context.target, arrName, context.scope, function (value) {
                    // 清理原始显示
                    var bIndex = parent.getChildIndex(sNode);
                    var eIndex = parent.getChildIndex(eNode);
                    for (var i = bIndex + 1; i < eIndex; i++) {
                        parent.removeChildAt(i).destroy();
                    }
                    // 如果是数字，构建一个数字列表
                    if (typeof value == "number") {
                        var temp = [];
                        for (var i = 0; i < value; i++) {
                            temp.push(i);
                        }
                        value = temp;
                    }
                    // 开始遍历
                    var curIndex = 0;
                    for (var key in value) {
                        // 拷贝一个target
                        var newNode = cloneObject(context.target);
                        // 添加到显示里
                        parent.addChildAt(newNode, (bIndex + 1) + curIndex);
                        // 生成子域
                        var newScope = Object.create(context.scope);
                        newScope.$index = key;
                        newScope[itemName] = value[key];
                        // 开始编译新节点
                        context.compiler.compile(newNode, newScope);
                        // 索引自增1
                        curIndex++;
                    }
                });
            }
        };
        function cloneObject(target) {
            if (!target || typeof target != "object")
                return target;
            // 如果对象有clone方法则直接调用clone方法
            if (typeof target["clone"] == "function")
                return target["clone"]();
            var cls = (target.constructor || Object);
            try {
                var result = new cls();
            }
            catch (err) {
                return null;
            }
            var keys = Object.keys(target);
            for (var i in keys) {
                var key = keys[i];
                // parent属性不复制
                if (key == "parent")
                    continue;
                // Text组件不能复制_texture属性
                if (key == "_texture" && target instanceof PIXI.Text)
                    continue;
                // children属性要特殊处理
                if (key == "children") {
                    var children = target["children"];
                    for (var j in children) {
                        var child = cloneObject(children[j]);
                        result["addChild"](child);
                    }
                }
                else {
                    var value = cloneObject(target[key]);
                    if (value !== null)
                        result[key] = value;
                }
            }
            return result;
        }
    })(pixijs = ares.pixijs || (ares.pixijs = {}));
})(ares || (ares = {}));
/// <reference path="PIXICommands.ts"/>
/// <reference path="pixi.js.d.ts"/>
/// <reference path="ares.d.ts"/>
/**
 * Created by Raykid on 2016/12/27.
 */
var ares;
(function (ares) {
    var pixijs;
    (function (pixijs) {
        var PIXICompiler = (function () {
            /**
             * 创建PIXI绑定
             * @param root 根显示对象，从这里传入的绑定数据属性名必须以“a_”开头
             * @param config 绑定数据，从这里传入的绑定数据属性名可以不以“a_”开头
             */
            function PIXICompiler(root, config) {
                this._nameDict = {};
                this._root = root;
                this._config = config;
            }
            PIXICompiler.prototype.init = function (entity) {
                this._entity = entity;
                // 开始编译root节点
                this.compile(this._root, entity.data);
            };
            PIXICompiler.prototype.compile = function (node, scope) {
                var hasLazyCompile = false;
                // 如果有名字就记下来
                var name = node.name;
                if (name)
                    this._nameDict[name] = node;
                // 取到属性列表
                var keys = [];
                for (var t in node) {
                    if (t.indexOf("a-") == 0 || t.indexOf("a_") == 0) {
                        keys.push(t);
                    }
                }
                // 把配置中的属性推入属性列表中
                var conf = (this._config && this._config[name]);
                for (var t in conf) {
                    if (t.indexOf("a-") != 0 && t.indexOf("a_") != 0)
                        t = "a-" + t;
                    keys.push(t);
                }
                // 开始遍历属性列表
                var cmdsToCompile = [];
                for (var i = 0, len = keys.length; i < len; i++) {
                    // 首先解析当前节点上面以a_开头的属性，将其认为是绑定属性
                    var key = keys[i];
                    var bIndex = 2;
                    var eIndex = key.indexOf(":");
                    if (eIndex < 0)
                        eIndex = key.indexOf("$");
                    if (eIndex < 0)
                        eIndex = key.length;
                    // 取到命令名
                    var cmdName = key.substring(bIndex, eIndex);
                    // 取到命令字符串
                    var exp;
                    if (conf)
                        exp = conf[key] || conf[cmdName] || node[key];
                    else
                        exp = node[key];
                    // 取到子命令名
                    var subCmd = key.substr(eIndex + 1);
                    // 用命令名取到Command
                    var cmd = pixijs.commands[cmdName];
                    // 如果没有找到命令，则认为是自定义命令，套用prop命令
                    if (!cmd) {
                        cmd = pixijs.commands["prop"];
                        subCmd = cmdName || "";
                    }
                    // 推入数组
                    cmdsToCompile.push({
                        propName: key,
                        cmd: cmd,
                        ctx: {
                            scope: scope,
                            target: node,
                            subCmd: subCmd,
                            exp: exp,
                            compiler: this,
                            entity: this._entity
                        }
                    });
                    // 如果是for或者if则设置懒编译
                    if (cmdName == "if" || cmdName == "for") {
                        hasLazyCompile = true;
                        // 清空数组，仅留下自身的编译
                        cmdsToCompile.splice(0, cmdsToCompile.length - 1);
                        break;
                    }
                }
                // 开始编译当前节点外部结构
                for (var i = 0, len = cmdsToCompile.length; i < len; i++) {
                    var cmdToCompile = cmdsToCompile[i];
                    // 移除属性
                    delete cmdToCompile.ctx.target[cmdToCompile.propName];
                    // 开始编译
                    cmdToCompile.cmd(cmdToCompile.ctx);
                }
                // 如果没有懒编译则编译内部结构
                if (!hasLazyCompile) {
                    // 如果是文本对象，则进行文本内容编译
                    if (node instanceof PIXI.Text) {
                        this.compileTextContent(node, scope);
                    }
                    // 然后递归解析子节点
                    if (node instanceof PIXI.Container) {
                        var children = node.children;
                        for (var i = 0; i < children.length; i++) {
                            var child = children[i];
                            this.compile(child, scope);
                        }
                    }
                }
            };
            PIXICompiler.prototype.compileTextContent = function (text, scope) {
                var value = text.text;
                if (PIXICompiler._textExpReg.test(value)) {
                    var exp = this.parseTextExp(value);
                    pixijs.textContent({
                        scope: scope,
                        target: text,
                        subCmd: "",
                        exp: exp,
                        compiler: this,
                        entity: this._entity
                    });
                }
            };
            PIXICompiler.prototype.parseTextExp = function (exp) {
                var reg = PIXICompiler._textExpReg;
                for (var result = reg.exec(exp); result != null; result = reg.exec(exp)) {
                    exp = result[1] + "${" + result[2] + "}" + result[3];
                }
                return "`" + exp + "`";
            };
            PIXICompiler._textExpReg = /(.*?)\{\{(.*?)\}\}(.*)/;
            return PIXICompiler;
        }());
        pixijs.PIXICompiler = PIXICompiler;
    })(pixijs = ares.pixijs || (ares.pixijs = {}));
})(ares || (ares = {}));
//# sourceMappingURL=ares_pixi.js.map