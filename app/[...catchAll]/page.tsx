"use client";

import {useEffect, useState} from "react";
import {CHANNELS, MatchData, ProductToOrderBook, SUPPORTED_PRODUCTS} from "@/app/[...catchAll]/utils";
import PriceView from "@/app/[...catchAll]/PriceView";
import StickySideButtonContainer from "@/app/[...catchAll]/StickySideButtonContainer";
import MatchView from "@/app/[...catchAll]/MatchView";

const styles: { [key: string]: React.CSSProperties } = {
    button: {
        width: "max-content",
        border: '1px solid red',

    }
}

const Coinbase = () => {
    const [priceData, setPriceData] = useState<ProductToOrderBook>({});
    const [subscribedList, setSubscribedList] = useState<string[]>([]);
    const [selectedCurrency, setSelectedCurrency] = useState<string>('');
    const [matchInfo, setMatchInfo] = useState<MatchData[]>([]);

    const url: string = "wss://ws-feed-public.sandbox.exchange.coinbase.com";

    const subscribeMessage = {
        "type": "subscribe",
        "channels": CHANNELS,
        "product_ids": SUPPORTED_PRODUCTS
    };
    
    // useEffect(() => {
    //     console.log("priceData is now: ")
    //     console.log(priceData);
    // }, [priceData]);

    function handleSubscriptions(data) {
        const currencyList = data.channels[0]["product_ids"];
        console.log("subscribedList ", currencyList);
        setSubscribedList(currencyList);
        setSelectedCurrency(currencyList[0]);
    }

    function updateSubscription(data) {

    }

    function handleSnapshot(data) {
        console.log(data)
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

    function handleL2Update(data) {
        const productId: string = data.product_id;
        setPriceData((prevValue) => {
            const currentBids = {...prevValue[productId].bids};
            const currentAsks = {...prevValue[productId].asks};

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

        ws.onopen = () => {
            ws.send(JSON.stringify(subscribeMessage));
            console.log('WebSocket connection opened.');
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
            />

            <MatchView matchInfo={matchInfo} />

            {(selectedCurrency !== "" && priceData[selectedCurrency]?.bids) ? (
                <PriceView bids={priceData[selectedCurrency].bids} asks={priceData[selectedCurrency].asks} />
            ): null}
        </div>
    )
};

export default Coinbase;