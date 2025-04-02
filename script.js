
// Global state
const state = {
    roverStatus: {
      battery_level: 0.85,
      temperature: 20,
      mode: 'Autonomous',
      position: { x: 0, y: 0 },
      direction: 'forward',
      warnings: []
    },
    sensorData: {
      ultrasonic_front: 0.7,
      temperature: 20,
      orientation: 45,
      power_consumption: 5.4,
      cpu_load: 32,
      rfid_tag: null
    },
    communicationActive: false,
    sessionId: null,
    isAutonomous: true,
    logs: [],
    discoveredSurvivors: [],
    sensorHistory: []
  };
  
  // Initialize Chart.js
  let sensorChart;
  
  // DOM Elements
  const missionTimerEl = document.getElementById('mission-timer');
  const connectionStatusEl = document.getElementById('connection-status');
  const wifiIndicatorEl = document.getElementById('wifi-indicator');
  const batteryLevelEl = document.getElementById('battery-level');
  const powerValueEl = document.getElementById('power-value');
  const powerStatusEl = document.getElementById('power-status');
  const powerIndicatorEl = document.getElementById('power-indicator');
  const temperatureValueEl = document.getElementById('temperature-value');
  const sessionIdEl = document.getElementById('session-id');
  const currentModeEl = document.getElementById('current-mode');
  const positionEl = document.getElementById('position');
  const warningContainerEl = document.getElementById('warning-container');
  const warningTextEl = document.getElementById('warning-text');
  const ultrasonicValueEl = document.getElementById('ultrasonic-value');
  const ultrasonicIndicatorEl = document.getElementById('ultrasonic-indicator');
  const temperatureSensorEl = document.getElementById('temperature-sensor');
  const orientationValueEl = document.getElementById('orientation-value');
  const powerConsumptionEl = document.getElementById('power-consumption');
  const cpuLoadEl = document.getElementById('cpu-load');
  const cpuIndicatorEl = document.getElementById('cpu-indicator');
  const rfidDisplayEl = document.getElementById('rfid-display');
  const autonomousSwitchEl = document.getElementById('autonomous-switch');
  const startMissionBtn = document.getElementById('start-mission');
  const forwardBtn = document.getElementById('forward');
  const leftBtn = document.getElementById('left');
  const rightBtn = document.getElementById('right');
  const backwardBtn = document.getElementById('backward');
  const stopBtn = document.getElementById('stop');
  const moveForwardBtn = document.getElementById('move-forward');
  const moveScanBtn = document.getElementById('move-scan');
  const moveRechargeBtn = document.getElementById('move-recharge');
  const moveReturnBtn = document.getElementById('move-return');
  const logEntriesEl = document.getElementById('log-entries');
  const survivorCountEl = document.getElementById('survivor-count');
  const survivorsListEl = document.getElementById('survivors-list');
  const mapCanvasEl = document.getElementById('map-canvas');
  
  // Initialize the application
  function init() {
    setupEventListeners();
    startMissionTimer();
    initializeSensorChart();
    initializeMap();
    
    // Generate some initial data
    addLogEntry('info', 'System initialized and ready');
    addLogEntry('info', 'Welcome to Mars Rover Rescue Simulation');
    updateUI();
    
    // Setup simulation updates
    setInterval(simulationUpdate, 1000);
  }
  
  // Event Listeners
  function setupEventListeners() {
    // Toggle autonomous mode
    autonomousSwitchEl.addEventListener('change', () => {
      state.isAutonomous = autonomousSwitchEl.checked;
      updateControlsState();
      
      if (state.communicationActive) {
        const mode = state.isAutonomous ? 'Autonomous' : 'Manual';
        addLogEntry('info', `Switched to ${mode} control mode`);
        state.roverStatus.mode = mode;
        updateUI();
      }
    });
    
    // Start mission button
    startMissionBtn.addEventListener('click', startMission);
    
    // Movement buttons - for press and hold
    const directionButtons = [
      { el: forwardBtn, dir: 'forward' },
      { el: leftBtn, dir: 'left' },
      { el: rightBtn, dir: 'right' },
      { el: backwardBtn, dir: 'backward' }
    ];
    
    directionButtons.forEach(btn => {
      let isHolding = false;
      
      // Mouse events
      btn.el.addEventListener('mousedown', () => {
        isHolding = true;
        moveRover(btn.dir);
        btn.el.classList.add('active');
      });
      
      btn.el.addEventListener('mouseup', () => {
        isHolding = false;
        stopRover();
        btn.el.classList.remove('active');
      });
      
      btn.el.addEventListener('mouseleave', () => {
        if (isHolding) {
          isHolding = false;
          stopRover();
          btn.el.classList.remove('active');
        }
      });
      
      // Touch events
      btn.el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isHolding = true;
        moveRover(btn.dir);
        btn.el.classList.add('active');
      });
      
      btn.el.addEventListener('touchend', () => {
        isHolding = false;
        stopRover();
        btn.el.classList.remove('active');
      });
    });
    
    // Stop button
    stopBtn.addEventListener('click', stopRover);
    
    // Quick action buttons
    moveForwardBtn.addEventListener('click', () => quickAction('Move Forward'));
    moveScanBtn.addEventListener('click', () => quickAction('Scan Area'));
    moveRechargeBtn.addEventListener('click', () => quickAction('Find Charging'));
    moveReturnBtn.addEventListener('click', () => quickAction('Return Home'));
  }
  
  // Mission timer
  function startMissionTimer() {
    let seconds = 0;
    
    setInterval(() => {
      seconds++;
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      missionTimerEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
  }
  
  // Initialize sensor chart
  function initializeSensorChart() {
    const ctx = document.getElementById('sensor-chart').getContext('2d');
    
    sensorChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array(20).fill(''),
        datasets: [
          {
            label: 'Ultrasonic',
            data: Array(20).fill(null),
            borderColor: '#3b82f6',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4
          },
          {
            label: 'Temperature',
            data: Array(20).fill(null),
            borderColor: '#f97316',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        scales: {
          x: {
            grid: {
              color: '#334155'
            },
            ticks: {
              color: '#94a3b8'
            }
          },
          y: {
            grid: {
              color: '#334155'
            },
            ticks: {
              color: '#94a3b8'
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: '#e2e8f0'
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            borderColor: '#334155',
            borderWidth: 1,
            titleColor: '#e2e8f0',
            bodyColor: '#e2e8f0',
            displayColors: true
          }
        }
      }
    });
    
    // Add initial data points
    for (let i = 0; i < 20; i++) {
      addSensorDataPoint();
    }
  }
  
  // Initialize map canvas
  function initializeMap() {
    if (mapCanvasEl) {
      const ctx = mapCanvasEl.getContext('2d');
      const resizeMap = () => {
        mapCanvasEl.width = mapCanvasEl.clientWidth;
        mapCanvasEl.height = mapCanvasEl.clientHeight;
        drawMap();
      };
      
      // Handle resize
      window.addEventListener('resize', resizeMap);
      resizeMap();
      
      // Initial draw
      drawMap();
      
      // Set up animation
      setInterval(() => {
        drawMap();
      }, 100);
    }
  }
  
  // Draw map on canvas
  function drawMap() {
    if (!mapCanvasEl) return;
    
    const ctx = mapCanvasEl.getContext('2d');
    const width = mapCanvasEl.width;
    const height = mapCanvasEl.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    drawGrid(ctx, width, height);
    
    // Draw rover
    drawRover(ctx, width, height);
    
    // Draw obstacles
    drawObstacles(ctx, width, height);
    
    // Draw survivors
    drawSurvivors(ctx, width, height);
  }
  
  // Draw grid
  function drawGrid(ctx, width, height) {
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw coordinate system
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
  }
  
  // Draw rover
  function drawRover(ctx, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw rover position
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fill();
    
    // Direction indicator
    ctx.fillStyle = '#93c5fd';
    
    // Default direction points upward
    let dirX = 0;
    let dirY = -20;
    
    // Adjust for rover direction
    if (state.roverStatus.direction) {
      switch(state.roverStatus.direction) {
        case 'forward':
          dirX = 0;
          dirY = -20;
          break;
        case 'backward':
          dirX = 0;
          dirY = 20;
          break;
        case 'left':
          dirX = -20;
          dirY = 0;
          break;
        case 'right':
          dirX = 20;
          dirY = 0;
          break;
      }
    }
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + dirX, centerY + dirY);
    ctx.lineTo(centerX + dirY * 0.4, centerY - dirX * 0.4);
    ctx.closePath();
    ctx.fill();
    
    // Draw rover range indicator
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 100, 0, 2 * Math.PI);
    ctx.stroke();
  }
  
  // Draw obstacles
  function drawObstacles(ctx, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Use ultrasonic sensor data
    if (state.sensorData.ultrasonic_front !== undefined) {
      const distance = Math.min(state.sensorData.ultrasonic_front * 100, 100);
      if (distance < 90) {
        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.arc(centerX, centerY - distance, 8, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    
    // Add random obstacles
    const obstacleCount = 5;
    ctx.fillStyle = '#475569';
    
    for (let i = 0; i < obstacleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 100;
      
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      ctx.beginPath();
      ctx.arc(x, y, 6 + Math.random() * 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  
  // Draw survivors
  function drawSurvivors(ctx, width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    state.discoveredSurvivors.forEach((survivor, index) => {
      const angle = (index / Math.max(state.discoveredSurvivors.length, 1)) * Math.PI * 2;
      const distance = 50 + Math.random() * 40;
      
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      // Draw survivor indicator
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw pulsing effect
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 12 + Math.sin(Date.now() / 200) * 4, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Label
      ctx.fillStyle = '#d1fae5';
      ctx.font = '12px monospace';
      ctx.fillText(`Survivor ${index + 1}`, x + 15, y + 5);
    });
  }
  
  // Start mission
  function startMission() {
    // Generate a random session ID
    state.sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
    state.communicationActive = true;
    
    // Update UI
    connectionStatusEl.textContent = 'CONNECTED';
    connectionStatusEl.classList.remove('disconnected');
    connectionStatusEl.classList.add('connected');
    
    wifiIndicatorEl.classList.remove('disconnected');
    
    startMissionBtn.textContent = 'Restart Mission';
    
    addLogEntry('success', 'Mission started, communication link established');
    
    updateUI();
    updateControlsState();
  }
  
  // Move rover
  function moveRover(direction) {
    if (!state.communicationActive || state.isAutonomous) return;
    
    state.roverStatus.direction = direction;
    addLogEntry('info', `Moving rover: ${direction}`);
    
    // Update UI
    updateUI();
  }
  
  // Stop rover
  function stopRover() {
    if (!state.communicationActive || state.isAutonomous) return;
    
    state.roverStatus.direction = null;
    addLogEntry('info', 'Rover stopped');
    
    // Update UI
    updateUI();
  }
  
  // Quick action
  function quickAction(action) {
    if (!state.communicationActive || state.isAutonomous) return;
    
    addLogEntry('info', `Quick action: ${action}`);
    
    // Simulate different actions
    switch(action) {
      case 'Move Forward':
        moveRover('forward');
        setTimeout(stopRover, 2000);
        break;
      case 'Scan Area':
        addLogEntry('info', 'Scanning area for survivors...');
        setTimeout(() => {
          if (Math.random() > 0.5) {
            discoverSurvivor();
          } else {
            addLogEntry('info', 'No survivors detected in scan area');
          }
        }, 3000);
        break;
      case 'Find Charging':
        addLogEntry('info', 'Searching for charging station...');
        setTimeout(() => {
          addLogEntry('success', 'Charging station located');
          state.roverStatus.battery_level = 1.0;
          updateUI();
        }, 2000);
        break;
      case 'Return Home':
        addLogEntry('info', 'Calculating return path...');
        setTimeout(() => {
          addLogEntry('info', 'Returning to base station');
          state.roverStatus.position = { x: 0, y: 0 };
          updateUI();
        }, 2000);
        break;
    }
  }
  
  // Add log entry
  function addLogEntry(type, message) {
    const timestamp = new Date();
    const entry = {
      type,
      message,
      timestamp
    };
    
    state.logs.push(entry);
    
    // Create log entry element
    const logEntryEl = document.createElement('div');
    logEntryEl.className = `log-entry ${type}`;
    
    // Icon based on type
    let iconSvg = '';
    switch(type) {
      case 'info':
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
        break;
      case 'success':
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
        break;
      case 'warning':
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
        break;
      case 'error':
        iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
        break;
    }
    
    logEntryEl.innerHTML = `
      <div class="log-entry-icon ${type}">${iconSvg}</div>
      <div class="log-entry-content">
        <div class="log-entry-message">${message}</div>
        <div class="log-entry-timestamp">${timestamp.toLocaleTimeString()}</div>
      </div>
    `;
    
    // Add to log entries
    logEntriesEl.appendChild(logEntryEl);
    
    // Scroll to bottom
    const logContainer = logEntriesEl.parentElement;
    logContainer.scrollTop = logContainer.scrollHeight;
  }
  
  // Discover a survivor
  function discoverSurvivor() {
    const survivor = {
      id: state.discoveredSurvivors.length + 1,
      timestamp: new Date()
    };
    
    state.discoveredSurvivors.push(survivor);
    
    addLogEntry('success', `Survivor ${survivor.id} found!`);
    
    // Update UI
    updateSurvivorsList();
  }
  
  // Update survivors list
  function updateSurvivorsList() {
    survivorCountEl.textContent = state.discoveredSurvivors.length;
    
    // Clear list
    survivorsListEl.innerHTML = '';
    
    if (state.discoveredSurvivors.length === 0) {
      survivorsListEl.innerHTML = '<div class="no-survivors">No survivors found yet</div>';
      return;
    }
    
    // Add survivors
    state.discoveredSurvivors.forEach((survivor, index) => {
      const survivorEl = document.createElement('div');
      survivorEl.className = 'survivor-item';
      survivorEl.innerHTML = `
        <div class="survivor-dot"></div>
        <div class="survivor-info">
          <span class="survivor-id">Survivor ${index + 1}</span>
          <span class="survivor-time">${new Date(survivor.timestamp).toLocaleTimeString()}</span>
        </div>
      `;
      
      survivorsListEl.appendChild(survivorEl);
    });
  }
  
  // Add sensor data point
  function addSensorDataPoint() {
    // Update chart data
    if (sensorChart) {
      const time = new Date().toLocaleTimeString();
      
      // Add new data point
      sensorChart.data.labels.push(time);
      sensorChart.data.datasets[0].data.push(state.sensorData.ultrasonic_front);
      sensorChart.data.datasets[1].data.push(state.sensorData.temperature);
      
      // Remove oldest data point
      sensorChart.data.labels.shift();
      sensorChart.data.datasets.forEach(dataset => dataset.data.shift());
      
      // Update chart
      sensorChart.update();
    }
  }
  
  // Simulation update
  function simulationUpdate() {
    if (!state.communicationActive) return;
    
    // Update sensor data
    state.sensorData.ultrasonic_front = Math.max(0.1, Math.min(1, state.sensorData.ultrasonic_front + (Math.random() - 0.5) * 0.1));
    state.sensorData.temperature = Math.max(15, Math.min(30, state.sensorData.temperature + (Math.random() - 0.5) * 0.5));
    state.sensorData.orientation = (state.sensorData.orientation + (Math.random() - 0.5) * 5) % 360;
    state.sensorData.power_consumption = Math.max(3, Math.min(10, state.sensorData.power_consumption + (Math.random() - 0.5) * 0.3));
    state.sensorData.cpu_load = Math.max(10, Math.min(90, state.sensorData.cpu_load + (Math.random() - 0.5) * 5));
    
    // Update rover status
    state.roverStatus.battery_level = Math.max(0, Math.min(1, state.roverStatus.battery_level - 0.001));
    state.roverStatus.temperature = state.sensorData.temperature;
    
    // Update position if moving
    if (state.roverStatus.direction) {
      const moveAmount = 0.05;
      switch(state.roverStatus.direction) {
        case 'forward':
          state.roverStatus.position.y -= moveAmount;
          break;
        case 'backward':
          state.roverStatus.position.y += moveAmount;
          break;
        case 'left':
          state.roverStatus.position.x -= moveAmount;
          break;
        case 'right':
          state.roverStatus.position.x += moveAmount;
          break;
      }
    }
    
    // Random events
    handleRandomEvents();
    
    // Add sensor data point to chart
    addSensorDataPoint();
    
    // Update UI
    updateUI();
  }
  
  // Handle random events
  function handleRandomEvents() {
    // Random RFID detection
    if (Math.random() > 0.95) {
      state.sensorData.rfid_tag = `TAG-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      addLogEntry('info', `RFID tag detected: ${state.sensorData.rfid_tag}`);
      
      // Maybe discover a survivor
      if (Math.random() > 0.5) {
        setTimeout(discoverSurvivor, 1000);
      }
    } else if (Math.random() > 0.8) {
      state.sensorData.rfid_tag = null;
    }
    
    // Random warnings
    if (state.roverStatus.battery_level < 0.2 && state.roverStatus.warnings.indexOf('Low battery') === -1) {
      state.roverStatus.warnings.push('Low battery');
      addLogEntry('warning', 'Low battery warning');
    } else if (state.roverStatus.battery_level < 0.1 && state.roverStatus.warnings.indexOf('Critical battery') === -1) {
      state.roverStatus.warnings.push('Critical battery');
      addLogEntry('error', 'Critical battery level');
    } else if (state.roverStatus.battery_level > 0.3) {
      state.roverStatus.warnings = state.roverStatus.warnings.filter(w => w !== 'Low battery' && w !== 'Critical battery');
    }
    
    // Random obstacles
    if (Math.random() > 0.98) {
      state.sensorData.ultrasonic_front = Math.random() * 0.3;
      addLogEntry('warning', `Obstacle detected at ${(state.sensorData.ultrasonic_front * 100).toFixed(1)} cm`);
    }
  }
  
  // Update UI based on state
  function updateUI() {
    // Battery level
    const batteryPercent = Math.round(state.roverStatus.battery_level * 100);
    batteryLevelEl.textContent = `${batteryPercent}%`;
    powerValueEl.textContent = `${batteryPercent}%`;
    
    // Battery color
    if (batteryPercent > 50) {
      batteryLevelEl.className = 'battery-level text-green-500';
      powerStatusEl.className = 'status-label green';
      powerStatusEl.textContent = 'Normal';
      powerIndicatorEl.className = 'progress-indicator green';
    } else if (batteryPercent > 20) {
      batteryLevelEl.className = 'battery-level text-amber-500';
      powerStatusEl.className = 'status-label amber';
      powerStatusEl.textContent = 'Normal';
      powerIndicatorEl.className = 'progress-indicator amber';
    } else {
      batteryLevelEl.className = 'battery-level text-red-500';
      powerStatusEl.className = 'status-label red';
      powerStatusEl.textContent = batteryPercent < 10 ? 'Critical' : 'Low';
      powerIndicatorEl.className = 'progress-indicator red';
    }
    
    // Battery indicator width
    powerIndicatorEl.style.width = `${batteryPercent}%`;
    
    // Temperature
    const tempF = Math.round(state.roverStatus.temperature * 9/5 + 32);
    temperatureValueEl.textContent = `${tempF}°F`;
    temperatureSensorEl.textContent = `${state.sensorData.temperature.toFixed(1)}°C`;
    
    // Session ID
    sessionIdEl.textContent = state.sessionId || 'Not connected';
    
    // Mode
    currentModeEl.textContent = state.roverStatus.mode;
    
    // Position
    if (state.roverStatus.position) {
      positionEl.textContent = `${state.roverStatus.position.x.toFixed(2)}, ${state.roverStatus.position.y.toFixed(2)}`;
    } else {
      positionEl.textContent = 'Unknown';
    }
    
    // Warnings
    if (state.roverStatus.warnings && state.roverStatus.warnings.length > 0) {
      warningContainerEl.classList.remove('hidden');
      warningTextEl.textContent = state.roverStatus.warnings[0];
    } else {
      warningContainerEl.classList.add('hidden');
    }
    
    // Sensor values
    ultrasonicValueEl.textContent = `${(state.sensorData.ultrasonic_front * 100).toFixed(1)} cm`;
    orientationValueEl.textContent = `${Math.round(state.sensorData.orientation)}°`;
    powerConsumptionEl.textContent = `${state.sensorData.power_consumption.toFixed(1)} W`;
    cpuLoadEl.textContent = `${Math.round(state.sensorData.cpu_load)}%`;
    cpuIndicatorEl.style.width = `${state.sensorData.cpu_load}%`;
    
    // Ultrasonic indicator
    const ultrasonicPercent = Math.max(0, Math.min(100, (1 - state.sensorData.ultrasonic_front) * 100));
    ultrasonicIndicatorEl.style.width = `${ultrasonicPercent}%`;
    
    if (ultrasonicPercent > 70) {
      ultrasonicIndicatorEl.className = 'progress-indicator red';
    } else if (ultrasonicPercent > 40) {
      ultrasonicIndicatorEl.className = 'progress-indicator amber';
    } else {
      ultrasonicIndicatorEl.className = 'progress-indicator green';
    }
    
    // RFID display
    if (state.sensorData.rfid_tag) {
      rfidDisplayEl.innerHTML = `
        <span style="color: #10b981;">RFID detected: </span>
        <span>${state.sensorData.rfid_tag}</span>
        <br>
        <span style="color: #10b981;">Type: </span>
        <span>Survivor tag</span>
      `;
    } else {
      rfidDisplayEl.textContent = 'No RFID tags detected in range...';
    }
  }
  
  // Update control buttons state
  function updateControlsState() {
    const controlButtons = document.querySelectorAll('.control-button, .action-button');
    
    controlButtons.forEach(button => {
      button.disabled = !state.communicationActive || state.isAutonomous;
      button.classList.toggle('disabled', !state.communicationActive || state.isAutonomous);
    });
  }
  
  // Initialize the app
  document.addEventListener('DOMContentLoaded', init);