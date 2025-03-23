import { Box, Button, Slider, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { useEffect, useState } from 'react';
import jstat from 'jstat'
import bernoulli from '@stdlib/random-base-bernoulli'
import { BarChart } from '@mui/x-charts';
import { MuiFileInput } from 'mui-file-input'
import { read, utils, writeFile } from 'xlsx'
import { getRangeData } from '../utils/getRange';

export const BernulliWork = () => {

    const [testFile, setTestFile] = useState(null)
    const [testMode, setTestMode] = useState(false)
    const [probability, setProbability] = useState<number | null>(null)
    const [sampleSize, setSampleSize] = useState<number | null>(null)

    const [probabilityRange, setProbabilityRange] = useState<number[]>([0.2, 0.8])
    const [sampleSizeRange, setSampleSizeRange] = useState<number[]>([100, 200])

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

    const [bernoulliSample, setBernoulliSample] = useState<number[]>([]);



    // Расчет данных для таблицы
    const calculateTableData = () => {
        if (!sampleSize || !probability || bernoulliSample.length === 0) return;

        // Уникальные значения (0 и 1)
        const uniqueValues = [0, 1];

        // Расчет частот
        const frequencyMap = bernoulliSample.reduce((acc, value) => {
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        // Расчет данных для таблицы
        const data = uniqueValues.map((bin) => {
            const frequency = frequencyMap[bin] || 0;
            const relativeFrequency = frequency / sampleSize;
            const theoreticalProbability = bin === 0 ? 1 - probability : probability;
            const Fx = bin === 0 ? 1 - probability : 1; // Функция распределения

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
        if (sampleSize && probability && !testMode) {
            const sample = Array.from({ length: sampleSize }, () => bernoulli(probability));
            setBernoulliSample(sample);
        }
    }, [sampleSize, probability]);

    // Расчет данных для таблицы при изменении выборки
    useEffect(() => {
        calculateTableData();
    }, [bernoulliSample]);

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
            const firstSheetName = sheetNames.find(name => name === 'Бернулли')
            const worksheet = workbook.Sheets[firstSheetName];


            const probabilityCell = 'D3'
            if (worksheet[probabilityCell]) {
                setProbability(worksheet[probabilityCell].v.toFixed(2))
            }

            const sampleSizeCell = 'D4'
            if (worksheet[sampleSizeCell]) {
                setSampleSize(worksheet[sampleSizeCell].v.toFixed(0))
            }

            const bernoulliSample = getRangeData(worksheet, 'B8', 'B126')
            setBernoulliSample(bernoulliSample)
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
                        min={0}
                        max={1}
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
                        min={0}
                        max={500}

                        disableSwap
                        getAriaLabel={() => 'Диапазон объема'}
                        value={sampleSizeRange}
                        onChange={(e, newValue) => setSampleSizeRange(newValue as number[])}
                        valueLabelDisplay="auto"

                    />
                    <Button onClick={getSampleSize} disabled={testMode}>Получить объем</Button>
                </Box>
            </Box>
            {sampleSize && probability && <Box display={'flex'} gap={"16px"} flexDirection={'column'}>
                <Typography variant='h6'>График распределения</Typography>
                <LineChart
                    xAxis={[{
                        data: Array.from({ length: bernoulliSample.length }, (_, i) => i + 1),
                        label: 'Номер испытания',
                    }]}
                    series={[
                        {
                            data: bernoulliSample, // Данные распределения Бернулли
                            label: 'Результат (0 или 1)',
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
                                data: ['Карман 0', 'Карман 1'], // Подписи для столбцов
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
                                data: ['Карман 0', 'Карман 1'], // Подписи для столбцов
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
