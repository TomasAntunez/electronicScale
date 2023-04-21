
const calculateWeeklyPrognostic = ( pesoPronosticoAnterior, array) => {

    let sumatoriaXY = pesoPronosticoAnterior * 1 + pesoPronosticoAnterior * 2.5;
    let sumatoriaX = 1 + 2.5;
    let sumatoriay = pesoPronosticoAnterior * 2;
    let sumatoriaXcuadrado = 1 + Math.pow(2.5, 2);
    let n = 2;

    for( let i = 1; i <= 7; i++ ) {

        array[i-1].forEach( pesada => {
            if( pesada.msg ) {
                return;
            }

            sumatoriaXY += i * parseInt(pesada.weight);
            sumatoriaX += i;
            sumatoriay += parseInt(pesada.weight);
            sumatoriaXcuadrado += Math.pow(i, 2);

            n++;
        });

    }

    if( sumatoriaX === 1 ) {
        return pesoPronosticoAnterior;
    }

    let sumatoriaXalCuadrado = Math.pow(sumatoriaX, 2);

    let promedioX = sumatoriaX / n;
    let promedioY = sumatoriay / n;

    const b = ((n * sumatoriaXY) - (sumatoriaX * sumatoriay)) / ((n * sumatoriaXcuadrado) - sumatoriaXalCuadrado);

    const a = promedioY - (b * promedioX);

    const y = a + (b * 8);

    const result = Math.round(y * 100) / 100;

    return result;
};

const calculateTotalPrognostic = (pesosPronostico, array) => {

    let sumatoriaXY = 0;
    let sumatoriaX = 0;
    let sumatoriaY = 0;
    let sumatoriaXcuadrado = 0;
    let n = 0;


    for( let i = 0; i <= 6; i++ ) {

        sumatoriaXY += (1 + (i * 7)) * pesosPronostico[i];
        sumatoriaX += 1 + (i * 7);
        sumatoriaY += pesosPronostico[i];
        sumatoriaXcuadrado += Math.pow(1 + (i * 7), 2);
        
        n++;
    }

    for( let j = 1;  j <= array.length; j++) {

        array[j-1].forEach( pesada => {
            if( pesada.msg ) {
                return;
            }

            sumatoriaXY += j * parseInt(pesada.weight);
            sumatoriaX += j;
            sumatoriaY += parseInt(pesada.weight);
            sumatoriaXcuadrado += Math.pow(j, 2);

            n++;
        });

    }

    let sumatoriaXalCuadrado = Math.pow(sumatoriaX, 2);

    let promedioX = sumatoriaX / n;
    let promedioY = sumatoriaY / n;

    const b = ((n * sumatoriaXY) - (sumatoriaX * sumatoriaY)) / ((n * sumatoriaXcuadrado) - sumatoriaXalCuadrado);

    const a = promedioY - (b * promedioX);

    const y = a + (b * array.length);

    const result = Math.round(y * 100) / 100;

    return result;

};

const calculateWeeklyAverage = array => {

    let weights = [];

    array.forEach( dia => {
        dia.forEach( pesada => {

            if( pesada.msg ) {
                return
            }

            weights.push(pesada);

        });
    });

    const newArray = weights.map( actualWeight => {

        const pesoActual = parseInt(actualWeight.weight);

        const obj = {
            peso: pesoActual,
            count: 0
        };

        weights.forEach( weight => {

            const pesada = parseInt(weight.weight);
            // console.log(pesada)

            if( pesada >= (pesoActual * 0.95) && pesada <= (pesoActual * 1.05) ) {
                obj.count++;
            }
        });

        return obj;
    });

    if( newArray.length === 0 ) {
        return 0;
    }

    newArray.sort( (a, b) => a.count - b.count );

    let moreImportantWeight = newArray[ newArray.length - 1 ];

    let moreImportantWeights = newArray.filter( weight => weight.count === moreImportantWeight.count );

    let count = 0;
    let totalIW = 0;

    moreImportantWeights.forEach( weight => {
        totalIW += parseInt(weight.peso);
        count++;
    });

    let importantAverage = totalIW / count;


    let total = 0;
    let n = 0;

    newArray.forEach( weight => {

        let peso = parseInt(weight.peso);

        if( peso >= (importantAverage * 0.95) && peso <= (importantAverage * 1.05) ) {
            total += peso;
            n++;
        }
    });

    if( n === 0 ) {
        return importantAverage;
    }

    const average = Math.round((total / n) * 100) / 100;

    return average;

};

const calculate10DaysAverage = array => {

    const newArray = array.map( actualWeight => {

        const obj = {
            peso: actualWeight,
            count: 0
        };

        array.forEach( weight => {

            if( weight >= (actualWeight * 0.95) && weight <= (actualWeight * 1.05) ) {
                obj.count++;
            }
        });

        return obj;
    });

    if( newArray.length === 0 ) {
        return 0;
    }

    newArray.sort( (a, b) => a.count - b.count );

    let moreImportantWeight = newArray[ newArray.length - 1 ];

    let moreImportantWeights = newArray.filter( weight => weight.count === moreImportantWeight.count );

    let count = 0;
    let totalIW = 0;

    moreImportantWeights.forEach( weight => {
        totalIW += weight.peso;
        count++;
    });

    let importantAverage = totalIW / count;


    let total = 0;
    let n = 0;

    newArray.forEach( weight => {

        let peso = weight.peso;

        if( peso >= (importantAverage * 0.95) && peso <= (importantAverage * 1.05) ) {
            total += peso;
            n++;
        }
    });

    if( n === 0 ) {
        return importantAverage;
    }

    const average = Math.round((total / n) * 100) / 100;

    return average;

};

const newCalculateTotalPrognostic = promedios => {

    let sumatoriaXY = 0;
    let sumatoriaX = 0;
    let sumatoriaY = 0;
    let sumatoriaXcuadrado = 0;
    let sumatoriaXalCuadrado = 0;
    let n = 0;

    for( let i = 1; i <= promedios.length; i++ ) {
        sumatoriaXY += (i * promedios[i-1]);
        sumatoriaX += i;
        sumatoriaY += promedios[i-1];
        sumatoriaXcuadrado += Math.pow(i, 2);
        n++;
    }

    sumatoriaXalCuadrado = Math.pow(sumatoriaX, 2);

    let promedioX = sumatoriaX / n;
    let promedioY = sumatoriaY / n;

    const b = ((n * sumatoriaXY) - (sumatoriaX * sumatoriaY)) / ((n * sumatoriaXcuadrado) - sumatoriaXalCuadrado);

    const a = promedioY - (b * promedioX);

    const y = a + (b * (promedios.length - 1));

    const result = Math.round(y * 100) / 100;

    return result;
};


export {
    calculateWeeklyPrognostic,
    calculateTotalPrognostic,
    calculateWeeklyAverage,
    calculate10DaysAverage,
    newCalculateTotalPrognostic
}