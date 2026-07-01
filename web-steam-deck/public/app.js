// ==========================================================================
// MAC DECK - CLIENT JAVASCRIPT
// Handles device mode, WebSockets, trackpad gestures, joystick math,
// virtual keyboard composition, sound synthesis, and settings storage.
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // ----------------------------------------------------------------------
    // 1. DEVICE TYPE & LAYOUT DETECTION
    // ----------------------------------------------------------------------
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const urlParams = new URLSearchParams(window.location.search);
    const forceMobile = urlParams.has('mode') && urlParams.get('mode') === 'mobile';
    const forceDesktop = urlParams.has('mode') && urlParams.get('mode') === 'desktop';
    const session = urlParams.get('session') || null;
    const isController = urlParams.get('role') === 'controller' || session !== null;
    const isDemoMode = (session !== null) || (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.startsWith('192.168.'));

    const desktopView = document.getElementById('desktop-view');
    const mobileView = document.getElementById('mobile-view');

    if ((isMobileDevice || forceMobile || isController) && !forceDesktop) {
        desktopView.classList.add('hidden');
        mobileView.classList.remove('hidden');
        initMobileController();
    } else {
        desktopView.classList.remove('hidden');
        mobileView.classList.add('hidden');
        initDesktopDashboard();
    }

    // ----------------------------------------------------------------------
    // 2. AUDIO SYNTHESIS FEEDBACK (Web Audio API)
    // ----------------------------------------------------------------------
    let audioCtx = null;
    
    function playSynthSound(type) {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            const now = audioCtx.currentTime;

            if (type === 'click') {
                // Short retro high-frequency click
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
                gainNode.gain.setValueAtTime(0.12, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            } 
            else if (type === 'tab') {
                // Smooth slide up tone
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(320, now + 0.15);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            } 
            else if (type === 'success') {
                // Uplifting arcade blip
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.setValueAtTime(450, now + 0.07);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.setValueAtTime(0.08, now + 0.07);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            }
            else if (type === 'alert') {
                // Low pitch error slide
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(80, now + 0.25);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            }
        } catch (e) {
            console.warn("Web Audio failure: ", e);
        }
    }

    // ----------------------------------------------------------------------
    // 3. DESKTOP VIEW CODE
    // ----------------------------------------------------------------------
    function initDesktopDashboard() {
        const copyBtn = document.getElementById('copy-url-btn');
        const mobileUrlCode = document.getElementById('mobile-url');
        const permStatusBox = document.getElementById('perm-status-box');
        const permDot = document.getElementById('perm-dot');
        const permText = document.getElementById('perm-text');
        const permInst = document.getElementById('perm-inst');
        const reqPermBtn = document.getElementById('request-perm-btn');
        
        // Host stats elements
        const hostActiveApp = document.getElementById('host-active-app');
        const hostCpu = document.getElementById('host-cpu');
        const hostMem = document.getElementById('host-mem');
        const hostBattery = document.getElementById('host-battery');

        const qrContainer = document.getElementById('qr-container');
        let mobileLink = '';

        if (isDemoMode) {
            // =================================================================
            // INTERACTIVE WEB DEMO MODE RUNTIME
            // =================================================================
            const connectionStatus = document.getElementById('desktop-connection-status');
            if (connectionStatus) {
                connectionStatus.innerHTML = '<span class="dot" style="background:#3b82f6;box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></span> Demo Mode';
                connectionStatus.className = "badge";
                connectionStatus.style.background = "rgba(59, 130, 246, 0.12)";
                connectionStatus.style.color = "#60a5fa";
                connectionStatus.style.borderColor = "rgba(59, 130, 246, 0.25)";
            }

            // Hide/Show correct panels
            document.querySelectorAll('.local-only').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.demo-only').forEach(el => el.classList.remove('hidden'));

            // Generate random session ID if not set
            const currentSession = session || Math.random().toString(36).substr(2, 8);
            const controllerUrl = window.location.origin + window.location.pathname + '?session=' + currentSession + '&role=controller';
            mobileLink = controllerUrl;
            mobileUrlCode.textContent = controllerUrl;

            // Generate QR Code via free public API
            if (qrContainer) {
                const qrImg = document.createElement('img');
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(controllerUrl)}`;
                qrImg.style.width = '100%';
                qrImg.style.height = '100%';
                qrContainer.innerHTML = '';
                qrContainer.appendChild(qrImg);
            }

            // Simulated macOS Desktop logic
            const desktopArea = document.querySelector('.sim-desktop-area');
            const virtualCursor = document.getElementById('sim-mouse-cursor');
            let demoCursorPos = { x: 200, y: 150 };

            // Clock updater
            const simClock = document.getElementById('sim-clock');
            function updateSimClock() {
                const now = new Date();
                let hours = now.getHours();
                let minutes = now.getMinutes();
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12 || 12;
                minutes = minutes < 10 ? '0' + minutes : minutes;
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                simClock.textContent = `${days[now.getDay()]} ${hours}:${minutes} ${ampm}`;
            }
            setInterval(updateSimClock, 5000);
            updateSimClock();

            // Window controls
            const windows = document.querySelectorAll('.sim-window');
            const dockItems = document.querySelectorAll('.dock-item');
            let zIndexCounter = 30;

            function focusWindow(win) {
                windows.forEach(w => w.classList.remove('active'));
                win.classList.add('active');
                zIndexCounter++;
                win.style.zIndex = zIndexCounter;
            }

            function toggleWindow(appId) {
                const win = document.getElementById(appId);
                if (!win) return;
                if (win.classList.contains('hidden')) {
                    win.classList.remove('hidden');
                    // Center it
                    const w = win.offsetWidth || 320;
                    const h = win.offsetHeight || 220;
                    win.style.left = ((desktopArea.offsetWidth - w) / 2) + 'px';
                    win.style.top = ((desktopArea.offsetHeight - h) / 2) + 'px';
                    focusWindow(win);
                } else {
                    win.classList.add('hidden');
                }
            }

            // Bind manual clicks to simulated elements (for testing directly on Mac)
            dockItems.forEach(item => {
                item.addEventListener('click', () => {
                    const appId = item.getAttribute('data-app');
                    toggleWindow(appId);
                });
            });

            document.querySelectorAll('.win-close-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const win = btn.closest('.sim-window');
                    if (win) win.classList.add('hidden');
                });
            });

            windows.forEach(win => {
                win.addEventListener('mousedown', () => focusWindow(win));
            });

            // Simulated Dragging variables
            let draggedWindow = null;
            let dragOffset = { x: 0, y: 0 };

            // Connect to ntfy.sh EventSource for phone signals
            const sse = new EventSource(`https://ntfy.sh/macdeck-${currentSession}/sse`);
            console.log(`Subscribed to ntfy.sh topic: macdeck-${currentSession}`);

            // Spotify play toggle simulation
            const simPlayBtn = document.getElementById('sim-play-btn');
            const simSpotifyArt = document.getElementById('sim-spotify-art');
            let isSpotifyPlaying = false;
            if (simPlayBtn) {
                simPlayBtn.addEventListener('click', () => {
                    isSpotifyPlaying = !isSpotifyPlaying;
                    simPlayBtn.textContent = isSpotifyPlaying ? '⏸️' : '▶️';
                    simSpotifyArt.textContent = isSpotifyPlaying ? '🔊' : '🎵';
                });
            }

            // Keyboard text editor
            const simTextEditor = document.getElementById('sim-text-editor');

            sse.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // ntfy wraps messages in event data
                    const payload = JSON.parse(data.message);
                    
                    // Handle events
                    if (payload.type === 'mouse_move') {
                        demoCursorPos.x += payload.dx * 0.5;
                        demoCursorPos.y += payload.dy * 0.5;

                        // Bounds checking
                        demoCursorPos.x = Math.max(0, Math.min(demoCursorPos.x, desktopArea.offsetWidth));
                        demoCursorPos.y = Math.max(24, Math.min(demoCursorPos.y, desktopArea.offsetHeight));

                        // Render cursor
                        if (virtualCursor) {
                            virtualCursor.style.left = demoCursorPos.x + 'px';
                            virtualCursor.style.top = demoCursorPos.y + 'px';
                        }

                        // Drag window
                        if (draggedWindow) {
                            let newLeft = demoCursorPos.x - dragOffset.x;
                            let newTop = demoCursorPos.y - dragOffset.y;
                            draggedWindow.style.left = newLeft + 'px';
                            draggedWindow.style.top = newTop + 'px';
                        }
                    } 
                    else if (payload.type === 'mouse_click') {
                        const areaRect = desktopArea.getBoundingClientRect();
                        const clientX = areaRect.left + demoCursorPos.x;
                        const clientY = areaRect.top + demoCursorPos.y;

                        if (payload.action === 'press') {
                            const el = document.elementFromPoint(clientX, clientY);
                            if (el) {
                                const dockItem = el.closest('.dock-item');
                                if (dockItem) {
                                    toggleWindow(dockItem.getAttribute('data-app'));
                                } else {
                                    el.click();
                                    const win = el.closest('.sim-window');
                                    if (win) focusWindow(win);
                                    const close = el.closest('.win-close-btn');
                                    if (close) {
                                        const wToClose = el.closest('.sim-window');
                                        if (wToClose) wToClose.classList.add('hidden');
                                    }
                                }
                            }
                        } 
                        else if (payload.action === 'down') {
                            const el = document.elementFromPoint(clientX, clientY);
                            if (el) {
                                const titlebar = el.closest('.win-titlebar');
                                if (titlebar) {
                                    draggedWindow = el.closest('.sim-window');
                                    focusWindow(draggedWindow);
                                    const winRect = draggedWindow.getBoundingClientRect();
                                    dragOffset.x = demoCursorPos.x - (winRect.left - areaRect.left);
                                    dragOffset.y = demoCursorPos.y - (winRect.top - areaRect.top);
                                }
                            }
                        } 
                        else if (payload.action === 'up') {
                            draggedWindow = null;
                        }
                    }
                    else if (payload.type === 'mouse_scroll') {
                        // Scroll currently active window if scrollable
                        const activeWin = document.querySelector('.sim-window.active');
                        if (activeWin) {
                            const content = activeWin.querySelector('.win-content');
                            if (content) {
                                content.scrollTop += payload.dy * 1.5;
                            }
                        }
                    }
                    else if (payload.type === 'open_app') {
                        const appPath = payload.name.toLowerCase();
                        if (appPath.includes('spotify')) {
                            toggleWindow('win-spotify');
                        } else if (appPath.includes('safari') || appPath.includes('chrome')) {
                            toggleWindow('win-safari');
                        } else if (appPath.includes('code') || appPath.includes('vscode')) {
                            toggleWindow('win-vscode');
                        }
                    }
                    else if (payload.type === 'keyboard_type') {
                        if (simTextEditor) {
                            simTextEditor.value += payload.text;
                        }
                    }
                    else if (payload.type === 'keyboard_key') {
                        if (simTextEditor) {
                            const keyCode = payload.code;
                            if (keyCode === 127 || payload.key === 'Backspace') { // backspace
                                simTextEditor.value = simTextEditor.value.slice(0, -1);
                            } else if (keyCode === 36 || payload.key === 'Enter') { // enter
                                simTextEditor.value += '\n';
                            }
                        }
                    }
                    else if (payload.type === 'media_volume' || payload.type === 'media_brightness') {
                        // Show HUD overlay
                        const hud = document.getElementById('sim-hud-overlay');
                        const hudIcon = document.getElementById('sim-hud-icon');
                        const hudFill = document.getElementById('sim-hud-fill');
                        
                        if (hud) {
                            hudIcon.textContent = payload.type === 'media_volume' ? '🔊' : '🔆';
                            let percentage = payload.value !== undefined ? payload.value : 50;
                            hudFill.style.width = `${percentage}%`;
                            
                            hud.classList.remove('hidden');
                            clearTimeout(hud.timer);
                            hud.timer = setTimeout(() => {
                                hud.classList.add('hidden');
                            }, 1500);
                        }
                    }
                    
                } catch(err) {
                    console.error("Failed to process ntfy event:", err);
                }
            };

        } else {
            // =================================================================
            // LOCAL SERVER PRODUCTION MODE RUNTIME
            // =================================================================
            // Set up host connection info dynamically from server config
            fetch('/api/server-info')
                .then(res => res.json())
                .then(data => {
                    mobileLink = data.url;
                    mobileUrlCode.textContent = data.url;
                    
                    if (data.qrCode && qrContainer) {
                        qrContainer.innerHTML = data.qrCode;
                        const svg = qrContainer.querySelector('svg');
                        if (svg) {
                            svg.style.width = '100%';
                            svg.style.height = '100%';
                            svg.style.display = 'block';
                        }
                    } else {
                        document.getElementById('qr-fallback').classList.remove('hidden');
                    }
                })
                .catch(err => {
                    console.error("Failed to load server info:", err);
                    const hostUrl = `${window.location.protocol}//${window.location.host}`;
                    mobileUrlCode.textContent = hostUrl;
                    mobileLink = hostUrl;
                    document.getElementById('qr-fallback').classList.remove('hidden');
                });

            // Fetch metrics and permissions
            function checkPermissionsAndStats() {
                fetch('/api/system-stats')
                    .then(res => res.json())
                    .then(data => {
                        // Update permission card
                        if (data.accessibilityTrusted) {
                            permDot.className = 'status-dot active';
                            permText.textContent = 'Accessibility Access Granted';
                            permInst.classList.add('hidden');
                        } else {
                            permDot.className = 'status-dot inactive';
                            permText.textContent = 'Accessibility Access Denied';
                            permInst.classList.remove('hidden');
                        }

                        // Update system stats
                        hostActiveApp.textContent = data.activeApp || "Unknown";
                        hostCpu.textContent = `${data.cpu}%`;
                        hostMem.textContent = `${data.memory}%`;
                        
                        let batStr = `${data.battery.percent}%`;
                        if (data.battery.isCharging) batStr += ' (Charging)';
                        hostBattery.textContent = batStr;
                    })
                    .catch(err => console.error("Error connecting to server stats API:", err));
            }

            reqPermBtn.addEventListener('click', () => {
                fetch('/api/request-accessibility', { method: 'POST' })
                    .then(() => checkPermissionsAndStats());
            });

            // Run check on startup and poll
            checkPermissionsAndStats();
            setInterval(checkPermissionsAndStats, 2000);
        }

        // Copy functionality
        copyBtn.addEventListener('click', () => {
            const urlToCopy = mobileLink || mobileUrlCode.textContent;
            navigator.clipboard.writeText(urlToCopy).then(() => {
                copyBtn.textContent = 'Copied!';
                setTimeout(() => copyBtn.textContent = 'Copy', 2000);
            });
        });
    }

    // ----------------------------------------------------------------------
    // 4. MOBILE VIEW CODE
    // ----------------------------------------------------------------------
    function initMobileController() {
        let ws = null;
        let activeModifiers = new Set();
        let trackpadSensitivity = parseFloat(localStorage.getItem('trackpadSensitivity') || '1.2');
        let reconnectInterval = 1000;
        let isConnected = false;

        // UI states
        const statusActiveApp = document.getElementById('mobile-active-app');
        const statusCpu = document.getElementById('mobile-stat-cpu');
        const statusBattery = document.getElementById('mobile-stat-battery');
        const statusTime = document.getElementById('mobile-time');
        const mobileWsStatus = document.getElementById('mobile-ws-status');
        const mobilePermStatus = document.getElementById('mobile-perm-status');

        // Library variables stored on Host PC
        let appLibrary = [];
        
        function fetchLibrary() {
            fetch('/api/library')
                .then(res => res.json())
                .then(data => {
                    appLibrary = data;
                    renderLibrary();
                })
                .catch(err => console.error("Error fetching library:", err));
        }

        function saveLibrary() {
            fetch('/api/library', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appLibrary)
            })
            .then(res => res.json())
            .then(data => {
                appLibrary = data.library;
                renderLibrary();
            })
            .catch(err => console.error("Error saving library:", err));
        }

        // Establish socket connection
        let aggregatedDX = 0;
        let aggregatedDY = 0;
        let throttleTimer = null;

        function throttleMouseMove(payload) {
            aggregatedDX += payload.dx;
            aggregatedDY += payload.dy;
            
            if (!throttleTimer) {
                throttleTimer = setTimeout(() => {
                    postDemoEvent({
                        type: 'mouse_move',
                        dx: aggregatedDX,
                        dy: aggregatedDY
                    });
                    aggregatedDX = 0;
                    aggregatedDY = 0;
                    throttleTimer = null;
                }, 80);
            }
        }

        function postDemoEvent(payload) {
            const currentSession = session || 'demo';
            fetch(`https://ntfy.sh/macdeck-${currentSession}`, {
                method: 'POST',
                body: JSON.stringify(payload)
            }).catch(e => console.error("Error posting demo event: ", e));
        }

        function connectWebSocket() {
            if (isDemoMode) {
                mobileWsStatus.textContent = "Demo Session Active";
                mobileWsStatus.className = "status-val text-green";
                mobilePermStatus.textContent = "Sandbox OK";
                mobilePermStatus.className = "status-val text-green";
                return; // skip local WS
            }

            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const socketUrl = `${protocol}//${window.location.host}`;
            
            mobileWsStatus.textContent = "Connecting...";
            mobileWsStatus.className = "status-val text-muted";
            
            ws = new WebSocket(socketUrl);
 
            ws.onopen = () => {
                console.log('Connected to server');
                isConnected = true;
                reconnectInterval = 1000;
                mobileWsStatus.textContent = "Connected";
                mobileWsStatus.className = "status-val text-green";
                playSynthSound('success');
            };
 
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'status_update') {
                        updateAccessibilityUI(data.accessibilityTrusted);
                    }
                } catch (e) {
                    console.error("WS error: ", e);
                }
            };
 
            ws.onclose = () => {
                isConnected = false;
                mobileWsStatus.textContent = "Disconnected";
                mobileWsStatus.className = "status-val text-red";
                playSynthSound('alert');
                
                // Retry reconnect
                setTimeout(() => {
                    reconnectInterval = Math.min(reconnectInterval * 2, 10000);
                    connectWebSocket();
                }, reconnectInterval);
            };
 
            ws.onerror = () => {
                ws.close();
            };
        }
 
        function sendWS(payload) {
            if (isDemoMode) {
                if (payload.type === 'mouse_move') {
                    throttleMouseMove(payload);
                } else {
                    postDemoEvent(payload);
                }
            } else {
                if (ws && isConnected && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(payload));
                }
            }
        }

        function updateAccessibilityUI(trusted) {
            if (trusted) {
                mobilePermStatus.textContent = "Accessibility OK";
                mobilePermStatus.className = "status-val text-green";
            } else {
                mobilePermStatus.textContent = "Need Permission";
                mobilePermStatus.className = "status-val text-red";
            }
        }

        // ------------------------------------------------------------------
        // Tab switching logic
        // ------------------------------------------------------------------
        const navItems = document.querySelectorAll('.mobile-nav-bar .nav-item');
        const panels = document.querySelectorAll('.panel-section');

        navItems.forEach(item => {
            item.addEventListener('touchstart', (e) => {
                e.preventDefault(); // suppress click delay
                
                const targetPanel = item.getAttribute('data-target');
                
                // Toggle active navbar item
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                // Switch visible panel
                panels.forEach(panel => {
                    if (panel.id === targetPanel) {
                        panel.classList.add('active');
                    } else {
                        panel.classList.remove('active');
                    }
                });

                playSynthSound('tab');
            });
        });

        // ------------------------------------------------------------------
        // Clock & System stats updater
        // ------------------------------------------------------------------
        function updateClock() {
            const date = new Date();
            let hours = date.getHours();
            let minutes = date.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            minutes = minutes < 10 ? '0' + minutes : minutes;
            statusTime.textContent = `${hours}:${minutes} ${ampm}`;
        }
        setInterval(updateClock, 1000);
        updateClock();

        function pollHostStats() {
            fetch('/api/system-stats')
                .then(res => res.json())
                .then(data => {
                    statusActiveApp.textContent = data.activeApp || "Finder";
                    statusCpu.textContent = `${data.cpu}%`;
                    
                    let batStr = `${data.battery.percent}%`;
                    if (data.battery.isCharging) batStr = `⚡ ${batStr}`;
                    statusBattery.textContent = batStr;
                    
                    updateAccessibilityUI(data.accessibilityTrusted);
                })
                .catch(() => {});
        }
        setInterval(pollHostStats, 3000);
        pollHostStats();

        // ------------------------------------------------------------------
        // library app carousel render
        // ------------------------------------------------------------------
        const carousel = document.getElementById('apps-carousel');
        const editLibraryBtn = document.getElementById('btn-edit-library');
        let editModeActive = false;

        function renderLibrary() {
            carousel.innerHTML = '';
            appLibrary.forEach((app, idx) => {
                const card = document.createElement('div');
                card.className = 'app-card';
                card.innerHTML = `
                    <button class="delete-btn" data-index="${idx}">&times;</button>
                    <div class="icon-wrapper">${app.icon || '🚀'}</div>
                    <div class="app-name">${app.name}</div>
                `;
                
                // Launch click handler
                card.addEventListener('click', (e) => {
                    if (editModeActive) return; // ignore launch if in delete mode
                    playSynthSound('click');
                    sendWS({ type: 'open_app', name: app.path });
                });

                // Delete click handler
                const deleteBtn = card.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    playSynthSound('alert');
                    appLibrary.splice(idx, 1);
                    saveLibrary();
                });

                carousel.appendChild(card);
            });
        }
        
        editLibraryBtn.addEventListener('click', () => {
            editModeActive = !editModeActive;
            playSynthSound('click');
            if (editModeActive) {
                editLibraryBtn.textContent = 'Done';
                carousel.classList.add('edit-mode');
            } else {
                editLibraryBtn.textContent = 'Edit';
                carousel.classList.remove('edit-mode');
            }
        });
        
        fetchLibrary();

        // ------------------------------------------------------------------
        // Virtual trackpad gestures
        // ------------------------------------------------------------------
        const trackpad = document.getElementById('virtual-trackpad');
        const sensSlider = document.getElementById('trackpad-sens');
        const sensVal = document.getElementById('sens-val');
        
        sensSlider.addEventListener('input', (e) => {
            trackpadSensitivity = parseFloat(e.target.value);
            sensVal.textContent = `${trackpadSensitivity}x`;
            localStorage.setItem('trackpadSensitivity', trackpadSensitivity);
        });
        
        // Trackpad gesture memory
        let touchStartPoints = [];
        let lastTouchTime = 0;
        let isScrolling = false;
        let scrollStartPoint = null;

        trackpad.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const now = Date.now();
            touchStartPoints = Array.from(e.touches).map(t => ({ x: t.clientX, y: t.clientY }));
            isScrolling = (e.touches.length === 2);
            
            if (isScrolling) {
                // Multi touch midpoint
                scrollStartPoint = getTouchMidpoint(e.touches);
            }
        });

        trackpad.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 1 && !isScrolling) {
                // Relative single-finger mouse movement
                const touch = e.touches[0];
                const start = touchStartPoints[0];
                if (!start) return;

                const dx = (touch.clientX - start.x) * trackpadSensitivity;
                const dy = (touch.clientY - start.y) * trackpadSensitivity;

                sendWS({
                    type: 'mouse_move',
                    dx: Math.round(dx),
                    dy: Math.round(dy)
                });

                // Update baseline to track differential sweeps
                touchStartPoints[0] = { x: touch.clientX, y: touch.clientY };
            } 
            else if (e.touches.length === 2 && isScrolling) {
                // Two-finger scroll
                const currentMidpoint = getTouchMidpoint(e.touches);
                if (!scrollStartPoint) return;

                const scrollDx = Math.round((currentMidpoint.x - scrollStartPoint.x) * trackpadSensitivity * 1.5);
                const scrollDy = Math.round((currentMidpoint.y - scrollStartPoint.y) * trackpadSensitivity * 1.5);

                // Note: macOS naturally reverses scroll values if natural scrolling is on, 
                // but standard wheel input translates scrolling directly. Let's invert y to act like standard mouse scroll.
                sendWS({
                    type: 'mouse_scroll',
                    dx: scrollDx,
                    dy: -scrollDy // invert vertical coordinate for intuitive desktop scroll mapping
                });

                scrollStartPoint = currentMidpoint;
            }
        });

        trackpad.addEventListener('touchend', (e) => {
            e.preventDefault();
            const now = Date.now();
            
            // Mouse click synthesis (tap detection)
            // Finger touch down and up quickly with minimal movement is a single click
            if (touchStartPoints.length === 1 && e.touches.length === 0) {
                const duration = now - lastTouchTime;
                
                // Generate left click
                sendWS({ type: 'mouse_click', button: 'left', action: 'press' });
                playSynthSound('click');
            } 
            else if (touchStartPoints.length === 2 && e.touches.length === 0) {
                // Two finger tap = Right click
                sendWS({ type: 'mouse_click', button: 'right', action: 'press' });
                playSynthSound('click');
            }

            // Record touch timing for multi-click analysis
            lastTouchTime = now;
            touchStartPoints = [];
            isScrolling = false;
            scrollStartPoint = null;
        });

        function getTouchMidpoint(touches) {
            return {
                x: (touches[0].clientX + touches[1].clientX) / 2,
                y: (touches[0].clientY + touches[1].clientY) / 2
            };
        }

        // Tap Left / Right buttons
        document.getElementById('track-left-click').addEventListener('touchstart', (e) => {
            e.preventDefault();
            playSynthSound('click');
            sendWS({ type: 'mouse_click', button: 'left', action: 'down' });
        });
        document.getElementById('track-left-click').addEventListener('touchend', (e) => {
            e.preventDefault();
            sendWS({ type: 'mouse_click', button: 'left', action: 'up' });
        });

        document.getElementById('track-right-click').addEventListener('touchstart', (e) => {
            e.preventDefault();
            playSynthSound('click');
            sendWS({ type: 'mouse_click', button: 'right', action: 'down' });
        });
        document.getElementById('track-right-click').addEventListener('touchend', (e) => {
            e.preventDefault();
            sendWS({ type: 'mouse_click', button: 'right', action: 'up' });
        });


        // ------------------------------------------------------------------
        // Advanced keyboard system & actions
        // ------------------------------------------------------------------
        const kbInput = document.getElementById('keyboard-input');
        const clearKbBtn = document.getElementById('keyboard-clear-btn');
        const modifierBtns = document.querySelectorAll('.key-modifier');
        const actionBtns = document.querySelectorAll('.key-action');
        const macroBtns = document.querySelectorAll('.macro-btn');

        // Intercept composition changes and dispatch to server
        kbInput.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val.length > 0) {
                sendWS({ type: 'type_text', text: val });
                e.target.value = ''; // clean input field immediately for next chars
            }
        });

        // Watch backspace key natively because input field is cleared
        kbInput.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                sendWS({ type: 'key_press', keycode: 51, action: 'press' });
                playSynthSound('click');
            }
        });

        clearKbBtn.addEventListener('click', () => {
            kbInput.value = '';
            kbInput.focus();
            playSynthSound('click');
        });

        // Modifier Sticky Key selection
        modifierBtns.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const modifierName = btn.getAttribute('data-mod');
                playSynthSound('click');
                
                if (activeModifiers.has(modifierName)) {
                    activeModifiers.delete(modifierName);
                    btn.classList.remove('active');
                } else {
                    activeModifiers.add(modifierName);
                    btn.classList.add('active');
                }
            });
        });

        function getActiveModifiersString() {
            return Array.from(activeModifiers).join(',');
        }

        // Action Keys
        actionBtns.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const keycode = btn.getAttribute('data-keycode');
                const mods = getActiveModifiersString();
                
                playSynthSound('click');
                sendWS({
                    type: 'key_press',
                    keycode: parseInt(keycode),
                    action: 'press',
                    modifiers: mods
                });

                // Clear sticky modifiers after executing the action
                clearStickyModifiers();
            });
        });

        function clearStickyModifiers() {
            activeModifiers.clear();
            modifierBtns.forEach(b => b.classList.remove('active'));
        }

        // Shortcut macro keys
        macroBtns.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const macro = btn.getAttribute('data-macro');
                playSynthSound('success');

                switch (macro) {
                    case 'copy':
                        sendWS({ type: 'key_press', keycode: 8, action: 'press', modifiers: 'cmd' });
                        break;
                    case 'paste':
                        sendWS({ type: 'key_press', keycode: 9, action: 'press', modifiers: 'cmd' });
                        break;
                    case 'spotlight':
                        sendWS({ type: 'key_press', keycode: 49, action: 'press', modifiers: 'cmd' });
                        break;
                    case 'app-switch':
                        sendWS({ type: 'key_press', keycode: 48, action: 'press', modifiers: 'cmd' });
                        break;
                    case 'undo':
                        sendWS({ type: 'key_press', keycode: 6, action: 'press', modifiers: 'cmd' });
                        break;
                    case 'quit':
                        sendWS({ type: 'key_press', keycode: 12, action: 'press', modifiers: 'cmd' });
                        break;
                }
            });
        });

        // ------------------------------------------------------------------
        // Gamepad Joystick math & input loop
        // ------------------------------------------------------------------
        // Tab gamepad joysticks
        initJoystick('controller-left-joystick', (x, y) => {
            if (x !== 0 || y !== 0) {
                const speedMult = 14;
                sendWS({
                    type: 'mouse_move',
                    dx: Math.round(x * speedMult),
                    dy: Math.round(y * speedMult)
                });
            }
        });

        initJoystick('controller-right-joystick', (x, y) => {
            if (x !== 0 || y !== 0) {
                const scrollMult = -6;
                sendWS({
                    type: 'mouse_scroll',
                    dx: Math.round(x * scrollMult),
                    dy: Math.round(y * scrollMult)
                });
            }
        });

        // Landscape side-handle joysticks
        initJoystick('landscape-left-joystick', (x, y) => {
            if (x !== 0 || y !== 0) {
                const speedMult = 14;
                sendWS({
                    type: 'mouse_move',
                    dx: Math.round(x * speedMult),
                    dy: Math.round(y * speedMult)
                });
            }
        });

        initJoystick('landscape-right-joystick', (x, y) => {
            if (x !== 0 || y !== 0) {
                const scrollMult = -6;
                sendWS({
                    type: 'mouse_scroll',
                    dx: Math.round(x * scrollMult),
                    dy: Math.round(y * scrollMult)
                });
            }
        });

        function initJoystick(elementId, moveCallback) {
            const pad = document.getElementById(elementId);
            if (!pad) return; // guard check
            const knob = pad.querySelector('.joystick-knob');
            const maxRadius = 30; // joystick travel distance constraint
            let padCenter = { x: 0, y: 0 };
            let loopTimer = null;
            let currentVector = { x: 0, y: 0 };

            pad.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const rect = pad.getBoundingClientRect();
                padCenter = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                };
                playSynthSound('click');
                startLoop();
            });

            pad.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                let dx = touch.clientX - padCenter.x;
                let dy = touch.clientY - padCenter.y;

                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > maxRadius) {
                    dx = (dx / distance) * maxRadius;
                    dy = (dy / distance) * maxRadius;
                }

                knob.style.transform = `translate(${dx}px, ${dy}px)`;
                
                // Normalize values between -1.0 and 1.0
                currentVector = {
                    x: dx / maxRadius,
                    y: dy / maxRadius
                };
            });

            function endTouch(e) {
                e.preventDefault();
                knob.style.transform = 'translate(0px, 0px)';
                currentVector = { x: 0, y: 0 };
                stopLoop();
            }

            pad.addEventListener('touchend', endTouch);
            pad.addEventListener('touchcancel', endTouch);

            function startLoop() {
                if (!loopTimer) {
                    loopTimer = setInterval(() => {
                        moveCallback(currentVector.x, currentVector.y);
                    }, 30); // 33fps input rate is fast and smooth
                }
            }

            function stopLoop() {
                if (loopTimer) {
                    clearInterval(loopTimer);
                    loopTimer = null;
                }
                moveCallback(0, 0);
            }
        }

        // ------------------------------------------------------------------
        // System and Media Controls
        // ------------------------------------------------------------------
        const volumeSlider = document.getElementById('volume-slider');
        const volVal = document.getElementById('vol-val');
        const mediaBtns = document.querySelectorAll('.media-btn');
        const brightUpBtn = document.getElementById('bright-up');
        const brightDownBtn = document.getElementById('bright-down');
        const sysActions = document.querySelectorAll('.sys-btn');

        volumeSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            volVal.textContent = `${val}%`;
            sendWS({ type: 'set_volume', value: parseInt(val) });
        });

        mediaBtns.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const mediaType = btn.getAttribute('data-media');
                playSynthSound('click');
                sendWS({ type: 'media_key', key: mediaType, action: 'press' });
            });
        });

        brightUpBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            playSynthSound('click');
            sendWS({ type: 'media_key', key: 'brightness_up', action: 'press' });
        });
        brightDownBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            playSynthSound('click');
            sendWS({ type: 'media_key', key: 'brightness_down', action: 'press' });
        });

        sysActions.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const action = btn.getAttribute('data-action');
                playSynthSound('success');
                sendWS({ type: 'system_action', action });
            });
        });

        // ------------------------------------------------------------------
        // Manage Library Modal Layout & Actions
        // ------------------------------------------------------------------
        const modal = document.getElementById('library-modal');
        const addLibraryBtn = document.getElementById('btn-edit-library');
        const closeModalBtn = document.getElementById('modal-close-btn');
        const tabSystem = document.getElementById('tab-add-system');
        const tabCustom = document.getElementById('tab-add-custom');
        const panelSystem = document.getElementById('panel-add-system');
        const panelCustom = document.getElementById('panel-add-custom');
        const systemAppsList = document.getElementById('system-apps-list');
        const appSearch = document.getElementById('app-search');
        const customAppForm = document.getElementById('custom-app-form');

        // Open library edit view (long press or quick edit button)
        addLibraryBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            playSynthSound('click');
            if (editModeActive) {
                // Done editing: open modal to add new apps
                modal.classList.remove('hidden');
                loadSystemApplications();
            } else {
                // Start edit mode
                editModeActive = true;
                addLibraryBtn.textContent = 'Add Apps / Done';
                carousel.classList.add('edit-mode');
            }
        });

        closeModalBtn.addEventListener('click', () => {
            playSynthSound('click');
            modal.classList.add('hidden');
        });

        // Modal Tab Toggles
        tabSystem.addEventListener('click', () => {
            playSynthSound('click');
            tabSystem.classList.add('active');
            tabCustom.classList.remove('active');
            panelSystem.classList.add('active');
            panelCustom.classList.remove('active');
        });

        tabCustom.addEventListener('click', () => {
            playSynthSound('click');
            tabCustom.classList.add('active');
            tabSystem.classList.remove('active');
            panelCustom.classList.add('active');
            panelSystem.classList.remove('active');
        });

        // Fetch installed applications from host
        let scannedApps = [];
        function loadSystemApplications() {
            systemAppsList.innerHTML = '<div class="loading-spinner">Scanning applications...</div>';
            fetch('/api/apps')
                .then(res => res.json())
                .then(apps => {
                    scannedApps = apps;
                    renderScannedAppsList(apps);
                })
                .catch(() => {
                    systemAppsList.innerHTML = '<div class="loading-spinner">Failed to load system apps.</div>';
                });
        }

        function renderScannedAppsList(apps) {
            systemAppsList.innerHTML = '';
            if (apps.length === 0) {
                systemAppsList.innerHTML = '<div class="loading-spinner">No applications found.</div>';
                return;
            }

            apps.forEach(app => {
                const item = document.createElement('div');
                item.className = 'app-list-item';
                
                // Try choosing emoji based on keywords
                let emoji = '🚀';
                const name = app.name.toLowerCase();
                if (name.includes('safari') || name.includes('chrome') || name.includes('firefox')) emoji = '🌐';
                else if (name.includes('code') || name.includes('xcode') || name.includes('terminal')) emoji = '💻';
                else if (name.includes('music') || name.includes('spotify')) emoji = '🎵';
                else if (name.includes('chat') || name.includes('slack') || name.includes('discord') || name.includes('messages')) emoji = '💬';
                else if (name.includes('settings') || name.includes('preferences')) emoji = '⚙️';
                else if (name.includes('mail') || name.includes('outlook')) emoji = '✉️';
                else if (name.includes('calendar')) emoji = '📅';
                else if (name.includes('photo') || name.includes('preview')) emoji = '🖼️';
                else if (name.includes('word') || name.includes('pages') || name.includes('notes')) emoji = '📝';

                item.innerHTML = `
                    <div class="app-info">
                        <span class="app-icon-placeholder">${emoji}</span>
                        <span class="app-title-text">${app.name}</span>
                    </div>
                    <span class="add-indicator">+ Add</span>
                `;

                item.addEventListener('click', () => {
                    playSynthSound('success');
                    
                    // Add app structure to custom user carousel
                    if (!appLibrary.some(a => a.path === app.path)) {
                        appLibrary.push({
                            name: app.name,
                            path: app.path,
                            icon: emoji
                        });
                        saveLibrary();
                    }
                    modal.classList.add('hidden');
                });

                systemAppsList.appendChild(item);
            });
        }

        // Live Search System Apps
        appSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = scannedApps.filter(app => app.name.toLowerCase().includes(query));
            renderScannedAppsList(filtered);
        });

        // Add custom App Form handler
        customAppForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('custom-name').value;
            const path = document.getElementById('custom-path').value;
            const icon = document.getElementById('custom-icon').value;

            playSynthSound('success');
            
            appLibrary.push({ name, path, icon });
            saveLibrary();
            
            // Reset and close
            customAppForm.reset();
            modal.classList.add('hidden');
        });

        // Initial connection
        connectWebSocket();
    }
});
