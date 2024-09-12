window.onload = () => {
    const selectedText = $('#selected');
    if (!lsGet('routes')) {
        selectedText.innerHTML = 'No Routes Set!';
    }
    else {
        updateCurrentRouteText();
    }

    const currentSelect = $('#current-route');

    //register event listeners
    currentSelect.addEventListener('input', () => {
        lsSet('current-route', currentSelect.value);
        updateCurrentRouteText();
    });

    $('#route-name').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.target.blur();
            saveInput();
        }
    })

    //if there are no routes, show only route creation box
    if (!lsGet('routes')) {
        openSettings();
        $('#buttons').style.display = 'none';
        $('fieldset').children[0].style.display = 'none';
        $('fieldset').children[2].style.display = 'none';
    }
}


/**
 * Updates all select boxes to reflect the current routes
 */
function updateSelectBoxes() {
    const deleteSelect = $('#delete-route');
    const currentSelect = $('#current-route');
    const routes = JSON.parse(lsGet('routes'));

    deleteSelect.innerHTML = '';
    currentSelect.innerHTML = '';

    //add all current routes to select boxes
    for (let route of routes) {
        const option = document.createElement('option');
        option.innerHTML = route.name;
        option.value = route.name;

        deleteSelect.appendChild(option.cloneNode(true));
        currentSelect.appendChild(option);
    }

    currentSelect.value = lsGet('current-route');

   updateCurrentRouteText();
}

/**
 * Updates the text that displays the current route
 */
function updateCurrentRouteText() {
    const selectedText = $('#selected');
    selectedText.innerHTML = 'Current Route: ' + (lsGet('current-route') ? lsGet('current-route') : 'Unnamed');
}

/**
 * Runs through the process of the settins menu.
 * 
 * If the settings menu is open already, close it.
 */
async function openSettings() {
    //use the button as a toggle
    if ($('#settings-form').style.display != 'none') {
        $('#settings-form').style.display = 'none';
        return;
    }

    //hide warnings
    $('#stop-off-warning').style.display = 'none';
    $('#stop-on-warning').style.display = 'none';

    //update displays
    $('#settings-form').style.display = 'block';
    $('#bus-info').style.display = 'none';
    const routeSelect = $('#route');

    //get routes
    let routes = JSON.parse(lsGet('mt-routes'));
    if (!routes) {
        routes = await getMetroTransit('/routes');
        lsSet('mt-routes', JSON.stringify(routes));
    }


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

    //once a route is selected, show other inputs
    routeSelect.removeEventListener('input', handleInput);
    routeSelect.addEventListener('input', handleInput);

    //call initially
    handleInput();
    updateSelectBoxes();
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

    //reset typed values for next change
    $('#stop-id-on').value = '';
    $('#stop-id-off').value = '';
    $('#route-name').value = '';


    //test stop IDs
    const [onTest, offTest] = await Promise.all([
        getMetroTransit(`/${onCampusStop}`),
        getMetroTransit(`/${offCampusStop}`)
    ]);

    let invalidFlag = false;
    if (onTest.status == 400) {
        $('#stop-on-warning').style.display = 'block';
        $('#stop-id-on').value = '';
        invalidFlag = true;
    }
    if (offTest.status == 400) {
        $('#stop-off-warning').style.display = 'block';
        $('#stop-id-off').value = '';
        invalidFlag = true;
    }

    if (invalidFlag) {
        return;
    }

    //create object
    const config = {
        route, onCampusStop, offCampusStop, directionToCampus, name
    }

    //push to local storage, create route variable if it exists
    if (!lsGet('routes')) {
        lsSet('routes', JSON.stringify([config]));
        $('#buttons').style.display = 'block';
        $('fieldset').children[0].style.display = 'flex';
        $('fieldset').children[2].style.display = 'flex';
    }
    else {
        const cur = JSON.parse(lsGet('routes'));
        cur.push(config);
        lsSet('routes', JSON.stringify(cur));
    }

    //set local storage, hide menu, and update select dropdowns
    lsSet('current-route', name);
    // $('#settings-form').style.display = 'none';
    updateSelectBoxes();
}

/**
 * Function to delete a route that is selected
 * in the delete route selection box
 */
function deleteRoute() {
    const routes = JSON.parse(lsGet('routes'));
    const selected = $('#delete-route').value;

    //loop through routes and delete matches
    for (let i in routes) {
        if (routes[i].name == selected) {
            routes.splice(i, 1);
            i--;
        }
    }

    //user deleted selected route
    if (lsGet('current-route') == selected) {
        if (!routes) {
            window.location.reload();
        }
        else {
            lsSet('current-route', routes[0].name);
        }
    }

    lsSet('routes', JSON.stringify(routes));
    updateSelectBoxes();
}


/**
 * 
 * @param {string} dir The direction we want to travel in
 * 
 * Shows the data for bus 3 in a given direction 
 */
async function showData(dir) {
    let data = [];
    const container = $('#bus-info');
    container.style.display = 'flex';
    $('#settings-form').style.display = 'none';

    //get info from local storage and find current route
    const routes = JSON.parse(lsGet('routes'));
    const cur = lsGet('current-route');
    let route;
    for (let r of routes) {
        if (r.name == cur) {
            route = r;
        }
    }

    let direction = route.directionToCampus;
    //choose which stop we are displaying
    if (dir == 'to') {
        data = await getMetroTransit('/' + route.offCampusStop);
    }
    else {
        data = await getMetroTransit('/' + route.onCampusStop);

        //going home from campus, take the opposite of directionToCampus
        direction = (1 - direction);
    }

    // <div class="card">
    //     <div class="card-top">
    //         Bus in 30
    //     </div>
    //     Departing from rollins longer text longer text
    // </div>  

    //<div class="alert">
    //   {alert text}
    //</div>
    let out = `<div style="font-weight: bold">Departures From ${data.stops[0].description}</div><div id='main-bus-div'>`;

    console.log(data.departures);
    for (let dep of data.departures) {
        if (dep.route_id != route.route || dep.direction_id != direction) {
            console.log(direction);
            continue;
        }
        const dep_text = dep.departure_text;

        out += `
        <div class='flex-center'>
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
        </div>
        `
    }

    out += '</div>'

    for (let alert of data.alerts) {
        out += `
            <div class='alert'>
                ${alert.alert_text}
            </div>
        `;
    }

    container.innerHTML = out;
}   



//===================================
// Helper Functions                 |
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