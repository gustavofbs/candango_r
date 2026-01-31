const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
let dockerProcess;

// Verificar se Docker está rodando
function checkDockerRunning() {
  return new Promise((resolve) => {
    const check = spawn('docker', ['ps']);
    check.on('close', (code) => {
      resolve(code === 0);
    });
    check.on('error', () => {
      resolve(false);
    });
  });
}

// Iniciar containers Docker
function startDockerContainers() {
  return new Promise((resolve, reject) => {
    console.log('Iniciando containers Docker...');
    
    const projectPath = path.join(__dirname, '..');
    dockerProcess = spawn('docker-compose', ['up', '-d'], {
      cwd: projectPath,
      shell: true
    });

    dockerProcess.stdout.on('data', (data) => {
      console.log(`Docker: ${data}`);
    });

    dockerProcess.stderr.on('data', (data) => {
      console.error(`Docker Error: ${data}`);
    });

    dockerProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Containers iniciados com sucesso!');
        resolve();
      } else {
        reject(new Error(`Docker falhou com código ${code}`));
      }
    });
  });
}

// Aguardar aplicação estar pronta
function waitForApp(url, maxAttempts = 30) {
  return new Promise((resolve) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await fetch(url);
        if (response.ok) {
          clearInterval(interval);
          resolve(true);
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          resolve(false);
        }
      }
    }, 1000);
  });
}

// Criar janela principal
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'Candango R - Sistema ERP',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.ico')
  });

  // Remover menu
  mainWindow.setMenuBarVisibility(false);

  // Carregar aplicação
  mainWindow.loadURL('http://localhost:3000');

  // Abrir DevTools em desenvolvimento
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Inicialização
app.whenReady().then(async () => {
  // Verificar Docker
  const dockerRunning = await checkDockerRunning();
  
  if (!dockerRunning) {
    dialog.showErrorBox(
      'Docker não encontrado',
      'O Docker Desktop não está rodando.\n\n' +
      'Por favor, inicie o Docker Desktop e tente novamente.'
    );
    app.quit();
    return;
  }

  try {
    // Iniciar containers
    await startDockerContainers();
    
    // Aguardar aplicação estar pronta
    console.log('Aguardando aplicação iniciar...');
    const ready = await waitForApp('http://localhost:3000');
    
    if (!ready) {
      dialog.showErrorBox(
        'Erro ao iniciar',
        'A aplicação não conseguiu iniciar.\n\n' +
        'Verifique se as portas 3000 e 8000 estão livres.'
      );
      app.quit();
      return;
    }

    // Criar janela
    createWindow();
    
  } catch (error) {
    dialog.showErrorBox(
      'Erro ao iniciar containers',
      `Erro: ${error.message}\n\n` +
      'Verifique se o Docker está configurado corretamente.'
    );
    app.quit();
  }
});

// Parar containers ao fechar
app.on('before-quit', () => {
  console.log('Parando containers...');
  const projectPath = path.join(__dirname, '..');
  spawn('docker-compose', ['down'], {
    cwd: projectPath,
    shell: true
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
