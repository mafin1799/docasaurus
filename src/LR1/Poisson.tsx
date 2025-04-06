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
import poisson from '@stdlib/random-base-poisson'
import { BarChart } from '@mui/x-charts';
import { MuiFileInput } from 'mui-file-input'
import { read, utils, writeFile } from 'xlsx'
import { getRangeData } from '../utils/getRange';

export const Poisson = () => {
    const [testFile, setTestFile] = useState(null)
    const [testMode, setTestMode] = useState(false)

    const [lambda, setLambda] = useState<number | null>(null)
    const [sampleSize, setSampleSize] = useState<number | null>(null)

    const [lambdaRange, setLambdaRange] = useState<number[]>([1, 5])
    const [sampleSizeRange, setSampleSizeRange] = useState<number[]>([100, 200])

    const [tableData, setTableData] = useState<{ bin: number; frequency: number; relativeFrequency: number; theoreticalProbability: number; Fx: number }[]>([]);

    // Генерация параметра λ
    const getLambda = () => {
        const randomNumber = jstat.uniform.sample(...lambdaRange)
        const roundedRandomNumber = randomNumber.toFixed(2)
        setLambda(+roundedRandomNumber)
    }

    // Генерация объема выборки
    const getSampleSize = () => {
        const randomNumber = jstat.uniform.sample(...sampleSizeRange)
        const roundedRandomNumber = randomNumber.toFixed(0)
        setSampleSize(+roundedRandomNumber)
    }

    const [poissonSample, setPoissonSample] = useState<number[]>([]);

    // Расчет данных для таблицы
    const calculateTableData = () => {
        if (!sampleSize || !lambda || poissonSample.length === 0) return;

        // Определяем диапазон значений (от минимального до максимального в выборке)
        const minValue = Math.min(...poissonSample);
        const maxValue = Math.max(...poissonSample);
        const uniqueValues = Array.from({ length: maxValue - minValue + 1 }, (_, i) => minValue + i);

        // Расчет частот
        const frequencyMap = poissonSample.reduce((acc, value) => {
            acc[value] = (acc[value] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        // Расчет данных для таблицы
        const data = uniqueValues.map((bin) => {
            const frequency = frequencyMap[bin] || 0;
            const relativeFrequency = frequency / sampleSize;

            const theoreticalProbability = jstat.poisson.pdf(bin, lambda);
            const Fx = jstat.poisson.cdf(bin, lambda);

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

    // Обновление выборки Пуассона при изменении lambda или sampleSize
    useEffect(() => {
        if (sampleSize && lambda && !testMode) {
            const sample = Array.from({ length: sampleSize }, () => poisson(lambda));
            setPoissonSample(sample);
        }
    }, [sampleSize, lambda]);

    // Расчет данных для таблицы при изменении выборки
    useEffect(() => {
        calculateTableData();
    }, [poissonSample]);

    // Обработка тестовых данных
    useEffect(() => {
        if (!testFile) return
        setTestMode(true)
        const reader = new FileReader();
        reader.onload = function (e) {
            const workbook = read(e.target.result);
            const sheetNames = workbook.SheetNames;
            const firstSheetName = sheetNames.find(name => name === 'Пуассона')
            const worksheet = workbook.Sheets[firstSheetName];

            const lambdaCell = 'D5'
            if (worksheet[lambdaCell]) {
                setLambda(+worksheet[lambdaCell].v.toFixed(2))
            }

            const sampleSizeCell = 'D6'
            if (worksheet[sampleSizeCell]) {
                setSampleSize(+worksheet[sampleSizeCell].v.toFixed(0))
            }

            const poissonSample = getRangeData(worksheet, 'B9', 'B127')
            setPoissonSample(poissonSample)
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
                    <Typography variant='h6'>Параметр λ: {lambda}</Typography>
                    <Slider
                        min={1}
                        max={5}
                        step={0.1}
                        disableSwap
                        getAriaLabel={() => 'Диапазон параметра λ'}
                        value={lambdaRange}
                        onChange={(e, newValue) => setLambdaRange(newValue as number[])}
                        valueLabelDisplay="auto"
                    />
                    <Button onClick={getLambda} disabled={testMode}>Получить λ</Button>
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
            </Box>

            {sampleSize && lambda && <Box display={'flex'} gap={"16px"} flexDirection={'column'}>
                <Typography variant='h6'>График распределения</Typography>
                <LineChart
                    xAxis={[{
                        data: Array.from({ length: poissonSample.length }, (_, i) => i + 1),
                        label: 'Номер испытания',
                    }]}
                    series={[
                        {
                            data: poissonSample,
                            label: 'Пуассона',
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
                            data: tableData.map(row => row.bin),
                            label: 'Карман',
                        }]}
                        series={[
                            {
                                data: tableData.map(row => row.Fx),
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
                                data: tableData.map(row => 'Карман ' + row.bin),
                                scaleType: 'band',
                            },
                        ]}
                        series={[
                            {
                                data: tableData.map(row => row.frequency),
                                label: 'Количество значений',
                            },
                        ]}
                        height={600}
                    />
                </Box>

                <Box>
                    <BarChart
                        xAxis={[
                            {
                                data: tableData.map(row => 'Карман ' + row.bin),
                                scaleType: 'band',
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