import requests as req

#https://svc.metrotransit.org/swagger/index.html

def getMetroTransit(query):
    url = 'https://svc.metrotransit.org/nextrip' + query
    print(url)

    resp = req.get(url)
    return resp.json()

route, direction, stop = -1, -1, -1
stopName = -1
routes = []
directions = []
dirNums = []
stops = []
codes = []
route = 3
# direction = 1
# stop = 'COSN'

while True:
    #get the user to specify the route
    if route == -1:
        routes = getMetroTransit('/routes')
        for route in routes:
            try:
                print('Route:', route['route_id'])
                routes.append(route['route_id'])
            except:
                1
        route = input("Please select a route: ")
        if route not in routes:
            print("Invalid route, try again")
            route = -1

    #specify the direction
    elif direction == -1:
        directionResponse = getMetroTransit('/directions/' + str(route))

        i = 0

        #add all directions to a store
        for dir in directionResponse:
            print(dir['direction_name'], f'({i})')
            directions.append(dir['direction_name'].lower())
            dirNums.append(str(i))
            i += 1

        dir = input("Please select a direction: ").lower()

        #invalid / valid direction
        if dir in dirNums:
            direciton = int(dir)
        elif dir not in directions:
            print("Invalid direction, try again")
            direction = -1
        else:
            direction = directions.index(dir)

    #specify the stop name
    elif stop == -1:
        stopResponse = getMetroTransit(f'/stops/{route}/{direction}')
        
        for stop in stopResponse:
            print(stop.description)
            stops.append(stop.description.lower())
            codes.append(stop.place_code)
        stopName = input("Please select a stop: ")
        stop = stopName.lower()
        if stop not in stops:
            stop = -1
            print("Invalid Stop, try again.")
        else:
            idx = stops.index(stop)
            stop = codes[idx]

    #all information exists, show the reuslts
    else:
        resp = getMetroTransit(f'/{route}/{direction}/{stop}')
        print(resp)
        for bus in resp['departures']:
            if ':' in bus.departure_text:
                print(f'Arrives in {bus.departure_text}')
                print(f'Bus {route} departing from {stopName}')
            else:
                print(f'Arrives at {bus.departure_text}')
                print(f'Bus {route} departing from {stopName} at {bus.departure_text}')
            print()
        break
    
