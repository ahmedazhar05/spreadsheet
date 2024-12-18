// place files you want to import through the `$lib` alias in this folder.
export function createIndex(n: number, include_blank = false): string[][] {
    const letters = String.fromCharCode(...Array(26).fill(0).map((_, i) => i + 65)).split("").map(x => [x]);
    let target: string[], output: string[][] = [[]];
    for(let i = 0; i < n; i++){
        if (i % 26 == 0) target = output[Math.floor(i / 26)];
        output.push(target!.concat(letters[i % 26]));
    }
    return output.slice(1 - +include_blank);
}

// type math_functions = Uppercase<Exclude<Extract<keyof Math, string>, 'E' | 'LN2' | 'LN10' | 'LOG2E' | 'LOG10E' | 'PI' | 'SQRT1_2' | 'SQRT2'>>;
type math_functions = keyof { [Prop in Extract<keyof Math, string> as Uppercase<Exclude<Prop, Math[Prop] extends Function ? '' : Prop>>]: Math[Prop] }

export const sheet_functions: Record<'SUM' | 'COUNT' | 'PROD' | 'AVG' | math_functions, (...nums: number[]) => number> = {
    SUM: (...nums: number[]) => nums.reduce((t, v) => t + v, 0),
    COUNT: (...nums: number[]) => nums.length,
    PROD: (...nums: number[]) => nums.reduce((t, v) => t * v, 1),
    AVG: (...nums: number[]) => nums.reduce((t, v) => t + v, 0) / nums.length,

    ...Object.getOwnPropertyNames(Math).reduce((t, e) => {
        // @ts-ignore
        if(e in Math && typeof Math[e as keyof Math] === 'function') t[e.toUpperCase()] = Math[e];
        return t;
    }, {} as Record<math_functions, (...nums: number[]) => number>)
} as const;

export const sheet_functions_regexp = new RegExp(`(${ Object.keys(sheet_functions).join('|') })\\((?:([A-Z]+)([1-9][0-9]*)(?::([A-Z]+)([1-9][0-9]*))?)?\\)`, 'g');

export function validate_expression(expression: string): boolean {
    // bracket opening and closing validation
    let open_brackets = 0;
    for(const char of expression) {
        // if(char === '(') open_brackets++;
        // else if(char === ')') open_brackets--;
        open_brackets += +(char === '(');
        open_brackets -= +(char === ')');
        if(open_brackets < 0) return false;
    }
    if(open_brackets > 0) return false;
    return true;
}

export {bracket_sub_expr_regex as plain_mathematical_expression_regex};
const bracket_sub_expr_regex = /\(((?:(?:\d+(?:\.\d+)?|[A-Z]+[1-9][0-9]*)[+*/%-])*(?:\d+(?:\.\d+)?|[A-Z]+[1-9][0-9]*))\)/g;

/*
function idx(n: number) {
    let x = [];
    x.push(...Array(n > 25 ? 26 : n).fill(0).map((_, i) => [i + 65]));
    n -= 26;
    for(let i = 0; i < n; i++) {
        let k = i.toString(26).padStart(2, '0');
        x.push(k.split("").map(x => parseInt(x, 26)).map(x => x + 65));
    }
    return x.map(v => String.fromCharCode(...v));
}

function ind(n: number, isShifted: boolean = false): string[][] {
    const letters = String.fromCharCode(...Array(26).fill(0).map((_, i) => i + 65)).split("").map(x => [x]);
    // if(n < 26) return isShifted ? (([[]] as string[][]).concat(letters).slice(0, n + 2)) : letters.slice(0, n + 1);
    if(n < 26) {
        const m = letters.slice(0, n + 1);
        if(isShifted) return ([[]] as string[][]).concat(m);
        return m;
    }
    n = Math.floor(n / 26);
    return letters.concat(ind(n, true).map(v => v.concat(letters[n - 1])));
}
*/