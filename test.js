// import prompt from 'prompt-sync'

async function getBruininks() {
    let url = 'https://svc.metrotransit.org/nextrip/80498';

    try {
        let resp = await fetch(url);
        let data = await resp.json();
        // console.log(data);

        for (let dep of data.departures) {
            if (dep.departure_text.includes(':')) {
                console.log("Bus at " + dep.departure_text);
            }
            else {
                console.log("Bus in " + dep.departure_text);
            }
            console.log("Desc: " + dep.description);
            console.log();
        }
    }
    catch (error) {
        console.log(error);
    }
}

async function getMetroTransit(query) {
    const url = 'https://svc.metrotransit.org/nextrip' + query;
    console.log(url);

    try {
        let resp = await fetch(url);
        let data = await resp.json();
        console.log(data);
        return data;
    }
    catch (error) {
        throw error;
    }
}

// getBruininks();
getMetroTransit('/directions/3');
// getMetroTransit('/routes')
// getMetroTransit('/80666'); //bruninks stop
// getMetroTransit('/WIHA');
// getMetroTransit('/stops/3/1');
// getMetroTransit('/3/1/COES');
// 
// async function metroInterface() {
//     while (true) {
//         if (!route) {
//             let routes = await getMetroTransit('/routes')
//         }
//     }
// }