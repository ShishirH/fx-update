import {createServer} from 'http';
import {parse} from 'url';
import next from 'next';
import WebSocket, {WebSocketServer} from 'ws';

// TODO - move to file
const SUPPORTED_PRODUCTS: string[] = [
    "BTC-USD",
    "USDT-USD",
    // "LTC-USD"
    // "ETH-USD"
]

const CHANNELS: string[] = [
    "level2_batch",
    "matches"
]


const app = next({dev: true});
const handle = app.getRequestHandler();

const PORT = 3000;
const coinBaseWs = new WebSocket('wss://ws-feed-public.sandbox.exchange.coinbase.com');

interface UserCurrencySockets {
    [userId: string]: {
        currencyList: string[],
        websocket: WebSocket;
    }
}

const subscribeMessage = {
    "type": "subscribe",
    "channels": CHANNELS,
    "product_ids": SUPPORTED_PRODUCTS
};

function pushUpdateToUsers(userCurrencySockets: UserCurrencySockets, data) {
    Object.keys(userCurrencySockets).forEach((user) => {
        if (userCurrencySockets[user].currencyList && userCurrencySockets[user].websocket) {
            if (userCurrencySockets[user].currencyList.includes(data.product_id)) {
                userCurrencySockets[user].websocket.send(JSON.stringify(data));
            }
        }
    });
}

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(String(req.url), true, true);
        handle(req, res, parsedUrl);
    });

    const socketServer = new WebSocketServer({ server });

    const userCurrencySockets: UserCurrencySockets = {};

    socketServer.on('connection', (connectedUser: WebSocket) => {
        connectedUser.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'initialize') {
                // New user. Subscribe to everything by default
                let user = data.user;

                if (!(user in userCurrencySockets)) {
                    userCurrencySockets[user] = {
                        currencyList: SUPPORTED_PRODUCTS,
                        websocket: connectedUser,
                    };
                } else {
                    // User was already initialized before. Just update websocket
                    userCurrencySockets[user].websocket = connectedUser;
                    let subscribedList = {
                        "type": "subscriptions",
                        currencyList: userCurrencySockets[user].currencyList
                    }
                    userCurrencySockets[user].websocket.send(JSON.stringify(data));
                }
            } else if (data.type === 'unsubscribe') {
                let user = data.user;
                console.log("user is: ", user);
                console.log(userCurrencySockets);
                if (userCurrencySockets[user]) {
                    let currencyArray = userCurrencySockets[user].currencyList;
                    currencyArray = currencyArray.filter((currency) => currency !== data.buttonName);
                    userCurrencySockets[user].currencyList = currencyArray;
                }
            } else if (data.type === 'subscribe') {
                let user = data.user;
                if (userCurrencySockets[user]) {
                    userCurrencySockets[user].currencyList.push(data.buttonName);
                }
            }
        }

        connectedUser.on('close', () => {
            // User connection lost.
            console.log("user connection lost")
        });
    });

    coinBaseWs.onopen = () => {
        // subscribe to everything and only send updates to what user subscribes
        console.log("coinbasews openeded")
        coinBaseWs.send(JSON.stringify(subscribeMessage));
    }

    coinBaseWs.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'l2update' || data.type === 'match') {
            //console.log("received l2data")
            pushUpdateToUsers(userCurrencySockets, data);
        } else if (data.type === 'snapshot') {
            //console.log("received snapshot")
            pushUpdateToUsers(userCurrencySockets, data);
        }
    }

    coinBaseWs.onerror = (error) => {
        console.error('error:', error);
    }

    server.listen(PORT, () => {
        console.log(`listening on server`);
    });
});
