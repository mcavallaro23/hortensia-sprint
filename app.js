
// app.js 1.2.8 FULL FUNCIONAL REAL
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

function renderTestList() {
  const screen = document.getElementById('screen');
  screen.innerHTML = "<h2>My Tests</h2><ul id='testList'></ul>";
  const ul = document.getElementById('testList');
  tests.forEach((t, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${t.name}</strong> - ${t.type}<br>
    <button onclick="selectAthletesForTest(${i})">Start Test</button>
    <button onclick="editTest(${i})">Edit Test</button>`;
    ul.appendChild(li);
  });
}

function editTest(index) {
  const test = tests[index];
  const screen = document.getElementById('screen');
  screen.innerHTML = `
    <h2>Edit Test</h2>
    <label>Test Name: <input id="testName" value="${test.name}" /></label><br>
    <label>Captures (not counting START): <input type="number" id="impulseCount" value="${test.impulses}" /></label><br>
    <button onclick="updateTest(${index})">Save Changes</button>
    <button onclick="renderTestList()">Cancel</button>
  `;
}

function updateTest(index) {
  tests[index].name = document.getElementById('testName').value;
  tests[index].impulses = parseInt(document.getElementById('impulseCount').value);
  localStorage.setItem('tests', JSON.stringify(tests));
  renderTestList();
}


function renderAthleteManager() {
  const screen = document.getElementById('screen');
  screen.innerHTML = `
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
  `;
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

function selectAthletesForTest(testIndex) {
  const screen = document.getElementById('screen');
  const test = tests[testIndex];
  currentTestIndex = testIndex;
  screen.innerHTML = `
    <h2>Select Athletes for ${test.name}</h2>
    <form id="athleteForm">
      ${athletes.map((a, i) => `
        <label><input type="checkbox" value="${a.name}">${a.name}</label><br>
      `).join('')}
    </form>
    <button onclick="startMultiAthleteTest(${testIndex})">Start Test</button>
  `;
}

function startMultiAthleteTest(testIndex) {
  const checkboxes = document.querySelectorAll('#athleteForm input:checked');
  selectedAthletes = Array.from(checkboxes).map(cb => cb.value);
  testQueue = [...selectedAthletes];
  finishedAthletes = [];
  loadTest(testIndex);
}


function loadTest(testIndex) {
  const test = tests[testIndex];
  expectedCaptures = test.impulses;
  const currentAthlete = testQueue[0];
  impulsesReceived = [];
  startTime = null;
  clearInterval(timerInterval);
  testInProgress = true;

  const screen = document.getElementById('screen');
  screen.innerHTML = `
    <h2>${test.name} - ${test.type}</h2>
    <p>Now testing: <strong>${currentAthlete}</strong></p>
    <button onclick="startCountdown()">Start</button>
    <button onclick="manualImpulse()">Manual Time</button>
    <div id="chronotime" style="font-size:2em; margin-top:20px;">Waiting...</div>
    <table><thead><tr><th>#</th><th>Split (s.ms)</th><th>Lap</th></tr></thead><tbody id="timeTable"></tbody></table>
    <div style="display: flex; gap: 20px;">
      <div><h3>Waiting</h3><ul id="waitingList">${testQueue.map(a => `<li>${a}</li>`).join('')}</ul></div>
      <div><h3>Finished</h3><ul id="finishedList">${finishedAthletes.map(a => `<li>${a.name}: ${a.time}</li>`).join('')}</ul></div>
    </div>
  `;
  document.addEventListener("photocellTrigger", handlePhotocellStart);
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return s.toString().padStart(2, '0') + '.' + cs.toString().padStart(2, '0');
}

function startCountdown() {
  startTime = Date.now();
  impulsesReceived = [];
  timerInterval = setInterval(() => {
    if (startTime) {
      const elapsed = Date.now() - startTime;
      document.getElementById("chronotime").textContent = "⏱️ " + formatTime(elapsed);
    }
  }, 50);
}

function handlePhotocellStart(e) {
  if (!testInProgress) return;
  recordImpulse();
}

function manualImpulse() {
  if (!testInProgress) return;
  recordImpulse();
}

function recordImpulse() {
  const now = Date.now();
  if (!startTime) {
    startCountdown();
    return;
  }

  const current = now - startTime;
  const lap = impulsesReceived.length === 0 ? current : current - impulsesReceived[impulsesReceived.length - 1].split;
  impulsesReceived.push({ split: current, lap });

  const tbody = document.getElementById("timeTable");
  const row = document.createElement("tr");
  row.innerHTML = `<td>${impulsesReceived.length}</td><td>${formatTime(current)}</td><td>${formatTime(lap)}</td>`;
  tbody.appendChild(row);

  if (impulsesReceived.length >= expectedCaptures + 1) {
    clearInterval(timerInterval);
    document.getElementById("chronotime").textContent = "🏁 FINISHED: " + formatTime(current);
    const finished = testQueue.shift();
    finishedAthletes.push({ name: finished, time: formatTime(current) });
    updateAthleteLists();

    if (testQueue.length > 0) {
      setTimeout(() => loadTest(currentTestIndex), 1500);
    } else {
      testInProgress = false;
      document.removeEventListener("photocellTrigger", handlePhotocellStart);
    }
  }
}

function updateAthleteLists() {
  const waiting = document.getElementById('waitingList');
  const finished = document.getElementById('finishedList');
  if (waiting) waiting.innerHTML = testQueue.map(a => `<li>${a}</li>`).join('');
  if (finished) finished.innerHTML = finishedAthletes.map(a => `<li>${a.name}: ${a.time}</li>`).join('');
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
  console.log("renderResults() ejecutado");
  const data = JSON.parse(localStorage.getItem('finishedTests') || '[]');
  const screen = document.getElementById('screen');
  screen.innerHTML = "<h2>Results</h2>";

  if (data.length === 0) {
    screen.innerHTML += "<p>No results found.</p>";
    return;
  }

  data.forEach((entry, index) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h3>${entry.name} - ${new Date(entry.date).toLocaleString()}</h3>
      <table>
        <thead><tr><th>Athlete</th><th>Time</th></tr></thead>
        <tbody>
          ${entry.athletes.map(a => `<tr><td>${a.name}</td><td>${a.time}</td></tr>`).join('')}
        </tbody>
      </table>
      <button onclick="exportResult(${index})">📤 Share</button>
    `;
    screen.appendChild(div);
  });
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
