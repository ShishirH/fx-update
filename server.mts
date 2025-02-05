import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import WebSocket, { WebSocketServer } from 'ws';

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

// For each currency, have a list of websockets subscribed
interface CurrencySockets {
    [currency: string]: WebSocket[];
}
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

function pushUpdateToUsers(currencySockets: CurrencySockets, data) {
    Object.keys(currencySockets).forEach((product) => {
        if (currencySockets[product].length > 0) {
            currencySockets[product].forEach((user) => {
                user.send(JSON.stringify(data));
            })
        }
    });
}

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(String(req.url), true, true);
        handle(req, res, parsedUrl);
    });

    const socketServer = new WebSocketServer({ server });

    const currencySockets: CurrencySockets = {};

    socketServer.on('connection', (connectedUser: WebSocket) => {
        connectedUser.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'initialize') {
                // New user. Subscribe to everything by default
                SUPPORTED_PRODUCTS.forEach((product) => {
                    if (!currencySockets[product]) {
                        currencySockets[product] = [];
                    }
                    currencySockets[product].push(connectedUser);
                })
            } else if (data.type === 'unsubscribe') {
                //console.log("unsubscribe from user: ");
                currencySockets[data.buttonName] = currencySockets[data.buttonName].filter((user) => user !== connectedUser);
            } else if (data.type === 'subscribe') {
                currencySockets[data.buttonName].push(connectedUser);
            }
        }

        connectedUser.on('close', () => {
            // User connection lost.
            SUPPORTED_PRODUCTS.forEach((product) => {
                currencySockets[product] = currencySockets[product].filter((user) => user !== connectedUser);
            });
        });
    });

    coinBaseWs.onopen = () => {
        // subscribe to everything and only send updates to what user subscribes
        coinBaseWs.send(JSON.stringify(subscribeMessage));
    }

    coinBaseWs.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'l2update' || data.type === 'match') {
            //console.log("received l2data")
            pushUpdateToUsers(currencySockets, data);
        } else if (data.type === 'snapshot') {
            //console.log("received snapshot")
            pushUpdateToUsers(currencySockets, data);
        }
    }

    coinBaseWs.onerror = (error) => {
        console.error('error:', error);
    }

    server.listen(PORT, () => {
        console.log(`listening on server`);
    });
});
