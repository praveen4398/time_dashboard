document.addEventListener('DOMContentLoaded', () => {
  
  // Initialize Lucide Icons
  lucide.createIcons();

  /* ==========================================================================
     GLOBAL VARIABLES & STATE
     ========================================================================== */
  
  // Stopwatch State
  let stopwatchState = {
    isRunning: false,
    startTime: 0,
    elapsedTime: 0,
    animationFrameId: null,
    laps: [],
    history: []
  };

  let activeStopwatchTab = 'history'; // 'history' | 'laps'
  let tooltipEl;

  // To-Do List State
  let tasks = [];
  let activeTaskId = null;
  let currentTodoFilter = 'all'; // 'all' | 'active' | 'completed'
  let selectedTodoPriority = 'low'; // 'low' | 'medium' | 'high'
  let currentTodoView = 'todo'; // 'todo' | 'habit'
  let selectedTodoType = 'todo'; // 'todo' | 'habit'

  // Grid State (Dynamic Calendar)
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth(); // 0-11
  let daysData = [];
  let selectedDayIndex = null;
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // SVG Ring Settings
  const circleRadius = 130;
  const strokeCircumference = 2 * Math.PI * circleRadius; // ~816.81

  /* ==========================================================================
     DOM ELEMENTS
     ========================================================================== */
  
  // Stopwatch DOM
  const timeDisplay = document.getElementById('stopwatch-time');
  const msDisplay = document.getElementById('stopwatch-ms');
  const statusLabel = document.getElementById('stopwatch-status');
  const dialGlow = document.getElementById('dial-glow');
  const dialProgress = document.getElementById('dial-progress');
  
  const btnStartPause = document.getElementById('btn-start-pause');
  const btnLap = document.getElementById('btn-lap');
  const btnSaveTime = document.getElementById('btn-save-time');
  const btnReset = document.getElementById('btn-reset');
  const historyListContainer = document.getElementById('history-list-container');
  const tabBtnHistory = document.getElementById('tab-btn-history');
  const tabBtnLaps = document.getElementById('tab-btn-laps');

  // Stats DOM
  const statCompletedCount = document.getElementById('stat-completed-count');
  const statPartialCount = document.getElementById('stat-partial-count');
  const statUncompletedCount = document.getElementById('stat-uncompleted-count');
  const totalDaysLabels = document.querySelectorAll('.total-days-label');
  
  const progressCompleted = document.getElementById('progress-completed');
  const progressPartial = document.getElementById('progress-partial');
  const progressUncompleted = document.getElementById('progress-uncompleted');

  // Grid DOM
  const blocksGrid = document.getElementById('blocks-grid');
  const currentMonthDisplay = document.getElementById('current-month-display');
  const btnPrevMonth = document.getElementById('btn-prev-month');
  const btnNextMonth = document.getElementById('btn-next-month');
  const weeklyBarsContainer = document.getElementById('weekly-bars-container');
  const dialContainer = document.querySelector('.stopwatch-dial-container');

  // Drawer DOM
  const drawerOverlay = document.getElementById('drawer-overlay');
  const drawerPanel = document.getElementById('drawer-panel');
  const drawerDayTitle = document.getElementById('drawer-day-title');
  const drawerNotes = document.getElementById('drawer-notes');
  const btnSaveDrawer = document.getElementById('btn-save-drawer');
  const btnCancelDrawer = document.getElementById('btn-cancel-drawer');
  const drawerClose = document.getElementById('drawer-close');
  const statusOptionBtns = document.querySelectorAll('.status-option-btn');
  const manualHoursInput = document.getElementById('manual-hours');
  const manualMinutesInput = document.getElementById('manual-minutes');
  const btnAddManualLog = document.getElementById('btn-add-manual-log');

  // To-Do DOM Elements
  const todoInput = document.getElementById('todo-input');
  const btnAddTodo = document.getElementById('btn-add-todo');
  const todoListContainer = document.getElementById('todo-list-container');
  const todoProgressText = document.getElementById('todo-progress-text');
  const todoProgressFill = document.getElementById('todo-progress-fill');
  const btnClearCompleted = document.getElementById('btn-clear-completed');
  const priorityButtons = document.querySelectorAll('.btn-priority');
  const todoTabs = document.querySelectorAll('.todo-tab');
  const activeTaskIndicator = document.getElementById('active-task-indicator');
  const activeTaskName = document.getElementById('active-task-name');
  const viewSelectorBtns = document.querySelectorAll('.view-selector-btn');
  const typeBtns = document.querySelectorAll('.type-btn');
  const dueDateContainer = document.getElementById('due-date-container');
  const todoDueDateInput = document.getElementById('todo-due-date');

  /* ==========================================================================
     INITIALIZATION
     ========================================================================== */
  
  function init() {
    // 1. Initialize SVG Dial settings
    dialProgress.style.strokeDasharray = strokeCircumference;
    dialProgress.style.strokeDashoffset = strokeCircumference;

    // 2. Load Stopwatch elapsed time, laps, and history from localStorage FIRST
    const savedStopwatch = localStorage.getItem('aura_stopwatch_state');
    if (savedStopwatch) {
      const parsed = JSON.parse(savedStopwatch);
      stopwatchState.elapsedTime = parsed.elapsedTime || 0;
      stopwatchState.laps = parsed.laps || [];
      
      // Migrate old history items
      let migrated = false;
      stopwatchState.history = (parsed.history || []).map(item => {
        if (item.durationMs === undefined || !item.dateKey) {
          const itemDate = new Date(item.id || Date.now());
          const calculatedDateKey = `${itemDate.getFullYear()}-${(itemDate.getMonth() + 1).toString().padStart(2, '0')}-${itemDate.getDate().toString().padStart(2, '0')}`;
          const calculatedMs = parseDurationToMs(item.duration);
          migrated = true;
          return {
            ...item,
            durationMs: calculatedMs,
            dateKey: calculatedDateKey
          };
        }
        return item;
      });

      if (migrated) {
        saveStopwatchToStorage();
      }
      
      // Check if stopwatch was running when refreshed
      if (parsed.isRunning && parsed.startTime) {
        stopwatchState.isRunning = true;
        stopwatchState.startTime = parsed.startTime;
        stopwatchState.elapsedTime = Date.now() - parsed.startTime;
        
        statusLabel.textContent = 'RUNNING';
        dialGlow.classList.add('running');
        btnStartPause.innerHTML = `<i data-lucide="pause"></i><span>Pause</span>`;
        
        btnLap.disabled = false;
        btnSaveTime.disabled = false;
        btnReset.disabled = false;
        
        stopwatchState.animationFrameId = requestAnimationFrame(tickStopwatch);
      } else {
        // Update display with saved elapsed time
        updateStopwatchDisplay(stopwatchState.elapsedTime);
        
        // Enable buttons if elapsed time exists
        if (stopwatchState.elapsedTime > 0) {
          btnReset.disabled = false;
          btnSaveTime.disabled = false;
        }
      }
    }
    renderStopwatchRecords();

    // 3. Load Grid data for the current calendar month (which uses loaded history to sync!)
    loadMonthData();

    // 4. Render Layout & calculate statistics
    renderGrid();
    updateStats();

    // 5. Initialize custom hover tooltip
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'dashboard-tooltip';
    document.body.appendChild(tooltipEl);

    // 6. Draw Weekly focus chart
    renderWeeklyChart();

    // 7. Click stopwatch dial to Start/Pause
    dialContainer.style.cursor = 'pointer';
    dialContainer.addEventListener('click', (e) => {
      // Ignore click if user is targetting control buttons
      if (e.target.closest('.stopwatch-controls') || e.target.closest('.stopwatch-sub-controls')) return;
      if (stopwatchState.isRunning) {
        pauseStopwatch();
      } else {
        startStopwatch();
      }
    });

    // 8. Load and Render To-Do Tasks
    loadTasks();
    renderTasks();
  }

  function parseDurationToMs(durationStr) {
    if (!durationStr) return 0;
    const parts = durationStr.split(':');
    if (parts.length !== 3) return 0;
    
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    
    const secondsParts = parts[2].split('.');
    const seconds = parseInt(secondsParts[0], 10);
    const ms = secondsParts.length > 1 ? parseInt(secondsParts[1], 10) * 10 : 0;
    
    return (hours * 3600 + minutes * 60 + seconds) * 1000 + ms;
  }

  function getMonthStorageKey() {
    return `time_dashboard_days_${currentYear}_${(currentMonth + 1).toString().padStart(2, '0')}`;
  }

  function loadMonthData() {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const storageKey = getMonthStorageKey();
    const savedDays = localStorage.getItem(storageKey);
    
    if (savedDays) {
      daysData = JSON.parse(savedDays);
      // Fallback check
      if (daysData.length !== daysInMonth) {
        adjustDaysDataLength(daysInMonth);
      }
    } else {
      daysData = [];
      for (let i = 1; i <= daysInMonth; i++) {
        daysData.push({
          dayNumber: i,
          status: 'uncompleted',
          notes: ''
        });
      }
    }

    // Auto-sync calendar days status with stopwatch history for this month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const totalMs = stopwatchState.history
        .filter(item => item.dateKey === dateKey)
        .reduce((sum, item) => sum + item.durationMs, 0);
        
      const totalHours = totalMs / (1000 * 60 * 60);
      let newStatus = 'uncompleted';
      if (totalHours >= 3.0) {
        newStatus = 'completed';
      } else if (totalHours >= 1.0) {
        newStatus = 'partial';
      }
      daysData[d - 1].status = newStatus;
    }
    saveDaysToStorage();

    // Update Header Display
    currentMonthDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    totalDaysLabels.forEach(el => {
      el.textContent = daysInMonth;
    });
  }

  function adjustDaysDataLength(targetLength) {
    if (daysData.length < targetLength) {
      const start = daysData.length + 1;
      for (let i = start; i <= targetLength; i++) {
        daysData.push({
          dayNumber: i,
          status: 'uncompleted',
          notes: ''
        });
      }
    } else if (daysData.length > targetLength) {
      daysData = daysData.slice(0, targetLength);
    }
    saveDaysToStorage();
  }

  /* ==========================================================================
     STOPWATCH LOGIC
     ========================================================================== */
  
  function startStopwatch() {
    if (stopwatchState.isRunning) return;
    
    stopwatchState.isRunning = true;
    stopwatchState.startTime = Date.now() - stopwatchState.elapsedTime;
    
    // Toggle UI State
    statusLabel.textContent = 'RUNNING';
    dialGlow.classList.add('running');
    
    // Update Play/Pause Button
    btnStartPause.innerHTML = `<i data-lucide="pause"></i><span>Pause</span>`;
    lucide.createIcons();
    
    // Enable other buttons
    btnLap.disabled = false;
    btnSaveTime.disabled = false;
    btnReset.disabled = false;
    
    // Save stopwatch state immediately to persist across refreshes
    saveStopwatchToStorage();
    
    // Start RAF Loop
    stopwatchState.animationFrameId = requestAnimationFrame(tickStopwatch);

    // Sync visual elements in To-Do list
    renderTasks();
  }

  function pauseStopwatch() {
    if (!stopwatchState.isRunning) return;
    
    stopwatchState.isRunning = false;
    stopwatchState.elapsedTime = Date.now() - stopwatchState.startTime;
    
    // Cancel RAF Loop
    cancelAnimationFrame(stopwatchState.animationFrameId);
    
    // Toggle UI State
    statusLabel.textContent = 'PAUSED';
    dialGlow.classList.remove('running');
    
    // Update Play/Pause Button
    btnStartPause.innerHTML = `<i data-lucide="play"></i><span>Resume</span>`;
    lucide.createIcons();
    
    btnLap.disabled = true;
    
    // Persist stopwatch state
    saveStopwatchToStorage();

    // Sync visual elements in To-Do list
    renderTasks();
  }

  function resetStopwatch() {
    // Stop stopwatch if running
    if (stopwatchState.isRunning) {
      pauseStopwatch();
    }
    
    // Reset state
    stopwatchState.elapsedTime = 0;
    stopwatchState.laps = [];
    activeTaskId = null;
    saveTasksToStorage();
    renderTasks();
    
    // Reset Display & SVG Ring
    updateStopwatchDisplay(0);
    dialProgress.style.strokeDashoffset = strokeCircumference;
    
    // Reset Controls & Labels
    statusLabel.textContent = 'IDLE';
    btnStartPause.innerHTML = `<i data-lucide="play"></i><span>Start</span>`;
    lucide.createIcons();
    
    btnLap.disabled = true;
    btnSaveTime.disabled = true;
    btnReset.disabled = true;
    
    // Keep active tab as history, render changes
    renderStopwatchRecords();
    
    // Save state
    saveStopwatchToStorage();
  }

  function recordLap() {
    if (!stopwatchState.isRunning) return;
    
    const currentElapsed = Date.now() - stopwatchState.startTime;
    const lapNumber = stopwatchState.laps.length + 1;
    const timeFormatted = formatTimeFull(currentElapsed);
    
    stopwatchState.laps.unshift({
      number: lapNumber,
      time: timeFormatted
    });
    
    // Switch to Laps tab automatically on recording lap
    activeStopwatchTab = 'laps';
    updateStopwatchTabUI();
    renderStopwatchRecords();
    saveStopwatchToStorage();
  }

  function saveStopwatchTime() {
    const elapsed = stopwatchState.isRunning 
      ? Date.now() - stopwatchState.startTime 
      : stopwatchState.elapsedTime;
      
    if (elapsed === 0) return;
    
    const timeFormatted = formatTimeFull(elapsed);
    
    // Get elegant date/time stamp
    const now = new Date();
    let timestampFormatted = now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }); // e.g., "Jul 6, 2026, 4:51:03 PM"

    const yr = now.getFullYear();
    const mo = now.getMonth();
    const dy = now.getDate();
    const dateKey = `${yr}-${(mo + 1).toString().padStart(2, '0')}-${dy.toString().padStart(2, '0')}`;

    if (activeTaskId !== null) {
      const activeTask = tasks.find(t => t.id === activeTaskId);
      if (activeTask) {
        activeTask.trackedMs = (activeTask.trackedMs || 0) + elapsed;
        timestampFormatted += ` (Task: ${activeTask.title})`;
        saveTasksToStorage();
      }
    }

    stopwatchState.history.unshift({
      id: Date.now(),
      durationMs: elapsed,
      duration: timeFormatted,
      timestamp: timestampFormatted,
      dateKey: dateKey
    });

    // Reset stopwatch after logging to prevent double-tracking/accumulation
    resetStopwatch();

    // Switch to History tab automatically on save
    activeStopwatchTab = 'history';
    updateStopwatchTabUI();
    renderStopwatchRecords();
    saveStopwatchToStorage();

    // Sync board day block status with history
    syncDayStatusWithStopwatch(yr, mo, dy);

    // Refresh Weekly Chart
    renderWeeklyChart();

    // Fire Confetti explosion if user reaches the 3-hour Green milestone today
    const todayMs = stopwatchState.history
      .filter(item => item.dateKey === dateKey)
      .reduce((sum, item) => sum + item.durationMs, 0);
    const todayHours = todayMs / (1000 * 60 * 60);
    if (todayHours >= 3.0) {
      triggerConfetti();
    }
  }

  function deleteHistoryItem(id) {
    const itemToDelete = stopwatchState.history.find(item => item.id === id);
    if (itemToDelete) {
      const parts = itemToDelete.dateKey.split('-');
      const yr = parseInt(parts[0]);
      const mo = parseInt(parts[1]) - 1;
      const dy = parseInt(parts[2]);

      stopwatchState.history = stopwatchState.history.filter(item => item.id !== id);
      
      renderStopwatchRecords();
      saveStopwatchToStorage();
      
      // Recalculate day status after session deletion
      syncDayStatusWithStopwatch(yr, mo, dy);

      // Refresh Weekly Chart
      renderWeeklyChart();
    }
  }

  function tickStopwatch() {
    const elapsed = Date.now() - stopwatchState.startTime;
    updateStopwatchDisplay(elapsed);
    
    // Update SVG progress ring based on active seconds (completes rotation every 60s)
    const secondsFraction = (elapsed % 60000) / 60000;
    const dashOffset = strokeCircumference - (secondsFraction * strokeCircumference);
    dialProgress.style.strokeDashoffset = dashOffset;
    
    if (stopwatchState.isRunning) {
      stopwatchState.animationFrameId = requestAnimationFrame(tickStopwatch);
    }
  }

  function updateStopwatchDisplay(totalMs) {
    const timeObj = convertMsToParts(totalMs);
    
    timeDisplay.textContent = `${timeObj.hrs}:${timeObj.mins}:${timeObj.secs}`;
    msDisplay.textContent = `.${timeObj.ms}`;
  }

  function convertMsToParts(totalMs) {
    const ms = Math.floor((totalMs % 1000) / 10);
    const totalSecs = Math.floor(totalMs / 1000);
    const secs = totalSecs % 60;
    const totalMins = Math.floor(totalSecs / 60);
    const mins = totalMins % 60;
    const hrs = Math.floor(totalMins / 60);

    return {
      hrs: hrs.toString().padStart(2, '0'),
      mins: mins.toString().padStart(2, '0'),
      secs: secs.toString().padStart(2, '0'),
      ms: ms.toString().padStart(2, '0')
    };
  }

  function formatTimeFull(totalMs) {
    const parts = convertMsToParts(totalMs);
    return `${parts.hrs}:${parts.mins}:${parts.secs}.${parts.ms}`;
  }

  function updateStopwatchTabUI() {
    if (activeStopwatchTab === 'history') {
      tabBtnHistory.classList.add('active');
      tabBtnLaps.classList.remove('active');
    } else {
      tabBtnLaps.classList.add('active');
      tabBtnHistory.classList.remove('active');
    }
  }

  function renderStopwatchRecords() {
    historyListContainer.innerHTML = '';
    
    if (activeStopwatchTab === 'history') {
      if (stopwatchState.history.length === 0) {
        historyListContainer.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1.5rem 0;">
            No saved sessions yet. Click "Save" to log.
          </div>
        `;
        return;
      }
      
      stopwatchState.history.forEach(item => {
        const row = document.createElement('div');
        row.className = 'history-item';
        row.innerHTML = `
          <div class="history-info">
            <span class="history-duration">${item.duration}</span>
            <span class="history-timestamp">${item.timestamp}</span>
          </div>
          <button class="btn-delete-history" title="Delete Session">
            <i data-lucide="trash-2"></i>
          </button>
        `;
        
        row.querySelector('.btn-delete-history').addEventListener('click', () => {
          deleteHistoryItem(item.id);
        });
        
        historyListContainer.appendChild(row);
      });
    } else { // activeStopwatchTab === 'laps'
      if (stopwatchState.laps.length === 0) {
        historyListContainer.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1.5rem 0;">
            No laps recorded. Click "Lap" while running.
          </div>
        `;
        return;
      }
      
      stopwatchState.laps.forEach(lap => {
        const row = document.createElement('div');
        row.className = 'history-item';
        row.innerHTML = `
          <div class="history-info">
            <span class="history-duration">${lap.time}</span>
            <span class="history-timestamp">LAP ${lap.number}</span>
          </div>
        `;
        historyListContainer.appendChild(row);
      });
    }
    lucide.createIcons();
  }

  function saveStopwatchToStorage() {
    localStorage.setItem('aura_stopwatch_state', JSON.stringify({
      isRunning: stopwatchState.isRunning,
      startTime: stopwatchState.startTime,
      elapsedTime: stopwatchState.elapsedTime,
      laps: stopwatchState.laps,
      history: stopwatchState.history
    }));
  }

  /* ==========================================================================
     30-DAY HABIT MATRIX / VISUALIZATION GRID
     ========================================================================== */
  
  function renderGrid() {
    blocksGrid.innerHTML = '';
    
    daysData.forEach((day, index) => {
      const block = document.createElement('div');
      block.className = `day-block state-${day.status}`;
      block.setAttribute('data-index', index);
      
      // Calculate Day of Week
      const dayDate = new Date(currentYear, currentMonth, day.dayNumber);
      const weekdayShort = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Day Number Label
      const labelNumber = document.createElement('span');
      labelNumber.className = 'day-number';
      labelNumber.textContent = day.dayNumber.toString().padStart(2, '0');
      block.appendChild(labelNumber);

      // Weekday Label
      const labelWeekday = document.createElement('span');
      labelWeekday.className = 'day-weekday';
      labelWeekday.textContent = weekdayShort;
      block.appendChild(labelWeekday);
      
      // Bottom State Dot Indicator
      const dot = document.createElement('div');
      dot.className = 'day-status-indicator';
      block.appendChild(dot);
      
      // Note indicator (top right)
      if (day.notes && day.notes.trim() !== '') {
        const noteDot = document.createElement('div');
        noteDot.className = 'day-note-indicator';
        block.appendChild(noteDot);
      }
      
      // Grid item Click Event
      block.addEventListener('click', () => {
        openEditDrawer(index);
      });

      // Hover Tooltip Event Listeners
      block.addEventListener('mouseenter', () => {
        const dayDate = new Date(currentYear, currentMonth, day.dayNumber);
        const weekdayLong = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dateKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.dayNumber.toString().padStart(2, '0')}`;
        
        // Sum total focus duration
        const totalMs = stopwatchState.history
          .filter(item => item.dateKey === dateKey)
          .reduce((sum, item) => sum + item.durationMs, 0);
          
        let tooltipContent = `
          <div class="tooltip-title">${weekdayLong}, Day ${day.dayNumber.toString().padStart(2, '0')}</div>
          <div class="tooltip-subtitle">Focus: ${formatHoursMinutesSeconds(totalMs)}</div>
        `;
        
        if (day.notes && day.notes.trim() !== '') {
          tooltipContent += `<div class="tooltip-notes">"${day.notes}"</div>`;
        }
        
        tooltipEl.innerHTML = tooltipContent;
        tooltipEl.classList.add('active');
      });

      block.addEventListener('mousemove', (e) => {
        tooltipEl.style.left = `${e.pageX + 12}px`;
        tooltipEl.style.top = `${e.pageY + 12}px`;
      });

      block.addEventListener('mouseleave', () => {
        tooltipEl.classList.remove('active');
      });
      
      blocksGrid.appendChild(block);
    });
  }

  function updateStats() {
    let completedCount = 0;
    let partialCount = 0;
    let uncompletedCount = 0;
    
    daysData.forEach(day => {
      if (day.status === 'completed') completedCount++;
      else if (day.status === 'partial') partialCount++;
      else uncompletedCount++;
    });

    // Update Counts
    statCompletedCount.textContent = completedCount;
    statPartialCount.textContent = partialCount;
    statUncompletedCount.textContent = uncompletedCount;

    // Calculate Percentages
    const total = daysData.length || 30;
    const completedPct = (completedCount / total) * 100;
    const partialPct = (partialCount / total) * 100;
    const uncompletedPct = (uncompletedCount / total) * 100;

    // Update progress bars widths
    progressCompleted.style.width = `${completedPct}%`;
    progressPartial.style.width = `${partialPct}%`;
    progressUncompleted.style.width = `${uncompletedPct}%`;
  }

  function saveDaysToStorage() {
    const storageKey = getMonthStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(daysData));
  }

  function syncDayStatusWithStopwatch(year, month, dayNumber) {
    const storageKey = `time_dashboard_days_${year}_${(month + 1).toString().padStart(2, '0')}`;
    const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNumber.toString().padStart(2, '0')}`;
    
    // Sum durationMs for this specific date
    const totalMs = stopwatchState.history
      .filter(item => item.dateKey === dateKey)
      .reduce((sum, item) => sum + item.durationMs, 0);
      
    const totalHours = totalMs / (1000 * 60 * 60);
    
    let newStatus = 'uncompleted';
    if (totalHours >= 3.0) {
      newStatus = 'completed';
    } else if (totalHours >= 1.0) {
      newStatus = 'partial';
    }
    
    // Load relevant month's days data
    let monthDays = [];
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      monthDays = JSON.parse(saved);
    } else {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        monthDays.push({
          dayNumber: i,
          status: 'uncompleted',
          notes: ''
        });
      }
    }
    
    if (monthDays[dayNumber - 1]) {
      monthDays[dayNumber - 1].status = newStatus;
    }
    
    localStorage.setItem(storageKey, JSON.stringify(monthDays));
    
    // Sync current UI if this is the active month
    if (year === currentYear && month === currentMonth) {
      daysData = monthDays;
      renderGrid();
      updateStats();
    }
  }

  function renderDrawerFocusStats(day) {
    const container = document.getElementById('stopwatch-focus-stats-container');
    const dateKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.dayNumber.toString().padStart(2, '0')}`;
    
    const totalMs = stopwatchState.history
      .filter(item => item.dateKey === dateKey)
      .reduce((sum, item) => sum + item.durationMs, 0);

    const targetMs = 3 * 60 * 60 * 1000; // 3 hours target
    const pct = Math.min((totalMs / targetMs) * 100, 100);
    const durationFormatted = formatHoursMinutesSeconds(totalMs);
    
    let progressColorClass = 'uncompleted';
    const totalHours = totalMs / (1000 * 60 * 60);
    if (totalHours >= 3.0) {
      progressColorClass = 'completed';
    } else if (totalHours >= 1.0) {
      progressColorClass = 'partial';
    }
    
    container.innerHTML = `
      <div class="focus-stats-header">
        <span class="focus-stats-title">
          <i data-lucide="hourglass"></i>
          <span>Today's Focus Log</span>
        </span>
        <span class="focus-stats-value">${durationFormatted}</span>
      </div>
      <div class="focus-progress-bar">
        <div class="focus-progress-fill ${progressColorClass}" style="width: ${pct}%"></div>
      </div>
      <div class="focus-stats-legend">
        Thresholds: Red (0-1h) • Yellow (1-3h) • Green (3h+)
      </div>
    `;
    lucide.createIcons();
  }

  function formatHoursMinutesSeconds(ms) {
    if (ms === 0) return '0s';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(' ');
  }

  /* ==========================================================================
     SIDE-DRAWER PANEL INTERACTION
     ========================================================================== */
  
  let tempSelectedState = 'uncompleted';

  function openEditDrawer(index) {
    selectedDayIndex = index;
    const day = daysData[index];
    tempSelectedState = day.status;

    // Reset manual inputs on open
    manualHoursInput.value = '';
    manualMinutesInput.value = '';

    // Calculate Weekday for Drawer Header
    const dayDate = new Date(currentYear, currentMonth, day.dayNumber);
    const weekdayLong = dayDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Set Text Values
    drawerDayTitle.textContent = `${weekdayLong}, Day ${day.dayNumber.toString().padStart(2, '0')}`;
    drawerNotes.value = day.notes || '';

    // Render stopwatch focus progress
    renderDrawerFocusStats(day);

    // Update active status in drawer selection
    updateDrawerStatusButtons();

    // Trigger Transition classes
    drawerOverlay.classList.add('active');
  }

  function closeEditDrawer() {
    drawerOverlay.classList.remove('active');
    selectedDayIndex = null;
  }

  function updateDrawerStatusButtons() {
    statusOptionBtns.forEach(btn => {
      const state = btn.getAttribute('data-state');
      if (state === tempSelectedState) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function saveDrawerData() {
    if (selectedDayIndex === null) return;
    
    // Save text inputs and toggle inputs into our memory array
    daysData[selectedDayIndex].status = tempSelectedState;
    daysData[selectedDayIndex].notes = drawerNotes.value.trim();

    // Persist and Render UI
    saveDaysToStorage();
    renderGrid();
    updateStats();
    closeEditDrawer();
  }

  /* ==========================================================================
     EVENT LISTENERS
     ========================================================================== */
  
  // Stopwatch Actions
  btnStartPause.addEventListener('click', () => {
    if (stopwatchState.isRunning) {
      pauseStopwatch();
    } else {
      startStopwatch();
    }
  });

  btnReset.addEventListener('click', resetStopwatch);
  btnLap.addEventListener('click', recordLap);
  btnSaveTime.addEventListener('click', saveStopwatchTime);

  // To-Do Actions
  btnAddTodo.addEventListener('click', () => {
    const title = todoInput.value.trim();
    if (title) {
      addTask(title, selectedTodoPriority, selectedTodoType, todoDueDateInput.value);
    }
  });

  todoInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const title = todoInput.value.trim();
      if (title) {
        addTask(title, selectedTodoPriority, selectedTodoType, todoDueDateInput.value);
      }
    }
  });

  // Priority Selector
  priorityButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      priorityButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTodoPriority = btn.getAttribute('data-priority');
    });
  });

  // View Selectors (Tasks vs Habits)
  viewSelectorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewSelectorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTodoView = btn.getAttribute('data-view');
      renderTasks();
    });
  });

  // Inline Type Toggles (Tasks vs Habits)
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTodoType = btn.getAttribute('data-type');
      
      // Toggle due date input visibility dynamically
      if (selectedTodoType === 'habit') {
        dueDateContainer.style.display = 'none';
      } else {
        dueDateContainer.style.display = 'flex';
      }
    });
  });

  // Filters
  todoTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      todoTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTodoFilter = tab.getAttribute('data-filter');
      renderTasks();
    });
  });

  btnClearCompleted.addEventListener('click', clearCompletedTasks);

  // Tab selections
  tabBtnHistory.addEventListener('click', () => {
    activeStopwatchTab = 'history';
    updateStopwatchTabUI();
    renderStopwatchRecords();
  });

  tabBtnLaps.addEventListener('click', () => {
    activeStopwatchTab = 'laps';
    updateStopwatchTabUI();
    renderStopwatchRecords();
  });

  // Drawer Save/Cancel actions
  btnSaveDrawer.addEventListener('click', saveDrawerData);
  btnCancelDrawer.addEventListener('click', closeEditDrawer);
  drawerClose.addEventListener('click', closeEditDrawer);

  // Manual Focus Time Logger Action
  btnAddManualLog.addEventListener('click', () => {
    if (selectedDayIndex === null) return;
    const day = daysData[selectedDayIndex];
    
    const hrs = parseInt(manualHoursInput.value, 10) || 0;
    const mins = parseInt(manualMinutesInput.value, 10) || 0;
    
    if (hrs === 0 && mins === 0) return;
    
    const durationMs = (hrs * 3600 + mins * 60) * 1000;
    const timeFormatted = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00.00`;
    
    const manualDate = new Date(currentYear, currentMonth, day.dayNumber);
    const timestampFormatted = `${manualDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (Manual Log)`;
    const dateKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.dayNumber.toString().padStart(2, '0')}`;
    
    // Add manual log entry to history
    stopwatchState.history.unshift({
      id: Date.now() + Math.random(),
      durationMs: durationMs,
      duration: timeFormatted,
      timestamp: timestampFormatted,
      dateKey: dateKey
    });
    
    saveStopwatchToStorage();
    
    // Recalculate block status with history
    syncDayStatusWithStopwatch(currentYear, currentMonth, day.dayNumber);
    
    // Reload drawer focus stats widget
    renderDrawerFocusStats(day);
    
    // Sync active state in selection
    tempSelectedState = daysData[selectedDayIndex].status;
    updateDrawerStatusButtons();
    
    // Refresh visual items
    renderWeeklyChart();
    renderStopwatchRecords();
    
    // Clear inputs
    manualHoursInput.value = '';
    manualMinutesInput.value = '';
    
    // Fire Confetti explosion if milestone achieved
    const todayMs = stopwatchState.history
      .filter(item => item.dateKey === dateKey)
      .reduce((sum, item) => sum + item.durationMs, 0);
    const todayHours = todayMs / (1000 * 60 * 60);
    if (todayHours >= 3.0) {
      triggerConfetti();
    }
  });

  // Month selector click events
  btnPrevMonth.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    loadMonthData();
    renderGrid();
    updateStats();
  });

  btnNextMonth.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    loadMonthData();
    renderGrid();
    updateStats();
  });
  
  // Close drawer if background overlay is clicked
  drawerOverlay.addEventListener('click', (e) => {
    if (e.target === drawerOverlay) {
      closeEditDrawer();
    }
  });

  // Drawer status selector triggers
  statusOptionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tempSelectedState = btn.getAttribute('data-state');
      updateDrawerStatusButtons();
    });
  });

  function renderWeeklyChart() {
    const weeklyBarsContainer = document.getElementById('weekly-bars-container');
    if (!weeklyBarsContainer) return;
    weeklyBarsContainer.innerHTML = '';
    
    const weekdaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Renders the last 7 calendar days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      const dayLabel = weekdaysShort[d.getDay()];
      
      const totalMs = stopwatchState.history
        .filter(item => item.dateKey === dateKey)
        .reduce((sum, item) => sum + item.durationMs, 0);
        
      const totalHours = totalMs / (1000 * 60 * 60);
      const maxChartHours = 4.0; // 4 hours represents 100% chart column height
      const heightPct = Math.min((totalHours / maxChartHours) * 100, 100);
      
      let statusClass = 'uncompleted';
      if (totalHours >= 3.0) {
        statusClass = 'completed';
      } else if (totalHours >= 1.0) {
        statusClass = 'partial';
      }
      
      const barCol = document.createElement('div');
      barCol.className = 'bar-column';
      barCol.innerHTML = `
        <div class="bar-track" title="${formatHoursMinutesSeconds(totalMs)} focused on ${dayLabel}">
          <div class="bar-fill ${statusClass}" style="height: 0%"></div>
        </div>
        <span class="bar-label">${dayLabel}</span>
      `;
      
      weeklyBarsContainer.appendChild(barCol);
      
      // Animate height progression
      setTimeout(() => {
        const fill = barCol.querySelector('.bar-fill');
        if (fill) fill.style.height = `${heightPct}%`;
      }, 50);
    }
  }

  function triggerConfetti() {
    const colors = ['#d4af37', '#f9e8a2', '#b8860b', '#d97706', '#10b981', '#e11d48'];
    const count = 70;
    const dialRect = document.querySelector('.stopwatch-dial-container').getBoundingClientRect();
    const centerX = dialRect.left + dialRect.width / 2;
    const centerY = dialRect.top + dialRect.height / 2;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-particle';
      p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      p.style.setProperty('--x', `${centerX}px`);
      p.style.setProperty('--y', `${centerY}px`);
      
      const angle = Math.random() * Math.PI * 2;
      const velocity = 50 + Math.random() * 120;
      const dx = Math.cos(angle) * velocity;
      const dy = Math.sin(angle) * velocity - 120; // Upward explode
      
      p.style.setProperty('--dx', `${dx}px`);
      p.style.setProperty('--dy', `${dy}px`);
      
      p.style.left = '0';
      p.style.top = '0';
      
      const size = 5 + Math.random() * 6;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      if (Math.random() > 0.5) p.style.borderRadius = '0';
      
      document.body.appendChild(p);
      
      p.addEventListener('animationend', () => p.remove());
    }
  }

  // Real-time Clock Widget Logic
  function updateRealTimeClock() {
    const clockDisplay = document.getElementById('realtime-clock-display');
    const dateDisplay = document.getElementById('realtime-date-display');
    if (!clockDisplay || !dateDisplay) return;
    const now = new Date();
    
    // Update Date (e.g., "Monday, Jul 6")
    dateDisplay.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });

    // Update Time
    clockDisplay.textContent = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  /* ==========================================================================
     STARTUP EXECUTION
     ========================================================================== */
  
  /* ==========================================================================
     TO-DO LIST (TASK COMPANION) LOGIC
     ========================================================================== */
  
  function getTodayDateString() {
    const now = new Date();
    const yr = now.getFullYear();
    const mo = (now.getMonth() + 1).toString().padStart(2, '0');
    const dy = now.getDate().toString().padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  }

  function formatDateFriendly(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function loadTasks() {
    const savedTasks = localStorage.getItem('aura_todo_tasks');
    if (savedTasks) {
      // Migrate old tasks (assign type: 'todo' if type is missing)
      tasks = JSON.parse(savedTasks).map(task => {
        if (!task.type) {
          task.type = 'todo';
          task.isCompleted = task.isCompleted !== undefined ? task.isCompleted : false;
          task.dueDate = task.dueDate || '';
        }
        if (task.type === 'habit' && !task.completedDates) {
          task.completedDates = [];
        }
        return task;
      });
    } else {
      tasks = [];
    }

    const savedActiveTaskId = localStorage.getItem('aura_todo_active_task_id');
    if (savedActiveTaskId) {
      activeTaskId = parseInt(savedActiveTaskId, 10);
    } else {
      activeTaskId = null;
    }
  }

  function saveTasksToStorage() {
    localStorage.setItem('aura_todo_tasks', JSON.stringify(tasks));
    if (activeTaskId !== null) {
      localStorage.setItem('aura_todo_active_task_id', activeTaskId);
    } else {
      localStorage.removeItem('aura_todo_active_task_id');
    }
  }

  function addTask(title, priority, type = 'todo', dueDate = '') {
    const newTask = {
      id: Date.now(),
      title: title,
      priority: priority,
      type: type, // 'todo' | 'habit'
      trackedMs: 0
    };

    if (type === 'habit') {
      newTask.completedDates = [];
    } else {
      newTask.isCompleted = false;
      newTask.dueDate = dueDate || '';
    }

    tasks.push(newTask);
    saveTasksToStorage();
    renderTasks();
    todoInput.value = '';
    todoDueDateInput.value = '';
  }

  function toggleTaskCompletion(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
      if (task.type === 'habit') {
        const todayStr = getTodayDateString();
        task.completedDates = task.completedDates || [];
        if (task.completedDates.includes(todayStr)) {
          task.completedDates = task.completedDates.filter(d => d !== todayStr);
          // If checking off today, stop active tracking if it was running
          if (activeTaskId === id) {
            if (stopwatchState.isRunning) {
              pauseStopwatch();
            }
            activeTaskId = null;
          }
        } else {
          task.completedDates.push(todayStr);
        }
      } else {
        task.isCompleted = !task.isCompleted;
        // If task is completed and it is currently active, stop active tracking
        if (task.isCompleted && activeTaskId === id) {
          if (stopwatchState.isRunning) {
            pauseStopwatch();
          }
          activeTaskId = null;
        }
      }
      saveTasksToStorage();
      renderTasks();
    }
  }

  function deleteTask(id) {
    if (activeTaskId === id) {
      if (stopwatchState.isRunning) {
        pauseStopwatch();
      }
      activeTaskId = null;
    }
    tasks = tasks.filter(t => t.id !== id);
    saveTasksToStorage();
    renderTasks();
  }

  function clearCompletedTasks() {
    const todayStr = getTodayDateString();
    
    // Auto un-track completed ones
    const completedIds = tasks
      .filter(t => (t.type === 'todo' && t.isCompleted) || (t.type === 'habit' && (t.completedDates || []).includes(todayStr)))
      .map(t => t.id);
      
    if (completedIds.includes(activeTaskId)) {
      if (stopwatchState.isRunning) {
        pauseStopwatch();
      }
      activeTaskId = null;
    }

    // Only clear 'todo' tasks since habits are recurring
    tasks = tasks.filter(t => t.type !== 'todo' || !t.isCompleted);
    saveTasksToStorage();
    renderTasks();
  }

  function calculateHabitStreak(completedDates) {
    if (!completedDates || completedDates.length === 0) return 0;
    
    // Sort descending (newest first) and deduplicate
    const dates = [...new Set(completedDates)].sort((a, b) => new Date(b) - new Date(a));
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const formatDate = (d) => {
      const yr = d.getFullYear();
      const mo = (d.getMonth() + 1).toString().padStart(2, '0');
      const dy = d.getDate().toString().padStart(2, '0');
      return `${yr}-${mo}-${dy}`;
    };
    
    const todayStr = formatDate(today);
    const yesterdayStr = formatDate(yesterday);
    
    const hasToday = dates.includes(todayStr);
    const hasYesterday = dates.includes(yesterdayStr);
    
    if (!hasToday && !hasYesterday) return 0;
    
    let streak = 0;
    let checkDate = hasToday ? today : yesterday;
    
    while (true) {
      const checkStr = formatDate(checkDate);
      if (dates.includes(checkStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }

  function renderTasks() {
    todoListContainer.innerHTML = '';
    const todayStr = getTodayDateString();
    
    // Filter by Tab (To-Do List vs Daily Habits)
    let viewTasks = tasks.filter(t => t.type === currentTodoView);

    // Filter by Active/Completed sub-tabs
    if (currentTodoFilter === 'active') {
      viewTasks = viewTasks.filter(t => {
        if (t.type === 'habit') {
          return !t.completedDates.includes(todayStr);
        } else {
          return !t.isCompleted;
        }
      });
    } else if (currentTodoFilter === 'completed') {
      viewTasks = viewTasks.filter(t => {
        if (t.type === 'habit') {
          return t.completedDates.includes(todayStr);
        } else {
          return t.isCompleted;
        }
      });
    }

    // Sort tasks: uncompleted first, then by priority (high > medium > low), then by date/id
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    viewTasks.sort((a, b) => {
      // Completed state comparison
      const aComp = a.type === 'habit' ? a.completedDates.includes(todayStr) : a.isCompleted;
      const bComp = b.type === 'habit' ? b.completedDates.includes(todayStr) : b.isCompleted;
      if (aComp !== bComp) {
        return aComp ? 1 : -1;
      }

      // Priority comparison
      const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (pDiff !== 0) return pDiff;

      // Due date comparison (for todos)
      if (a.type === 'todo' && b.type === 'todo') {
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate) - new Date(b.dueDate);
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
      }

      return b.id - a.id;
    });

    // Hide clear completed button for habits since they reset daily and are not deleted
    if (currentTodoView === 'habit') {
      btnClearCompleted.style.visibility = 'hidden';
    } else {
      btnClearCompleted.style.visibility = 'visible';
    }

    if (viewTasks.length === 0) {
      const typeLabel = currentTodoView === 'habit' ? 'habits' : 'tasks';
      todoListContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 2rem 0;">
          No ${typeLabel} found. Add an item to start tracking!
        </div>
      `;
    } else {
      viewTasks.forEach(task => {
        const item = document.createElement('div');
        
        const isCompleted = task.type === 'habit' 
          ? task.completedDates.includes(todayStr) 
          : task.isCompleted;
          
        item.className = `todo-item priority-${task.priority} ${isCompleted ? 'completed' : ''}`;
        
        const isTrackingThis = activeTaskId === task.id;
        const timeFormatted = formatHoursMinutesSeconds(task.trackedMs || 0);

        // Compute Due Date or Streak Badges
        let metaBadgeHtml = '';
        if (task.type === 'todo') {
          if (task.dueDate) {
            const isToday = task.dueDate === todayStr;
            const isOverdue = !task.isCompleted && new Date(task.dueDate) < new Date(todayStr);
            
            let badgeClass = '';
            let text = formatDateFriendly(task.dueDate);
            if (isToday) {
              badgeClass = 'today';
              text = '📅 Today';
            } else if (isOverdue) {
              badgeClass = 'overdue';
              text = '⚠️ Overdue: ' + text;
            } else {
              text = '📅 ' + text;
            }
            metaBadgeHtml = `<span class="todo-due-date-badge ${badgeClass}">${text}</span>`;
          }
        } else { // 'habit'
          const streak = calculateHabitStreak(task.completedDates || []);
          metaBadgeHtml = `<span class="todo-due-date-badge">🔁 Daily</span>`;
          if (streak > 0) {
            metaBadgeHtml += `
              <span class="todo-streak-badge">
                <i data-lucide="flame"></i>
                <span>${streak} day${streak > 1 ? 's' : ''}</span>
              </span>
            `;
          }
        }
        
        item.innerHTML = `
          <div class="todo-item-left">
            <label class="todo-checkbox-wrapper">
              <input type="checkbox" class="todo-checkbox-input" ${isCompleted ? 'checked' : ''}>
              <span class="todo-custom-checkbox"></span>
            </label>
            <div class="todo-details">
              <span class="todo-title">${task.title}</span>
              <div class="todo-meta-info">
                <span class="todo-priority-badge" style="text-transform: capitalize; font-weight: 600; color: ${task.priority === 'high' ? 'var(--color-uncompleted)' : task.priority === 'medium' ? 'var(--color-partial)' : '#3b82f6'};">
                  ${task.priority}
                </span>
                •
                <span class="todo-time-badge ${isTrackingThis ? 'tracking' : ''}">
                  <i data-lucide="clock" style="width: 10px; height: 10px;"></i>
                  <span>Tracked: ${timeFormatted}</span>
                </span>
                ${metaBadgeHtml ? '• ' + metaBadgeHtml : ''}
              </div>
            </div>
          </div>
          <div class="todo-item-actions">
            <button class="btn-todo-action play-btn ${isTrackingThis ? 'active-tracking' : ''}" title="${isTrackingThis && stopwatchState.isRunning ? 'Pause Tracking' : 'Track Focus Time'}" ${isCompleted ? 'disabled' : ''}>
              <i data-lucide="${isTrackingThis && stopwatchState.isRunning ? 'pause' : 'play'}"></i>
            </button>
            <button class="btn-todo-action delete-btn" title="Delete Task">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        `;

        // Checkbox event
        item.querySelector('.todo-checkbox-input').addEventListener('change', () => {
          toggleTaskCompletion(task.id);
        });

        // Play/Pause event
        item.querySelector('.play-btn').addEventListener('click', () => {
          handleTaskTrackingToggle(task.id);
        });

        // Delete event
        item.querySelector('.delete-btn').addEventListener('click', () => {
          deleteTask(task.id);
        });

        todoListContainer.appendChild(item);
      });
    }

    // Update Progress Info for current view
    const viewTotalTasks = tasks.filter(t => t.type === currentTodoView);
    const totalCount = viewTotalTasks.length;
    const completedCount = viewTotalTasks.filter(t => {
      if (t.type === 'habit') return t.completedDates.includes(todayStr);
      return t.isCompleted;
    }).length;
    
    todoProgressText.textContent = `${completedCount}/${totalCount} Completed`;
    const pct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    todoProgressFill.style.width = `${pct}%`;

    // Render active task indicator
    updateActiveTaskIndicator();

    // Recreate Lucide Icons
    lucide.createIcons();
  }

  function handleTaskTrackingToggle(id) {
    if (activeTaskId === id) {
      if (stopwatchState.isRunning) {
        pauseStopwatch();
      } else {
        startStopwatch();
      }
    } else {
      const currentElapsed = stopwatchState.isRunning 
        ? Date.now() - stopwatchState.startTime 
        : stopwatchState.elapsedTime;
        
      if (currentElapsed > 0) {
        saveStopwatchTime();
      }
      
      activeTaskId = id;
      saveTasksToStorage();
      startStopwatch();
    }
  }

  function updateActiveTaskIndicator() {
    if (activeTaskId !== null) {
      const activeTask = tasks.find(t => t.id === activeTaskId);
      if (activeTask) {
        activeTaskIndicator.style.display = 'flex';
        activeTaskName.textContent = activeTask.title;
        return;
      }
    }
    activeTaskIndicator.style.display = 'none';
  }

  init();
  updateRealTimeClock();
  setInterval(updateRealTimeClock, 1000);

});
