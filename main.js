// Directory Structure
// your-app/
// ├── package.json
// ├── main.js
// └── index.html

// npm init

// modify package.json
// {
//     "name": "your-app",
//     "version": "0.1.0",
//     "main": "main.js",
//     "scripts": {
//       "start": "electron ."
//     }
// }

// npm install --save-dev electron

// Run the app
// npm start


const electron = require("electron");
const app = electron.app;



function createWindow(){
    const win = new electron.BrowserWindow({
       width:800,
       height:600,
       show:false,
       webPreferences:{
           nodeIntegration:true
       }
    })
    win.loadFile("index.html").then(function(){
        win.maximize();
        win.removeMenu();
        win.show();
        win.webContents.openDevTools({
            detached:true
        });
    })
}


app.whenReady().then(createWindow);

app.on("window-all-closed",function(){
    if(process.platform !== "darwin"){
        app.quit();
    }
});

app.on("activate",function(){
    if(electron.BrowserWindow.getAllWindows().length === 0){
        createWindow();
    }
});


//changes made
app.allowRendererProcessReuse = false;
// changes 2 make
