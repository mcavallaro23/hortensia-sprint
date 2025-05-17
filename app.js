// app.js 1.2.9 COMPLETO Y FUNCIONAL
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