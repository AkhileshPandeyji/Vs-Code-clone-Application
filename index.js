const $ = require("jquery");
const path = require("path");
const fs = require("fs");
const jstree = require("jstree");
const { dialog } = require("electron").remote;

let myMonaco;
let editor;
let isLight = false;
let xterm;
let i = 1;
let cp;
let tabsArr = []
let srcPath = "C:/Users/pande/Desktop/TPP-DEV/TPP-DEV/Lecture12-ElectronVsCode/test/";


$(document).ready(async function () {
    editor = await createEditor();
    let src = srcPath;
    let chArr = getChildrenNodes(src);
    let pObj = {
        id: src,
        parent: "#",
        text: path.basename(src)
    }
    chArr.unshift(pObj);
    $('#tree').jstree({
        'core':
        {
            'data': chArr,
            'check_callback': true,
            "themes": {
                "icons": false
            }
        }

    }).on("open_node.jstree", function (event, data) {
        let children = data.node.children;
        for (let i = 0; i < children.length; i++) {
            let gcnodes = getChildrenNodes(children[i]);
            for (let j = 0; j < gcnodes.length; j++) {
                let gcexists = $("#tree").jstree().get_node(gcnodes[j]);
                if (gcexists) {
                    return;
                }
                $("#tree").jstree().create_node(children[i], gcnodes[j], "last");
            }
        }
    }).on("select_node.jstree", function (e, data) {

        let src = data.node.id;
        if (fs.lstatSync(src).isFile() == false) {
            return;
        }
        if(tabsArr.includes(src)){
            return;
        }
        else{
            tabsArr.push(src);
        }
        cp = src;
        setData(src);
        createTab(src);
    });
    startTerminal();
});

$("#theme-btn").on("click", function () {
    if (isLight == false) {
        myMonaco.editor.setTheme("lighttheme");
        $(this).html("Dark");
        $(".file-explorer ").css({
            "background":"#ffffff"
        });
        $("#tree").css({
            "color":"black",
            "font-weight":"bold"
        });
        $(".terminal-container").css({
            "background":"#ffffff"
        });
        $("body").css({
           "background":"#ede8e8" 
        });
        xterm.setOption("theme", { background: "#ffffff", foreground: "#000000" });
        isLight = !isLight;
    }
    else {
        myMonaco.editor.setTheme("darktheme");
        $(this).html("Light");
        $(".file-explorer ").css({
            "background":"rgba(44, 42, 42, 0.616)"
        });
        $("#tree").css({
            "color":"rgba(212, 214, 219, 0.911)",
            "font-weight":"normal"
        });
        $(".terminal-container").css({
            "background":"#222324"
        });
        $("body").css({
            "background":"#000000" 
         });
        xterm.setOption("theme", { background: "#222324", foreground: "#ffffff" });
        isLight = !isLight;
    }
});

$("#new-btn").on("click",function(){
    let model = editor.getModel();
    model.setValue("//type your code here");
    let fp = path.join(srcPath,`untitled-${i}`);
    fs.writeFileSync(fp,"//type your code here");
    createTab(fp);
    i++;
    let src = srcPath;
    let chArr = getChildrenNodes(src);
    let pObj = {
        id: src,
        parent: "#",
        text: path.basename(src)
    }
    chArr.unshift(pObj);
    $('#tree').jstree(true).settings.core.data = chArr;
    $('#tree').jstree(true).refresh();
});

$("#save-btn").on("click",function(){
    let base = path.basename(cp);
    let cdata = editor.getModel().getValue();
    if(base.includes("untitled")){
        let filename = dialog.showSaveDialogSync({
            defaultPath:cp,
            buttonLabel:"Save File"
        });
        fs.unlinkSync(cp);
        fs.writeFileSync(filename,cdata);
    }
    else{
        fs.writeFileSync(cp,cdata);
    }
    let src = srcPath;
    let chArr = getChildrenNodes(src);
    let pObj = {
        id: src,
        parent: "#",
        text: path.basename(src)
    }
    chArr.unshift(pObj);
    $('#tree').jstree(true).settings.core.data = chArr;
    $('#tree').jstree(true).refresh();
    // console.log(ppath);
});

function getChildrenNodes(src) {
    let isFile = fs.lstatSync(src).isFile();
    if (isFile) {
        return [];
    }
    let children = fs.readdirSync(src);
    let chArr = []
    for (let i = 0; i < children.length; i++) {
        let chObj = {
            id: path.join(src, children[i]),
            parent: src,
            text: children[i]
        }
        chArr.push(chObj);
    }
    return chArr;
}

function createEditor() {
    const path = require('path');
    const amdLoader = require('./node_modules/monaco-editor/min/vs/loader.js');
    const amdRequire = amdLoader.require;
    const amdDefine = amdLoader.require.define;

    amdRequire.config({
        baseUrl: './node_modules/monaco-editor/min'
    });
    // workaround monaco-css not understanding the environment
    self.module = undefined;
    return new Promise(function (resolve, reject) {
        try {
            amdRequire(['vs/editor/editor.main'], function () {
                monaco.editor.defineTheme('darktheme', {
                    base: 'vs-dark', // can also be vs-dark or hc-black
                    inherit: true, // can also be false to completely replace the builtin rules
                    rules: [
                        { token: 'comment', foreground: 'ffa500', fontStyle: 'italic underline' },
                        { token: 'comment.js', foreground: '008800', fontStyle: 'bold' },
                        { token: 'comment.css', foreground: '0000ff' } // will inherit fontStyle from `comment` above
                    ]
                });
                monaco.editor.defineTheme("lighttheme", {
                    base: "vs",
                    inherit: true,
                    rules: [
                        { token: 'comment', foreground: 'ffa500', fontStyle: 'italic underline' },
                        { token: 'comment.js', foreground: '008800', fontStyle: 'bold' },
                        { token: 'comment.css', foreground: '0000ff' } // will inherit fontStyle from `comment` above
                    ]
                });
                var editor = monaco.editor.create(document.querySelector('#code-editor'), {
                    value: ["//type your code here"].join('\n'),
                    language: "javascript",
                    theme: "darktheme"
                });

                myMonaco = monaco;
                return resolve(editor);
            });
        }
        catch (error) {
            reject(error);
        }
    });
}

function setData(src) {
    let content = fs.readFileSync(src) + "";
    let ext = src.split(".")[1];
    let srcObj = JSON.parse(fs.readFileSync("./source.json") + "");
    let lang = srcObj[ext];
    let model = editor.getModel();
    myMonaco.editor.setModelLanguage(model, lang);
    model.setValue(content);
}

function setEmptyData() {
    let model = editor.getModel();
    myMonaco.editor.setModelLanguage(model, "javascript");
    model.setValue("//type your code here");
}

function createTab(src) {
    let fname = path.basename(src);
    //add element to tab-container
    $(".tab-container").append(`<div class="tab"><span class="tab-fname" id="${src}" onclick="handleClick(this)">${fname}</span><i class="fas fa-times" id="${src}" onclick="handleClose(this)"></i></div>`);

}

function handleClick(elem) {
    let src = $(elem).attr("id");
    cp = src;
    // console.log(src);
    setData(src);
}

function handleClose(elem) {
    let src = $(elem).attr("id");
    //remove Tab
    $(elem).parent().remove();
    //show code-content of first file
    let notabs = $(".tab-container .tab").length;
    if (notabs != 0) {
        let src = $($(".tab-container .tab span")[0]).attr("id");
        // console.log(src);
        setData(src);
    }
    else {
        setEmptyData();
    }
}

function startTerminal() {
    const os = require('os');
    const pty = require('node-pty');
    const Terminal = require('xterm').Terminal;
    const { FitAddon } = require('xterm-addon-fit');

    const shell = process.env[os.platform() === 'win32' ? 'COMSPEC' : 'SHELL'];
    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: srcPath,
        env: process.env
    });

    // Initialize xterm.js and attach it to the DOM
    xterm = new Terminal();
    const fitAddon = new FitAddon();

    xterm.loadAddon(fitAddon);

    xterm.open(document.getElementById('terminal'));

    xterm.setOption("theme", { background: "#222324", foreground: "#ffffff" });
    xterm.setOption("cursorBlink", true);
    xterm.setOption("cursorStyle", "underline");

    // Setup communication between xterm.js and node-pty
    xterm.onData(function (data) {
        ptyProcess.write(data);
    });

    ptyProcess.on('data', function (data) {
        xterm.write(data);
    });
    fitAddon.fit();
}