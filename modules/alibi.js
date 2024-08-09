import { EventBus } from './utils.js';

const activityTypes = {
  WORK: 0,
  SOCIAL: 1,
  FOOD: 2,
  SHOPPING: 3,
  LEISURE: 4,
  TRAVEL: 5,
  MINOR_CRIME: 6,
  MEDICAL: 7,
  LEGAL: 8,
  EDUCATION: 9
};

const activities = {
  [activityTypes.WORK]: [
    "Working a shift",
    "Attending a meeting",
    "Doing overtime",
    "Training a new employee",
    "Fixing a work-related issue"
  ],
  [activityTypes.SOCIAL]: [
    "Hanging out with friends",
    "Going on a date",
    "Attending a party",
    "Meeting a business associate",
    "ERPing"
  ],
  [activityTypes.FOOD]: [
    "Getting food",
    "Trying out a new restaurant",
    "Picking up a takeout order",
    "Having a quick snack",
    "Meeting someone for lunch"
  ],
  [activityTypes.SHOPPING]: [
    "Buying something off Lemon List",
    "Window shopping",
    "Returning a purchased item",
    "Browsing for new clothes",
    "Picking up groceries"
  ],
  [activityTypes.LEISURE]: [
    "Taking a leisurely walk",
    "Watching a movie",
    "Reading a book at a café",
    "Playing basketball at the court",
    "Sightseeing around the city"
  ],
  [activityTypes.TRAVEL]: [
    "Going for a drive",
    "Taking a taxi",
    "Riding the bus",
    "Cycling around town",
    "Hitchhiking"
  ],
  [activityTypes.MINOR_CRIME]: [
    "Jaywalking",
    "Accidentally shoplifting a small item",
    "Parking in a no-parking zone",
    "Littering",
    "Trespassing in an abandoned building"
  ],
  [activityTypes.MEDICAL]: [
    "Getting a routine check-up",
    "Picking up a prescription",
    "Visiting a sick friend",
    "Donating blood",
    "Attending a first-aid course"
  ],
  [activityTypes.LEGAL]: [
    "Meeting with a lawyer",
    "Attending a court hearing",
    "Filing paperwork at city hall",
    "Serving jury duty",
    "Applying for a permit"
  ],
  [activityTypes.EDUCATION]: [
    "Attending a class",
    "Studying at the library",
    "Participating in a workshop",
    "Taking a driving test",
    "Tutoring a student"
  ]
};

let districts = [];
let locations = [];

export function initialize(container, params = {}) {
  if (!container || !(container instanceof HTMLElement)) {
    console.error('Invalid container provided to Alibi initialize function');
    return;
  }

  console.log('Initializing Alibi app with params:', params);
  setupAlibiApp(container);
}

function setupAlibiApp(container) {
  container.innerHTML = createAlibiAppHTML();
  loadData().then(() => {
    populateDistrictCheckboxes(container);
    setupEventListeners(container);
  });
}

function createAlibiAppHTML() {
  return `
    <div class="alibi-app">
      <div class="sidebar">
        <h3>Select Districts</h3>
        <div id="district-checkboxes"></div>
      </div>
      <div class="main-content">
        <div class="options">
          <select id="time-of-day">
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="night">Night</option>
          </select>
          <select id="alibi-type">
            <option value="work">Work-related</option>
            <option value="social">Social</option>
            <option value="food">Food</option>
            <option value="shopping">Shopping</option>
            <option value="leisure">Leisure</option>
            <option value="travel">Travel</option>
            <option value="minor_crime">Minor Crime</option>
            <option value="medical">Medical</option>
            <option value="legal">Legal</option>
            <option value="education">Education</option>
          </select>
        </div>
        <button id="lucky-button">I'm Feeling Lucky</button>
        <button id="generate-button">Generate Alibi</button>
        <div id="alibi-result"></div>
      </div>
    </div>
  `;
}

async function loadData() {
  try {
    const [districtsData, locationsData] = await Promise.all([
      fetch('../data/alibiDistricts.csv').then(response => response.text()),
      fetch('../data/alibiLocations.csv').then(response => response.text())
    ]);

    districts = parseDistrictsCSV(districtsData);
    locations = parseLocationsCSV(locationsData);
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function parseDistrictsCSV(csv) {
  const lines = csv.split('\n').slice(1); // Skip header
  return lines.reduce((acc, line) => {
    const [district, neighborhood] = line.split(',').map(item => item.trim());
    if (district && !acc.includes(district)) {
      acc.push(district);
    }
    return acc;
  }, []);
}

function parseLocationsCSV(csv) {
  const lines = csv.split('\n').slice(1); // Skip header
  return lines.map(line => {
    const [name, area] = line.split(',').map(item => item.trim());
    return {
      name,
      area,
      activityTypes: assignActivityTypes(name)
    };
  });
}

function assignActivityTypes(locationName) {
  // This is a simplified assignment. You may want to create a more sophisticated mapping.
  const types = [];
  if (locationName.includes('Bank')) types.push(activityTypes.LEGAL, activityTypes.WORK);
  if (locationName.includes('Beach') || locationName.includes('Park')) types.push(activityTypes.LEISURE, activityTypes.SOCIAL);
  if (locationName.includes('Hospital') || locationName.includes('Medical')) types.push(activityTypes.MEDICAL);
  if (locationName.includes('Court') || locationName.includes('Hall')) types.push(activityTypes.LEGAL);
  if (locationName.includes('School') || locationName.includes('University')) types.push(activityTypes.EDUCATION);
  if (locationName.includes('Restaurant') || locationName.includes('Café')) types.push(activityTypes.FOOD);
  if (locationName.includes('Shop') || locationName.includes('Store')) types.push(activityTypes.SHOPPING);
  
  // Add some default types if none were assigned
  if (types.length === 0) {
    types.push(activityTypes.TRAVEL, activityTypes.SOCIAL, activityTypes.LEISURE);
  }
  
  return types;
}

function populateDistrictCheckboxes(container) {
  const checkboxContainer = container.querySelector('#district-checkboxes');
  districts.forEach(district => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `district-${district.replace(/\s+/g, '-').toLowerCase()}`;
    checkbox.value = district;
    checkbox.checked = true;

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = district;

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(label);
    checkboxContainer.appendChild(document.createElement('br'));
  });
}

function setupEventListeners(container) {
  const luckyButton = container.querySelector('#lucky-button');
  const generateButton = container.querySelector('#generate-button');

  luckyButton.addEventListener('click', () => generateAlibi(container, true));
  generateButton.addEventListener('click', () => generateAlibi(container, false));
}

function generateAlibi(container, isRandom) {
  const selectedDistricts = isRandom ? districts : getSelectedDistricts(container);
  const timeOfDay = isRandom ? getRandomTimeOfDay() : container.querySelector('#time-of-day').value;
  const alibiType = isRandom ? getRandomAlibiType() : container.querySelector('#alibi-type').value;

  const filteredLocations = locations.filter(location => 
    selectedDistricts.some(district => location.area.includes(district))
  );

  if (filteredLocations.length === 0) {
    displayAlibi(container, "No suitable locations found. Please select more districts.");
    return;
  }

  const location = filteredLocations[Math.floor(Math.random() * filteredLocations.length)];
  const activityType = getActivityTypeForAlibi(alibiType);
  const activity = getRandomActivity(activityType);

  const alibi = `At ${timeOfDay}, you were at ${location.name} (${location.area}) ${activity}.`;
  displayAlibi(container, alibi);
}

function getSelectedDistricts(container) {
  return Array.from(container.querySelectorAll('#district-checkboxes input:checked')).map(cb => cb.value);
}

function getRandomTimeOfDay() {
  const times = ['morning', 'afternoon', 'evening', 'night'];
  return times[Math.floor(Math.random() * times.length)];
}

function getRandomAlibiType() {
  return Object.keys(activityTypes)[Math.floor(Math.random() * Object.keys(activityTypes).length)];
}

function getActivityTypeForAlibi(alibiType) {
  return activityTypes[alibiType.toUpperCase()];
}

function getRandomActivity(activityType) {
  const activitiesForType = activities[activityType];
  return activitiesForType[Math.floor(Math.random() * activitiesForType.length)];
}

function displayAlibi(container, alibi) {
  const alibiResult = container.querySelector('#alibi-result');
  alibiResult.textContent = alibi;
}