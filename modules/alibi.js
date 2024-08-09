import { faker } from '@faker-js/faker';

const activityTypes = {
    WORK: 'WORK',
    SOCIAL: 'SOCIAL',
    FOOD: 'FOOD',
    SHOPPING: 'SHOPPING',
    LEISURE: 'LEISURE',
    TRAVEL: 'TRAVEL',
    MINOR_CRIME: 'MINOR_CRIME',
    MEDICAL: 'MEDICAL',
    LEGAL: 'LEGAL',
    EDUCATION: 'EDUCATION'
  };

const activities = {
  [activityTypes.WORK]: [
    "Working a shift",
    "Attending a business meeting",
    "Doing overtime",
    "Training a new employee",
    "Fixing a work-related issue"
  ],
  [activityTypes.SOCIAL]: [
    "Hanging out with friends",
    "Going on a date",
    "Attending a party",
    "Going dancing",
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
    "Reading a book",
    "Playing sports",
    "Sightseeing"
  ],
  [activityTypes.TRAVEL]: [
    "Going for a drive",
    "Calling a taxi",
    "Riding the bus",
    "Riding my bike",
    "Hitchhiking"
  ],
  [activityTypes.MINOR_CRIME]: [
    "Jaywalking",
    "Yelling at the employees",
    "Parking in a no-parking zone",
    "Littering",
    "Trying to figure out if I ran a red light"
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
    "Gathering witness statements",
    "Filing paperwork",
    "Mailing a cease and desist letter",
    "Taking photos"
  ],
  [activityTypes.EDUCATION]: [
    "Attending a class",
    "Studying for an exam",
    "Participating in a workshop",
    "Taking a driving test",
    "Tutoring a student"
  ]
};

let districts = [];
let locations = [];

export async function initialize(container, params = {}) {
    if (!container || !(container instanceof HTMLElement)) {
      console.error('Invalid container provided to Alibi initialize function');
      return;
    }
  
    console.log('Initializing Alibi app with params:', params);
    await setupAlibiApp(container);
  }

async function setupAlibiApp(container) {
    container.innerHTML = createAlibiAppHTML();
    try {
      await loadData();
      setupDistrictCheckboxes(container);
      setupTimeCheckboxes(container);
      setupActivityCheckboxes(container);
      setupEventListeners(container);
    } catch (error) {
      console.error('Error setting up Alibi app:', error);
      container.innerHTML = '<p>Error loading Alibi app. Please try again later.</p>';
    }
  }

function createAlibiAppHTML() {
  return `
    <div class="alibi-app">
      <h3>㊙️ Generate an Alibi ㊙️</h3>
      <p>Select one or more areas, times of day, and types of activity. Or, generate a random alibi if you're feeling lucky.</p>
      <div class="options-container">
        <div class="option-column">
          <h4>Area</h4>
          <div id="district-checkboxes"></div>
        </div>
        <div class="option-column">
          <h4>Time of Day</h4>
          <div id="time-checkboxes"></div>
          <div id="witness-checkbox" class="witness-option">
            <label>
              <input type="checkbox" id="generate-witness" checked>
              <strong>Generate Witness?</strong>
            </label>
          </div>
        </div>
        <div class="option-column">
          <h4>Type of Activity</h4>
          <div id="activity-checkboxes"></div>
        </div>
      </div>
      <!-- ... rest of the content ... -->
    </div>
  `;
}

async function loadData() {
  try {
    const [districtsResponse, locationsResponse] = await Promise.all([
      fetch('../data/alibiDistricts.csv'),
      fetch('../data/alibiLocations.csv')
    ]);

    if (!districtsResponse.ok || !locationsResponse.ok) {
      throw new Error('Failed to fetch CSV files');
    }

    const districtsData = await districtsResponse.text();
    const locationsData = await locationsResponse.text();

    districts = parseDistrictsCSV(districtsData);
    locations = parseLocationsCSV(locationsData);

    console.log('Districts loaded:', districts.length);
    console.log('Locations loaded:', locations.length);
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function parseDistrictsCSV(csv) {
  const lines = csv.split('\n').filter(line => line.trim() !== '');
  const districts = new Set();
  let currentDistrict = '';

  lines.forEach(line => {
    const [first, second] = parseCSVLine(line);
    if (first && !second) {
      currentDistrict = first.trim();
      districts.add(currentDistrict);
    }
  });

  return Array.from(districts);
}

function parseLocationsCSV(csv) {
  const lines = csv.split('\n').filter(line => line.trim() !== '');
  return lines.slice(1).map(line => {
    const [name, area] = parseCSVLine(line);
    return {
      name: name.trim(),
      area: area.trim(),
/*       activityTypes: assignActivityTypes(name.trim()) */
    };
  });
}

function parseCSVLine(line) {
  const result = [];
  let startIndex = 0;
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === ',' && !inQuotes) {
      result.push(line.slice(startIndex, i).replace(/^"|"$/g, '').trim());
      startIndex = i + 1;
    }
  }

  result.push(line.slice(startIndex).replace(/^"|"$/g, '').trim());
  return result;
}

/* function assignActivityTypes(locationName) {
  const types = [];
  if (locationName.includes('Bank')) types.push(activityTypes.LEGAL, activityTypes.WORK);
  if (locationName.includes('Beach') || locationName.includes('Park')) types.push(activityTypes.LEISURE, activityTypes.SOCIAL);
  if (locationName.includes('Hospital') || locationName.includes('Medical')) types.push(activityTypes.MEDICAL);
  if (locationName.includes('Court') || locationName.includes('Hall')) types.push(activityTypes.LEGAL);
  if (locationName.includes('School') || locationName.includes('University')) types.push(activityTypes.EDUCATION);
  if (locationName.includes('Restaurant') || locationName.includes('Café')) types.push(activityTypes.FOOD);
  if (locationName.includes('Shop') || locationName.includes('Store')) types.push(activityTypes.SHOPPING);
  
  if (types.length === 0) {
    types.push(activityTypes.TRAVEL, activityTypes.SOCIAL, activityTypes.LEISURE);
  }
  
  return types;
} */

  function setupDistrictCheckboxes(container) {
    const checkboxContainer = container.querySelector('#district-checkboxes');
    districts.forEach(district => {
      const checkbox = createCheckbox(district, district);
      checkboxContainer.appendChild(checkbox);
    });
  }

function setupTimeCheckboxes(container) {
  const checkboxContainer = container.querySelector('#time-checkboxes');
  const times = [
    { value: 'morning', label: 'Morning', range: [5, 8] },
    { value: 'day', label: 'Day', range: [9, 12] },
    { value: 'afternoon', label: 'Afternoon', range: [13, 16] },
    { value: 'evening', label: 'Evening', range: [17, 20] },
    { value: 'night', label: 'Night', range: [21, 0] },
    { value: 'late night', label: 'Late Night', range: [1, 4] }
  ];
  times.forEach(time => {
    const checkbox = createCheckbox(time.value, time.label);
    checkbox.querySelector('input').dataset.range = JSON.stringify(time.range);
    checkboxContainer.appendChild(checkbox);
  });
}

function setupActivityCheckboxes(container) {
    const checkboxContainer = container.querySelector('#activity-checkboxes');
    Object.keys(activityTypes).forEach(type => {
      const checkbox = createCheckbox(type, type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' '));
      checkboxContainer.appendChild(checkbox);
    });
  }

function createCheckbox(value, label) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <label>
      <input type="checkbox" value="${value}" checked>
      ${label}
    </label>
  `;
  return wrapper;
}

function setupEventListeners(container) {
  const luckyButton = container.querySelector('#lucky-button');
  const generateButton = container.querySelector('#generate-button');

  luckyButton.addEventListener('click', () => generateAlibi(container, true));
  generateButton.addEventListener('click', () => generateAlibi(container, false));
}

function generatePhoneNumber() {
    const areaCode = '420';
    const prefixRanges = [[310, 323], [818, 830], [588, 599], [300, 308], [960, 968]];
    const lineRanges = [[7865, 8000], [4315, 4370], [7125, 7255], [1785, 1844]];
  
    const randomRange = (ranges) => {
      const range = ranges[Math.floor(Math.random() * ranges.length)];
      return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    };
  
    const prefix = randomRange(prefixRanges);
    const lineNumber = randomRange(lineRanges);
  
    return `(${areaCode}) ${prefix}-${lineNumber.toString().padStart(4, '0')}`;
  }

function generateAlibi(container, isRandom) {
    const selectedDistricts = isRandom ? districts : getSelectedOptions(container, '#district-checkboxes');
    const selectedTimes = isRandom ? ['morning', 'day', 'afternoon', 'evening', 'night', 'late night'] : getSelectedOptions(container, '#time-checkboxes');
    const selectedActivityTypes = isRandom ? Object.keys(activityTypes) : getSelectedOptions(container, '#activity-checkboxes');
  
    console.log('Selected Districts:', selectedDistricts);
    console.log('Selected Times:', selectedTimes);
    console.log('Selected Activity Types:', selectedActivityTypes);
  
    const filteredLocations = locations.filter(location => 
      selectedDistricts.some(district => location.area.includes(district))
    );
  
    if (filteredLocations.length === 0) {
      displayAlibi(container, "No suitable locations found. Please select more districts.");
      return;
    }
  
    const location = filteredLocations[Math.floor(Math.random() * filteredLocations.length)];
    const activityType = selectedActivityTypes[Math.floor(Math.random() * selectedActivityTypes.length)];
    
    console.log('Selected Location:', location);
    console.log('Selected Activity Type:', activityType);
  
    const activity = getRandomActivity(activityType);
  
    const timeRanges = getTimeRanges(container, selectedTimes);
    const randomTime = getRandomTimeFromRanges(timeRanges);

    const generateWitness = container.querySelector('#generate-witness').checked;
    let witnessInfo = '';

    if (generateWitness) {
        const witnessName = faker.name.fullName();
        const witnessPhone = generatePhoneNumber();
        witnessInfo = `\nWitness: ${witnessName} (${witnessPhone})`;
    }
  
    const alibi = `At ${randomTime}, you were at ${location.name} (${location.area}), ${activity}. Witness: ${witnessInfo}`;
    displayAlibi(container, alibi);
  }

function getSelectedOptions(container, selector) {
  return Array.from(container.querySelectorAll(`${selector} input:checked`)).map(cb => cb.value);
}

function getRandomActivity(activityType) {
    const activitiesForType = activities[activityType];
    if (!activitiesForType || activitiesForType.length === 0) {
      console.error(`No activities found for type: ${activityType}`);
      return "doing something";  // fallback activity
    }
    return activitiesForType[Math.floor(Math.random() * activitiesForType.length)];
  }

function getTimeRanges(container, selectedTimes) {
  return Array.from(container.querySelectorAll('#time-checkboxes input:checked'))
    .filter(cb => selectedTimes.includes(cb.value))
    .map(cb => JSON.parse(cb.dataset.range));
}

function getRandomTimeFromRanges(ranges) {
  const flattenedRanges = ranges.flatMap(range => {
    const [start, end] = range;
    return Array.from({length: end - start + 1}, (_, i) => (start + i) % 24);
  });
  const randomHour = flattenedRanges[Math.floor(Math.random() * flattenedRanges.length)];
  const randomMinute = Math.floor(Math.random() * 60);
  return `${randomHour.toString().padStart(2, '0')}:${randomMinute.toString().padStart(2, '0')}`;
}

function displayAlibi(container, alibi) {
    const alibiResult = container.querySelector('#alibi-result');
    alibiResult.innerHTML = alibi.replace(/\n/g, '<br>');
  }