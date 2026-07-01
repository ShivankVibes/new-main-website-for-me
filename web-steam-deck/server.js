const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const os = require('os');
const QRCode = require('qrcode');
const https = require('https');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Serve static files
app.use(express.static(PUBLIC_DIR));
app.use(express.json());

// Path to compiled Swift controller
const SWIFT_SOURCE = path.join(__dirname, 'mac-controller.swift');
const SWIFT_BINARY = path.join(__dirname, 'mac-controller');

let swiftProcess = null;
let accessibilityTrusted = false;

// CPU Calculation variables
let lastCpuInfo = getCpuTicks();
let currentCpuUsage = 0;

function getCpuTicks() {
    const cpus = os.cpus();
    if (!cpus || cpus.length === 0) return { idle: 0, total: 0 };
    let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
    for (const cpu of cpus) {
        user += cpu.times.user;
        nice += cpu.times.nice;
        sys += cpu.times.sys;
        idle += cpu.times.idle;
        irq += cpu.times.irq;
    }
    const total = user + nice + sys + idle + irq;
    return { idle, total };
}

function calculateCpuUsage() {
    const current = getCpuTicks();
    const idleDiff = current.idle - lastCpuInfo.idle;
    const totalDiff = current.total - lastCpuInfo.total;
    lastCpuInfo = current;
    if (totalDiff === 0) return 0;
    return Math.round((1 - idleDiff / totalDiff) * 100);
}

// Update CPU statistics periodically
setInterval(() => {
    currentCpuUsage = calculateCpuUsage();
}, 2000);

// Compile and launch Swift Daemon
function startSwiftDaemon() {
    // If the binary doesn't exist, we compile it on startup
    if (!fs.existsSync(SWIFT_BINARY)) {
        console.log("Swift controller binary not found. Compiling...");
        exec(`swiftc "${SWIFT_SOURCE}" -o "${SWIFT_BINARY}" -framework Cocoa -framework ApplicationServices`, (err) => {
            if (err) {
                console.error("Failed to compile Swift controller: ", err);
                console.warn("Server running in Fallback AppleScript mode.");
                return;
            }
            console.log("Swift controller compiled successfully.");
            spawnDaemon();
        });
    } else {
        spawnDaemon();
    }
}

function spawnDaemon() {
    try {
        console.log("Starting Swift daemon process...");
        swiftProcess = spawn(SWIFT_BINARY);
        
        swiftProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            console.log(`[Swift Daemon]: ${output}`);
            
            if (output.includes("INIT_SUCCESS")) {
                console.log("Swift daemon successfully connected.");
                // Immediately check accessibility permission
                sendToSwift("check_accessibility");
            }
            
            if (output.startsWith("ACCESSIBILITY:")) {
                accessibilityTrusted = output.includes("true");
                console.log(`macOS Accessibility Permission Trusted: ${accessibilityTrusted}`);
                // Broadcast state to all connected sockets
                broadcast({ type: 'status_update', accessibilityTrusted });
            }
        });

        swiftProcess.stderr.on('data', (data) => {
            console.error(`[Swift Daemon Error]: ${data.toString()}`);
        });

        swiftProcess.on('close', (code) => {
            console.warn(`Swift daemon exited with code ${code}. Restarting in 5s...`);
            swiftProcess = null;
            setTimeout(spawnDaemon, 5000);
        });
    } catch (e) {
        console.error("Error spawning Swift daemon: ", e);
    }
}

function sendToSwift(message) {
    if (swiftProcess && swiftProcess.stdin.writable) {
        swiftProcess.stdin.write(message + "\n");
    } else {
        // Fallback or log
        console.warn(`Swift daemon not running or writable. Message ignored: "${message}"`);
    }
}

// Helper to broadcast WebSocket messages
function broadcast(data) {
    const payload = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

// Helper to scan for macOS applications
function getInstalledApps() {
    const dirs = ['/Applications', '/System/Applications'];
    const apps = [];
    const seen = new Set();
    
    for (const dir of dirs) {
        try {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    if (file.endsWith('.app') && !seen.has(file)) {
                        seen.add(file);
                        const name = file.slice(0, -4);
                        apps.push({ name, path: path.join(dir, file) });
                    }
                }
            }
        } catch (e) {
            console.error(`Error scanning directory ${dir}: `, e);
        }
    }
    
    // Default system utility additions if not detected
    const defaults = ["Finder", "Safari", "Terminal", "System Settings"];
    for (const d of defaults) {
        if (!apps.some(a => a.name.toLowerCase() === d.toLowerCase())) {
            apps.push({ name: d, path: d });
        }
    }
    
    return apps.sort((a, b) => a.name.localeCompare(b.name));
}

const LIBRARY_FILE = path.join(__dirname, 'library.json');

const DEFAULT_LIBRARY = [
    { name: 'Finder', path: 'Finder', icon: '📂' },
    { name: 'Safari', path: 'Safari', icon: '🌐' },
    { name: 'Chrome', path: 'Google Chrome', icon: '🧭' },
    { name: 'VS Code', path: 'Visual Studio Code', icon: '💻' },
    { name: 'Spotify', path: 'Spotify', icon: '🎵' },
    { name: 'Terminal', path: 'Terminal', icon: '📟' },
    { name: 'Slack', path: 'Slack', icon: '💬' },
    { name: 'Discord', path: 'Discord', icon: '🎮' },
    { name: 'Settings', path: 'System Settings', icon: '⚙️' }
];

function readLibrary() {
    try {
        if (fs.existsSync(LIBRARY_FILE)) {
            const data = fs.readFileSync(LIBRARY_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Error reading library file:", e);
    }
    // Create defaults if not found
    writeLibrary(DEFAULT_LIBRARY);
    return DEFAULT_LIBRARY;
}

function writeLibrary(library) {
    try {
        fs.writeFileSync(LIBRARY_FILE, JSON.stringify(library, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error("Error writing library file:", e);
        return false;
    }
}

// REST endpoints
app.get('/api/library', (req, res) => {
    res.json(readLibrary());
});

app.post('/api/library', (req, res) => {
    const newLibrary = req.body;
    if (Array.isArray(newLibrary)) {
        writeLibrary(newLibrary);
        res.json({ success: true, library: newLibrary });
    } else {
        res.status(400).json({ error: "Invalid library structure" });
    }
});

app.get('/api/apps', (req, res) => {
    res.json(getInstalledApps());
});

app.get('/api/server-info', async (req, res) => {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (const k in interfaces) {
        for (const k2 in interfaces[k]) {
            const address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
            }
        }
    }
    
    let bestIp = '127.0.0.1';
    for (const ip of addresses) {
        if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
            bestIp = ip;
            break;
        }
    }
    if (bestIp === '127.0.0.1' && addresses.length > 0) {
        bestIp = addresses[0];
    }
    
    const hostUrl = `http://${bestIp}:${PORT}`;
    
    try {
        const qrSvg = await QRCode.toString(hostUrl, { type: 'svg' });
        res.json({
            localIp: bestIp,
            port: PORT,
            url: hostUrl,
            qrCode: qrSvg,
            allIps: addresses
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to generate QR code" });
    }
});

// Cache variables for system stats to limit sub-process load
let cachedStats = {
    cpu: 0,
    memory: 0,
    battery: { percent: 100, isCharging: false },
    activeApp: "Unknown",
    accessibilityTrusted: false
};

app.get('/api/system-stats', (req, res) => {
    // 1. CPU and Memory are sync/lightweight
    cachedStats.cpu = currentCpuUsage;
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    cachedStats.memory = Math.round(((totalMem - freeMem) / totalMem) * 100);
    cachedStats.accessibilityTrusted = accessibilityTrusted;

    // 2. Fetch Active App and Battery asynchronously and respond with current cache
    // This guarantees sub-millisecond response times for client API polls
    exec("osascript -e 'tell application \"System Events\" to get name of first process whose frontmost is true'", (err, stdout) => {
        if (!err && stdout) {
            cachedStats.activeApp = stdout.trim();
        }
    });

    exec("pmset -g batt", (err, stdout) => {
        if (!err && stdout) {
            const matches = stdout.match(/(\d+)%;\s*([^;]+);/);
            if (matches) {
                cachedStats.battery = {
                    percent: parseInt(matches[1]),
                    isCharging: matches[2].toLowerCase().includes('charging') || matches[2].toLowerCase().includes('ac')
                };
            }
        }
    });

    res.json(cachedStats);
});

// Trigger accessibility permission prompt manually
app.post('/api/request-accessibility', (req, res) => {
    sendToSwift("check_accessibility");
    res.json({ success: true, accessibilityTrusted });
});

// WebSocket Controller logic
wss.on('connection', (ws) => {
    console.log('Mobile device connected via WebSocket');
    
    // Send initial status
    ws.send(JSON.stringify({
        type: 'status_update',
        accessibilityTrusted
    }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleIncomingPayload(data);
        } catch (e) {
            console.error("Error parsing WebSocket message: ", e);
        }
    });

    ws.on('close', () => {
        console.log('Mobile device disconnected');
    });
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
    // Get local IPv4 addresses
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (const k in interfaces) {
        for (const k2 in interfaces[k]) {
            const address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
            }
        }
    }
    
    console.log(`==================================================`);
    console.log(`🚀 Web Steam Deck Server is running!`);
    console.log(`💻 Local access: http://localhost:${PORT}`);
    console.log(`📱 Mobile access from your Wi-Fi network:`);
    addresses.forEach(ip => {
        console.log(`   👉 http://${ip}:${PORT}`);
    });
    console.log(`==================================================`);
    
    // Fire up the Swift background process
    startSwiftDaemon();

    // Subscribe to cloud relay channel
    const topicName = 'macdeck-' + os.hostname().toLowerCase().split('.')[0].replace(/[^a-z0-9-]/g, '');
    console.log(`☁️ Cloud Relay: Listening to https://ntfy.sh/${topicName}`);
    subscribeToNtfy(topicName);

    // Periodically publish system stats to the cloud relay for the phone controller HUD
    setInterval(() => publishStatsToCloud(topicName), 5000);
    // Initial stats publish
    setTimeout(() => publishStatsToCloud(topicName), 1000);

    // Publish real installed app list on startup and refresh daily
    setTimeout(() => publishAppsToCloud(topicName), 3000);
    setInterval(() => publishAppsToCloud(topicName), 24 * 60 * 60 * 1000);
});

// Centralized Payload Handler (WebSocket + Cloud Relay)
function handleIncomingPayload(data) {
    try {
        switch (data.type) {
            case 'mouse_move':
                sendToSwift(`move ${data.dx} ${data.dy}`);
                break;
            case 'mouse_to':
                sendToSwift(`move_to ${data.x} ${data.y}`);
                break;
            case 'mouse_click':
                sendToSwift(`click ${data.button} ${data.action || 'press'}`);
                break;
            case 'mouse_scroll':
                sendToSwift(`scroll ${data.dx} ${data.dy}`);
                break;
            case 'key_press':
                sendToSwift(`key ${data.keycode} ${data.action} ${data.modifiers || ''}`);
                break;
            case 'type_text':
                sendToSwift(`type ${data.text}`);
                break;
            case 'media_key':
                sendToSwift(`media_key ${data.key} ${data.action || 'press'}`);
                break;
            case 'set_volume':
                exec(`osascript -e "set volume output volume ${data.value}"`);
                break;
            case 'open_app':
                console.log(`Opening app: ${data.name}`);
                exec(`open -a "${data.name}"`, (err) => {
                    if (err) {
                        exec(`open -a "${path.basename(data.name, '.app')}"`);
                    }
                });
                break;
            case 'system_action':
                if (data.action === 'sleep') {
                    exec("osascript -e 'tell application \"System Events\" to sleep'");
                } else if (data.action === 'lock') {
                    exec("osascript -e 'tell application \"System Events\" to keystroke \"q\" using {control down, command down}'");
                } else if (data.action === 'desktop') {
                    exec(`osascript -e '
                        tell application "System Events"
                            set visible of every process whose visible is true and name is not "Finder" to false
                        end tell
                    '`);
                } else if (data.action === 'mission_control') {
                    exec("open -a 'Mission Control'");
                }
                break;
        }
    } catch (e) {
        console.error("Error executing action: ", e);
    }
}

// SSE Subscriber to ntfy.sh (No browser required)
function subscribeToNtfy(topic) {
    const url = `https://ntfy.sh/${topic}/sse`;
    https.get(url, (res) => {
        let buffer = '';
        res.on('data', (chunk) => {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop();
            
            for (const line of lines) {
                if (line.startsWith('data:')) {
                    try {
                        const eventData = JSON.parse(line.slice(5).trim());
                        if (eventData.event === 'message') {
                            const payload = JSON.parse(eventData.message);
                            handleIncomingPayload(payload);
                        }
                    } catch (e) {}
                }
            }
        });
        
        res.on('end', () => {
            console.log("Cloud relay disconnected, reconnecting in 2s...");
            setTimeout(() => subscribeToNtfy(topic), 2000);
        });
    }).on('error', (err) => {
        console.error("Cloud relay connection error:", err);
        setTimeout(() => subscribeToNtfy(topic), 5000);
    });
}

// Publish real-time stats to cloud channel for phone HUD updates
function publishStatsToCloud(topic) {
    cachedStats.cpu = currentCpuUsage;
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    cachedStats.memory = Math.round(((totalMem - freeMem) / totalMem) * 100);
    cachedStats.accessibilityTrusted = accessibilityTrusted;

    exec("osascript -e 'tell application \"System Events\" to get name of first process whose frontmost is true'", (err, activeAppOut) => {
        if (!err && activeAppOut) {
            cachedStats.activeApp = activeAppOut.trim();
        }
        
        exec("pmset -g batt", (err, battOut) => {
            if (!err && battOut) {
                const matches = battOut.match(/(\d+)%;\s*([^;]+);/);
                if (matches) {
                    cachedStats.battery = {
                        percent: parseInt(matches[1]),
                        isCharging: matches[2].toLowerCase().includes('charging') || matches[2].toLowerCase().includes('ac')
                    };
                }
            }
            
            const payload = {
                type: 'stats_update',
                stats: cachedStats
            };
            
            ntfyPost(`${topic}-stats`, payload);
        });
    });
}

// Helper to POST JSON to ntfy.sh
function ntfyPost(topic, payload) {
    const postData = JSON.stringify(payload);
    const req = https.request({
        hostname: 'ntfy.sh',
        port: 443,
        path: `/${topic}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    }, (res) => {});
    req.on('error', () => {});
    req.write(postData);
    req.end();
}

// Publish the real installed app list to ntfy.sh so Netlify can read it
function publishAppsToCloud(topic) {
    const apps = getInstalledApps();
    const payload = {
        type: 'apps_list',
        apps: apps,
        publishedAt: Date.now()
    };
    ntfyPost(`${topic}-apps`, payload);
    console.log(`📦 Published ${apps.length} installed apps to cloud (ntfy.sh/${topic}-apps)`);
}
