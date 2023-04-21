import fs from 'fs';
import { xml2js } from "xml-js";
import { parse } from 'csv-parse/sync';
import Weight from '../models/Weight.js';
import Caravan from '../models/Caravan.js'
import ManualWeighing from '../models/ManualWeighing.js';
import formatDate from '../helpers/formatDate.js';
import {
    calculateTotalPrognostic,
    calculateWeeklyPrognostic,
    calculateWeeklyAverage,
    calculate10DaysAverage,
    newCalculateTotalPrognostic
} from '../helpers/calculatePrognostic.js';

const showHomepage = (req, res) => {
    res.render("index", {
        page: 'Inicio'
    });
};

const uploadWeightForm = (req, res) => {
    res.render("uploads/uploadWeight", {
        page: 'Subir Pesadas'
    });
};

const uploadManualWeightForm = (req, res) => {
    res.render("uploads/uploadManualWeight", {
        page: 'Subir Pesadas Manuales'
    });
};

const uploadWeight = async (req, res) => {

    const file = fs.readFileSync('./uploads/pesadas.xml');

    const conversion = xml2js( file, { compact: true } );

    const tableCaravans = conversion.Workbook.Worksheet[0].Table.Row;
    const tableWeight = conversion.Workbook.Worksheet[1].Table.Row;

    // const caravans = tableCaravans[1].Cell[1];

    const caravans = tableCaravans.map( cell => {

        if( cell === tableCaravans[0] ) {
            return
        }

        const element = {
            caravan: ''
        }

        element.caravan = cell.Cell[0].Data._text

        return element;
    });

    const cleanCaravans = caravans.filter( obj => obj?.caravan !== undefined );

    cleanCaravans.forEach( async element => {
        const caravan = new Caravan(element);

        const found = await Caravan.findOne({ caravan: caravan.caravan });

        if(!found) {
            caravan.save();
        }
    });

    const weights = tableWeight.map( cell => {

        if( cell === tableWeight[0] ) {
            return;
        }

        const element = {
            date: '',
            caravan: '',
            weight: ''
        }

        const time = cell.Cell[1].Data._text.split(":")

        const date = cell.Cell[0].Data._text.split("/");

        element.date = new Date(date[2], date[1] - 1, date[0], time[0], time[1], 0);
        element.caravan = cell.Cell[2].Data._text;
        element.weight = cell.Cell[6].Data._text;

        return element;
    });

    const cleanWeights = weights.filter( obj => obj?.caravan !== undefined );

    cleanWeights.forEach( async element => {
        const weight = new Weight(element);

        const found = await Weight.findOne({ caravan: weight.caravan, weight: weight.weight, date: weight.date });

        if(!found) {
            weight.save();
        }
    });

    res.render("index", {
        page: 'Inicio'
    });
};

const uploadManualWeight = async (req, res) => {

    const file = fs.readFileSync('./uploads/pesadas.csv');

    const conversion = parse(file, {
        columns: true,
        skip_empty_lines: true
    });
    
    conversion.forEach( async pesada => {
        const data = Object.values(pesada)[0].split(';')

        const caravan = data[0].slice(-6);
        const date = data[2].split('/');
        const time = data[3].split(':');
        const peso = data[4];

        if(peso !== '') {
            
            const obj = {
                caravan: caravan,
                weight: peso,
                date: new Date(date[2], date[1]-1, date[0], time[0], time[1], time[2] )
            };

            const manualWeight = new ManualWeighing(obj);

            const found = await ManualWeighing.findOne({
                caravan: manualWeight.caravan,
                weight: manualWeight.weight,
                date: manualWeight.date
            });

            if(!found) {
                manualWeight.save();
            }
        }

    });


    res.render("index", {
        page: 'Inicio'
    });
};

const showTable = async (req, res) => {

    const milisegundosDia = 24 * 60 * 60 * 1000;

    let caravans = [];

    const fechaPromedio = new Date(2022,7,16);
    const fechaPronostico = new Date(2022,7,16 + 8);

    let fechas = [];
    let formatedDates = [];
    
    for( let i = 1; i <= 7 ; i++ ) {
        fechas.push( new Date(2022,7,16 + i) );
    }

    formatedDates = fechas.map( fecha => {
        return formatDate(fecha);
    });

    const caravan1 = await Caravan.findOne({ caravan: '713484' });
    const caravan2 = await Caravan.findOne({ caravan: '713480' });
    const caravan3 = await Caravan.findOne({ caravan: '713491' });
    const caravan4 = await Caravan.findOne({ caravan: '118914' });
    const caravan5 = await Caravan.findOne({ caravan: '713461' });

    caravans.push(caravan1);
    caravans.push(caravan2);
    caravans.push(caravan3);
    caravans.push(caravan4);
    caravans.push(caravan5);
    
    const cleanCaravans = caravans.map( async caravan => {

        const obj = {
            caravana: '',
            pesadas: [],
            pesoPromedioAnterior: '',
            pesoPronostico: ''
        };

        const manualWeights = await ManualWeighing.findOne({ caravan: caravan.caravan });

        const pesoPromedioAnterior = parseInt(manualWeights.weight);


        const weights = await Weight.find({ caravan: caravan.caravan }).sort('-date').limit(14);

        const orderWeights = weights.sort((a, b) => a.date.getTime() - b.date.getTime());


        const cleanWeightsArray = fechas.map( fecha => {

            const cleanWeights = orderWeights.map( weight => {

                const date = weight.date.getTime()
    
                if( date !== fecha.getTime() ) {
                    return;
                }
    
                if( weight.weight <= (pesoPromedioAnterior * 1.05) && weight.weight >= (pesoPromedioAnterior * 0.95) ) {

                    return weight;
    
                } else {
                    return {
                        msg: 'Mal Pesada'
                    };
                }

            });

            const cleanWeightsFiltrados = cleanWeights.filter( cleanWeight => cleanWeight !== undefined );

            if( cleanWeightsFiltrados.length === 0 ) {
                cleanWeightsFiltrados.push({
                    msg: '---'
                });
            }

            return cleanWeightsFiltrados;

        });

        obj.caravana = caravan.caravan;
        obj.pesadas = cleanWeightsArray;
        obj.pesoPromedioAnterior = pesoPromedioAnterior;
        obj.pesoPronostico = calculateWeeklyPrognostic( pesoPromedioAnterior, cleanWeightsArray );

        return obj;
    });

    const arrayCaravans = await Promise.all(cleanCaravans);

    res.render("tables/weightTable", {
        page: 'Caravanas',
        caravans: arrayCaravans,
        dates: formatedDates
    });
};

const showNewTable = async (req, res) => {

    const msDia = 24 * 60 * 60 * 1000;
    const msSemana = 7 * 24 * 60 * 60 * 1000;

    const caravans = ['118935','118939','118976','118914','118966','713402','713423','713468','713495','713453'];

    let diasDePronostico = [];

    let fechaInicio = new Date(2022, 7, 8);
    let fechaFin = new Date(2022, 8, 20);

    let finSemana1 = new Date(2022, 7, 15);
    let finSemana2 = new Date(2022, 7, 22);
    let finSemana3 = new Date(2022, 7, 29);
    let finSemana4 = new Date(2022, 8, 5);
    let finSemana5 = new Date(2022, 8, 12);
    let finSemana6 = new Date(2022, 8, 19);

    diasDePronostico.push(finSemana1);
    diasDePronostico.push(finSemana2);
    diasDePronostico.push(finSemana3);
    diasDePronostico.push(finSemana4);
    diasDePronostico.push(finSemana5);
    diasDePronostico.push(finSemana6);

    const cleanCaravans = caravans.map( async caravan => {

        const obj = {
            caravana: caravan,
            pronosticos: [],
            pronosticoTotal: ''
        };

        const manualWeights = await ManualWeighing.findOne({ caravan }).sort('date');

        const pesoInicio = parseInt(manualWeights.weight);

        const weights = await Weight
            .find({
                caravan,
                date: {
                    $gte: fechaInicio,
                    $lt: fechaFin
                }
            })
            .sort('date')
        ;

        let prognostics = [pesoInicio];
        let totalWeights = [];

        diasDePronostico.forEach( dia => {

            let prognostic;
            let weightsArray = [];
            let diaInicioMs = dia.getTime() - msSemana;

            let pesoPromedioAnterior = prognostics[prognostics.length - 1];

            for( let i = 0; i <= 6; i++ ) {

                let fechaMs = diaInicioMs + (i * msDia);

                const weights1Dia = weights.map( weight => {

                    const dateWeightMs = weight.date.getTime();
        
                    if( dateWeightMs !==  fechaMs) {
                        return;
                    }
        
                    if( weight.weight <= (pesoPromedioAnterior * 1.1) && weight.weight >= (pesoPromedioAnterior * 0.9) ) {
    
                        return weight;
        
                    } else {
                        return {
                            msg: 'Mal Pesada'
                        };
                    }
    
                });
    
                const cleanWeights1Dia = weights1Dia.filter( weight => weight !== undefined );
    
                if( cleanWeights1Dia.length === 0 ) {
                    cleanWeights1Dia.push({
                        msg: '---'
                    });
                }

                weightsArray.push(cleanWeights1Dia);
                totalWeights.push(cleanWeights1Dia);

            }

            prognostic = calculateWeeklyPrognostic(pesoPromedioAnterior, weightsArray);
            prognostics.push(prognostic);

        });

        let totalPrognostic = calculateTotalPrognostic(prognostics, totalWeights);

        prognostics.shift();

        obj.pronosticos = prognostics;
        obj.pronosticoTotal = totalPrognostic;

        return obj;
    });

    const arrayCaravans = await Promise.all(cleanCaravans);

    res.render("tables/newWeightTable", {
        page: 'Caravanas',
        caravans: arrayCaravans
    });
}

const showAverageTable = async (req, res) => {

    const msDia = 24 * 60 * 60 * 1000;
    const msSemana = 7 * 24 * 60 * 60 * 1000;

    const caravans = ['118935','118939','118976','118914','118966','713402','713423','713468','713495','713453'];
    const caravans2 = ['118914'];

    let diasDePronostico = [];

    let fechaInicio = new Date(2022, 7, 16);
    let fechaFin = new Date(2022, 8, 28);

    let finSemana1 = new Date(2022, 7, 23);
    let finSemana2 = new Date(2022, 7, 30);
    let finSemana3 = new Date(2022, 8, 6);
    let finSemana4 = new Date(2022, 8, 13);
    let finSemana5 = new Date(2022, 8, 20);
    let finSemana6 = new Date(2022, 8, 27);

    diasDePronostico.push(finSemana1);
    diasDePronostico.push(finSemana2);
    diasDePronostico.push(finSemana3);
    diasDePronostico.push(finSemana4);
    diasDePronostico.push(finSemana5);
    diasDePronostico.push(finSemana6);

    const cleanCaravans = caravans.map( async caravan => {

        const obj = {
            caravana: caravan,
            promedios: [],
            pronosticoTotal: ''
        };

        const manualWeights = await ManualWeighing.findOne({ caravan });

        const pesoInicio = parseInt(manualWeights.weight);

        const weights = await Weight
            .find({
                caravan,
                date: {
                    $gte: fechaInicio,
                    $lt: fechaFin
                }
            })
            .sort('date')
        ;

        let promedios = [pesoInicio];
        let totalWeights = [];

        diasDePronostico.forEach( dia => {

            let promedio;
            let weightsArray = [];
            let diaInicioMs = dia.getTime() - msSemana;

            let pesoPromedioAnterior = promedios[promedios.length - 1];

            for( let i = 0; i <= 6; i++ ) {

                let fechaMs = diaInicioMs + (i * msDia);

                const weights1Dia = weights.map( weight => {

                    const dateWeightMs = weight.date.getTime();
        
                    if( dateWeightMs !==  fechaMs) {
                        return;
                    }
        

                    if( weight.weight <= (pesoPromedioAnterior * 1.15) && weight.weight >= (pesoPromedioAnterior * 0.85) ) {
    
                        return weight;
        
                    } else {
                        return {
                            msg: 'Mal Pesada'
                        };
                    }
    
                });
    
                const cleanWeights1Dia = weights1Dia.filter( weight => weight !== undefined );
    
                if( cleanWeights1Dia.length === 0 ) {
                    cleanWeights1Dia.push({
                        msg: '---'
                    });
                }

                weightsArray.push(cleanWeights1Dia);
                totalWeights.push(cleanWeights1Dia);

            }

            promedio = calculateWeeklyAverage(weightsArray);

            if( promedio === 0 ) {
                promedio = promedios[promedios.length - 1];
            }

            promedios.push(promedio);

        });

        let totalPrognostic = newCalculateTotalPrognostic(promedios);

        promedios.shift();

        obj.promedios = promedios;
        obj.pronosticoTotal = totalPrognostic;

        return obj;
    });

    const arrayCaravans = await Promise.all(cleanCaravans);

    res.render("tables/averageTable", {
        page: 'Caravanas',
        caravans: arrayCaravans
    });

};

// const showAverageTable10 = async (req, res) => {

//     const msDia = 24 * 60 * 60 * 1000;
//     const msSemana = 7 * 24 * 60 * 60 * 1000;

//     const caravans = ['118935','118939','118976','118914','118966', '118902', '713402','713423','713468','713495','713453', '713032', '713173', '713434', '713453', '119018', '119018', '119028', '118902', '118914', '118939', '118977', '118993'];
//     const caravans2 = ['118914'];

//     let diasDePronostico = [];

//     let fechaInicio = new Date(2022, 7, 19);
//     let fechaFin = new Date(2022, 8, 29);

//     let finSemana1 = new Date(2022, 7, 29);
//     let finSemana2 = new Date(2022, 8, 8);
//     let finSemana3 = new Date(2022, 8, 18);
//     let finSemana4 = new Date(2022, 8, 28);

//     diasDePronostico.push(finSemana1);
//     diasDePronostico.push(finSemana2);
//     diasDePronostico.push(finSemana3);
//     diasDePronostico.push(finSemana4);

//     const cleanCaravans = caravans.map( async caravan => {

//         const obj = {
//             caravana: caravan,
//             promedios: [],
//             pronosticoTotal: ''
//         };

//         const manualWeights = await ManualWeighing.findOne({ caravan });

//         const pesoInicio = parseInt(manualWeights.weight);

//         const weights = await Weight
//             .find({
//                 caravan,
//                 date: {
//                     $gte: fechaInicio,
//                     $lt: fechaFin
//                 }
//             })
//             .sort('date')
//         ;

//         let promedios = [pesoInicio];
//         let totalWeights = [];

//         diasDePronostico.forEach( dia => {

//             let promedio;
//             let weightsArray = [];
//             let diaInicioMs = dia.getTime() - (msDia * 10);

//             let pesoPromedioAnterior = promedios[promedios.length - 1];

//             for( let i = 0; i <= 9; i++ ) {

//                 let fechaMs = diaInicioMs + (i * msDia);

//                 const weights1Dia = weights.map( weight => {

//                     const dateWeightMs = weight.date.getTime();
        
//                     if( dateWeightMs !==  fechaMs) {
//                         return;
//                     }
        

//                     if( weight.weight <= (pesoPromedioAnterior * 1.15) && weight.weight >= (pesoPromedioAnterior * 0.85) ) {

//                         return weight;
        
//                     } else {
//                         return {
//                             msg: 'Mal Pesada'
//                         };
//                     }
    
//                 });
    
//                 const cleanWeights1Dia = weights1Dia.filter( weight => weight !== undefined );
    
//                 if( cleanWeights1Dia.length === 0 ) {
//                     cleanWeights1Dia.push({
//                         msg: '---'
//                     });
//                 }

//                 weightsArray.push(cleanWeights1Dia);
//                 totalWeights.push(cleanWeights1Dia);

//             }

//             promedio = calculate10DaysAverage(weightsArray);

//             if( promedio === 0 ) {
//                 promedio = promedios[promedios.length - 1];
//             }

//             promedios.push(promedio);

//         });

//         let totalPrognostic = newCalculateTotalPrognostic(promedios);

//         promedios.shift();

//         obj.promedios = promedios;
//         obj.pronosticoTotal = totalPrognostic;

//         return obj;
//     });

//     const arrayCaravans = await Promise.all(cleanCaravans);

//     res.render("tables/averageTable10", {
//         page: 'Caravanas',
//         caravans: arrayCaravans
//     });

// };

const showAverageTable10 = async (req, res) => {

    const msDia = 24 * 60 * 60 * 1000;
    const ms10Dias = 10 * msDia;
    const ms40Dias = 4 * ms10Dias;

    const caravans = await Caravan.find().sort({caravan : 1});

    const lastWeighing = await Weight.find().sort({date : -1}).limit(1);

    const maxDate = lastWeighing[0].date;

    const maxDateMs = maxDate.getTime();
    const minDateMs = maxDateMs - ms40Dias;

    let dates = [new Date(minDateMs - ms10Dias * 3)];
    for( let i = 1; i <= 6; i++ ) {
        dates.push(new Date((minDateMs - ms10Dias * 3) + ms10Dias * i));
    }

    let formatedDates = [];

    dates.forEach( date => {

        const date1 = formatDate(date);
        const date2 = formatDate(new Date(date.getTime() + ms10Dias));

        const formatedDate = `${date1} - ${date2}`;

        formatedDates.push(formatedDate);
    });


    const cleanCaravans = caravans.map( async caravan => {

        const manualWeights = await ManualWeighing.find({ caravan: caravan.caravan }).sort({date : -1});

        if(manualWeights[0]) {

            const lastWeighings = manualWeights.map( weighing => {
                if( weighing.date.getTime() < minDateMs ) {
                    return weighing;
                }
            });
            const cleanLastWeighings = lastWeighings.filter( weighing => weighing !== undefined );

            if(cleanLastWeighings[0]) {
                
                const lastWeighing = cleanLastWeighings[0];

                const lastWeighingDateMs = lastWeighing.date.getTime();
    
                let dateMs = minDateMs;
                let n = 0;
    
                while( lastWeighingDateMs < dateMs) {
                    dateMs -= ms10Dias;
                    n++;
                }
    
                const startDate = new Date(dateMs);
    
                const weights = await Weight
                    .find({
                        caravan: caravan.caravan,
                        date: {
                            $gte: startDate,
                            $lt: maxDate
                        }
                    })
                    .sort('date')
                ;
    
    
                let promedios = [parseInt(lastWeighing.weight)];
    
                while( dateMs < maxDateMs ) {
    
                    let weights10dias = [];
    
                    let pesoPromedioAnterior = promedios[promedios.length - 1];
    
                    weights.forEach( weight => {
    
                        const ms = weight.date.getTime();
    
                        if( ms > dateMs && ms <= (dateMs + ms10Dias) ) {
                            const peso = parseInt(weight.weight);
    
                            if( peso>=(pesoPromedioAnterior*0.85) && peso<=(pesoPromedioAnterior*1.15) ) {
                                weights10dias.push(peso);
                            }
                        }
    
                    });
    
                    let promedio = null;

                    manualWeights.forEach(manualWeight => {
                        
                        const ms = manualWeight.date.getTime();

                        if( ms > dateMs && ms <= (dateMs + ms10Dias) ) {
                            promedio = parseInt(manualWeight.weight);
                        }
                    });

                    if(!promedio) {
                        promedio = calculate10DaysAverage(weights10dias);
    
                        if( promedio === 0 ) {
                            promedio = promedios[promedios.length - 1];
                        }
                    }

                    promedios.push(promedio);
    
                    dateMs += ms10Dias;
                }
    
                const totalPrognostic = newCalculateTotalPrognostic(promedios);
    
                const obj = {
                    caravana: caravan.caravan,
                    promedios: promedios.slice(-7),
                    pronosticoTotal: totalPrognostic
                };
    
                return obj;
            }

        }

    });

    const arrayCaravans = await Promise.all(cleanCaravans);

    const cleanArrayCaravans = arrayCaravans.filter( caravan => caravan !== undefined );

    res.render("tables/averageTable10", {
        page: 'Caravanas',
        dates: formatedDates,
        caravans: cleanArrayCaravans
    });

};


const fillManualWeight = async (req, res) => {

    const pesadasManuales = [
        {
            caravan: '118935',
            weight: '250',
            date: new Date(2022, 8, 10)
        },
        {
            caravan: '118935',
            weight: '257',
            date: new Date(2022, 9, 20)
        },
    ];

    pesadasManuales.forEach( element => {
        const caravana = new ManualWeighing(element);
        caravana.save();
    });

    res.send('Pesadas manuales cargadas');
};



export {
    showHomepage,
    uploadWeightForm,
    uploadWeight,
    uploadManualWeightForm,
    uploadManualWeight,
    showTable,
    showNewTable,
    showAverageTable,
    showAverageTable10,
    fillManualWeight
};