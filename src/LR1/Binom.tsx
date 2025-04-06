import { useState } from "react"
import { Box, Button, Slider, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { useEffect } from 'react';
import jstat from 'jstat'
import binomial from '@stdlib/random-base-binomial'
import { BarChart } from '@mui/x-charts';
import { MuiFileInput } from 'mui-file-input'
import { read, utils, writeFile } from 'xlsx'
import { getRangeData } from '../utils/getRange';

export const Binom = () => {


    const [testFile, setTestFile] = useState(null)
    const [testMode, setTestMode] = useState(false)

    const [probability, setProbability] = useState<number | null>(null)
    const [sampleSize, setSampleSize] = useState<number | null>(null)
    const [numberOfTrials, setNumberOfTrials] = useState<number | null>(null)

    const [probabilityRange, setProbabilityRange] = useState<number[]>([0.2, 0.8])
    const [sampleSizeRange, setSampleSizeRange] = useState<number[]>([100, 200])
    const [numberOfTrialsRange, setNumberOfTrialsRange] = useState<number[]>([3, 7])

    const [tableData, setTableData] = useState<{ bin: number; frequency: number; relativeFrequency: number; theoreticalProbability: number; Fx: number }[]>([]);

    // Генерация вероятности
    const getProbability = () => {
        const randomNumber = jstat.uniform.sample(...probabilityRange)
        const roundedRandomNumber = randomNumber.toFixed(2)
        setProbability(roundedRandomNumber)
    }

    // Генерация объема выборки
    const getSampleSize = () => {
        const randomNumber = jstat.uniform.sample(...sampleSizeRange)
        const roundedRandomNumber = randomNumber.toFixed(0)
        setSampleSize(roundedRandomNumber)
    }

    // Генерация объема выборки
    const getNumberOfTrials = () => {
        const randomNumber = jstat.uniform.sample(...numberOfTrialsRange)
        const roundedRandomNumber = randomNumber.toFixed(0)
        setNumberOfTrials(roundedRandomNumber)
    }

    const [binomSample, setBinomSample] = useState<number[]>([]);



    // Расчет данных для таблицы
    const calculateTableData = () => {
        if (!sampleSize || !probability || binomSample.length === 0) return;

        // Уникальные значения (0 и 1)
        const uniqueValues = Array.from({ length: numberOfTrials }, (_, k) => k);

        // Расчет частот
        const frequencyMap = binomSample.reduce((acc, value) => {
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        // Расчет данных для таблицы
        const data = uniqueValues.map((bin) => {
            const frequency = frequencyMap[bin] || 0;
            const relativeFrequency = frequency / sampleSize;

            const theoreticalProbability = jstat.binomial.pdf(+bin, +numberOfTrials, +probability);
            const Fx = jstat.binomial.cdf(+bin, +numberOfTrials, +probability);

            return {
                bin,
                frequency,
                relativeFrequency,
                theoreticalProbability,
                Fx,
            };
        });

        setTableData(data);
    };

    // Обновление выборки Бернулли при изменении probability или sampleSize
    useEffect(() => {
        if (sampleSize && probability && numberOfTrials && !testMode) {
            const sample = Array.from({ length: +sampleSize }, (_, k) => binomial(+numberOfTrials, +probability));
            console.log(sample, sampleSize, probability, numberOfTrials)
            setBinomSample(sample);
        }
    }, [sampleSize, probability, numberOfTrials]);

    // Расчет данных для таблицы при изменении выборки
    useEffect(() => {
        calculateTableData();
    }, [binomSample]);

    //Обработка тестовых данных
    useEffect(() => {
        console.log(testFile)

        if (!testFile) return
        setTestMode(true)
        const reader = new FileReader();
        reader.onload = function (e) {
            const workbook = read(e.target.result);

            // Получение списка листов
            const sheetNames = workbook.SheetNames;
            console.log('Листы:', sheetNames);

            // Чтение данных из первого листа
            const firstSheetName = sheetNames.find(name => name === 'Биноминальное')
            const worksheet = workbook.Sheets[firstSheetName];


            const probabilityCell = 'D4'
            if (worksheet[probabilityCell]) {
                setProbability(+worksheet[probabilityCell].v.toFixed(2))
            }
            const numberOfTrialsCell = 'D5'
            if (worksheet[numberOfTrialsCell]) {
                setNumberOfTrials(+worksheet[numberOfTrialsCell].v.toFixed(0))
            }
            const sampleSizeCell = 'D6'
            if (worksheet[sampleSizeCell]) {
                setSampleSize(+worksheet[sampleSizeCell].v.toFixed(0))
            }

            const binomSample = getRangeData(worksheet, 'B9', 'B127')
            setBinomSample(binomSample)
        }

        reader.readAsArrayBuffer(testFile);
    }, [testFile])
    return (
        <Box display={'flex'} gap={"16px"} flexDirection={'column'}>
            <Box display={'flex'} gap={"16px"} alignItems={'center'}>
                <Typography variant='h6'>Протестировать</Typography>
                <MuiFileInput size='small' value={testFile} onChange={setTestFile} placeholder='Загрузите тестовый файл' inputProps={{ accept: '.xlsx' }} />
                {testMode && <Button onClick={() => {
                    setTestFile(null)
                    setTestMode(false)
                }}>Вернуть рабочий режим</Button>}
            </Box>

            <Box display={'flex'} gap={"16px"} flexDirection={'column'}>
                <Box display={'flex'} gap={"16px"} flexDirection={'column'} >
                    <Typography variant='h6'>Вероятность событий: {probability}</Typography>
                    <Slider
                        min={0.2}
                        max={0.8}
                        step={0.1}
                        disableSwap
                        getAriaLabel={() => 'Диапазон вероятностей'}
                        value={probabilityRange}
                        onChange={(e, newValue) => setProbabilityRange(newValue as number[])}
                        valueLabelDisplay="auto"

                    />
                    <Button onClick={getProbability} disabled={testMode}>Получить вероятность</Button>
                </Box>

                <Box display={'flex'} gap={"16px"} flexDirection={'column'}>
                    <Typography variant='h6'>Объем выборки: {sampleSize}</Typography>
                    <Slider
                        min={100}
                        max={200}
                        disableSwap
                        getAriaLabel={() => 'Диапазон объема'}
                        value={sampleSizeRange}
                        onChange={(e, newValue) => setSampleSizeRange(newValue as number[])}
                        valueLabelDisplay="auto"

                    />
                    <Button onClick={getSampleSize} disabled={testMode}>Получить объем</Button>
                </Box>

                <Box display={'flex'} gap={"16px"} flexDirection={'column'}>
                    <Typography variant='h6'>Число испытаний: {numberOfTrials}</Typography>
                    <Slider
                        min={3}
                        max={7}
                        disableSwap
                        getAriaLabel={() => 'Диапазон объема'}
                        value={numberOfTrialsRange}
                        onChange={(e, newValue) => setNumberOfTrialsRange(newValue as number[])}
                        valueLabelDisplay="auto"

                    />
                    <Button onClick={getNumberOfTrials} disabled={testMode}>Получить число испытаний</Button>
                </Box>
            </Box>
            {sampleSize && probability && numberOfTrials && <Box display={'flex'} gap={"16px"} flexDirection={'column'}>
                <Typography variant='h6'>График распределения</Typography>
                <LineChart
                    xAxis={[{
                        data: Array.from({ length: binomSample.length }, (_, i) => i + 1),
                        label: 'Номер испытания',
                    }]}
                    series={[
                        {
                            data: binomSample, // Данные распределения Бернулли
                            label: 'Биномиальное',
                        },
                    ]}

                    height={600}
                />

                <Box display={'flex'} gap={"16px"} flexDirection={'column'}>
                    <Typography variant='h6'>Гистограммы и распределения вероятностей</Typography>

                    <TableContainer component={Paper}>
                        <Table aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Карман</TableCell>
                                    <TableCell align="right">Частота</TableCell>
                                    <TableCell align="right">Отн.част</TableCell>
                                    <TableCell align="right">Теор</TableCell>
                                    <TableCell align="right">F(x)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tableData.map((row) => (
                                    <TableRow key={row.bin}>
                                        <TableCell component="th" scope="row">
                                            {row.bin}
                                        </TableCell>
                                        <TableCell align="right">{row.frequency}</TableCell>
                                        <TableCell align="right">{Number(row.relativeFrequency).toFixed(2)}</TableCell>
                                        <TableCell align="right">{Number(row.theoreticalProbability).toFixed(2)}</TableCell>
                                        <TableCell align="right">{Number(row.Fx).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                <Box>
                    <LineChart
                        xAxis={[{
                            data: Array.from({ length: tableData.length }, (_, i) => i + 1),
                            label: 'Карман',
                        }]}
                        series={[
                            {
                                data: tableData.map(row => row.Fx), // Данные распределения Бернулли
                                label: 'F(x)',
                            },
                        ]}

                        height={600}
                    />
                </Box>

                <Box>
                    <BarChart
                        xAxis={[
                            {
                                data: Array.from({ length: numberOfTrials }).map((_, i) => 'Карман ' + i), // Подписи для столбцов
                                scaleType: 'band', // Используем band для категориальных данных
                            },
                        ]}
                        series={[
                            {
                                data: tableData.map(row => row.frequency), // Количество значений для каждого кармана
                                label: 'Количество значений', // Подпись для серии
                            },
                        ]}

                        height={600}
                    />
                </Box>


                <Box>
                    <BarChart
                        xAxis={[
                            {
                                data: Array.from({ length: numberOfTrials }).map((_, i) => 'Карман ' + i), // Подписи для столбцов
                                scaleType: 'band', // Используем band для категориальных данных
                            },
                        ]}
                        series={[
                            {
                                data: tableData.map(row => row.relativeFrequency),
                                label: 'Относительная вероятность'
                            },
                            {
                                data: tableData.map(row => row.theoreticalProbability),
                                label: 'Теоретическая вероятность'
                            }
                        ]}

                        height={600}
                    />
                </Box>
            </Box>}
        </Box>
    )
}