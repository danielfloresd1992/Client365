'use client';
import { useState, useEffect } from 'react';



export default function InputBorderBlue({
    textLabel = '',
    type = 'text',
    register = null,
    name,
    childSelect = [],
    important = true,
    eventChengue = null,
    disable = false,
    value = null,
    min = 0,
    max = 100,
    step = 0.1,
    disableLabelText = false
}) {

    const [valueState, setValueState] = useState();

    useEffect(() => {
        setValueState(value ? value : null);
    }, [value]);


    const printInput = () => {
        if (type === 'select') {
            return (
                <select
                    required={important ? true : true}
                    className='__input'
                    {...(register ? register(name) : {})}
                    defaultValue={''}
                    value={valueState}
                    disabled={disable}
                    onChange={e => {
                        setValueState(e.target.value);
                        eventChengue ? eventChengue(e.target.value) : null;
                    }}
                >
                    <option value='' disabled={true}>--Selecione--</option>
                    {
                        Array.isArray(childSelect) && childSelect.length > 0 ?
                            childSelect.map((option, index) => (
                                <option className='w-full' value={option.value} key={index}>{option.text || option.value}</option>
                            ))
                            :
                            null
                    }
                </select>
            );

        }//box-shadow: 
        if (type === 'range') {
            return (
                <input
                    type={type}
                    className='__input'
                    value={valueState ? valueState : false}
                    disabled={disable}
                    min={min}
                    max={max}
                    step={step}
                    {...(register ? register(name) : {})}
                    onChange={e => {
                        setValueState(e.target.value);
                        eventChengue ? eventChengue(e.target.value) : null;
                    }}
                />
            )
        }
        if (type === 'checkbox') {
            return (
                <input
                    type={type}
                    className='__input'
                    checked={valueState ? valueState : false}
                    disabled={disable}
                    {...(register ? register(name) : {})}
                    onChange={e => {
                        setValueState(e.target.checked);
                        eventChengue ? eventChengue(e.target.checked) : null;
                    }}
                />
            )
        } ''
        if (type === 'toogle') {
            return (
                <div className='relative bg-white w-10 h-5 rounded-full cursor-pointer flex items-center'
                    style={{
                        boxShadow: 'inset -1px -1px 2px 0px #838383'
                    }}
                    onClick={() => {
                        eventChengue(!valueState);
                    }
                    }
                >
                    <div className={`absolute w-[22px] h-[22px] rounded-full bg-[#0a2657] ${valueState ? 'right-[0]' : 'left-[0]'}`}
                        style={{
                            backgroundColor: valueState ? 'green' : 'red'
                        }}
                    >

                    </div>
                </div >
            )
        }
        else {
            return (
                <input
                    type={type}
                    required={important ? true : true}
                    className='__input'
                    value={valueState ? valueState : ''}
                    disabled={disable}
                    {...(register ? register(name) : {})}
                    min={min}
                    max={max}
                    onChange={e => {
                        setValueState(e.target.value);
                        eventChengue ? eventChengue(e.target.value) : null;
                    }}
                />
            );
        }
    }

    return (
        <label className='__width-complete __label'
            style={{ outline: 'none' }}
        >
            {
                disableLabelText ?
                    null
                    :
                    <p
                        className='form-label-p'
                        style={type === 'checkbox' ? { textAlign: 'center' } : null}
                    >{textLabel} {important ? <b style={{ color: 'red' }}>*</b> : null}</p>
            }
            {
                printInput()
            }
        </label>
    );
}