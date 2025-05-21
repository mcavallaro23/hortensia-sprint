let tests = JSON.parse(localStorage.getItem('tests') || '[]');
let athletes = JSON.parse(localStorage.getItem('athletes') || '[]');

let startTime = null;
let animationFrame = null;
let impulseCount = 0;
let expectedImpulses = 0;
let running = false;
let inTest = false; // Indicates if a general test is in progress
let splits = []; // Splits for the current athlete (these are the PARTIAL times)
let laps = [];   // Laps for the current athlete (these are the ACCUMULATED times)

let athletesPending = [];  // Atletas q todavía no hicieron el test
let athletesFinished = []; // Atletas q ya terminaron su test
let currentTestAthlete = null; // El atleta actualmente SELECCIONADO en la lista (puede no estar corriendo)
let athleteReadyToStart = null; // El atleta q ya está "READY" pa' correr y mostrarse en grande
let currentTestResults = {}; // Object to store results per athlete and test

function renderNewTestForm() {
  const screen = document.getElementById('screen');
  screen.innerHTML = `
    <h2>Create New Test</h2>
    <label>Test Name: <input id="testName" /></label><br>
    <label>Captures: <input id="impulses" type="number" value="3" min="1" /></label><br>
    <button onclick="saveTest()">Save Test</button>
  `;
}

function saveTest() {
  const test = {
    name: document.getElementById('testName').value,
    impulses: parseInt(document.getElementById('impulses').value)
  };
  tests.push(test);
  localStorage.setItem('tests', JSON.stringify(tests));
}

function selectAthletesForTest(index) {
  const test = tests[index];
  currentTestIndex = index;
  const screen = document.getElementById('screen');
  screen.innerHTML = `
    <h2>Select Athletes for "${test.name}"</h2>
    <div class="athlete-selection" style="display: flex; gap: 20px; justify-content: center; align-items: center; flex-wrap: wrap;">
      <div>
        <h3>ATHLETES</h3>
        <select id="allAthletes" size="10" style="min-width: 200px;" multiple>
          ${athletes.map(a => `<option value="${a.name}">${a.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <button onclick="addToTest()">→</button><br><br>
        <button onclick="removeFromTest()">←</button>
      </div>
      <div>
        <h3>TEST</h3>
        <select id="testAthletes" size="10" style="min-width: 200px;" multiple></select>
      </div>
    </div>
    <br>
    <button onclick="startMultiAthleteTest()">Start Test</button>
  `;
}

function addToTest() {
  const all = document.getElementById('allAthletes');
  const testList = document.getElementById('testAthletes');
  [...all.selectedOptions].forEach(opt => {
    testList.innerHTML += `<option value="${opt.value}">${opt.textContent}</option>`;
    opt.remove();
  });
}

function removeFromTest() {
  const testList = document.getElementById('testAthletes');
  const all = document.getElementById('allAthletes');
  [...testList.selectedOptions].forEach(opt => {
    all.innerHTML += `<option value="${opt.value}">${opt.textContent}</option>`;
    opt.remove();
  });
}

function startMultiAthleteTest() {
    const testList = document.getElementById('testAthletes');
    
    // Rellenamos athletesPending con los atletas seleccionados inicialmente
    athletesPending = [...testList.options].map(opt => opt.value);
    
    if (athletesPending.length === 0) {
        alert("You must select at least one athlete for the test.");
        return;
    }

    athletesFinished = [];
    currentTestResults = {}; // Reset results for new test
    currentTestAthlete = null; // No athlete selected from list initially
    athleteReadyToStart = null; // No athlete ready to start

    const test = tests[currentTestIndex];
    inTest = true; // General test is in progress
    startChronometer(test); 
}

function renderChronoScreen(testName) {
    const screen = document.getElementById('screen');
    
    function renderAthleteTable(athletesArr, tableId, isClickable = false) {
        let rows = '';
        if (athletesArr.length === 0) {
            rows = `<tr><td colspan="1">No athletes</td></tr>`;
        } else {
            athletesArr.forEach(athlete => {
                // Highlight only if it's the current selected athlete AND no athlete is READY AND chrono is not running
                let className = (athlete === currentTestAthlete && !athleteReadyToStart && !running) ? 'selected-athlete' : '';
                
                // Pending table is clickable only if no athlete is READY AND chrono is not running
                const onclick = isClickable && !athleteReadyToStart && !running ? `onclick="selectAthleteFromList('${athlete}')"` : '';
                rows += `<tr class="${className}" ${onclick}><td>${athlete}</td></tr>`;
            });
        }
        return `
            <table border="1" style="width: 100%; margin-bottom: 20px;">
                <thead><tr><th>Athlete</th></tr></thead>
                <tbody id="${tableId}">${rows}</tbody>
            </table>
        `;
    }

    screen.innerHTML = `
        <h2>Test: ${testName}</h2>
        <h3 style="color: yellow;">Athlete READY: <span id="athleteReadyName">${athleteReadyToStart || 'NONE'}</span></h3> 
        <h3>Selected Athlete: <span id="currentAthleteName">${currentTestAthlete || 'Select Athlete'}</span></h3> 
        
        <h1 id="chrono" style="font-size: 48px;">00.00</h1>
        
        <button id="timeBtn" onclick="manualStart()">TIME</button>
        <button id="readyBtn" onclick="setAthleteReady()">READY</button>
        <button onclick="finishOverallTest()">Finish Overall Test</button>

        <div style="display: flex; justify-content: space-around; margin-top: 20px;">
            <div style="width: 45%;">
                <h3>Pending</h3>
                ${renderAthleteTable(athletesPending, 'pendingAthletesTableBody', true)}
            </div>
            <div style="width: 45%;">
                <h3>Finished</h3>
                ${renderAthleteTable(athletesFinished, 'finishedAthletesTableBody', false)}
            </div>
        </div>

        <h4>Current Athlete Results</h4>
        <table id="resultsTable" border="1" style="width: 100%;">
            <thead><tr><th>Split</th><th>Lap</th></tr></thead> <tbody></tbody>
        </table>
    `;
    updateAthleteTablesUI(); 
    updateButtonsState(); // Ensure button states are correct from the start
}

// New function to select an athlete from the list (when no one is READY)
function selectAthleteFromList(athleteName) {
    if (running || athleteReadyToStart) return; // Do not allow selection if chrono is running or someone is READY
    currentTestAthlete = athleteName;
    updateAthleteTablesUI(); // This will highlight the athlete
    updateButtonsState(); // Update READY button state
}

// New function to set the athlete to READY state
function setAthleteReady() {
    // Only if an athlete is selected, no one is READY, and chrono is not running
    if (!currentTestAthlete || athleteReadyToStart || running) return; 

    stopChrono(); // Ensure chrono is stopped
    
    // The selected athlete now becomes the READY one
    athleteReadyToStart = currentTestAthlete;
    // We don't nullify currentTestAthlete here, it's still the "reference" for the READY athlete.
    // The visual update (removing from pending table) is handled in updateAthleteTablesUI.
    
    // Reset chrono variables for the new athlete about to start
    splits = [];
    laps = [];
    impulseCount = 0;
    startTime = null;
    running = false;

    updateAthleteTablesUI(); // Update tables and "READY" athlete name
    updateButtonsState(); // Enable TIME button
}

function manualStart() {
  if (!athleteReadyToStart) return; // If no athlete is ready, do nothing

  const now = performance.now();

  if (!running) {
    startTime = now;
    running = true;
    updateChrono();
    // The first click on TIME is the START of the chrono for this athlete
    return; 
  }

  // If already running, the "TIME" button acts as an impulse
  handleImpulse();
}

function startChronometer(test) {
  impulseCount = 0;
  expectedImpulses = test.impulses; // The impulses are the ones to be recorded, not including a start impulse
  splits = [];
  laps = [];
  running = false; // Chrono starts only with first TIME or photocell impulse
  renderChronoScreen(test.name);
}

function handleImpulse() {
  const now = performance.now();
  // Only if a general test is in progress, an athlete is READY, and chrono is running
  if (!inTest || !athleteReadyToStart || !running) return; 

  const elapsed = now - startTime;
  impulseCount++;

  // 'currentSplit' is the partial time since the last impulse/start
  // 'currentLap' is the accumulated time since the start of the athlete's chrono
  const currentLap = elapsed;
  const currentSplit = elapsed - (laps.length > 0 ? laps[laps.length - 1] : 0);

  laps.push(currentLap); // Store the accumulated time (lap)
  splits.push(currentSplit); // Store the partial time (split)

  const tbody = document.querySelector("#resultsTable tbody");
  const row = document.createElement("tr");
  // ¡¡¡MARCOS, AHORA SÍ, LA PUTA MADRE!!! AQUÍ SE INVIERTEN LOS VALORES PARA TU LÓGICA
  // Columna "Split" (izquierda) -> Muestra el tiempo acumulado (currentLap)
  // Columna "Lap" (derecha) -> Muestra el tiempo parcial (currentSplit)
  row.innerHTML = `<td>${formatTime(currentLap)}</td><td>${formatTime(currentSplit)}</td>`; 
  tbody.appendChild(row);

  if (impulseCount >= expectedImpulses) {
      stopChrono();
      // Automatically finish athlete test when expected impulses are reached
      finishAthleteTest(); 
      updateButtonsState(); // Update button states after finishing an athlete's test
  }
}

function updateChrono() {
  if (!running) return;
  const now = performance.now();
  const elapsed = now - startTime;
  document.getElementById("chrono").textContent = formatTime(elapsed);
  animationFrame = requestAnimationFrame(updateChrono);
}

function stopChrono() {
  running = false;
  cancelAnimationFrame(animationFrame);
}

function formatTime(ms) {
  const sec = Math.floor(ms / 1000);
  const cent = Math.floor((ms % 1000) / 10);
  return `${sec.toString().padStart(2, '0')}.${cent.toString().padStart(2, '0')}`;
}

window.navigate = function(screen) {
  const screenDiv = document.getElementById('screen');
  if (!screenDiv) return;

  switch (screen) {
    case 'testMenu':
      screenDiv.innerHTML = `
        <h2>Test Menu</h2>
        <button onclick="navigate('simpleTest')">Simple Test</button>
        <button onclick="navigate('myTests')">My Tests</button>
        <button onclick="navigate('predefinedTests')">Predefined Tests</button>
        <button onclick="navigate('newTest')">New Test</button>
      `;
      break;
    case 'newTest':
      renderNewTestForm();
      break;
    case 'myTests':
      renderTestList();
      break;
    case 'athletes':
      renderAthleteManager();
      break;
    case 'results':
      renderResults();
      break;
    case 'photocells':
      renderPhotocellScan();
      break;
    default:
      screenDiv.innerHTML = `<p>Screen ${screen} not yet implemented.</p>`;
  }
};

function renderPhotocellScan() {
  const screen = document.getElementById("screen");
  screen.innerHTML = `
    <h2>Scan Photocells</h2>
    <button onclick="scanPhotocells()">Scan & Connect</button>
    <ul id="deviceList"></ul>
  `;
}

function scanPhotocells() {
  let device;
  let characteristic;

  navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb']
  })
  .then(dev => {
    if (!dev.name || !dev.name.startsWith('CRONOPIC-F')) {
      throw new Error("Device is not CRONOPIC-FX");
    }
    device = dev;
    return device.gatt.connect();
  })
  .then(server => {
    return server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
  })
  .then(service => {
    return service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
  })
  .then(char => {
    characteristic = char;
    return characteristic.startNotifications();
  })
  .then(() => {
    characteristic.addEventListener('characteristicvaluechanged', event => {
      const decoded = new TextDecoder().decode(event.target.value);
      console.log("📡 Frame received:", decoded);

      if (!inTest) console.log("Frame received (not in test): " + decoded);

      // Only handle impulse if an athlete is READY and chrono is running
      if (athleteReadyToStart && running) {
          handleImpulse();
      }
    });

    const ul = document.getElementById('deviceList');
    const li = document.createElement('li');
    li.textContent = `✅ Connected to: ${device.name}`;
    ul.appendChild(li);
  })
  .catch(error => {
    if (error.message !== "Device is not CRONOPIC-FX") {
      console.error('❌ BLE error:', error);
    }
  });
}

function renderTestList() {
  const screen = document.getElementById('screen');
  screen.innerHTML = "<h2>My Tests</h2>";
  if (!tests.length) {
    screen.innerHTML += "<p>No saved tests.</p>";
    return;
  }
  tests.forEach((t, i) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <p><strong>${t.name}</strong> (${t.impulses} impulses)</p>
      <button onclick="selectAthletesForTest(${i})">Select Test</button>
    `;
    screen.appendChild(div);
  });
}

function renderAthleteManager() {
  const screen = document.getElementById('screen');
  screen.innerHTML = `
    <h2>Athletes</h2>
    <label>Name: <input id="aName"></label><br>
    <label>Club: <input id="aClub"></label><br>
    <button onclick="saveAthlete()">Save Athlete</button>
    <ul id="athleteList"></ul>
  `;
  updateAthleteList();
}

function saveAthlete() {
  const athlete = {
    name: document.getElementById('aName').value,
    club: document.getElementById('aClub').value
  };
  athletes.push(athlete);
  localStorage.setItem('athletes', JSON.stringify(athletes));
  updateAthleteList();

  document.getElementById('aName').value = '';
  document.getElementById('aClub').value = '';
}

function updateAthleteList() {
  const ul = document.getElementById('athleteList');
  if (!ul) return;
  ul.innerHTML = "";
  athletes.forEach(a => {
    const li = document.createElement('li');
    li.textContent = a.name + " (" + a.club + ")";
    ul.appendChild(li);
  });
}

function renderResults() {
  const screen = document.getElementById('screen');
  screen.innerHTML = "<h2>Results</h2>";
  
  const savedResults = localStorage.getItem('lastTestResults');
  if (savedResults) {
      const results = JSON.parse(savedResults);
      if (Object.keys(results).length > 0) {
          let resultsHtml = '<h3>Last Test Results:</h3>';
          for (const athleteName in results) {
              const res = results[athleteName];
              resultsHtml += `<p><strong>${res.athleteName}</strong> (Test: ${res.testName}) - Total Time: ${formatTime(res.totalTime)}</p>`;
              resultsHtml += `<ul>Splits: ${res.splits.map(s => formatTime(s)).join(', ')}</ul>`;
              resultsHtml += `<ul>Laps: ${res.laps.map(l => formatTime(l)).join(', ')}</ul>`;
          }
          screen.innerHTML += resultsHtml;
      } else {
          screen.innerHTML += "<p>No results to show for the last test.</p>";
      }
  } else {
      screen.innerHTML += "<p>No results to show.</p>";
  }
}

// Function to finish the current athlete's test (and move them to 'Finished')
function finishAthleteTest() {
    if (!athleteReadyToStart) return; // If no athlete is "READY", there's nothing to finish

    stopChrono(); // Stop the current chrono

    // Save results for the READY athlete
    if (splits.length > 0 || laps.length > 0) { // Only save if there was activity
        currentTestResults[athleteReadyToStart] = {
            testName: tests[currentTestIndex].name,
            athleteName: athleteReadyToStart,
            splits: [...splits],
            laps: [...laps],
            totalTime: laps.length > 0 ? laps[laps.length - 1] : 0
        };
        console.log(`Results saved for ${athleteReadyToStart}:`, currentTestResults[athleteReadyToStart]);
    } else {
        console.log(`No times recorded for ${athleteReadyToStart}.`);
    }

    // Move the athlete from READY to FINISHED
    // If the athlete READY was in athletesPending, remove them. Add to finished.
    athletesPending = athletesPending.filter(a => a !== athleteReadyToStart); // Remover de pendientes
    if (!athletesFinished.includes(athleteReadyToStart)) { // Evitar duplicados en finalizados
        athletesFinished.push(athleteReadyToStart);
        athletesFinished.sort();
    }
    
    // Reset the READY athlete and the selected athlete from the list (as they're done)
    athleteReadyToStart = null;
    currentTestAthlete = null; // Important: Clear selected athlete too to allow new selection

    // Clear chrono variables for the next athlete
    splits = [];
    laps = [];
    impulseCount = 0;
    startTime = null;
    running = false;

    updateAthleteTablesUI(); // Update tables and UI state
    updateButtonsState(); // Update button states
}

function finishOverallTest() {
    stopChrono();
    inTest = false; // General test ends

    // Save all results from the current test to localStorage
    localStorage.setItem('lastTestResults', JSON.stringify(currentTestResults));
    console.log("Overall test results saved:", currentTestResults);

    // Reiniciar variables de test general para q la próxima vez q inicie un test, esté limpio
    athletesPending = [];
    athletesFinished = [];
    currentTestAthlete = null;
    athleteReadyToStart = null;
    currentTestResults = {};
    
    navigate('myTests'); // Go back to tests menu
}

function updateAthleteTablesUI() {
    const pendingBody = document.getElementById('pendingAthletesTableBody');
    const finishedBody = document.getElementById('finishedAthletesTableBody');
    const currentAthleteNameSpan = document.getElementById('currentAthleteName');
    const athleteReadyNameSpan = document.getElementById('athleteReadyName');
    const resultsTbody = document.querySelector("#resultsTable tbody");

    // Update PENDING table
    if (pendingBody) {
        let pendingRows = '';
        // Filter out the READY athlete from the visible pending list
        const currentPendingList = athletesPending.filter(a => a !== athleteReadyToStart); 
        if (currentPendingList.length === 0) {
            pendingRows = `<tr><td colspan="1">No pending athletes</td></tr>`;
        } else {
            currentPendingList.forEach(athlete => {
                // Highlight only if it's the current selected athlete AND no athlete is READY AND chrono is not running
                let className = (athlete === currentTestAthlete && !athleteReadyToStart && !running) ? 'selected-athlete' : '';
                // Pending table is clickable only if no athlete is READY AND chrono is not running
                const onclick = !athleteReadyToStart && !running ? `onclick="selectAthleteFromList('${athlete}')"` : '';
                pendingRows += `<tr class="${className}" ${onclick}><td>${athlete}</td></tr>`;
            });
        }
        pendingBody.innerHTML = pendingRows;
    }

    // Update FINISHED table
    if (finishedBody) {
        let finishedRows = '';
        if (athletesFinished.length === 0) {
            finishedRows = `<tr><td colspan="1">No finished athletes</td></tr>`;
        } else {
            athletesFinished.forEach(athlete => {
                finishedRows += `<tr><td>${athlete}</td></tr>`;
            });
        }
        finishedBody.innerHTML = finishedRows;
    }

    // Update names in display
    if (currentAthleteNameSpan) {
        currentAthleteNameSpan.textContent = currentTestAthlete || 'Select Athlete';
    }
    if (athleteReadyNameSpan) {
        athleteReadyNameSpan.textContent = athleteReadyToStart || 'NONE';
    }

    // Clear current athlete results table
    if (resultsTbody) {
        resultsTbody.innerHTML = "";
    }
    document.getElementById("chrono").textContent = "00.00";
}

// Function to update the state of TIME and READY buttons
function updateButtonsState() {
    const timeBtn = document.getElementById('timeBtn');
    const readyBtn = document.getElementById('readyBtn');

    if (timeBtn) {
        // Enabled if there's a READY athlete AND (chrono is not running OR impulses are not completed)
        // Disabled if no READY athlete OR (impulses completed AND chrono stopped)
        timeBtn.disabled = !athleteReadyToStart || (impulseCount >= expectedImpulses && !running);
    }
    if (readyBtn) {
        // Enabled if there's a selected athlete (currentTestAthlete) AND no one is READY AND chrono is not running
        readyBtn.disabled = !currentTestAthlete || !!athleteReadyToStart || running;
    }
}