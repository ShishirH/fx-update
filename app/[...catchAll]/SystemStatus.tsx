interface SystemStatusProps {
    buttonList: string[]
}

const SystemStatus:React.FC<SystemStatusProps> = ({buttonList}) => {
    return (
        <div>
            <p>System status</p>
            {buttonList.map((buttonName) => {
                return (
                    <p key={buttonName}> {buttonName} </p>
                )
            })}
        </div>
    )
}

export default SystemStatus;