/**
* Essentially just document.querySelector with a shorter name
*/
function $(query) {
    return document.querySelector(query);
}

async function configure() {
    //select proper items
    $('#bus-info').style.display = 'none';
    const select = $('select');

    //get routes
    const routes = await getMetroTransit('/routes');

    //add to select box
    for (let route of routes) {
        const option = document.createElement('option');
        option.innerHTML = `${route.route_id} - ${route.route_label}`;
        //option.id = 'route-' + route.route_id;
        option.value = route.route_id;
        select.appendChild(option);
    }

    select.addEventListener('input', (event) => {
        $('#map-link').href = 'https://www.metrotransit.org/Route/' + select.value;
    });

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