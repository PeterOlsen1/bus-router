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

async function showData(dir) {
    let data;
    const container = document.querySelector('#bus-info');

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