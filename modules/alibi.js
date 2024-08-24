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
    "working a shift",
    "attending a business meeting",
    "doing overtime",
    "training a new employee",
    "fixing a work-related issue"
  ],
  [activityTypes.SOCIAL]: [
    "hanging out with friends",
    "going on a date",
    "attending a party",
    "going dancing",
    "ERPing"
  ],
  [activityTypes.FOOD]: [
    "getting food",
    "trying out a new restaurant",
    "picking up a takeout order",
    "having a quick snack",
    "meeting someone for lunch"
  ],
  [activityTypes.SHOPPING]: [
    "buying something off Lemon List",
    "window shopping",
    "returning a purchased item",
    "browsing for new clothes",
    "picking up groceries"
  ],
  [activityTypes.LEISURE]: [
    "taking a leisurely walk",
    "watching a movie",
    "reading a book",
    "playing sports",
    "sightseeing"
  ],
  [activityTypes.TRAVEL]: [
    "going for a drive",
    "calling a taxi",
    "riding the bus",
    "riding my bike",
    "hitchhiking"
  ],
  [activityTypes.MINOR_CRIME]: [
    "jaywalking",
    "yelling at the employees",
    "parking in a no-parking zone",
    "littering",
    "running a red light"
  ],
  [activityTypes.MEDICAL]: [
    "getting a routine check-up",
    "picking up a prescription",
    "visiting a sick friend",
    "donating blood",
    "attending a first-aid course"
  ],
  [activityTypes.LEGAL]: [
    "meeting with a lawyer",
    "gathering witness statements",
    "filing paperwork",
    "mailing a letter",
    "taking photos"
  ],
  [activityTypes.EDUCATION]: [
    "attending a class",
    "studying for an exam",
    "participating in a workshop",
    "taking a driving test",
    "tutoring a student"
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
  
  try {
    await setupAlibiApp(container);
  } catch (error) {
    console.error('Error initializing Alibi app:', error);
    container.innerHTML = '<p>Error loading Alibi app. Please try again later.</p>';
  }
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
        <p>Select one or more areas, times of day, and types of activity.</p>
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
        <div class="button-container">
          <button id="generate-button">Generate Alibi</button>
        </div>
        <div id="alibi-result"></div>
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
  const generateButton = container.querySelector('#generate-button');
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

function generateName(){
	var name1 = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", 
    "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", 
    "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", 
    "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", 
    "Donald", "Ashley", "Steven", "Dorothy", "Paul", "Kimberly", "Andrew", "Emily", 
    "Joshua", "Donna", "Kenneth", "Michelle", "Kevin", "Carol", "Brian", "Amanda", 
    "George", "Melissa", "Edward", "Deborah", "Ronald", "Stephanie", "Timothy", 
    "Rebecca", "Jason", "Sharon", "Jeffrey", "Laura", "Ryan", "Cynthia", "Jacob", 
    "Kathleen", "Gary", "Amy", "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", 
    "Helen", "Stephen", "Anna", "Larry", "Brenda", "Justin", "Pamela", "Scott", 
    "Nicole", "Brandon", "Emma", "Benjamin", "Samantha", "Samuel", "Katherine", 
    "Gregory", "Christine", "Frank", "Debra", "Alexander", "Rachel", "Raymond", 
    "Catherine", "Patrick", "Carolyn", "Jack", "Janet", "Dennis", "Ruth", "Jerry", 
    "Maria"
  ];

	var name2 = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", 
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", 
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", 
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", 
    "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", 
    "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", 
    "Campbell", "Mitchell", "Carter", "Roberts", "Gomez", "Phillips", "Evans", 
    "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes", "Stewart", 
    "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", 
    "Cooper", "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", 
    "Cox", "Ward", "Richardson", "Watson", "Brooks", "Chavez", "Wood", "James", 
    "Bennett", "Gray", "Mendoza", "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", 
    "Sanders", "Patel", "Myers", "Long", "Ross", "Foster", "Jimenez", "Powell", 
    "Jenkins", "Perry", "Russell", "Sullivan"
  ];

	var name = name1[Math.floor(Math.random() * (name1.length))] + ' ' + name2[Math.floor(Math.random() * (name2.length))];
	return name;

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
      const witnessName = generateName();
      const witnessPhone = generatePhoneNumber();
      witnessInfo = `\nWitness: ${witnessName} - ${witnessPhone}`;
    }
  
    const alibi = `"At ${randomTime}, I was at ${location.name} (${location.area}), ${activity}." ${witnessInfo}`;
    displayAlibi(container, alibi);
  }

function getSelectedOptions(container, selector) {
  return Array.from(container.querySelectorAll(`${selector} input:checked`)).map(cb => cb.value);
}

function getRandomActivity(activityType) {
    const activitiesForType = activities[activityType];
    if (!activitiesForType || activitiesForType.length === 0) {
      console.error(`No activities found for type: ${activityType}`);
      return "doing something";
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