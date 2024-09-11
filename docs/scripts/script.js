/**
* Essentially just document.querySelector with a shorter name
*/
function $(query) {
    return document.querySelector(query);
}

/**
 * Runs through the process of the settins menu
 */
async function configure() {
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
 * Function to save user input in local storage
 */
function saveInput() {
    const route = $('#route').value;
    const onCampusStop = $('#stop-id-on');
    const offCampusStop = $('#stop-id-off');
    const directionToCampus = $('#direction');
    const name = $('#route-name');

    const config = {
        route, onCampusStop, offCampusStop, directionToCampus, name
    }

    if (!localStorage.getItem('config')) {
        localStorage.setItem('config', JSON.stringify([config]));
    }
    else {
        const cur = JSON.parse(localStorage.getItem('config'));
        cur.push(config);
        localStorage.setItem('config', JSON.stringify(cur));
    }
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