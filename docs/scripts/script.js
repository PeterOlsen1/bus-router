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
        $('fieldset').children[3].style.display = 'none';
    }
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
    $('#stop-off-warning-edit').style.display = 'none';
    $('#stop-on-warning-edit').style.display = 'none';

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

    //edit second route select too
    const editRouteSelect = $('#route-edit');
    editRouteSelect.innerHTML = '';

    //add to select box
    for (let route of routes) {
        const option = document.createElement('option');
        option.innerHTML = `${route.route_id} - ${route.route_label}`;
        //option.id = 'route-' + route.route_id;
        option.value = route.route_id;
        editRouteSelect.appendChild(option.cloneNode(true));
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

    const editRoute = $('#edit-route');
    editRoute.removeEventListener('input', populateEditRoute);
    editRoute.addEventListener('input', populateEditRoute);

    //call initially
    handleInput();
    updateSelectBoxes();
    populateEditRoute();
}

function populateEditRoute() {
    //grab form elements
    const selected = $('#edit-route');
    const route = $('#route-edit');
    const stopOn = $('#stop-id-on-edit');
    const stopOff = $('#stop-id-off-edit');
    const direction = $('#direction-edit');
    const name = $('#route-name-edit');
    const data = JSON.parse(lsGet('routes'));
    let curRoute;

    //find current entry
    for (const entry of data) {
        if (entry.name == selected.value) {
            curRoute = entry;
        }
    }

    //populate all values
    stopOn.value = curRoute.onCampusStop;
    stopOff.value = curRoute.offCampusStop;
    direction.value = curRoute.direction;
    route.value = curRoute.route;
    name.value = curRoute.name;

    //function to handle route input
    async function handleInput() {
        $('#map-link').href = 'https://www.metrotransit.org/imap/' + route.value;

        const directions = await getMetroTransit('/directions/' + route.value);
        const dirSelect = $('#direction-edit');
        dirSelect.innerHTML = '';

        //add all possible directions to select box
        for (let dir of directions) {
            const option = document.createElement('option');
            option.innerHTML = dir.direction_name;
            option.value = dir.direction_id;
            dirSelect.appendChild(option);
        }
    } 

    //call initially and then register listeners
    handleInput();
    route.removeEventListener('input', handleInput);
    route.addEventListener('input', handleInput);
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

    //reset typed values for next change
    $('#stop-id-on').value = '';
    $('#stop-id-off').value = '';
    $('#route-name').value = '';

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
        $('fieldset').children[3].style.display = 'flex';
    }
    else {
        const cur = JSON.parse(lsGet('routes'));
        cur.push(config);
        lsSet('routes', JSON.stringify(cur));
    }

    //set local storage, hide menu, and update select dropdowns
    lsSet('current-route', name);
    $('#settings-form').style.display = 'none';
    updateSelectBoxes();
}

/**
 * 
 * @description Edits the data of the oldName object according to the edited form 
 */
async function saveEdits() {
    const oldName = $('#edit-route').value;
    const route = $('#route-edit').value;
    const onCampusStop = $('#stop-id-on-edit').value;
    const offCampusStop = $('#stop-id-off-edit').value;
    const directionToCampus = $('#direction-edit').value;
    const name = $('#route-name-edit').value;
    const data = JSON.parse(lsGet('routes'));

    //test stop IDs
    const [onTest, offTest] = await Promise.all([
        getMetroTransit(`/${onCampusStop}`),
        getMetroTransit(`/${offCampusStop}`)
    ]);

    let invalidFlag = false;
    if (onTest.status == 400) {
        $('#stop-on-warning-edit').style.display = 'block';
        $('#stop-id-on-edit').value = '';
        invalidFlag = true;
    }
    if (offTest.status == 400) {
        $('#stop-off-warning-edit').style.display = 'block';
        $('#stop-id-off-edit').value = '';
        invalidFlag = true;
    }

    //hide warnings if we get this far
    $('#stop-off-warning-edit').style.display = 'none';
    $('#stop-on-warning-edit').style.display = 'none';

    if (invalidFlag) {
        return;
    }

    //find index of data to edit
    let idx = 0;
    for (const i in data) {
        if (data[i].name == oldName) {
            idx = i; 
        }
    }
    
    const config = {
        route, onCampusStop, offCampusStop, directionToCampus, name
    }

    //commit new object back to local storage
    data[idx] = config;
    lsSet('routes', JSON.stringify(data));

    //change current value if it was set to the old one
    if (lsGet('current-route') == oldName) {
        lsSet('current-route', name);
    }
    
    //hide form
    $('#settings-form').style.display = 'none';
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
    $('#settings-form').style.display = 'none';
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

    let count = 0;
    for (let dep of data.departures) {
        if (dep.route_id != route.route /*|| dep.direction_id != direction*/) {
            continue;
        }
        count++;
        const dep_text = dep.departure_text;

        out += `
        <div class='flex-center'>
        <div class="card">
            <div class="card-top">
            ${dep_text.includes(':') ? 
                "Departure at " + dep_text :
                "Departure in " + dep_text
            }
            </div>
            ${
                (dep.route_id == '901' || dep.route_id == '902') ? 
                `${dep.route_short_name} Line - ${dep.description}` :
                `Bus ${dep.route_id}${dep.terminal} - ${dep.description}`
            }
        </div>   
        </div>
        `
    }

    if (count == 0) {
        out = '<div style="font-weight: bold">No results found!<br><br>It is likely that your stops and directions don\'t align.<br>The stop ID map is very tricky, so make sure to zoom in very far and check that you have the right stop for each direction.'
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
 * Updates all select boxes to reflect the current routes
 */
function updateSelectBoxes() {
    const deleteSelect = $('#delete-route');
    const currentSelect = $('#current-route');
    const editSelect = $('#edit-route');
    const routes = JSON.parse(lsGet('routes'));

    deleteSelect.innerHTML = '';
    currentSelect.innerHTML = '';
    editSelect.innerHTML = '';

    //add all current routes to select boxes
    for (let route of routes) {
        const option = document.createElement('option');
        option.innerHTML = route.name;
        option.value = route.name;

        deleteSelect.appendChild(option.cloneNode(true));
        editSelect.appendChild(option.cloneNode(true));
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