import { ToLaTeXConverter } from '../../../../domain/usecases/to-latex-converter';
import { MathMLElement } from '../../../protocols/mathml-element';
import { JoinWithManySeparators, mathMLElementToLaTeXConverter } from '../../../helpers';
import { MathMLToLaTeX } from '../../../../main/mathml-to-latex';



export class MTable implements ToLaTeXConverter {
    private readonly _mathmlElement: MathMLElement;

    constructor(mathElement: MathMLElement) {
        this._mathmlElement = mathElement;
    }
// new method to get the number
    extractAndConvertNumbers(columnwidth: string) {
        const numberPattern = /-?\d+(\.\d+)?/g;
        const matches = columnwidth.match(numberPattern);
        return matches ? matches.map(num => parseFloat(num)) : [];
    }
     
    convert(): string {
        const tableContent = this._mathmlElement.children
            .map((child) => mathMLElementToLaTeXConverter(child))
            .map((converter) => converter.convert())
            .join(' \\\\\n'); // Joining rows with LaTeX new line for matrix rows

        const Maxcol: number = this._mathmlElement.children.map((e: MathMLElement): number => e.children.length).reduce((a: number, b: number) => (a >= b ? a : b))
        return this._wrapNestedTableContent(tableContent, Maxcol)
    }

    private _wrapNestedTableContent(latex: string, Maxcol: number): string {
//计算ccc
        const col = Array.from({ length: Maxcol }).map((e): string => 'c').join('')

//columnwidth
        const columnwidth = this._mathmlElement.attributes['columnwidth'] // 每一个column占多少em的空间
        const widthValues = this.extractAndConvertNumbers(columnwidth);
        const columnwidthCm = widthValues.map(value => value * 0.423);
        let TableRows = latex.split('\\\\');
        TableRows = TableRows.map(row => {
            if (row.trim() !== '') {
                let columns = row.split('&');
                columns = columns.map((column, index) => {
                    if (index < columnwidthCm.length) {
                        return `\\hspace{${columnwidthCm[index]}cm}{${column}}`;
                    }
                    return column;
                });
                return columns.join('&');
            }
            return row;
        });
        latex = TableRows.join(' \\\\');

//columnspacing
        const columnspacing = this._mathmlElement.attributes['columnspacing']// 每一个column占多少em的空间
        // 1 em = 0.423 cm
        const columnspacingCm = parseFloat(columnspacing) * 0.423;
        let tableRows = latex.split('\\\\');

        // Process each row to add the horizontal space using \hspace
        tableRows = tableRows.map(row => {
        if (row.trim() !== '') {
        // Split the row into columns
        let columns = row.split('&');

        // Add the \hspace between each column
        columns = columns.map((column, index) => {
            if (index < columns.length - 1 &&  !/\\hspace{.*?}/.test(column)) {
                return `${column} \\hspace{${columnspacingCm}cm}`;
            }
            return column;
        });

        // Join the columns back into a single row string
        return columns.join('&');
    }
    return row;
});

latex = tableRows.join(' \\\\');

// rowspacing
        const rowspacing = this._mathmlElement.attributes['rowspacing']// 每一个row占多少em的空间
        let rows = latex.split('\\\\');
        rows = rows.map(row => {
                if (row.trim() !== '') {
                    // Convert rowspacing from em to pt assuming 1em = 10pt (nedd furthur adjustment based on actual font size)
                    const rowspacingPt = parseFloat(rowspacing) * 10;
                    // Add the \rule to the end of the row to create vertical space
                    return `${row} \\rule{0pt}{${rowspacingPt}pt}`;
                }
                return row;
            });
        latex = rows.join(' \\\\');// 为什么只有两个
//


//rowlines
        const rowlines = this._mathmlElement.attributes['rowlines'] //加 hline at the end of each line if necessary
        if (rowlines === 'solid') {
        let rows = latex.split('\\\\');

        // Add \hline to the end of each row and join them back together
        rows = rows.map(row => row.trim() + '\\\\ \\hline');
        latex = rows.join(' \\\\');
        }

        console.log("Modified LaTeX with rowlines:", latex); 

//
        
//columnlines
        const columnlines = this._mathmlElement.attributes['columnlines'];
        let columnSpec = col; // Initial column specification string
        if (columnlines === 'solid') {
            // Add a '|' between each 'c'
            columnSpec = columnSpec.split('').join('|');
        }
        console.log("columnSpec", columnSpec); // Outputs the modified column specification
//

console.log("1", latex)

// frame 
        let hLine = ''
        const frame = this._mathmlElement.attributes['frame']// 2个外框加 \hline（上下）然后也要加 '|'
        if (frame === 'solid'){
            columnSpec = '|' + columnSpec + '|';
            hLine = '\\hline'  
        }
//

//framespacing
        const framespacing = this._mathmlElement.attributes['framespacing']//分为 em（横向的）和ex（竖向的）， 看看占据多少空间
        const spacingValues = this.extractAndConvertNumbers(framespacing);
        const horizontalSpacingEm = spacingValues[0] || 0;
        const verticalSpacingEx = spacingValues[1] || 0;
        let Tablerows = latex.split('\\\\');
//         // Add vertical spacing to the first row
        if (Tablerows.length > 0) {
        Tablerows[0] = `\\rule{0pt}{${verticalSpacingEx}ex} ` + Tablerows[0];
        }
//         // Add vertical spacing to the last row
        if (Tablerows.length > 1) {
        Tablerows[Tablerows.length - 1] += ` \\rule{0pt}{${verticalSpacingEx}ex}`;
        }
        Tablerows = Tablerows.map((row, rowIndex) => {
            if (row.trim() !== '') {
                // Split the row into columns
                let columns = row.split('&');
        
                // Add horizontal spacing to the first column if \hspace does not already exist
                if (!/\\hspace{.*?}/.test(columns[0])) {
                    columns[0] = `\\hspace{${horizontalSpacingEm}em} ${columns[0]}`;
                }
        
                // Add horizontal spacing to the last column if \hspace does not already exist
                if (!/\\hspace{.*?}/.test(columns[columns.length - 1])) {
                    columns[columns.length - 1] = `${columns[columns.length - 1]} \\hspace{${horizontalSpacingEm}em}`;
                }
        
                // Join the columns back into a single row string
                return columns.join('&');
            }
            return row;
        });
console.log('2', latex)
        //选中一行，选前两个元素，然后一行一行走




        //分不同的类，mtable和mtr分开来

        //const width = this._mathmlElement.attributes['width']// 每一个column占多少em的空间
        //const depth = this._mathmlElement.attributes['depth'] //每一个row占多少em的空间(under baseline)
        //const height = this._mathmlElement.attributes['height']//每一个row占多少em的空间（above baseline）
        //这三个是mspace的先不处理！


        const screen_output = `\\begin{array}{${columnSpec}}${hLine}${latex}\\end{array}`
        return screen_output;
    }

}


