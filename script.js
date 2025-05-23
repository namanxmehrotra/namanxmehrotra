    // Simulated script.js
    document.addEventListener('DOMContentLoaded', () => {
        const desktop = document.getElementById('desktop');
        const desktopIconContainer = document.querySelector('.desktop-icon-container'); 
        const taskbarIconsContainer = document.getElementById('taskbar-icons');
        const startButton = document.getElementById('start-button');
        const startMenu = document.getElementById('start-menu');
        const clockElement = document.getElementById('clock');
        const dateTimeWidgetTime = document.querySelector('#date-time-widget .time');
        const dateTimeWidgetDate = document.querySelector('#date-time-widget .date');
        const weatherWidgetTemp = document.querySelector('#weather-widget .temperature');
        const weatherWidgetDesc = document.querySelector('#weather-widget .description');
        const weatherWidgetLoading = document.querySelector('#weather-widget .loading');
        const weatherWidgetError = document.querySelector('#weather-widget .error');
        const turnOnButton = document.getElementById('turn-on-button');

        const windows = document.querySelectorAll('.window'); 
        let desktopIcons = document.querySelectorAll('.desktop-icon-container .desktop-icon'); 
        
        let highestZIndex = 10;
        let openWindows = {}; 
        let activeDialog = null; 

        // --- Confirmation Modal ---
        const confirmationModal = document.getElementById('confirmation-modal');
        const confirmationMessage = document.getElementById('confirmation-message');
        const confirmYesButton = document.getElementById('confirm-yes');
        const confirmNoButton = document.getElementById('confirm-no');
        let currentConfirmAction = null;

        function showConfirmationModal(message, onConfirm) {
            confirmationMessage.textContent = message;
            currentConfirmAction = onConfirm;
            confirmationModal.style.display = 'flex';
        }

        confirmYesButton.addEventListener('click', () => {
            if (currentConfirmAction) {
                currentConfirmAction();
            }
            confirmationModal.style.display = 'none';
            currentConfirmAction = null;
        });

        confirmNoButton.addEventListener('click', () => {
            confirmationModal.style.display = 'none';
            currentConfirmAction = null;
        });


        // --- Date, Time, and Weather Widget Functionality ---
        function updateDateTime() {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = (hours % 12 || 12).toString().padStart(2, '0');
            
            const timeString = `${displayHours}:${minutes} ${ampm}`;
            clockElement.textContent = timeString;
            if(dateTimeWidgetTime) dateTimeWidgetTime.textContent = timeString;

            if(dateTimeWidgetDate){
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                dateTimeWidgetDate.textContent = now.toLocaleDateString(undefined, options);
            }
        }
        setInterval(updateDateTime, 1000);
        updateDateTime();

        async function fetchWeather() {
            if (!weatherWidgetTemp) return; 
            weatherWidgetLoading.style.display = 'inline';
            weatherWidgetError.style.display = 'none';
            weatherWidgetTemp.textContent = '--°C';
            weatherWidgetDesc.textContent = 'Loading...';

            const apiKey = "AIzaSyCAYjNggYp1ulTMwRuvDR1oojELtCl79gM"; 
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const promptText = "What is the current weather in Kolkata, India? Provide temperature in Celsius and a brief description (e.g., Sunny, Cloudy, Light Rain). Format as JSON like: {\"location\": \"Kolkata, India\", \"temperatureC\": 32, \"description\": \"Sunny\", \"iconCode\": \"01d\" } where iconCode is an OpenWeatherMap icon code (e.g., 01d for clear sky day, 01n for clear sky night, 02d for few clouds day etc.).";

            const payload = {
              contents: [{ role: "user", parts: [{ text: promptText }] }],
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: "OBJECT",
                  properties: {
                    location: { type: "STRING" },
                    temperatureC: { type: "NUMBER" },
                    description: { type: "STRING" },
                    iconCode: {type: "STRING" } 
                  }
                }
              }
            };

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                const result = await response.json();
                
                if (result.candidates && result.candidates.length > 0 &&
                    result.candidates[0].content && result.candidates[0].content.parts &&
                    result.candidates[0].content.parts.length > 0) {
                    const weatherData = JSON.parse(result.candidates[0].content.parts[0].text);
                    weatherWidgetTemp.textContent = `${Math.round(weatherData.temperatureC)}°C`;
                    weatherWidgetDesc.textContent = weatherData.description;
                    if(document.querySelector('#weather-widget .location')) {
                        document.querySelector('#weather-widget .location').textContent = weatherData.location;
                    }
                } else {
                    throw new Error("No weather data in response.");
                }
            } catch (error) {
                console.error("Weather fetch error:", error);
                weatherWidgetError.style.display = 'inline';
                weatherWidgetDesc.textContent = 'Error';
            } finally {
                weatherWidgetLoading.style.display = 'none';
            }
        }
        fetchWeather();
        setInterval(fetchWeather, 15 * 60 * 1000); 


        // --- Start Menu Functionality ---
        startButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const isOpening = startMenu.style.display !== 'block';
            startMenu.style.display = isOpening ? 'block' : 'none';
            
            if (isOpening) {
                startButton.classList.add('active');
                startMenu.classList.add('opening');
                setTimeout(() => startMenu.classList.remove('opening'), 10); 
            } else {
                startButton.classList.remove('active');
            }
        });

        document.addEventListener('click', (event) => {
            if (startMenu.style.display === 'block' && !startMenu.contains(event.target) && event.target !== startButton && !startButton.contains(event.target)) {
                startMenu.style.display = 'none';
                startButton.classList.remove('active');
            }
            if (event.target === desktop || event.target.classList.contains('desktop-icon-container')) {
                 desktopIcons.forEach(icon => icon.classList.remove('selected'));
            }
        });
        
        function setupStartMenuItems() {
            startMenu.querySelectorAll('.start-menu-item').forEach(item => {
                const windowId = item.getAttribute('data-window-id');
                const linkUrl = item.getAttribute('data-link');

                if (windowId) {
                    item.addEventListener('click', () => {
                        const windowElement = document.getElementById(windowId);
                        if (windowElement) {
                            openWindow(windowElement);
                        }
                        startMenu.style.display = 'none';
                        startButton.classList.remove('active');
                    });
                } else if (linkUrl) {
                     item.addEventListener('click', () => {
                        window.open(linkUrl, '_blank');
                        startMenu.style.display = 'none';
                        startButton.classList.remove('active');
                    });
                }
            });
        }
        setupStartMenuItems();


        // --- Window Management ---
        function injectWindowIcons() {
            document.querySelectorAll('.window').forEach(win => {
                const header = win.querySelector('.window-header');
                if (header && win.dataset.iconSvg && !header.querySelector('.window-icon')) {
                    const iconContainer = document.createElement('div'); 
                    iconContainer.innerHTML = win.dataset.iconSvg.trim();
                    const svgIcon = iconContainer.firstChild;
                    if (svgIcon && svgIcon.nodeName.toLowerCase() === 'svg') { 
                         svgIcon.classList.add('window-icon'); 
                         header.insertBefore(svgIcon, header.querySelector('.window-title'));
                    } else {
                        const imgIcon = document.createElement('img');
                        imgIcon.src = "https://placehold.co/16x16/808080/FFFFFF?text=W&font=tahoma"; 
                        imgIcon.alt = "";
                        imgIcon.classList.add('window-icon');
                        header.insertBefore(imgIcon, header.querySelector('.window-title'));
                    }
                }
            });
        }
        injectWindowIcons(); 


        function bringToFront(windowElement) {
            if (activeDialog && activeDialog !== windowElement && !windowElement.contains(activeDialog)) {
                 bringToFront(activeDialog); 
                 return;
            }

            highestZIndex++;
            windowElement.style.zIndex = highestZIndex;
            
            document.querySelectorAll('#taskbar-icons .taskbar-icon').forEach(tbIcon => {
                tbIcon.classList.remove('active');
            });
            if (openWindows[windowElement.id] && openWindows[windowElement.id].taskbarIcon) {
                openWindows[windowElement.id].taskbarIcon.classList.add('active');
            }
        }

        function createTaskbarIcon(windowElement) {
            const windowId = windowElement.id;
            if (openWindows[windowId] && openWindows[windowId].taskbarIcon) return openWindows[windowId].taskbarIcon;

            const icon = document.createElement('div');
            icon.classList.add('taskbar-icon');
            icon.setAttribute('data-window-id', windowId);
            
            const title = windowElement.dataset.title || "Window";
            let iconContent = '';
            if (windowElement.dataset.iconSvg) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = windowElement.dataset.iconSvg.trim();
                const svgElement = tempDiv.firstChild;
                if (svgElement && svgElement.nodeName.toLowerCase() === 'svg') {
                    svgElement.setAttribute('width', '14'); 
                    svgElement.setAttribute('height', '14');
                    iconContent = svgElement.outerHTML;
                } else {
                     iconContent = `<img src="https://placehold.co/14x14/808080/FFFFFF?text=W&font=tahoma" alt="" width="14" height="14">`;
                }
            } else { 
                iconContent = `<img src="https://placehold.co/14x14/808080/FFFFFF?text=W&font=tahoma" alt="" width="14" height="14">`;
            }
            
            icon.innerHTML = `${iconContent} <span>${title}</span>`;
            
            icon.addEventListener('click', () => {
                const targetWindow = document.getElementById(windowId);
                if (targetWindow.classList.contains('minimized-to-taskbar')) {
                    targetWindow.style.display = 'block';
                    targetWindow.classList.remove('minimized-to-taskbar');
                    bringToFront(targetWindow);
                } else if (targetWindow.style.display === 'none') { 
                    openWindow(targetWindow);
                } else if (parseInt(targetWindow.style.zIndex) < highestZIndex && targetWindow.style.display !== 'none') {
                    bringToFront(targetWindow);
                } else { 
                    minimizeWindow(targetWindow);
                }
            });
            taskbarIconsContainer.appendChild(icon);
            return icon;
        }

        function removeTaskbarIcon(windowId) {
            if (openWindows[windowId] && openWindows[windowId].taskbarIcon) {
                openWindows[windowId].taskbarIcon.remove();
            }
        }
        
        function openWindow(windowElement, fromDesktopIcon = false) {
            if (activeDialog && !windowElement.id.includes('-dialog')) { 
                if (activeDialog !== windowElement && !windowElement.contains(activeDialog)) {
                    bringToFront(activeDialog);
                    return;
                }
            }


            windowElement.style.display = 'block';
            windowElement.classList.remove('minimized-to-taskbar');
            
            if (!openWindows[windowElement.id] && !windowElement.id.includes('-dialog')) { 
                const tbIcon = createTaskbarIcon(windowElement);
                openWindows[windowElement.id] = { element: windowElement, taskbarIcon: tbIcon };
            }
            
            bringToFront(windowElement); 

            windowElement.style.opacity = '0';
            windowElement.style.transform = 'scale(0.95)';
            setTimeout(() => {
                windowElement.style.opacity = '1';
                windowElement.style.transform = 'scale(1)';
            }, 10);

            if (fromDesktopIcon && (!windowElement.style.top || windowElement.style.top === "0px") && (!windowElement.style.left || windowElement.style.left === "0px")) {
                const desktopRect = desktop.getBoundingClientRect();
                const windowWidth = parseInt(windowElement.style.width) || 600;
                const windowHeight = parseInt(windowElement.style.height) || 400;
                
                const openMainWindowsCount = Object.keys(openWindows).filter(id => !id.includes('-dialog')).length;
                let top = (desktopRect.height - windowHeight) / 3 + (openMainWindowsCount % 5) * 25;
                let left = (desktopRect.width - windowWidth) / 3 + (openMainWindowsCount % 5) * 25;

                top = Math.max(5, Math.min(top, desktopRect.height - windowHeight - 5 - 40)); 
                left = Math.max(5, Math.min(left, desktopRect.width - windowWidth - 5));

                windowElement.style.top = `${top}px`;
                windowElement.style.left = `${left}px`;
            }
        }

        function minimizeWindow(windowElement) {
            if (windowElement.id.includes('-dialog')) return; 

            windowElement.classList.add('minimized-to-taskbar');
            if (openWindows[windowElement.id] && openWindows[windowElement.id].taskbarIcon) {
                openWindows[windowElement.id].taskbarIcon.classList.remove('active');
            }
            const visibleWindows = Object.values(openWindows)
                .map(ow => ow.element)
                .filter(w => w.style.display === 'block' && !w.classList.contains('minimized-to-taskbar'));
            if (visibleWindows.length > 0) {
                visibleWindows.sort((a, b) => parseInt(b.style.zIndex) - parseInt(a.style.zIndex));
                bringToFront(visibleWindows[0]);
            }
        }
        
        function closeWindow(windowElement) {
            windowElement.style.opacity = '0';
            windowElement.style.transform = 'scale(0.95)';
            setTimeout(() => {
                windowElement.style.display = 'none';
                windowElement.style.opacity = '1'; 
                windowElement.style.transform = 'scale(1)'; 
                
                if (windowElement.id.includes('-dialog')) { 
                    if(activeDialog === windowElement) activeDialog = null;
                } else { 
                    removeTaskbarIcon(windowElement.id);
                    if(openWindows[windowElement.id]) delete openWindows[windowElement.id]; 
                     const visibleWindows = Object.values(openWindows)
                        .map(ow => ow.element)
                        .filter(w => w && w.style.display === 'block' && !w.classList.contains('minimized-to-taskbar')); 
                    if (visibleWindows.length > 0) {
                        visibleWindows.sort((a, b) => parseInt(b.style.zIndex) - parseInt(a.style.zIndex));
                        bringToFront(visibleWindows[0]);
                    }
                }
            }, 150);
        }

        function setupDesktopIcons() {
            desktopIcons = document.querySelectorAll('.desktop-icon-container .desktop-icon'); 
            desktopIcons.forEach(icon => {
                const windowId = icon.getAttribute('data-window-id');
                const linkUrl = icon.getAttribute('data-link');
                const action = windowId ? 'window' : (linkUrl ? 'link' : null);

                const openHandler = () => {
                    if (action === 'window') {
                        const windowElement = document.getElementById(windowId);
                        if (windowElement) {
                            openWindow(windowElement, true);
                        }
                    } else if (action === 'link') {
                        window.open(linkUrl, '_blank');
                    }
                };

                // Use click for touch/small screens, dblclick for larger screens
                if (window.matchMedia("(max-width: 768px)").matches) {
                    icon.addEventListener('click', openHandler);
                } else {
                    icon.addEventListener('dblclick', openHandler);
                }
                
                // Single click for selection still applies to all
                icon.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    desktopIcons.forEach(i => i.classList.remove('selected'));
                    icon.classList.add('selected');
                });
            });
        }
        setupDesktopIcons();


        windows.forEach(windowElement => {
            const header = windowElement.querySelector('.window-header');
            const closeButton = windowElement.querySelector('.window-buttons .close');
            const minimizeButton = windowElement.querySelector('.window-buttons .minimize');
            const maximizeButton = windowElement.querySelector('.window-buttons .maximize');
            let isDragging = false;
            let dragOffsetX, dragOffsetY;

            windowElement.addEventListener('mousedown', (e) => {
                if (windowElement.classList.contains('minimized-to-taskbar')) {
                    const taskbarIconData = openWindows[windowElement.id];
                    if (taskbarIconData && taskbarIconData.taskbarIcon) taskbarIconData.taskbarIcon.click();
                } else {
                    bringToFront(windowElement);
                }
            }, true); 

            if (header) {
                header.addEventListener('mousedown', (e) => {
                    if (e.target.closest('button') || (activeDialog && activeDialog !== windowElement && !windowElement.contains(activeDialog))) return;
                    if (windowElement.classList.contains('maximized')) return;

                    isDragging = true;
                    dragOffsetX = e.clientX - windowElement.offsetLeft;
                    dragOffsetY = e.clientY - windowElement.offsetTop;
                    header.style.cursor = 'grabbing';
                    desktop.style.cursor = 'grabbing';
                    e.preventDefault(); 
                });

                if (maximizeButton) { 
                     header.addEventListener('dblclick', (e) => {
                        if (e.target.closest('button')) return;
                        maximizeButton.click();
                    });
                }
            }
            
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                let newX = e.clientX - dragOffsetX;
                let newY = e.clientY - dragOffsetY;
                windowElement.style.left = `${newX}px`;
                windowElement.style.top = `${newY}px`;
            });

            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    if(header) header.style.cursor = 'move';
                    desktop.style.cursor = 'default';

                    const desktopRect = desktop.getBoundingClientRect();
                    let finalX = windowElement.offsetLeft;
                    let finalY = windowElement.offsetTop;
                    const windowWidth = windowElement.offsetWidth;
                    const headerHeight = header ? header.offsetHeight : 22;

                    finalX = Math.max(-windowWidth + 60, Math.min(finalX, desktopRect.width - 60)); 
                    finalY = Math.max(0, Math.min(finalY, desktopRect.height - headerHeight - 5)); 

                    windowElement.style.left = `${finalX}px`;
                    windowElement.style.top = `${finalY}px`;
                }
            });

            if(closeButton) closeButton.addEventListener('click', () => closeWindow(windowElement));
            if(minimizeButton) minimizeButton.addEventListener('click', () => minimizeWindow(windowElement));
            
            if (maximizeButton) {
                let originalSize = {};
                maximizeButton.addEventListener('click', () => {
                    if (windowElement.classList.contains('maximized')) {
                        windowElement.classList.remove('maximized');
                        windowElement.style.width = originalSize.width;
                        windowElement.style.height = originalSize.height;
                        windowElement.style.top = originalSize.top;
                        windowElement.style.left = originalSize.left;
                        maximizeButton.innerHTML = '<svg viewBox="0 0 10 10"><rect x="0" y="0" width="10" height="10" stroke-width="2" fill="none"/></svg>';
                        maximizeButton.title = "Maximize";
                    } else {
                        originalSize = {
                            width: windowElement.style.width || `${windowElement.offsetWidth}px`,
                            height: windowElement.style.height || `${windowElement.offsetHeight}px`,
                            top: windowElement.style.top || `${windowElement.offsetTop}px`,
                            left: windowElement.style.left || `${windowElement.offsetLeft}px`
                        };
                        windowElement.classList.add('maximized');
                        maximizeButton.innerHTML = '<svg viewBox="0 0 10 10"><path d="M2 0H8V2H2V0ZM0 2H2V8H0V2ZM8 2H10V8H8V2ZM2 8H8V10H2V8Z" transform="translate(0,0)"/></svg>'; // Restore icon
                        maximizeButton.title = "Restore";
                    }
                    bringToFront(windowElement);
                });
            }
        });

        // --- Control Panel & Display Properties Functionality ---
        const cpDisplayProps = document.getElementById('cp-display-properties');
        const cpSystemInfo = document.getElementById('cp-system-info');
        const displayPropsDialog = document.getElementById('display-properties-dialog');
        const systemInfoDialog = document.getElementById('system-info-dialog');
        const wallpaperSelect = document.getElementById('wallpaper-select');
        let currentWallpaperSelection = 'bliss'; 

        if(wallpaperSelect) {
            wallpaperSelect.addEventListener('change', (e) => {
                // currentWallpaperSelection is updated by the OK button or on cancel
            });
        }

        function applyWallpaper(selection) {
            currentWallpaperSelection = selection; 
            switch(selection) {
                case 'bliss':
                    desktop.style.backgroundImage = "url('img/img1.webp')";
                    desktop.style.backgroundColor = ""; 
                    break;
                case 'blue':
                    desktop.style.backgroundImage = "none";
                    desktop.style.backgroundColor = "#0058CC"; 
                    break;
                case 'green':
                    desktop.style.backgroundImage = "none";
                    desktop.style.backgroundColor = "#37A837"; 
                    break;
                case 'gray':
                    desktop.style.backgroundImage = "none";
                    desktop.style.backgroundColor = "#808080"; 
                    break;
                case 'none':
                    desktop.style.backgroundImage = "none";
                    desktop.style.backgroundColor = "#000000"; 
                    break;
            }
        }


        function openDialog(dialogElement, parentWindow) {
            if (activeDialog && activeDialog !== dialogElement) closeWindow(activeDialog); 

            openWindow(dialogElement); 
            activeDialog = dialogElement;
            dialogElement.classList.add('mock-dialog-parent'); 

            const parentRect = parentWindow ? parentWindow.getBoundingClientRect() : desktop.getBoundingClientRect();
            const dialogWidth = parseInt(dialogElement.style.width) || 350;
            const dialogHeight = parseInt(dialogElement.style.height) || 250;

            let top = parentRect.top + (parentRect.height - dialogHeight) / 2;
            let left = parentRect.left + (parentRect.width - dialogWidth) / 2;

            const desktopRect = desktop.getBoundingClientRect();
            top = Math.max(5, Math.min(top, desktopRect.height - dialogHeight - 5 - 40));
            left = Math.max(5, Math.min(left, desktopRect.width - dialogWidth - 5));

            dialogElement.style.top = `${top}px`;
            dialogElement.style.left = `${left}px`;
            bringToFront(dialogElement); 
        }

        if(cpDisplayProps) cpDisplayProps.addEventListener('click', () => {
            if(wallpaperSelect) wallpaperSelect.value = currentWallpaperSelection; 
            openDialog(displayPropsDialog, document.getElementById('control-panel-window'));
        });
        if(cpSystemInfo) cpSystemInfo.addEventListener('click', () => {
            openDialog(systemInfoDialog, document.getElementById('control-panel-window'));
        });
        
        displayPropsDialog.querySelector('.dialog-ok')?.addEventListener('click', () => {
            if(wallpaperSelect) applyWallpaper(wallpaperSelect.value);
            closeWindow(displayPropsDialog);
        });
        displayPropsDialog.querySelector('.dialog-cancel')?.addEventListener('click', () => {
            closeWindow(displayPropsDialog);
        });
         displayPropsDialog.querySelector('.close')?.addEventListener('click', () => { 
            closeWindow(displayPropsDialog);
        });

        systemInfoDialog.querySelectorAll('.dialog-ok, .close').forEach(btn => {
            btn.addEventListener('click', () => closeWindow(systemInfoDialog));
        });
        document.getElementById('cp-add-remove')?.addEventListener('click', () => {
             showConfirmationModal("Feature 'Add/Remove Programs' is for demonstration only.", () => {});
        });
         document.getElementById('cp-mouse-settings')?.addEventListener('click', () => {
             showConfirmationModal("Feature 'Mouse Settings' is for demonstration only.", () => {});
        });


        // Turn Off Button
        document.getElementById('turnoff-button')?.addEventListener('click', () => {
            showConfirmationModal("Are you sure you want to Turn Off Computer?", () => {
                console.log("User chose to turn off.");
                document.body.innerHTML = '<div style="background-color:black; color:white; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; font-size:20px; font-family:Tahoma;"><div>It is now safe to turn off your computer.</div></div>';
                const turnOnBtn = document.getElementById('turn-on-button'); // Get the button from the original DOM
                if(turnOnBtn) { // Check if it exists
                    document.body.appendChild(turnOnBtn); // Append it to the new body
                    turnOnBtn.style.display = 'block'; // Make it visible
                }
            });
        });
        
        // Turn On Button
        turnOnButton?.addEventListener('click', () => {
            window.location.reload();
        });


    });