// ==========================================================================
// MAC DECK - CLIENT JAVASCRIPT
// Handles device mode, WebSockets, trackpad gestures, joystick math,
// virtual keyboard composition, sound synthesis, and settings storage.
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // Setup BroadcastChannel for client-to-client offline relay (0 latency, 0 rate limits!)
    const localChannel = new BroadcastChannel('macdeck-relay');

    // ----------------------------------------------------------------------
    // 1. DEVICE TYPE & LAYOUT DETECTION
    // ----------------------------------------------------------------------
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const urlParams = new URLSearchParams(window.location.search);
    const forceMobile = urlParams.has('mode') && urlParams.get('mode') === 'mobile';
    const forceDesktop = urlParams.has('mode') && urlParams.get('mode') === 'desktop';
    let session = urlParams.get('session') || null;
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
        // -----------------------------------------------------------------------
        // PRODUCTION DESKTOP DASHBOARD
        // The desktop view shows live Mac status + controller QR/link.
        // Stats are pulled from the Mac via ntfy.sh SSE cloud relay.
        // No simulation, no demo mode — this is the real deal.
        // -----------------------------------------------------------------------

        // The Mac's hardcoded ntfy.sh channel topic.
        // This is derived from your Mac's hostname and is set in server.js at startup.
        const MAC_NTFY_TOPIC = 'macdeck-bhupals-macbook-pro';

        const copyBtn = document.getElementById('copy-url-btn');
        const mobileUrlCode = document.getElementById('mobile-url');
        const hostActiveApp = document.getElementById('host-active-app');
        const hostCpu = document.getElementById('host-cpu');
        const hostMem = document.getElementById('host-mem');
        const hostBattery = document.getElementById('host-battery');
        const qrContainer = document.getElementById('qr-container');
        const macStatusDot = document.getElementById('mac-status-dot');
        const macStatusText = document.getElementById('mac-status-text');
        const statusBadge = document.getElementById('desktop-connection-status');
        const statsOfflineMsg = document.getElementById('stats-offline-msg');

        // Build the controller URL — same page, with ?role=controller
        // Anyone who opens this link gets the mobile controller UI directly
        const controllerUrl = window.location.origin + window.location.pathname + '?role=controller';
        let mobileLink = controllerUrl;

        // Set the URL display
        if (mobileUrlCode) mobileUrlCode.textContent = controllerUrl;

        // Generate QR code pointing to the controller URL
        if (qrContainer) {
            const qrImg = document.createElement('img');
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(controllerUrl)}&bgcolor=ffffff&color=000000&margin=4`;
            qrImg.style.width = '100%';
            qrImg.style.height = '100%';
            qrImg.alt = 'Controller QR Code';
            qrContainer.innerHTML = '';
            qrContainer.appendChild(qrImg);
        }

        // "Open Controller on This Computer" button
        const openControllerDesktopBtn = document.getElementById('open-controller-desktop-btn');
        if (openControllerDesktopBtn) {
            openControllerDesktopBtn.addEventListener('click', () => {
                const w = 870, h = 560;
                const left = Math.round((screen.width - w) / 2);
                const top  = Math.round((screen.height - h) / 2);
                window.open(controllerUrl, 'MacDeckController',
                    `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=no`);
            });
        }

        // Copy button
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(mobileLink).then(() => {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => copyBtn.textContent = 'Copy', 2000);
                });
            });
        }

        // -----------------------------------------------------------------------
        // Live Stats via ntfy.sh SSE
        // The Mac's server.js pushes stats every 5 seconds to ntfy.sh/<topic>-stats
        // We listen to that SSE stream here to show real-time Mac status
        // -----------------------------------------------------------------------
        let macOnline = false;
        let statsTimeoutHandle = null;

        function setMacStatus(online) {
            macOnline = online;
            if (macStatusDot) {
                macStatusDot.style.background = online ? '#10b981' : '#6b7280';
                macStatusDot.style.boxShadow = online ? '0 0 8px rgba(16,185,129,0.8)' : 'none';
            }
            if (macStatusText) macStatusText.textContent = online ? 'Mac Online' : 'Mac Offline';
            if (statusBadge) {
                statusBadge.className = online ? 'badge status-connected' : 'badge';
                statusBadge.style.background = online ? '' : 'rgba(107,114,128,0.12)';
                statusBadge.style.color = online ? '' : '#9ca3af';
                statusBadge.style.borderColor = online ? '' : 'rgba(107,114,128,0.25)';
            }
            if (statsOfflineMsg) statsOfflineMsg.style.display = online ? 'none' : 'block';
        }

        function applyStats(stats) {
            if (!stats) return;
            setMacStatus(true);

            // Reset the "went offline" timer — if we don't get stats for 15s, mark offline
            clearTimeout(statsTimeoutHandle);
            statsTimeoutHandle = setTimeout(() => setMacStatus(false), 15000);

            if (hostActiveApp) hostActiveApp.textContent = stats.activeApp || '—';
            if (hostCpu) hostCpu.textContent = stats.cpu !== undefined ? `${stats.cpu}%` : '—';
            if (hostMem) hostMem.textContent = stats.memory !== undefined ? `${stats.memory}%` : '—';
            if (hostBattery) {
                const bat = stats.battery;
                if (bat) {
                    let batStr = `${bat.percent}%`;
                    if (bat.isCharging) batStr = '⚡ ' + batStr;
                    hostBattery.textContent = batStr;
                } else {
                    hostBattery.textContent = '—';
                }
            }
        }

        // Connect to ntfy.sh SSE for live stats
        function connectStatsSSE() {
            const statsUrl = `https://ntfy.sh/${MAC_NTFY_TOPIC}-stats/sse`;
            const statsSSE = new EventSource(statsUrl);

            statsSSE.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.event === 'message') {
                        const payload = JSON.parse(data.message);
                        if (payload.type === 'stats_update' && payload.stats) {
                            applyStats(payload.stats);
                        }
                    }
                } catch (e) {
                    // ignore parse errors
                }
            };

            statsSSE.onerror = () => {
                statsSSE.close();
                // Reconnect after 5s
                setTimeout(connectStatsSSE, 5000);
            };
        }

        // If running on localhost, also poll local API for richer local stats
        const isLocalServer = (window.location.hostname === 'localhost' ||
                               window.location.hostname === '127.0.0.1' ||
                               window.location.hostname.startsWith('192.168.'));

        if (isLocalServer) {
            // Local mode: use direct API + WebSocket, overriding QR with local IP
            fetch('/api/server-info')
                .then(res => res.json())
                .then(data => {
                    const localUrl = data.url;
                    if (mobileUrlCode) mobileUrlCode.textContent = localUrl;
                    mobileLink = localUrl;

                    if (data.qrCode && qrContainer) {
                        qrContainer.innerHTML = data.qrCode;
                        const svg = qrContainer.querySelector('svg');
                        if (svg) { svg.style.width = '100%'; svg.style.height = '100%'; }
                    }
                })
                .catch(() => {});

            function pollLocalStats() {
                fetch('/api/system-stats')
                    .then(res => res.json())
                    .then(data => {
                        applyStats({
                            activeApp: data.activeApp,
                            cpu: data.cpu,
                            memory: data.memory,
                            battery: data.battery
                        });
                    })
                    .catch(() => setMacStatus(false));
            }
            pollLocalStats();
            setInterval(pollLocalStats, 3000);
        }

        // Always connect to ntfy SSE for cloud relay stats (works both locally and on Netlify)
        connectStatsSSE();

        // Start with "Checking..." which resolves once stats arrive or times out
        setTimeout(() => {
            if (!macOnline) setMacStatus(false);
        }, 8000);
    }

    // ----------------------------------------------------------------------
    // 4. MOBILE VIEW CODE
    // ----------------------------------------------------------------------
    function initMobileController() {
        // Determine if we're running locally or on Netlify/cloud
        const isLocalServer = (window.location.hostname === 'localhost' ||
                               window.location.hostname === '127.0.0.1' ||
                               window.location.hostname.startsWith('192.168.'));

        let ws = null;
        let activeModifiers = new Set();
        let trackpadSensitivity = parseFloat(localStorage.getItem('trackpadSensitivity') || '1.2');
        let reconnectInterval = 1000;
        let isConnected = false;

        // Custom Cloud Mac ID setup handler
        const cloudMacIdInput = document.getElementById('cloud-mac-id-input');
        const saveCloudMacIdBtn = document.getElementById('save-cloud-mac-id-btn');
        const cloudMacIdStatus = document.getElementById('cloud-mac-id-status');

        let savedCloudMacId = localStorage.getItem('cloudMacId');
        if (savedCloudMacId) {
            if (cloudMacIdInput) cloudMacIdInput.value = savedCloudMacId;
            session = savedCloudMacId; // override session
        }

        if (saveCloudMacIdBtn && cloudMacIdInput) {
            saveCloudMacIdBtn.addEventListener('click', () => {
                const newId = cloudMacIdInput.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
                if (newId) {
                    localStorage.setItem('cloudMacId', newId);
                    if (cloudMacIdStatus) {
                        cloudMacIdStatus.style.display = 'block';
                        setTimeout(() => { cloudMacIdStatus.style.display = 'none'; }, 3000);
                    }
                    setTimeout(() => {
                        window.location.href = window.location.origin + window.location.pathname + '?session=' + newId + '&role=controller';
                    }, 800);
                } else {
                    localStorage.removeItem('cloudMacId');
                    window.location.href = window.location.origin + window.location.pathname + '?role=controller';
                }
            });
        }

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
            if (isDemoMode) {
                // In demo mode, load from localStorage
                appLibrary = JSON.parse(localStorage.getItem('macDeckLibrary') || '[]');
                if (appLibrary.length === 0) {
                    // Default mockup configuration
                    appLibrary = [
                        { name: 'Safari', path: 'Safari', icon: '🌐' },
                        { name: 'Spotify', path: 'Spotify', icon: '🎵' },
                        { name: 'VS Code', path: 'Visual Studio Code', icon: '💻' }
                    ];
                    localStorage.setItem('macDeckLibrary', JSON.stringify(appLibrary));
                }
                renderLibrary();
            } else {
                // In local mode, fetch from host server API
                fetch('/api/library')
                    .then(res => res.json())
                    .then(data => {
                        appLibrary = data;
                        renderLibrary();
                    })
                    .catch(err => console.error("Error fetching library:", err));
            }
        }

        function saveLibrary() {
            if (isDemoMode) {
                // In demo mode, save to localStorage
                localStorage.setItem('macDeckLibrary', JSON.stringify(appLibrary));
                renderLibrary();
            } else {
                // In local mode, save to host server API
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
        }

        // Establish socket connection
        let aggregatedDX = 0;
        let aggregatedDY = 0;
        let throttleTimer = null;

        // Hardcoded Mac ntfy.sh topic — must match server.js hostname-derived topic
        const MAC_NTFY_TOPIC = 'macdeck-bhupals-macbook-pro';

        function throttleMouseMove(payload) {
            aggregatedDX += payload.dx;
            aggregatedDY += payload.dy;
            
            if (!throttleTimer) {
                throttleTimer = setTimeout(() => {
                    postCloudEvent({
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

        function postCloudEvent(payload) {
            fetch(`https://ntfy.sh/${MAC_NTFY_TOPIC}`, {
                method: 'POST',
                body: JSON.stringify(payload)
            }).catch(e => console.error("Error posting cloud event: ", e));
        }

        function connectWebSocket() {
            if (!isLocalServer) {
                // Cloud/Netlify mode — no local WebSocket needed, using ntfy.sh relay
                mobileWsStatus.textContent = "Cloud Relay Active";
                mobileWsStatus.className = "status-val text-green";
                mobilePermStatus.textContent = "Ready";
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
            // Always broadcast to same-origin tabs (popup controller window)
            localChannel.postMessage(payload);

            if (isLocalServer) {
                // On local network: send via WebSocket directly to server
                if (ws && isConnected && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(payload));
                }
            } else {
                // On Netlify/cloud: route via ntfy.sh cloud relay to the Mac
                if (payload.type === 'mouse_move') {
                    throttleMouseMove(payload);
                } else {
                    postCloudEvent(payload);
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

        let statsSse = null;
        function pollHostStats() {
            if (!isLocalServer) {
                // Cloud/Netlify mode — subscribe to ntfy.sh SSE for live Mac stats
                if (!statsSse) {
                    statsSse = new EventSource(`https://ntfy.sh/${MAC_NTFY_TOPIC}-stats/sse`);
                    statsSse.onmessage = (event) => {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.event === 'message') {
                                const payload = JSON.parse(data.message);
                                if (payload.type === 'stats_update' && payload.stats) {
                                    const stats = payload.stats;
                                    statusActiveApp.textContent = stats.activeApp || '—';
                                    statusCpu.textContent = `${stats.cpu}%`;
                                    
                                    let batStr = `${stats.battery.percent}%`;
                                    if (stats.battery.isCharging) batStr = `⚡ ${batStr}`;
                                    statusBattery.textContent = batStr;
                                    
                                    updateAccessibilityUI(stats.accessibilityTrusted);
                                }
                            }
                        } catch (e) {}
                    };
                    statsSse.onerror = () => {
                        statsSse.close();
                        statsSse = null;
                        // Reconnect after 5s
                        setTimeout(pollHostStats, 5000);
                    };
                }
                return;
            }

            // Local mode — poll REST API directly
            fetch('/api/system-stats')
                .then(res => res.json())
                .then(data => {
                    statusActiveApp.textContent = data.activeApp || '—';
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
