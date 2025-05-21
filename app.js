let tests = JSON.parse(localStorage.getItem('tests') || '[]');
let athletes = JSON.parse(localStorage.getItem('athletes') || '[]');

let startTime = null;
let animationFrame = null;
let impulseCount = 0;
let expectedImpulses = 0;
let running = false;
let inTest = false;
let splits = [];
let laps = [];

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
  alert("Test saved.");
}

function selectAthletesForTest(index) {
  const test = tests[index];
  currentTestIndex = index;
  selectedAthletes = [];
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
  selectedAthletes = [...testList.options].map(opt => opt.value);
  const test = tests[currentTestIndex];
  inTest = true;
  startChronometer(test);
}

function renderChronoScreen(testName) {
  const screen = document.getElementById('screen');
  screen.innerHTML = `
    <h2>Running Test: ${testName}</h2>
    <h1 id="chrono" style="font-size: 48px;">00.00</h1>
    <button onclick="handleImpulse()">Simular fotocélula</button>
    <table id="resultsTable" border="1">
      <thead><tr><th>Lap</th><th>Split</th></tr></thead>
      <tbody></tbody>
    </table>
  `;
}

function startChronometer(test) {
  impulseCount = 0;
  expectedImpulses = test.impulses + 1;
  splits = [];
  laps = [];
  running = false;
  renderChronoScreen(test.name);
}

function handleImpulse() {
  const now = performance.now();
  if (!inTest) return;

  if (!running) {
    startTime = now;
    running = true;
    updateChrono();
    return;
  }

  const elapsed = now - startTime;
  impulseCount++;

  const lastLap = laps.length ? laps[laps.length - 1] : 0;
  const lap = elapsed;
  const split = elapsed - lastLap;

  laps.push(lap);
  splits.push(split);

  const tbody = document.querySelector("#resultsTable tbody");
  const row = document.createElement("tr");
  row.innerHTML = `<td>${formatTime(lap)}</td><td>${formatTime(split)}</td>`;
  tbody.appendChild(row);

  if (impulseCount >= expectedImpulses - 1) stopChrono();
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
  inTest = false;
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
      screenDiv.innerHTML = `<p>Pantalla ${screen} no implementada aún.</p>`;
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
      alert(`Dispositivo ignorado: ${dev.name || '(sin nombre)'}`);
      throw new Error("Dispositivo no es CRONOPIC-FX");
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
      console.log("📡 Trama recibida:", decoded);

      if (!inTest) alert("Trama recibida: " + decoded);

      handleImpulse();
    });

    const ul = document.getElementById('deviceList');
    const li = document.createElement('li');
    li.textContent = `✅ Conectado a: ${device.name}`;
    ul.appendChild(li);
  })
  .catch(error => {
    if (error.message !== "Dispositivo no es CRONOPIC-FX") {
      console.error('❌ BLE error:', error);
      alert('BLE error: ' + error.message);
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
  const nameInput = document.getElementById('aName');
  const clubInput = document.getElementById('aClub');
  const athlete = {
    name: nameInput.value,
    club: clubInput.value
  };
  athletes.push(athlete);
  localStorage.setItem('athletes', JSON.stringify(athletes));
  updateAthleteList();
  nameInput.value = '';
  clubInput.value = '';
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
  screen.innerHTML = "<h2>Results</h2><p>No results to show.</p>";
}
