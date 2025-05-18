
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
    screen.innerHTML += `<p>${t.name} (${t.type})</p>`;
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
