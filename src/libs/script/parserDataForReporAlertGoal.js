'use client';

export default function calculateGoalData(data, schedules, isDaylightSavingTimeBoolean){
    if(!data || !schedules) return;
  
    const result = {};
    const arr = data.data;
    const interShift = isDaylightSavingTimeBoolean ? '18:00:00' : '17:00:00';
    const date = new Date();
    const dayNow = date.getDay();
    

    for(let i = 0; i < arr.length; i++){

        let in_range_boolean = false;

        if(arr[i].line === 'P') continue;
        if(arr[i].failed) continue;
        
        const selectedTime = schedules.filter(schedule => schedule.idLocal === arr[i].establishment._id) ;
        if(selectedTime.length < 1) continue;

        const dayMonitoring = selectedTime[0].dayMonitoring.filter(daySchedule => daySchedule.dayMonitoring ===  dayNow);

        if(dayMonitoring.length < 1) continue;

       

        for(let j = 0; j < dayMonitoring.length; j++ ){

            let hour_start = dayMonitoring[j].hours.start.split(':')[0];
            let hourt_end = interShift.split(':')[0];

            if(data.shift === 'diurno'){
                if(date.getHours() >= Number(hour_start)  && date.getHours() < Number(hourt_end)) in_range_boolean = true;
            }
            else if(data.shift === 'nocturno'){
                if(date.getHours() >= hourt_end  && date.getHours() <= 23) in_range_boolean = true;
            }

        }

        if( !in_range_boolean ) continue;

        let key = `line_${arr[i].line}`;
        if(result[key]){
            result[key].count = result[key].count + 1;
            result[key].total = result[key].total + arr[i].alert
        }
        else{
            result[key] = {
                count: 1,
                total: arr[i].alert
            }
        }
    }
    return result;
}