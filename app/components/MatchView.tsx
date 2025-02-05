import {MatchData} from "@/app/utils/utils";

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        width: '900px',
        maxHeight: '400px',
        height: '400px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
    },
    buyEntry: {
        display: 'flex',
        gap: '10px',
        color: 'green'
    },
    sellEntry: {
        display: 'flex',
        gap: '10px',
        color: 'red'
    },
    stickyButtonContainer: {
        position: 'absolute',
        top: '50%',
        left: '10%',
        border: '1px solid red',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        width: 'max-content',
    },
    stickyButton: {
        backgroundColor: 'gray',
        border: '1px solid gray',
        display: 'inline-flex',
        gap: '10px'
    },
    subscribeButton: {
        backgroundColor: '#C2DEA2',
    }
}

interface MatchViewProps {
    matchInfo: MatchData[]
}

const MatchView:React.FC<MatchViewProps> = ({matchInfo}) => {
    return (
        <div style={styles.container}>
            <h3> Match View </h3>
            {matchInfo && matchInfo.length > 0 ? (
                <div>
                    {matchInfo.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .slice(0, 100)
                        .map((info, index) => (
                            <div style={(info.side === "buy") ? styles.buyEntry : styles.sellEntry} key={index}>
                                <p> {info.timestamp} </p>
                                <p> {info.productId} </p>
                                <p> {info.size} </p>
                                <p> {info.price} </p>
                            </div>
                        ))}
                </div>
            ) : null}
        </div>
    )
}

export default MatchView;