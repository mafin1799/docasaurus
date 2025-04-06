import { useState } from "react"
import { Box, Button, Slider, Typography } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { useEffect } from 'react';
import jstat from 'jstat'
import { MuiFileInput } from 'mui-file-input'
import { read, utils, writeFile } from 'xlsx'
import { getRangeData } from '../utils/getRange';

export const Discrete = () => {
    const [testFile, setTestFile] = useState(null)
    const [testMode, setTestMode] = useState(false)

    // Параметры распределения (значения и их вероятности)
    const [distributionParams, setDistributionParams] = useState<{ values: number[], probabilities: number[] }>({
        values: [1, 15, 30, 100, 200],
        probabilities: [0.3, 0.2, 0.35, 0.1, 0.05]
    })

    const [sampleSize, setSampleSize] = useState<number | null>(null)
    const [sampleSizeRange, setSampleSizeRange] = useState<number[]>([100, 200])

    // Генерация объема выборки
    const getSampleSize = () => {
        const randomNumber = jstat.uniform.sample(...sampleSizeRange)
        const roundedRandomNumber = randomNumber.toFixed(0)
        setSampleSize(+roundedRandomNumber)
    }

    const [discreteSample, setDiscreteSample] = useState<number[]>([])

    // Функция для генерации выборки дискретного распределения
    const generateDiscreteSample = () => {
        if (!sampleSize || distributionParams.values.length === 0) return

        const sample = []
        for (let i = 0; i < sampleSize; i++) {
            const rand = Math.random()
            let cumulativeProb = 0
            let selectedValue = distributionParams.values[0] // значение по умолчанию

            for (let j = 0; j < distributionParams.values.length; j++) {
                cumulativeProb += distributionParams.probabilities[j]
                if (rand <= cumulativeProb) {
                    selectedValue = distributionParams.values[j]
                    break
                }
            }

            sample.push(selectedValue)
        }

        setDiscreteSample(sample)
    }

    // Расчет данных для таблицы
    const calculateTableData = () => {
        if (!sampleSize || discreteSample.length === 0) return

        // Создаем объект для подсчета частот
        const frequencyMap: Record<number, number> = {}
        distributionParams.values.forEach(value => {
            frequencyMap[value] = 0
        })

        // Подсчитываем частоты
        discreteSample.forEach(value => {
            frequencyMap[value]++
        })

        // Расчет данных для таблицы
        const data = distributionParams.values.map((value, index) => {
            const frequency = frequencyMap[value]
            const relativeFrequency = frequency / sampleSize
            const theoreticalProbability = distributionParams.probabilities[index]

            // Расчет F(x) - кумулятивной вероятности
            let Fx = 0
            for (let i = 0; i <= index; i++) {
                Fx += distributionParams.probabilities[i]
            }

            return {
                bin: value,
                frequency,
                relativeFrequency,
                theoreticalProbability,
                Fx
            }
        })

        setTableData(data)
    }

    const [tableData, setTableData] = useState<{
        bin: number;
        frequency: number;
        relativeFrequency: number;
        theoreticalProbability: number;
        Fx: number
    }[]>([])

    // Обновление выборки при изменении параметров
    useEffect(() => {
        if (!testMode) {
            generateDiscreteSample()
        }
    }, [sampleSize, distributionParams])

    // Расчет данных для таблицы при изменении выборки
    useEffect(() => {
        calculateTableData()
    }, [discreteSample])

    // Обработка тестовых данных
    useEffect(() => {
        if (!testFile) return
        setTestMode(true)

        const reader = new FileReader()
        reader.onload = function (e) {
            const workbook = read(e.target.result)
            const sheetNames = workbook.SheetNames
            const sheetName = sheetNames.find(name => name === 'Дискретное')
            const worksheet = workbook.Sheets[sheetName]

            // Чтение параметров распределения (значения и вероятности)
            const values = []
            const probabilities = []

            // Значения находятся в столбце A (A6:A10)
            for (let i = 6; i <= 10; i++) {
                const valueCell = `A${i}`
                const probCell = `B${i}`

                if (worksheet[valueCell] && worksheet[probCell]) {
                    values.push(worksheet[valueCell].v)
                    probabilities.push(worksheet[probCell].v)
                }
            }

            setDistributionParams({
                values,
                probabilities
            })

            // Чтение объема выборки (B12)
            if (worksheet['B12']) {
                setSampleSize(worksheet['B12'].v)
            }

            // Чтение выборки (B16:B134)
            const sample = getRangeData(worksheet, 'B16', 'B134')
            setDiscreteSample(sample)
        }

        reader.readAsArrayBuffer(testFile)
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
                <Box display={'flex'} gap={"16px"} flexDirection={'column'}>
                    <Typography variant='h6'>Параметры распределения</Typography>
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Значение (X)</TableCell>
                                    <TableCell align="right">Вероятность P(X)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {distributionParams.values.map((value, index) => (
                                    <TableRow key={value}>
                                        <TableCell>{value}</TableCell>
                                        <TableCell align="right">
                                            {distributionParams.probabilities[index].toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell><strong>Сумма</strong></TableCell>
                                    <TableCell align="right">
                                        {distributionParams.probabilities.reduce((sum, prob) => sum + prob, 0).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
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

            {sampleSize && discreteSample.length > 0 && (
                <Box display={'flex'} gap={"16px"} flexDirection={'column'}>
                    <Typography variant='h6'>График распределения</Typography>
                    <LineChart
                        xAxis={[{
                            data: Array.from({ length: discreteSample.length }, (_, i) => i + 1),
                            label: 'Номер испытания',
                        }]}
                        series={[{
                            data: discreteSample,
                            label: 'Дискретное распределение',
                        }]}
                        height={600}
                    />

                    <Typography variant='h6'>Гистограммы и распределения вероятностей</Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Значение</TableCell>
                                    <TableCell align="right">Частота</TableCell>
                                    <TableCell align="right">Отн.част</TableCell>
                                    <TableCell align="right">Теор</TableCell>
                                    <TableCell align="right">F(x)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tableData.map((row) => (
                                    <TableRow key={row.bin}>
                                        <TableCell>{row.bin}</TableCell>
                                        <TableCell align="right">{row.frequency}</TableCell>
                                        <TableCell align="right">{row.relativeFrequency.toFixed(2)}</TableCell>
                                        <TableCell align="right">{row.theoreticalProbability.toFixed(2)}</TableCell>
                                        <TableCell align="right">{row.Fx.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box>
                        <LineChart
                            xAxis={[{
                                data: tableData.map(row => row.bin),
                                label: 'Значение',
                            }]}
                            series={[{
                                data: tableData.map(row => row.Fx),
                                label: 'F(x)',
                            }]}
                            height={600}
                        />
                    </Box>

                    <Box>
                        <BarChart
                            xAxis={[{
                                data: tableData.map(row => `Значение ${row.bin}`),
                                scaleType: 'band',
                            }]}
                            series={[{
                                data: tableData.map(row => row.frequency),
                                label: 'Количество значений',
                            }]}
                            height={600}
                        />
                    </Box>

                    <Box>
                        <BarChart
                            xAxis={[{
                                data: tableData.map(row => `Значение ${row.bin}`),
                                scaleType: 'band',
                            }]}
                            series={[
                                {
                                    data: tableData.map(row => row.relativeFrequency),
                                    label: 'Относительная частота'
                                },
                                {
                                    data: tableData.map(row => row.theoreticalProbability),
                                    label: 'Теоретическая вероятность'
                                }
                            ]}
                            height={600}
                        />
                    </Box>
                </Box>
            )}
        </Box>
    )
}