/// <reference path="../src/ares/pixijs/pixi.js.d.ts"/>
/// <reference path="../src/ares/pixijs/ares.d.ts"/>
/// <reference path="../dist/ares_pixi.d.ts"/>

/**
 * Created by Raykid on 2016/12/23.
 */
window.onload = ()=>
{
    var renderer:PIXI.SystemRenderer = PIXI.autoDetectRenderer(800, 600, {backgroundColor:0xeeeeee});
    document.getElementById("div_root").appendChild(renderer.view);
    var stage:PIXI.Container = new PIXI.Container();
    render();

    function render():void
    {
        try
        {
            // 渲染Stage
            renderer.render(stage);
        }
        catch(err)
        {
            console.error(err.toString());
        }
        // 计划下一次渲染
        requestAnimationFrame(render);
    }

    var testSkin:PIXI.Container = new PIXI.Container();
    stage.addChild(testSkin);

    var testSprite:PIXI.Sprite = new PIXI.Sprite();
    testSprite.texture = PIXI.Texture.fromImage("http://pic.qiantucdn.com/58pic/14/45/39/57i58PICI2K_1024.png");
    testSprite.width = testSprite.height = 200;
    testSprite.interactive = true;
    testSprite["a-on:click"] = "testFunc";
    testSprite["a-for"] = "item in testFor";
    testSprite["a-x"] = "$target.x + $index * 200";
    testSprite.x = 200;
    testSkin.addChild(testSprite);

    var testText:PIXI.Text = new PIXI.Text("text: {{text}}, {{item}}");
    testText["a_for"] = "item in testFor";
    testText["a-y"] = "$target.y + $index * 100";
    testText.y = 300;
    testSkin.addChild(testText);

    ares.bind({
        text: "text",
        testFor: [],
        testFunc: function(evt:Event):void
        {
            this.text = "Fuck!!!";
        }
    }, new ares.pixijs.PIXICompiler(testSkin), {
        inited: function():void
        {
            setTimeout(()=>{
                this.testFor = ["asdf", "ajsdf", 323];
            }, 2000);
        }
    });
};