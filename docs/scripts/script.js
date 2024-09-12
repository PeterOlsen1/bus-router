window.onload = () => {
    const selectedText = $('#selected');
    if (!lsGet('current-configuration')) {
        selectedText.innerHTML = 'No Configurations Set!';
    }
    else {
        selectedText.innerHTML = 'Configuration: ' + lsGet('current-configuration');
    }

    const currentSelect = $('#current-configuration');

    currentSelect.addEventListener('input', () => {
        lsSet('current-configuration', currentSelect.value);
        selectedText.innerHTML = 'Configuration: ' + lsGet('current-configuration');
    });

    updateSelectBoxes();
}


/**
 * Updates all select boxes to reflect the current configs
 */
function updateSelectBoxes() {
    const deleteSelect = $('#delete-configuration');
    const currentSelect = $('#current-configuration');
    const configs = JSON.parse(lsGet('config'));

    deleteSelect.innerHTML = '';
    currentSelect.innerHTML = '';

    //add all current configs to select boxes
    for (let config of configs) {
        const option = document.createElement('option');
        option.innerHTML = config.name;
        option.value = config.name;

        deleteSelect.appendChild(option.cloneNode(true));
        currentSelect.appendChild(option);
    }

    $('#selected').innerHTML = 'Configuration: ' + lsGet('current-configuration');
}


/**
 * Runs through the process of the settins menu.
 * 
 * If the configuration menu is open already, close it.
 */
async function configure() {
    //use the button as a toggle
    if ($('#configuration-form').style.display != 'none') {
        $('#configuration-form').style.display = 'none';
        return;
    }

    //hide warnings
    $('#stop-off-warning').style.display = 'none';
    $('#stop-on-warning').style.display = 'none';

    //update displays
    $('#configuration-form').style.display = 'block';
    $('#bus-info').style.display = 'none';
    const routeSelect = $('#route');

    //get routes
    const routes = await getMetroTransit('/routes');

    //add to select box
    for (let route of routes) {
        const option = document.createElement('option');
        option.innerHTML = `${route.route_id} - ${route.route_label}`;
        //option.id = 'route-' + route.route_id;
        option.value = route.route_id;
        routeSelect.appendChild(option);
    }

    //declare function to handle input within the parent function
    async function handleInput() {
        $('#map-link').href = 'https://www.metrotransit.org/imap/' + routeSelect.value;

        const directions = await getMetroTransit('/directions/' + routeSelect.value);
        const dirSelect = $('#direction');
        dirSelect.innerHTML = '';

        //add all possible directions to select box
        for (let dir of directions) {
            const option = document.createElement('option');
            option.innerHTML = dir.direction_name;
            option.value = dir.direction_id;
            dirSelect.appendChild(option);
        }
    }   
    //call initially
    handleInput();

    //once a route is selected, show other inputs
    routeSelect.addEventListener('input', handleInput);
}


/**
 * Function to save user input in local storage.
 * 
 * If the stop IDs are invalid, show a warning and reset
 */
async function saveInput() {
    //hide warnings
    $('#stop-off-warning').style.display = 'none';
    $('#stop-on-warning').style.display = 'none';

    //gather data
    const route = $('#route').value;
    const onCampusStop = $('#stop-id-on').value;
    const offCampusStop = $('#stop-id-off').value;
    const directionToCampus = $('#direction').value;
    const name = $('#route-name').value;


    // //test stop IDs
    // const [onTest, offTest] = await Promise.all([
    //     getMetroTransit(`/${onCampusStop}`),
    //     getMetroTransit(`/${offCampusStop}`)
    // ]);

    // let invalidFlag = false;
    // if (onTest.status == 400) {
    //     $('#stop-on-warning').style.display = 'block';
    //     $('#stop-id-on').value = '';
    //     invalidFlag = true;
    // }
    // if (offTest.status == 400) {
    //     $('#stop-off-warning').style.display = 'block';
    //     $('#stop-id-off').value = '';
    //     invalidFlag = true;
    // }

    // if (invalidFlag) {
    //     return;
    // }

    //create object
    const config = {
        route, onCampusStop, offCampusStop, directionToCampus, name
    }

    //push to local storage, create config variable if it exists
    if (!lsGet('config')) {
        lsSet('config', JSON.stringify([config]));
    }
    else {
        const cur = JSON.parse(lsGet('config'));
        cur.push(config);
        lsSet('config', JSON.stringify(cur));
    }

    //set local storage, hide menu, and update select dropdowns
    lsSet('current-configuration', name);
    $('#configuration-form').style.display = 'none';
    updateSelectBoxes();
}

/**
 * Function to delete a config that is selected
 * in the delete config selection box
 */
function deleteConfig() {
    const configs = JSON.parse(lsGet('config'));
    const selected = $('#delete-configuration').value;

    for (let i in configs) {
        if (configs[i].name == selected) {
            configs.splice(i, 1);
            i--;
        }
    }
    console.log(configs);

    lsSet('config', JSON.stringify(configs));
    updateSelectBoxes();
}


/**
 * 
 * @param {string} dir The direction we want to travel in
 * 
 * Shows the data for bus 3 in a given direction 
 */
async function showData(dir) {
    let data;
    const container = $('#bus-info');
    container.style.display = 'flex';

    if (dir == 'to') {
        data = await getMetroTransit('/16102');
    }
    else {
        data = await getMetroTransit('/80666');
    }

    // <div class="card">
    //     <div class="card-top">
    //         Bus in 30
    //     </div>
    //     Departing from rollins longer text longer text
    // </div>  
    let out = '';
    for (let dep of data.departures) {
        if (dep.route_id != 3) {
            continue;
        }
        const dep_text = dep.departure_text;

        out += `
        <div class="card">
            <div class="card-top">
                ${dep_text.includes(':') ? 
                "Bus at " + dep_text :
                "Bus in " + dep_text
            }
            </div>
            ${
                `Bus ${dep.route_id}${dep.terminal} - ${dep.description}`
            }
        </div>   
        `
    }

    container.innerHTML = out;
}   



//===================================
// Helper Functions
//===================================

/**
 * 
 * @param {string} query The url scheme we want to fetch from MetroTransit API
 * @returns The data returned by metro transit
 */
async function getMetroTransit(query) {
    const url = 'https://svc.metrotransit.org/nextrip' + query;
    console.log(url);

    try {
        let resp = await fetch(url);
        let data = await resp.json();
        return data;
    }
    catch (error) {
        throw error;
    }
}

/**
* Essentially just document.querySelector with a shorter name
*/
function $(query) {
    return document.querySelector(query);
}


/**
 * 
 * @param {string} name The name of the item to get
 * @returns The result of calling localStorage.getItem
 */
function lsGet(name) {
    return localStorage.getItem(name);
}


/**
 * 
 * @param {string} name name of item to set
 * @param {*} item thing to set it to
 * 
 * @returns Nothing
 */
function lsSet(name, item) {
    localStorage.setItem(name, item);
}