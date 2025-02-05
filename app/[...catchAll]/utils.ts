export const SUPPORTED_PRODUCTS: string[] = [
    "BTC-USD",
    "USDT-USD",
    // "LTC-USD"
    // "ETH-USD"
]

export const CHANNELS: string[] = [
    "level2_batch",
    "matches"
]

export interface ProductToOrderBook {
    [productId: string]: {
        bids: { [price: string]: number };
        asks: { [price: string]: number };
    }
}

export interface MatchData {
    productId: string;
    price: string;
    side: string;
    timestamp: string;
    size: string;
}
