import calcularTotalHoras from '@/libs/calculateHours';

interface Hour {
    start: string;
    end: string;
}

interface Item {
    key: string;
    hours: Hour;
}

interface BoxHoursProps {
    arr: Item[];
    deleteHour: (key: string) => void;
}


export default function BoxHours({ arr, deleteHour }: BoxHoursProps): JSX.Element {


    return (
        <>
            {
                arr.map((item, index) => (
                    <div
                        key={index}
                        className='box-contain'
                        style={{
                            minHeight: `${calcularTotalHoras(item.hours.start, item.hours.end) * 25}px`,
                            position: 'relative',
                            width: '90%',
                            padding: '.3rem',
                            backgroundColor: '#b7b7b7',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '.3rem',
                            borderRadius: '4px',
                            justifyContent: 'center'
                        }}
                    >
                        <div className='contain-btn contain-btn--withText'
                            style={{
                                position: 'relative',
                                width: '100%',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                padding: '.5rem',
                                cursor: 'auto',
                                left: 0,
                                top: 0,
                                textAlign: 'start'
                            }}
                        >
                            <button
                                className='btn-invisivily'
                                onClick={() => {
                                    deleteHour(item.key);
                                }
                                }
                            >
                                <img
                                    style={{
                                        pointerEvents: 'none',
                                        width: '24px'
                                    }}
                                    className='filter-invert' src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB50lEQVR4nO2Z30rDMBSH46XDm4mIiOALzW627saHcJ3YernX2nRT/PM2Ui9szo0IR4qbxpGlSXuSoOQHuU2/b6Xd+aWMhYSEhPyZwGl+Bkm2wOFkh3pv7E06EOezMr4+Z7bgeZy/Q5Ijj/NHSgn8gp8v9/4glxDhV4tKAgV4YW86CRk8lQRK4EklVPBtJVTwQCGhA99UQgce2kggY1uQZFOdC/ysbFGBacEn2cJw72nFZCYxHG9Dkt+aXKjuTpj88rDaM8keGj9nlBLO4SklvMFTSHiHb/PwldFoxqP03jt8kzvBB2Modg/fXveOkPdT//AmEiv4F8awWjoS3AW8jsQ6vI4EdwmvktgEr5LgPuBlEnXwMgnuE/5bojfpVG+bolsPL0qU0cWzd/iVAPTTu2L/WAu+WkX3gMPJaO5d4FeTGlyijkQFX0YjkP1jO420SdVIiPCbxg4nUTapDRIyePAhodWk1iRU8OBSwqhJLSV04MGFRKOpsp8+8Si9sdHsjNJmJLbR7IxCMc97k0DCMuJcAi00KWcS+B+OVSC+SrQPtgynSqNmF7c5ndOQaDoSazW7mOJ8VCHRdp5HVbMjPaGWSFCVEZQ1OyvfCAQJ6iaFYrOzAS9KWPvENKwksqk1+JCQkBBmI5/G9M0wq45fBQAAAABJRU5ErkJggg=="
                                />
                            </button>
                        </div>
                        <p className='box-text'>desde: {item.hours.start}</p>
                        <p className='box-text'>hasta: {item.hours.end}</p>
                        <p className='box-text'>total: {Math.floor(calcularTotalHoras(item.hours.start, item.hours.end))} horas</p>
                    </div>
                ))
            }
        </>
    );
}