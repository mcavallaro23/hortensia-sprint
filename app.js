
let tests = JSON.parse(localStorage.getItem('tests') || '[]');
let athletes = JSON.parse(localStorage.getItem('athletes') || '[]');
let selectedAthletes = [];
let testQueue = [];
let finishedAthletes = [];
let currentTestIndex = null;
let startTime = null;
let impulsesReceived = [];
let expectedCaptures = 0;
let timerInterval = null;
let testInProgress = false;

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
    case 'photocells':
      renderPhotocellScan();
      break;
    case 'results':
      renderResults();
      break;
    default:
      screenDiv.innerHTML = `<h2>${screen}</h2>`;
  }
};

function renderNewTestForm() {
  const screen = document.getElementById('screen');
  screen.innerHTML = `
    <h2>Create New Test</h2>
    <label>Test Name: <input id="testName" /></label><br>
    <label>Test Type:
      <select id="testType" onchange="onTestTypeChange(this.value)">
        <option value="SPRINT">SPRINT</option>
        <option value="GO_RETURN">GO & RETURN</option>
        <option value="SHUTTLE_RECOVERY">SHUTTLE WITH RECOVERY</option>
      </select>
    </label><br>
    <div id="extraOptions"></div>
    <button onclick="saveTest()">Save Test</button>
  `;
  onTestTypeChange('SPRINT');
}

function onTestTypeChange(type) {
  const extra = document.getElementById('extraOptions');
  if (type === "SPRINT") {
    extra.innerHTML = `
      <label>Finish Type:
        <select id="finishType">
          <option value="IMPULSES">NUMBER OF IMPULSES</option>
          <option value="TIME">END OF TIME</option>
          <option value="BOTH">BOTH</option>
        </select>
      </label><br>
      <label>Captures to expect (not counting START):
        <input type="number" id="impulseCount" value="3" min="1" max="10" />
      </label><br>
    `;
  } else {
    extra.innerHTML = "";
  }
}

function saveTest() {
  const name = document.getElementById('testName').value;
  const type = document.getElementById('testType').value;
  const finishType = document.getElementById('finishType')?.value || null;
  const impulses = parseInt(document.getElementById('impulseCount')?.value || 0);
  tests.push({ name, type, finishType, impulses });
  localStorage.setItem('tests', JSON.stringify(tests));
  alert("Test saved!");
}

function renderPhotocellScan() {
  const screen = document.getElementById('screen');
  screen.innerHTML = "<h2>Scan Photocells</h2><button onclick='scanPhotocells()'>Scan & Connect</button>";
}

function saveFinalResult(test, results) {
  const stored = JSON.parse(localStorage.getItem('finishedTests') || '[]');
  const entry = {
    name: test.name,
    date: new Date().toISOString(),
    athletes: results
  };
  stored.push(entry);
  localStorage.setItem('finishedTests', JSON.stringify(stored));
}

function renderResults() {
  const data = JSON.parse(localStorage.getItem('finishedTests') || '[]');
  const screen = document.getElementById('screen');
  screen.innerHTML = "<h2>Results</h2>";

  if (!data.length) {
    screen.innerHTML += "<p>No results found.</p>";
    return;
  }

  data.forEach((entry, index) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h3>${entry.name || 'Unnamed Test'} - ${new Date(entry.date).toLocaleString()}</h3>
      <table>
        <thead><tr><th>Athlete</th><th>Time</th></tr></thead>
        <tbody>
          ${(entry.athletes || []).map(a => `
            <tr>
              <td>${a.name}</td>
              <td>${a.time}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    screen.appendChild(div);
  });
}

function renderDebugTools() {
  const screen = document.getElementById('screen');
  screen.innerHTML += '<button onclick="forceSaveTest()">💾 Forzar Guardado Manual</button>';
}

function forceSaveTest() {
  if (finishedAthletes.length && tests[currentTestIndex]) {
    saveFinalResult(tests[currentTestIndex], finishedAthletes);
    alert("Guardado forzado realizado.");
  } else {
    alert("No hay datos para guardar.");
  }
}

function renderTestList() {
  const screen = document.getElementById('screen');
  screen.innerHTML = "<h2>My Tests</h2>";
  if (!tests.length) {
    screen.innerHTML += "<p>No saved tests found.</p>";
    return;
  }
  tests.forEach((t, i) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <p><strong>${t.name}</strong> - ${t.type || ''}</p>
      <button onclick="selectAthletesForTest(${i})">Start Test</button>
    `;
    screen.appendChild(div);
  });
}

function renderAthleteManager() {
  const screen = document.getElementById('screen');
  screen.innerHTML = \`
    <h2>Athletes</h2>
    <label>Name: <input id="aName"></label><br>
    <label>Birthdate: <input type="date" id="aBirth"></label><br>
    <label>Height (cm): <input type="number" id="aHeight"></label><br>
    <label>Weight (kg): <input type="number" id="aWeight"></label><br>
    <label>Sex: 
      <select id="aSex">
        <option value="M">Male</option>
        <option value="F">Female</option>
      </select>
    </label><br>
    <label>Club: <input id="aClub"></label><br>
    <button onclick="saveAthlete()">Save Athlete</button>
    <ul id="athleteList"></ul>
  \`;
  updateAthleteList();
}

function saveAthlete() {
  const athlete = {
    name: document.getElementById('aName').value,
    birth: document.getElementById('aBirth').value,
    height: document.getElementById('aHeight').value,
    weight: document.getElementById('aWeight').value,
    sex: document.getElementById('aSex').value,
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
