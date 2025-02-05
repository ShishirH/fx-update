"use client";

import {useEffect, useState} from "react";
import {MatchData, ProductToOrderBook, SUPPORTED_PRODUCTS} from "@/app/utils/utils";
import PriceView from "@/app/[...catchAll]/PriceView";
import StickySideButtonContainer from "@/app/[...catchAll]/StickySideButtonContainer";
import MatchView from "@/app/[...catchAll]/MatchView";
import SystemStatus from "@/app/[...catchAll]/SystemStatus";
import {useRouter} from "next/router";
import {usePathname} from "next/navigation";

const Coinbase = () => {
    const [priceData, setPriceData] = useState<ProductToOrderBook>({});
    const [subscribedList, setSubscribedList] = useState<string[]>(SUPPORTED_PRODUCTS);
    const [selectedCurrency, setSelectedCurrency] = useState<string>(SUPPORTED_PRODUCTS[0]);
    const [matchInfo, setMatchInfo] = useState<MatchData[]>([]);
    const [webSocket, setWebSocket] = useState<WebSocket>();

    const url: string = "ws://localhost:3000";
    const pathname = usePathname();

    // useEffect(() => {
    //     console.log("priceData is now: ")
    //     console.log(priceData);
    // }, [priceData]);


    // @ts-expect-error
    function handleSubscriptions(data) {
        const currencyList = data.channels[0]["product_ids"];
        console.log("subscribedList ", currencyList);
        setSubscribedList(currencyList);
        setSelectedCurrency(currencyList[0]);
    }

    function updateSubscription(buttonName: string) {
        const payload = {
            "type": "",
            buttonName
        };

        // If subscribed, unsubscribe
        if (subscribedList.includes(buttonName)) {
            payload.type = "unsubscribe";
            setPriceData((prevState) => {
                const copy = {...prevState};
                delete copy[buttonName];
                return copy;
            });
            setSubscribedList(subscribedList.filter((productId) => productId !== buttonName));
        } else {
            payload.type = "subscribe";
            setSubscribedList([...subscribedList, buttonName]);
        }
        webSocket?.send(JSON.stringify(payload))
    }

    // @ts-expect-error
    function handleSnapshot(data) {
        const bidsData: { [price: string]: number } = {};
        const asksData: { [price: string]: number } = {};
        const productId = data.product_id;

        // [["9690.84", "0.20000000"], ["9691.04", "0.60000000"], ["9691.34", "0.40000000"]]
        data.asks.forEach((entry: [string, string]) => {
            asksData[entry[0]] = Number(entry[1]);
        })

        data.bids.forEach((entry: [string, string]) => {
            bidsData[entry[0]] = Number(entry[1]);
        })

        const productSnapshot = {
            [productId]: {
                bids: bidsData,
                asks: asksData
            }
        }

        setPriceData((prevValue) => {
            return {...prevValue, ...productSnapshot}
        });
    }

    // @ts-expect-error
    function handleL2Update(data) {
        const productId: string = data.product_id;
        if (!subscribedList.includes(productId)) return;

        setPriceData((prevValue) => {
            const currentBids = {...(prevValue[productId]?.bids ?? {})};
            const currentAsks = {...(prevValue[productId]?.asks ?? {})};

            data.changes.forEach(([buyOrSell, price, size]: [string, string, string]) => {
                // The size property is the updated size at the price level, not a delta. A size of "0" indicates the price level can be removed.
                const sizeNum = parseFloat(size);
                if (buyOrSell === "buy") {
                    if (sizeNum === 0) {
                        delete currentBids[price];
                    } else {
                        // Add to bids
                        currentBids[price] = sizeNum;
                    }
                } else if (buyOrSell === "sell") {
                    if (sizeNum === 0) {
                        delete currentAsks[price];
                    } else {
                        // Add to asks
                        currentAsks[price] = sizeNum;
                        //console.log(currentAsks)
                    }
                }
            });
            const orderData: { [productId: string]: any } = {}
            orderData[productId] = {bids: currentBids, asks: currentAsks};
            return {...prevValue, ...orderData}
        })
    }

    useEffect(() => {
        const ws = new WebSocket(url);
        setWebSocket(ws);

        ws.onopen = () => {
            console.log("sending a message to server")
            ws.send(JSON.stringify({"type": "initialize", "user": pathname}));
            console.log('client WebSocket connection opened.');
        };

        // Handle incoming messages
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "subscriptions") {
                handleSubscriptions(data);
            }

            if (data.type === "match") {
                const matchData: MatchData = {
                    productId: data.product_id,
                    price: data.price,
                    size: data.size,
                    timestamp: data.time,
                    side: data.side,
                };

                setMatchInfo((prevState) => {
                    return [...prevState, matchData];
                })
            }

            // Reference: https://docs.cdp.coinbase.com/exchange/docs/websocket-channels#level2-channel

            // Initially level2 channel gives snapshot, which is the initial state of the order book.
            if (data.type === "snapshot") {
                handleSnapshot(data);
            }

            if (data.type === "l2update") {
                // [["buy","1705.06","0.00002000"],["sell","1705.36","0.00000000"],["sell","1705.46","0.40000000"]]
                handleL2Update(data);
            }
        };

        // Handle errors
        ws.onerror = (error) => {
            console.log("being closed")
            console.error('WebSocket error:', error);
        };

        // Clean up when the component unmounts
        return () => {
            ws.close();
            console.log('WebSocket connection closed.');
        };
    }, [])

    return (
        <div>
            <StickySideButtonContainer
                buttonList={SUPPORTED_PRODUCTS}
                subscribedList={subscribedList}
                onClick={setSelectedCurrency}
                handleSubscription={updateSubscription}
            />

            <MatchView matchInfo={matchInfo} />

            {(selectedCurrency !== "" && priceData[selectedCurrency]?.bids) ? (
                <PriceView bids={priceData[selectedCurrency].bids} asks={priceData[selectedCurrency].asks} />
            ): null}

            <SystemStatus buttonList={SUPPORTED_PRODUCTS} />
        </div>
    )
};

export default Coinbase;