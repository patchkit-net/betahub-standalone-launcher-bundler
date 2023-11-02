// Replace this
// const path = require('path');
// const fs = require('fs');

// With this (no direct requires)
// All functionalities will be accessed via the `electron` object

document.getElementById('selectSrcDir').addEventListener('click', async () => {
    const dirPath = await electron.selectDirectory();
    if (!dirPath) return;

    document.getElementById('selectedSrcDir').textContent = dirPath;

    // Get files
    const files = await electron.getFilesInDirectory(dirPath);

    const executables = files.filter(file => file.endsWith('.exe'));
    const dropdown = document.getElementById('executablesDropdown');
    executables.forEach(exe => {
        const option = document.createElement('option');
        option.value = exe;
        option.textContent = exe;
        dropdown.appendChild(option);
    });
});


document.getElementById('selectOutputDir').addEventListener('click', async () => {
    const dirPath = await electron.selectDirectory();
    if (!dirPath) return;

    document.getElementById('selectedOutputDir').textContent = dirPath;
});


document.getElementById('bundle').addEventListener('click', () => {
    const data = {
        srcDir: document.getElementById('selectedSrcDir').textContent,
        executable: document.getElementById('executablesDropdown').value,
        outputDir: document.getElementById('selectedOutputDir').textContent,
        url: document.getElementById('betahubURL').value
    };

    document.getElementById('overlay').style.display = 'block';
    electron.send('bundle-game', data);
});

electron.on('bundle-complete', (message) => {
    console.log('Renderer: Received bundle-complete message:', message);

    document.getElementById('statusMessage').textContent = message;
    document.getElementById('openOutputDir').style.display = 'block';
    showPopup();
});


electron.on('bundle-error', (message) => {
    document.getElementById('statusMessage').textContent = message;
    showPopup();
});

document.getElementById('openOutputDir').addEventListener('click', () => {
    const outputDir = document.getElementById('selectedOutputDir').textContent;
    console.log('Opening output directory:', outputDir);
    electron.openDirectory(outputDir);
});

