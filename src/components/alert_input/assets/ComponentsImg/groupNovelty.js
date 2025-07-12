const groupedNewsByEstablishment = subjectOfEstablishmentNews => {
 
    if(!subjectOfEstablishmentNews) return;
    
        const newObject = { 
            data: {},
            dataEstablishment: subjectOfEstablishmentNews.dataEstablishment
        };
        
        for(let j = 0; j < subjectOfEstablishmentNews.data.length; j++){

            const title = subjectOfEstablishmentNews.data[j].title;


            if(newObject.data[title]){
                
                newObject.data[title] = {
                    ...newObject.data[title],
                    count:  newObject.data[title].count + 1
                };
                
            }
            else{
                newObject.data[title] = {
                    title: title,
                    ignored: 0,
                    approved: 0,
                    disapproved: 0,
                    count: 1                    
                };
            }
        }
  
    return newObject;
};

export default groupedNewsByEstablishment;