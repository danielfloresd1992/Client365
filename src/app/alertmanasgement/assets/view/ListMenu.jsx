'use client';
import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { getMenuAll, deleteMenu } from '../model/menu.model.js'
import { setConfigModal } from '@/store/slices/globalModal.js';
import categoryArr from '../model/category.js';




function ListMenu({ 
        setMenu,
        resetNoveltie, 
        modal, 
        newMENU, 
        resetAddManuState 
    }){

    const [ arrayMenuAll, setArrayMenuAll ] = useState([]);
    const [ category, setCategory] = useState('all');
    const categoryRef = useRef(null);
    const dispatch = useDispatch();

    useEffect(() => {
        getMenuAll(category, (err, { menuList, categoryList } ) => {
            categoryRef.current = categoryList;
            setArrayMenuAll([...menuList]);
            
        });
    }, [ category, newMENU ]);

    useEffect(() => {
        if(Boolean(newMENU)) {
            setArrayMenuAll([...arrayMenuAll, newMENU]);
            resetAddManuState();
        }

    }, [ newMENU ])
    
    
    const deleteMenuAllArray = id => {
        const newArray = arrayMenuAll.filter( menu => id !== menu._id );
        setArrayMenuAll(newArray);
        resetNoveltie();
    };


    const listMenuHtml = arrayMenuAll.map((item, index)=> (
        <div 
            className='__flexRowFlex bdGray __border-ra-5 __width-complete __midPadding' 
            idmenu={ item._id } 
            key={ `${index}_${item._id}` }
            style={
                item.rulesForBonus.worth > 0 && item.rulesForBonus.amulative ?
                {
                    outline: '2px solid #2bcb00'
                }
                : 
                {
                    border: 'none'
                }
            }
        >
            <h4 
                className='__width-complete __pointer' 
                id='selectMenu-02'
                onClick={() => setMenu(item._id) }
            >
                { item.es }
            </h4>
            <p className='__width-90'>{ item.en }</p>
      
            <button 
                className='__center_center __pointer'
                style={{
                    width: '30px',
                    border: '1px solid #000'
                }}
                id='deleted-menu10'
                onClick={
                    () => {
                        dispatch(setConfigModal({
                            modalOpen: true,
                            title: '¿Seguro que quieres eliminar este elemeto de la lista?',
                            description: '',
                            isCallback: () => {
                                deleteMenu(item._id, (err, response) => {
                                    if(err){
                                        let text;
                                        if(err.response?.status === 401){ 
                                            text = 'Usuario no autenticado.';
                                        }
                                        else if(err.response?.status === 403){
                                            text = 'Usuario no autorizado.';
                                        }
                                        else{
                                            text = 'Ha ocurrido un error.';
                                        }
                                        dispatch(setConfigModal({
                                            modalOpen: true,
                                            title: 'Error',
                                            description: text,
                                            isCallback: null,
                                            type: 'error'
                                        }));
                                    }
                                    else{
                                        dispatch(setConfigModal({
                                            modalOpen: true,
                                            title: 'Eliminado',
                                            description: 'El elemento fue eliminado de la lista.',
                                            isCallback: null,
                                            type: 'successfull'
                                        }));
                                        deleteMenuAllArray(item._id);
                                    }
                                });
                            },
                            type: 'warning'
                        }));
                    }
                }
            >
                <img 
                    className='__never-pointer'
                    src={ `/ico/delete/delete.svg` } 
                    style={{
                        width: '30px',
                    }}
                />
            </button>       
        </div>
    ));




    return(
        <>    
            <div 
                className='border10 contentStatic __padding1rem __width-mid scrollthemeY __border-smoothed bgWhite __flexRowFlex __oneGap'
                style={{ alignContent: 'flex-start' }}
            >
                <div className='__flex-between __width-complete'>
                    <div className='__center_center __midGap'>
                        <p>cantidad de alertas creadas:</p>
                        <p className='menu-length'>{ arrayMenuAll.length }</p>
                    </div>
                        
                    <label className='__label __width-mid'>
                        <p>Selecione la categoria de la alerta</p>
                        <select 
                            className='__input'
                            onChange={ e => setCategory( e.target.value ) }
                            defaultValue='--Selecione--'
                        >
                            <option value='--Selecione--' disabled={ true }>--Selecione--</option>
                            <option value="all">Todos</option>
                            {
                                categoryArr.map((item, index) => (
                                    item.title === '' ?
                                    <option value='sin categoria' key={ `${index }_item.value`}>sin categoria</option>
                                    :
                                    <option value={ item.value } key={ index }>{ item.text }</option>
                                ))
                            }
                        </select>
                    </label>
                    
                </div>
                <div className='__flexRowFlex __midGap' id='listMenu'>
                    {
                        listMenuHtml
                    }
                </div>
            </div>
        </>
    )
}


export { ListMenu }