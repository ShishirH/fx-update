import {MatchData} from "@/app/[...catchAll]/utils";

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        width: '900px',
        maxHeight: '400px',
        height: '400px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
    },
    matchEntry: {
        display: 'flex',
        gap: '10px'
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
            {matchInfo && matchInfo.length > 0 ? (
                <div>
                    {matchInfo.map((info, index) => (
                        <div style={styles.matchEntry} key={index}>
                            <p> { info.timestamp } </p>
                            <p> { info.productId } </p>
                            <p> { info.size } </p>
                            <p> { info.price } </p>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

export default MatchView;