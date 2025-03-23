import { utils } from "xlsx";

export function getRangeData(worksheet, startCell, endCell) {
    const range = utils.decode_range(`${startCell}:${endCell}`);
    const data = [];

    for (let row = range.s.r; row <= range.e.r; row++) {
        const rowData = [];
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = utils.encode_cell({ r: row, c: col });
            const cell = worksheet[cellAddress];
            rowData.push(cell ? cell.v : null);
        }
        data.push(rowData);
    }

    return data;
}