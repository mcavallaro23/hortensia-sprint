
let tests = JSON.parse(localStorage.getItem('tests') || '[]');
let athletes = JSON.parse(localStorage.getItem('athletes') || '[]');

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
  const screen = document.getElementById('screen');
  screen.innerHTML = `
    <h2>Selected Test: ${test.name}</h2>
    <p>This is a placeholder. From here you could load athletes or start the test logic.</p>
  `;
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
  alert("Starting test with: " + selectedAthletes.join(", "));
}


function renderPhotocellScan() {
  const screen = document.getElementById("screen");
  screen.innerHTML = `
    <h2>Scan Photocells</h2>
    <button onclick="scanPhotocells()">Scan & Connect</button>
    <ul id="deviceList"></ul>
  `;
}

function scanPhotocells() {
  navigator.bluetooth.requestDevice({
    filters: [{ namePrefix: 'CRONOPIC-F' }],
    optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e']
  })
  .then(device => device.gatt.connect())
  .then(server => server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e'))
  .then(service => service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e'))
  .then(characteristic => {
    characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', event => {
      const value = new TextDecoder().decode(event.target.value);
      console.log("Trama recibida:", value);
      alert("Trama recibida: " + value); // luego se reemplaza por lógica real
    });

    const ul = document.getElementById('deviceList');
    const li = document.createElement('li');
    li.textContent = `Connected & listening: CRONOPIC`;
    ul.appendChild(li);
  })
  .catch(error => {
    alert('BLE error: ' + error.message);
  });
}

