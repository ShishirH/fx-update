interface StickySideButtonContainerProps {
    buttonList: string[],
    subscribedList: string[],
    onClick?: (buttonName: string) => void,
    handleSubscription?: (buttonName: string) => void,
}


const styles: { [key: string]: React.CSSProperties } = {
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

const StickySideButtonContainer: React.FC<StickySideButtonContainerProps> = ({buttonList, subscribedList, onClick, handleSubscription}) => {
    return (
        <div style={styles.stickyButtonContainer}>
            {buttonList.map((buttonName) => {
                return (
                    <div style={styles.stickyButton} key={buttonName}>
                        <button
                            style={styles.buttonName}
                            onClick={() => onClick ? onClick(buttonName) : null}>
                            {buttonName}
                        </button>

                        <button
                            style={styles.subscribeButton}
                            onClick={() => handleSubscription ? handleSubscription(buttonName) : null}>
                            {subscribedList.includes(buttonName) ? "Unsubscribe" : "Subscribe"}
                        </button>
                    </div>
                )
            })}
        </div>
    )
}

export default StickySideButtonContainer;