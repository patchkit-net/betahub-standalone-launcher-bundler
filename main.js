const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra'); // this requires "npm install fs-extra"
const axios = require('axios'); // this requires "npm install axios"
const AdmZip = require('adm-zip'); // this requires "npm install adm-zip"
const { exec } = require('child_process');

let win;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    mainWindow.webContents.openDevTools();


    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.on('bundle-game', async (event, data) => {
    try {
        console.log(data);
        // Extract projectId from URL
        const matches = data.url.match(/projects\/(\d+)/);
        const projectId = matches[1];

        console.log('Project ID: ' + projectId);

        // Download BetaHub launcher
        const response = await axios.get('https://public.3.basecamp.com/p/CZbWrJyYcz9YqguJVtJXijoP/attachments/b8e71592-73fe-11ee-b682-aaa4f1cd8999/download/betahub-launcher-2023-10-26.zip?attachment=true', {
            responseType: 'arraybuffer'
        });
        const zipData = Buffer.from(response.data, 'binary');
        const tempZipPath = path.join(__dirname, 'temp.zip');
        fs.writeFileSync(tempZipPath, zipData);

        console.log('Downloaded BetaHub launcher');
        
        // Extract files
        const zip = new AdmZip(tempZipPath);
        zip.extractAllTo(data.outputDir, true);

        console.log('Extracted BetaHub launcher');

        // Update config.json
        const configPath = path.join(data.outputDir, 'launcher', 'resources', 'config.json');
        const config = JSON.parse(fs.readFileSync(configPath));
        config.projectId = projectId;
        config.projectExecutableFilePath = 'app\\' + path.basename(data.executable);
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

        console.log('Updated config.json');

        // Copy game files
        fs.copySync(data.srcDir, path.join(data.outputDir, 'launcher', 'app'));

        console.log('Copied game files');

        // Rename launcher exe
        const exePath = path.join(data.outputDir, 'Start Game XYZ.exe');
        fs.renameSync(exePath, path.join(data.outputDir, path.basename(data.executable)));

        console.log('Renamed launcher exe');

        event.reply('bundle-complete', 'Process is finished! Your game build is now ready to be sent to players. Please repeat this process for each update.');
    } catch (error) {
        event.reply('bundle-error', 'An error occurred: ' + error.message);
    }
});

ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    if (result.canceled) {
        return null;
    } else {
        return result.filePaths[0];
    }
});

ipcMain.handle('get-files-in-directory', (event, dirPath) => {
    return fs.readdirSync(dirPath);
});

ipcMain.handle('open-directory', (event, dirPath) => {
    console.log('Opening directory: ' + dirPath);
    // be aware of operating system
    if (process.platform === 'darwin') {
        exec('open ' + dirPath);
    } else if (process.platform === 'win32') {
        exec('start "" "' + dirPath + '"');
    } else {
        exec('xdg-open', [dirPath]);
    }
});