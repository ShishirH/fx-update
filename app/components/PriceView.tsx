interface PriceViewProps {
    bids: { [price: string]: number };
    asks: { [price: string]: number };
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        width: "400px",
        maxHeight: "400px",
        minHeight: "400px",
        overflowY: "auto",
        border: '1px solid #C2DEA2',
    }
}

const PriceView: React.FC<PriceViewProps> = (props) => {


    return (
        <div style={styles.container}>
            <h3> Price View </h3>
            <div>
                <p>Bids</p>
                {Object.entries(props.bids).map(([price, value]) => (
                    <li key={price}> {price}: {value} </li>
                ))}
            </div>
            <div>
                <p>Asks</p>
                {Object.entries(props.asks).map(([price, value]) => (
                    <li key={price}> {price}: {value} </li>
                ))}
            </div>
        </div>
    )
}

export default PriceView;