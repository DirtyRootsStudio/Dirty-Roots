const { app, BrowserWindow } = require('electron');  
const { spawn } = require('child_process');  
const path = require('path');  
  
let nextServer;  
let mainWindow;  
  
function startNextServer() {  
  nextServer = spawn('npm', ['run', 'start'], {  
    cwd: __dirname,  
    shell: true  
  });  
}  
  
function createWindow() {  
  mainWindow = new BrowserWindow({  
    width: 1200,  
    height: 800,  
  });  
  
  mainWindow.loadURL('http://localhost:3000');  
}  
  
app.whenReady().then(() => {  
  startNextServer();  
  setTimeout(createWindow, 3000); // Esperar a que Next.js inicie  
});